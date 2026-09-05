//! Bounded, read-only repository discovery without invoking Cargo or build scripts.
use crate::{
    analysis::{SourceFile, analyze_sources, edge},
    proto::{Graph, Node},
};
use anyhow::{Context, Result, ensure};
use std::{
    collections::BTreeMap,
    fs,
    path::{Path, PathBuf},
};

const MAX_SOURCE_BYTES: u64 = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES: u64 = 64 * 1024 * 1024;

struct Package {
    directory: PathBuf,
    name: String,
    manifest: String,
    dependencies: Vec<String>,
}

/// Read Rust files and Cargo manifests and build a deterministic source graph.
/// Does not compile code, follow symlinks, or execute build scripts.
///
/// # Errors
/// Returns an error if the root does not exist or is not a directory.
pub fn analyze(root: &Path) -> Result<Graph> {
    let root = root
        .canonicalize()
        .context("Não foi possível abrir o repositório")?;
    ensure!(root.is_dir(), "Informe um diretório de repositório");
    let (paths, mut diagnostics) = discover(&root);
    let packages = packages(&root, &paths, &mut diagnostics);
    let files = sources(&root, &paths, &packages, &mut diagnostics);
    let mut graph = analyze_sources(&files);
    graph.name = root
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .into();
    graph.diagnostics.extend(diagnostics);
    add_packages(&mut graph, &packages);
    crate::repository::add_tree(&mut graph, &root, &paths);
    Ok(graph)
}

fn discover(root: &Path) -> (Vec<PathBuf>, Vec<String>) {
    let walker = ignore::WalkBuilder::new(root)
        .hidden(false)
        .follow_links(false)
        .require_git(false)
        .filter_entry(|entry| {
            !["target", "node_modules", "vendor", ".git", "dist"]
                .contains(&entry.file_name().to_string_lossy().as_ref())
        })
        .build();
    let mut paths = Vec::new();
    let mut diagnostics = Vec::new();
    for result in walker {
        match result {
            Ok(entry) if entry.file_type().is_some_and(|t| t.is_file() || t.is_dir()) => {
                paths.push(entry.into_path());
                if paths.len() >= 20_000 {
                    diagnostics
                        .push("Árvore limitada a 20.000 entradas; analise um subdiretório.".into());
                    break;
                }
            }
            Err(error) => diagnostics.push(format!("Leitura incompleta: {error}")),
            _ => {}
        }
    }
    paths.sort();
    (paths, diagnostics)
}

fn packages(root: &Path, paths: &[PathBuf], diagnostics: &mut Vec<String>) -> Vec<Package> {
    paths
        .iter()
        .filter(|p| visible_source(root, p) && p.file_name().is_some_and(|n| n == "Cargo.toml"))
        .filter_map(|path| {
            let source = read_bounded(path, diagnostics)?;
            let manifest: toml::Value = match toml::from_str(&source) {
                Ok(value) => value,
                Err(error) => {
                    diagnostics.push(format!("{}: {error}", relative(root, path)));
                    return None;
                }
            };
            let name = manifest
                .get("package")?
                .get("name")?
                .as_str()?
                .replace('-', "_");
            let dependencies = ["dependencies", "dev-dependencies", "build-dependencies"]
                .iter()
                .filter_map(|key| manifest.get(key)?.as_table())
                .flat_map(|table| {
                    table.iter().map(|(name, spec)| {
                        spec.get("package")
                            .and_then(|p| p.as_str())
                            .unwrap_or(name)
                            .replace('-', "_")
                    })
                })
                .collect();
            Some(Package {
                directory: path.parent()?.into(),
                name,
                manifest: relative(root, path),
                dependencies,
            })
        })
        .collect()
}

fn sources(
    root: &Path,
    paths: &[PathBuf],
    packages: &[Package],
    diagnostics: &mut Vec<String>,
) -> Vec<SourceFile> {
    let mut total = 0;
    let mut files = Vec::new();
    for path in paths
        .iter()
        .filter(|p| visible_source(root, p) && p.extension().is_some_and(|e| e == "rs"))
    {
        let Some(source) = read_bounded(path, diagnostics) else {
            continue;
        };
        total += source.len() as u64;
        if total > MAX_TOTAL_BYTES {
            diagnostics
                .push("Limite de 64 MiB de código atingido; analise um subdiretório.".into());
            break;
        }
        let package = packages
            .iter()
            .filter(|p| path.starts_with(&p.directory))
            .max_by_key(|p| p.directory.components().count());
        let crate_name = package
            .map(|p| p.name.clone())
            .unwrap_or_else(|| "repository".into());
        let base = package.map(|p| p.directory.as_path()).unwrap_or(root);
        let module = module_path(base, path, &crate_name);
        files.push(SourceFile {
            path: relative(root, path),
            crate_name,
            module,
            source,
        });
    }
    files
}

fn read_bounded(path: &Path, diagnostics: &mut Vec<String>) -> Option<String> {
    if fs::metadata(path).ok()?.len() > MAX_SOURCE_BYTES {
        diagnostics.push(format!(
            "{}: arquivo acima de 2 MiB ignorado",
            path.display()
        ));
        return None;
    }
    match fs::read_to_string(path) {
        Ok(source) => Some(source),
        Err(error) => {
            diagnostics.push(format!("{}: {error}", path.display()));
            None
        }
    }
}

fn visible_source(root: &Path, path: &Path) -> bool {
    path.is_file()
        && path.strip_prefix(root).is_ok_and(|relative| {
            !relative
                .components()
                .any(|part| part.as_os_str().to_string_lossy().starts_with('.'))
        })
}

fn module_path(base: &Path, path: &Path, crate_name: &str) -> String {
    let relative = path.strip_prefix(base).unwrap_or(path).with_extension("");
    let parts: Vec<_> = relative
        .components()
        .map(|p| p.as_os_str().to_string_lossy().into_owned())
        .collect();
    let mut module = vec![crate_name.to_string()];
    for (i, part) in parts.iter().enumerate() {
        if (i == 0 && part == "src")
            || (i == parts.len() - 1 && ["mod", "lib", "main"].contains(&part.as_str()))
        {
            continue;
        }
        module.push(part.clone());
    }
    module.join("::")
}

fn add_packages(graph: &mut Graph, packages: &[Package]) {
    let by_name: BTreeMap<_, _> = packages
        .iter()
        .map(|p| (&p.name, format!("crate:{}", p.manifest)))
        .collect();
    for package in packages {
        let id = format!("crate:{}", package.manifest);
        for n in &mut graph.nodes {
            if n.parent.is_empty() && n.qualified_name.starts_with(&format!("{}::", package.name)) {
                n.parent = id.clone();
                graph.edges.push(edge(&id, &n.id, "contains", "contém"));
            }
        }
        for dependency in &package.dependencies {
            if let Some(target) = by_name.get(dependency) {
                graph.edges.push(edge(&id, target, "depends", "depende de"));
            }
        }
        graph.nodes.push(Node {
            id,
            name: package.name.clone(),
            qualified_name: package.name.clone(),
            kind: "crate".into(),
            file: package.manifest.clone(),
            ..Default::default()
        });
    }
}

fn relative(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .unwrap_or(path)
        .to_string_lossy()
        .replace('\\', "/")
}
