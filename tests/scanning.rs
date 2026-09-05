//! Repository scanning must be read-only, bounded, and honest about incomplete sources.
use rust_visualizer::analyze;
use std::fs;

#[test]
fn ignored_files_and_symlinks_cannot_leak_into_the_graph() {
    let dir = tempfile::tempdir().unwrap();
    fs::write(dir.path().join(".gitignore"), "secret.rs\n").unwrap();
    fs::write(dir.path().join("secret.rs"), "fn secret() {}").unwrap();
    fs::write(dir.path().join("main.rs"), "fn main() {}").unwrap();
    fs::create_dir(dir.path().join("target")).unwrap();
    fs::write(dir.path().join("target/generated.rs"), "fn generated() {}").unwrap();
    #[cfg(unix)]
    std::os::unix::fs::symlink(dir.path().join("secret.rs"), dir.path().join("leak.rs")).unwrap();
    let graph = analyze(dir.path()).unwrap();
    assert!(
        !graph
            .nodes
            .iter()
            .any(|n| ["secret", "generated"].contains(&n.name.as_str()))
    );
    assert!(graph.nodes.iter().any(|n| n.name == "main"));
}

#[test]
fn invalid_sources_produce_diagnostics_without_hiding_valid_sources() {
    let dir = tempfile::tempdir().unwrap();
    fs::write(dir.path().join("broken.rs"), "fn {").unwrap();
    fs::write(dir.path().join("main.rs"), "fn main() {}").unwrap();
    let graph = analyze(dir.path()).unwrap();
    assert!(graph.diagnostics.iter().any(|d| d.contains("broken.rs")));
    assert!(graph.nodes.iter().any(|n| n.name == "main"));
}

#[test]
fn nonexistent_root_is_an_error_and_an_empty_directory_is_a_valid_snapshot() {
    assert!(analyze(std::path::Path::new("/nonexistent-rust-visualizer-fixture")).is_err());
    let dir = tempfile::tempdir().unwrap();
    assert!(analyze(dir.path()).unwrap().nodes.is_empty());
}

#[test]
fn hidden_source_is_listed_but_does_not_expand_the_existing_source_read_boundary() {
    let dir = tempfile::tempdir().unwrap();
    fs::write(dir.path().join(".hidden.rs"), "fn private_hidden_body() {}").unwrap();
    let graph = analyze(dir.path()).unwrap();
    assert!(
        graph
            .nodes
            .iter()
            .any(|n| n.kind == "file" && n.file == ".hidden.rs")
    );
    assert!(!graph.nodes.iter().any(|n| n.name == "private_hidden_body"));
}

#[test]
fn repository_tree_contains_non_rust_files_empty_folders_and_hidden_config_without_contents() {
    let dir = tempfile::tempdir().unwrap();
    fs::create_dir_all(dir.path().join(".github/workflows")).unwrap();
    fs::create_dir(dir.path().join("empty")).unwrap();
    fs::create_dir(dir.path().join("src")).unwrap();
    fs::write(dir.path().join("README.md"), "private markdown body").unwrap();
    fs::write(dir.path().join(".github/workflows/test.yml"), "name: CI").unwrap();
    fs::write(dir.path().join("src/main.rs"), "fn main() {}").unwrap();
    let graph = analyze(dir.path()).unwrap();
    for path in ["README.md", ".github/workflows/test.yml", "src/main.rs"] {
        let file = graph
            .nodes
            .iter()
            .find(|n| n.kind == "file" && n.file == path);
        assert!(file.is_some(), "missing file: {path}");
        assert!(file.unwrap().source.is_empty());
    }
    assert!(
        graph
            .nodes
            .iter()
            .any(|n| n.kind == "folder" && n.file == "empty")
    );
    let main = graph.nodes.iter().find(|n| n.name == "main").unwrap();
    let file = graph.nodes.iter().find(|n| n.id == main.parent).unwrap();
    assert_eq!(file.kind, "file");
    assert_eq!(file.file, "src/main.rs");
}

#[test]
fn tree_keeps_nested_crates_in_their_directories_and_excludes_ignored_files_and_symlinks() {
    let dir = tempfile::tempdir().unwrap();
    fs::create_dir_all(dir.path().join("crates/core/src")).unwrap();
    fs::write(
        dir.path().join("crates/core/Cargo.toml"),
        "[package]\nname='core'\nversion='0.1.0'",
    )
    .unwrap();
    fs::write(dir.path().join("crates/core/src/lib.rs"), "pub fn run() {}").unwrap();
    fs::write(dir.path().join(".gitignore"), "secret.txt\n").unwrap();
    fs::write(dir.path().join("secret.txt"), "secret").unwrap();
    #[cfg(unix)]
    std::os::unix::fs::symlink(dir.path().join("secret.txt"), dir.path().join("link.txt")).unwrap();
    let graph = analyze(dir.path()).unwrap();
    assert!(
        !graph
            .nodes
            .iter()
            .any(|n| ["secret.txt", "link.txt"].contains(&n.file.as_str()))
    );
    let krate = graph.nodes.iter().find(|n| n.kind == "crate").unwrap();
    let parent = graph.nodes.iter().find(|n| n.id == krate.parent).unwrap();
    assert_eq!(parent.file, "crates");
    let src = graph
        .nodes
        .iter()
        .find(|n| n.kind == "folder" && n.file == "crates/core/src")
        .unwrap();
    assert_eq!(src.parent, krate.id);
    for node in &graph.nodes {
        if !node.parent.is_empty() {
            assert!(graph.nodes.iter().any(|parent| parent.id == node.parent));
        }
    }
}
