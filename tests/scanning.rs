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
