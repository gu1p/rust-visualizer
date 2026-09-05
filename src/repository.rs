//! Filesystem hierarchy metadata, without embedding non-Rust file contents.
use crate::{
    analysis::edge,
    proto::{Graph, Node},
};
use std::{
    collections::BTreeMap,
    path::{Path, PathBuf},
};

/// Attach a bounded filesystem tree and its source declarations to the snapshot.
pub(crate) fn add_tree(graph: &mut Graph, root: &Path, paths: &[PathBuf]) {
    if paths.len() <= 1 && graph.nodes.is_empty() {
        return;
    }
    let crates: BTreeMap<String, String> = graph
        .nodes
        .iter()
        .filter(|n| n.kind == "crate")
        .map(|n| (parent_path(&n.file), n.id.clone()))
        .collect();
    let mut tree: BTreeMap<String, Node> = paths
        .iter()
        .filter_map(|path| tree_entry(root, path, &graph.name, &crates))
        .collect();
    let mut ids: BTreeMap<_, _> = tree
        .iter()
        .map(|(path, n)| (path.clone(), n.id.clone()))
        .collect();
    ids.extend(crates);
    for (path, node) in &mut tree {
        if !path.is_empty() {
            node.parent = ids.get(&parent_path(path)).cloned().unwrap_or_default();
        }
    }
    reparent(graph, &ids);
    graph.nodes.extend(tree.into_values());
    containment(graph);
}

fn tree_entry(
    root: &Path,
    path: &Path,
    name: &str,
    crates: &BTreeMap<String, String>,
) -> Option<(String, Node)> {
    let relative = path
        .strip_prefix(root)
        .ok()?
        .to_string_lossy()
        .replace('\\', "/");
    if crates.contains_key(&relative) && path.is_dir() {
        return None;
    }
    let name = if relative.is_empty() {
        name.into()
    } else {
        path.file_name()?.to_string_lossy().into_owned()
    };
    Some((
        relative.clone(),
        Node {
            id: format!("path:{relative}"),
            name,
            file: relative,
            kind: if path.is_dir() { "folder" } else { "file" }.into(),
            detail: "Metadados do repositório. Selecione uma declaração para ler o código Rust."
                .into(),
            ..Default::default()
        },
    ))
}

fn containment(graph: &mut Graph) {
    graph.edges.retain(|e| e.kind != "contains");
    let parents: BTreeMap<_, _> = graph.nodes.iter().map(|n| (&n.id, &n.kind)).collect();
    for node in &graph.nodes {
        if !node.parent.is_empty()
            && parents
                .get(&node.parent)
                .is_some_and(|kind| kind.as_str() != "function")
        {
            graph
                .edges
                .push(edge(&node.parent, &node.id, "contains", "contém"));
        }
    }
}

fn reparent(graph: &mut Graph, ids: &BTreeMap<String, String>) {
    for node in &mut graph.nodes {
        if node.kind == "crate" {
            let directory = parent_path(&node.file);
            node.parent = if directory.is_empty() {
                String::new()
            } else {
                ids.get(&parent_path(&directory))
                    .cloned()
                    .unwrap_or_default()
            };
        } else if (node.parent.is_empty() || node.parent.starts_with("crate:"))
            && let Some(file) = ids.get(&node.file)
        {
            node.parent = file.clone();
        }
    }
}

fn parent_path(path: &str) -> String {
    path.rsplit_once('/')
        .map(|(parent, _)| parent.to_string())
        .unwrap_or_default()
}
