//! Real HTTP transport against a local provider double; never requires paid credentials.
use axum::{Json, Router, routing::post};
use rust_visualizer::{
    ai::{ProviderConfig, ask},
    analyze,
    proto::ChatRequest,
};
use serde_json::{Value, json};

#[tokio::test]
async fn openai_compatible_request_returns_text_and_validated_graph_steps() {
    let graph = analyze(std::path::Path::new("tests/fixtures/journey")).unwrap();
    let node = graph
        .nodes
        .iter()
        .find(|n| n.name == "process")
        .unwrap()
        .id
        .clone();
    let answer_node = node.clone();
    let app = Router::new().route(
        "/chat/completions",
        post(move |Json(body): Json<Value>| {
            let node = answer_node.clone();
            async move {
                assert_eq!(body["response_format"]["json_schema"]["strict"], true);
                assert_eq!(body["model"], "test-model");
                assert!(body["messages"].to_string().contains("save(total).await?"));
                Json(json!({"choices":[{"message":{"content":json!({
                "answer":"A validação precede a persistência.", "highlights":[node],
                "steps":[{"node_id":node,"explanation":"Valida a entrada."}]
            }).to_string()}}]}))
            }
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let base = format!("http://{}/", listener.local_addr().unwrap());
    let task = tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    let config = ProviderConfig::from_lookup(|key| match key {
        "OPENAI_API_KEY" => Some("test-secret".into()),
        "RV_AI_BASE_URL" => Some(base.clone()),
        "RV_AI_MODEL" => Some("test-model".into()),
        _ => None,
    })
    .unwrap()
    .unwrap();
    let request = ChatRequest {
        question: "Como funciona?".into(),
        selected_ids: vec![node.clone()],
        ..Default::default()
    };
    let answer = ask(&config, &graph, &request).await.unwrap();
    assert!(answer.answer.contains("validação"));
    assert_eq!(answer.steps[0].node_id, node);
    task.abort();
}

#[tokio::test]
async fn upstream_errors_do_not_echo_provider_body_or_credentials() {
    let app = Router::new().route(
        "/chat/completions",
        post(|| async {
            (
                axum::http::StatusCode::UNAUTHORIZED,
                "test-secret provider-internal-body",
            )
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let base = format!("http://{}/", listener.local_addr().unwrap());
    let task = tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    let config = ProviderConfig::from_lookup(|key| match key {
        "OPENAI_API_KEY" => Some("test-secret".into()),
        "RV_AI_BASE_URL" => Some(base.clone()),
        _ => None,
    })
    .unwrap()
    .unwrap();
    let error = ask(
        &config,
        &Default::default(),
        &ChatRequest {
            question: "Hi".into(),
            ..Default::default()
        },
    )
    .await
    .unwrap_err()
    .to_string();
    assert!(error.contains("401"));
    assert!(!error.contains("test-secret"));
    assert!(!error.contains("provider-internal-body"));
    task.abort();
}
