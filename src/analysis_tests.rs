//! Pure analyzer regression tests.
use super::*;

fn graph(source: &str) -> Graph {
    analyze_source("src/main.rs", "demo", source).unwrap()
}

#[test]
fn an_early_return_cannot_reach_the_next_statement() {
    let g = graph("fn run() { return; after(); } fn after() {}");
    let ret = g.nodes.iter().find(|n| n.kind == "return").unwrap();
    let destinations: Vec<_> = g
        .edges
        .iter()
        .filter(|e| e.from == ret.id && e.kind == "flow")
        .filter_map(|e| g.nodes.iter().find(|n| n.id == e.to))
        .collect();
    assert!(destinations.iter().all(|n| n.kind == "exit"));
}

#[test]
fn question_mark_has_separate_success_and_error_paths() {
    let g = graph("fn run() -> Result<(), ()> { work()?; Ok(()) }");
    let node = g.nodes.iter().find(|n| n.kind == "try").unwrap();
    let edges: Vec<_> = g
        .edges
        .iter()
        .filter(|e| e.from == node.id && e.kind == "flow")
        .collect();
    assert!(edges.iter().any(|e| e.label == "Ok / Some"));
    assert!(edges.iter().any(|e| e.label == "Err / None"));
}

#[test]
fn ambiguous_method_calls_are_never_presented_as_resolved() {
    let g = graph(
        "struct A; struct B; impl A { fn save(&self) {} } impl B { fn save(&self) {} } fn run(x: A) { x.save(); }",
    );
    assert!(!g.edges.iter().any(|e| e.kind == "calls"));
    assert!(g.nodes.iter().any(|n| n.kind == "call"
        && n.name.contains("save")
        && n.detail.contains("não resolvida")));
}

#[test]
fn closures_and_async_blocks_are_deferred_not_inlined_as_executed() {
    let g =
        graph("fn run() { let f = || hidden(); let future = async { hidden(); }; } fn hidden() {}");
    assert!(g.nodes.iter().any(|n| n.kind == "deferred"));
    assert!(!g.edges.iter().any(|e| e.kind == "calls"));
}

#[test]
fn recursion_is_a_finite_graph_with_unique_ids() {
    let g = graph("fn recurse() { recurse(); }");
    let ids: std::collections::HashSet<_> = g.nodes.iter().map(|n| &n.id).collect();
    assert_eq!(ids.len(), g.nodes.len());
    assert!(g.edges.iter().any(|e| e.kind == "calls" && e.from == e.to));
    assert!(g.nodes.len() < 10);
}

#[test]
fn nested_loops_target_the_correct_break_and_continue_nodes() {
    let g = graph("fn run() { 'outer: loop { loop { continue 'outer; } break; } }");
    let jump = g.nodes.iter().find(|n| n.kind == "continue").unwrap();
    let outer = g
        .nodes
        .iter()
        .find(|n| n.kind == "loop" && n.name.contains("outer"))
        .unwrap();
    assert!(
        g.edges
            .iter()
            .any(|e| e.from == jump.id && e.to == outer.id && e.kind == "flow")
    );
}

#[test]
fn short_circuit_boolean_does_not_execute_rhs_unconditionally() {
    let g = graph(
        "fn run() { if ready() && save() { done(); } } fn ready() -> bool { true } fn save() -> bool { true } fn done() {}",
    );
    assert!(
        g.nodes
            .iter()
            .any(|n| n.kind == "branch" && n.name.contains("&&"))
    );
}

#[test]
fn a_local_binding_shadowing_a_function_is_not_resolved_to_that_function() {
    let g = graph("fn save() {} fn run(save: fn()) { save(); }");
    assert!(!g.edges.iter().any(|e| e.kind == "calls"));
}

#[test]
fn an_unqualified_nested_call_does_not_fall_back_to_the_crate_root() {
    let g = graph("fn save() {} mod nested { fn run() { save(); } }");
    assert!(!g.edges.iter().any(|e| e.kind == "calls"));
}

#[test]
fn explicit_super_paths_and_import_aliases_still_resolve() {
    let g = graph(
        "fn save() {} mod nested { use super::save as persist; fn run() { persist(); super::save(); } }",
    );
    assert_eq!(g.edges.iter().filter(|e| e.kind == "calls").count(), 2);
}
