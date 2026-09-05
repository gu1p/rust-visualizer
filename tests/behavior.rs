//! Behavioral contracts for portable analysis and export.
use rust_visualizer::{analyze, export_html};
use std::{path::Path, process::Command};

fn fixture() -> &'static Path {
    Path::new("tests/fixtures/journey")
}

#[test]
fn given_a_rust_repository_when_analyzed_then_entry_points_and_flow_are_source_linked() {
    let graph = analyze(fixture()).unwrap();
    let process = graph.nodes.iter().find(|n| n.name == "process").unwrap();
    assert!(process.is_async);
    assert!(process.source.contains("save(total).await?"));
    assert_eq!(process.file, "src/main.rs");
    for kind in ["branch", "return", "await", "try", "match", "loop"] {
        assert!(graph.nodes.iter().any(|n| n.kind == kind), "missing {kind}");
    }
    assert!(
        graph
            .nodes
            .iter()
            .any(|n| n.name == "main" && n.entry_point)
    );
    assert!(graph.edges.iter().any(|e| {
        e.kind == "calls"
            && e.from == process.id
            && graph
                .nodes
                .iter()
                .any(|n| n.id == e.to && n.name == "persist")
    }));
    assert!(graph.edges.iter().any(|e| e.kind == "implements"));
}

#[test]
fn given_the_same_sources_when_analyzed_twice_then_the_snapshot_is_deterministic() {
    assert_eq!(analyze(fixture()).unwrap(), analyze(fixture()).unwrap());
}

#[test]
fn given_a_graph_when_exported_then_one_html_contains_every_asset_and_protobuf_data() {
    let html = export_html(&analyze(fixture()).unwrap());
    assert!(html.contains("application/x-protobuf"));
    assert!(html.contains("Conversar com IA"));
    assert!(!html.contains("<script src="));
    assert!(!html.contains("<link rel=\"stylesheet\""));
    assert!(!html.contains("https://cdn"));
}

#[test]
fn given_a_built_executable_when_run_outside_its_repo_then_it_exports_without_node_or_cargo() {
    let temp = tempfile::tempdir().unwrap();
    let status = Command::new(env!("CARGO_BIN_EXE_rust-visualizer"))
        .current_dir(temp.path())
        .env("PATH", "")
        .args([
            "export",
            fixture().canonicalize().unwrap().to_str().unwrap(),
            "--output",
            "ARCHITECTURE.html",
        ])
        .status()
        .unwrap();
    assert!(status.success());
    assert!(
        temp.path()
            .join("ARCHITECTURE.html")
            .metadata()
            .unwrap()
            .len()
            > 10_000
    );
}
