//! Provider-independent contracts for grounded graph commands.
use super::*;
use crate::proto::{Graph, Node};

fn graph() -> Graph {
    Graph {
        nodes: vec![Node {
            id: "f".into(),
            name: "process".into(),
            source: "fn process() {}".into(),
            ..Default::default()
        }],
        ..Default::default()
    }
}

#[test]
fn answers_must_reference_real_nodes_and_never_execute_arbitrary_commands() {
    assert!(
        parse_answer(
            r#"{"answer":"ok","highlights":["missing"],"steps":[]}"#,
            &graph()
        )
        .is_err()
    );
    assert!(
        parse_answer(
            r#"{"answer":"ok","highlights":[],"steps":[],"javascript":"alert(1)"}"#,
            &graph()
        )
        .is_err()
    );
    let answer = parse_answer(r#"{"answer":"Veja process","highlights":["f"],"steps":[{"node_id":"f","explanation":"Entrada"}]}"#, &graph()).unwrap();
    assert_eq!(answer.highlights, ["f"]);
    assert_eq!(answer.steps[0].node_id, "f");
}

#[test]
fn key_selection_is_deterministic_and_missing_configuration_is_actionable() {
    let config = ProviderConfig::from_lookup(|key| match key {
        "OPENROUTER_API_KEY" => Some("router-secret".into()),
        _ => None,
    })
    .unwrap()
    .unwrap();
    assert_eq!(
        config.endpoint,
        "https://openrouter.ai/api/v1/chat/completions"
    );
    assert!(!format!("{config:?}").contains("router-secret"));
    assert!(ProviderConfig::from_lookup(|_| None).unwrap().is_none());
    assert!(
        ProviderConfig::from_lookup(|key| (key == "RV_AI_PROVIDER").then(|| "bogus".into()))
            .is_err()
    );
}

#[test]
fn provider_context_is_bounded_and_prioritizes_selected_source() {
    let mut graph = graph();
    graph.nodes[0].source = "a".repeat(500_000);
    let request = crate::proto::ChatRequest {
        question: "Explique".into(),
        selected_ids: vec!["f".into()],
        ..Default::default()
    };
    let context = context_for(&graph, &request);
    assert!(context.len() <= 100_000);
    assert!(context.contains("process"));
}
