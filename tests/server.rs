//! HTTP integration contracts: protobuf transport, local origin, and embedded assets.
use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use http_body_util::BodyExt;
use prost::Message;
use rust_visualizer::{
    analyze,
    proto::{ChatRequest, ChatResponse, Graph},
    server::router,
};
use tower::ServiceExt;

fn app() -> axum::Router {
    router(
        analyze(std::path::Path::new("tests/fixtures/journey")).unwrap(),
        None,
        "test-session".into(),
    )
}

#[tokio::test]
async fn graph_and_config_are_protobuf_and_assets_are_embedded() {
    let response = app()
        .oneshot(Request::get("/api/graph").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(response.headers()["content-type"], "application/x-protobuf");
    let graph = Graph::decode(response.into_body().collect().await.unwrap().to_bytes()).unwrap();
    assert!(graph.nodes.len() > 10);
    for path in ["/", "/app.js", "/app.css"] {
        let response = app()
            .oneshot(Request::get(path).body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }
}

#[tokio::test]
async fn chat_requires_session_token_and_reports_missing_configuration_in_protobuf() {
    let body = ChatRequest {
        question: "Explique".into(),
        ..Default::default()
    }
    .encode_to_vec();
    let response = app()
        .oneshot(
            Request::post("/api/chat")
                .header("content-type", "application/x-protobuf")
                .body(Body::from(body.clone()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
    let response = app()
        .oneshot(
            Request::post("/api/chat")
                .header("content-type", "application/x-protobuf")
                .header("x-rv-session", "test-session")
                .body(Body::from(body))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    let chat =
        ChatResponse::decode(response.into_body().collect().await.unwrap().to_bytes()).unwrap();
    assert!(chat.error.contains("OPENAI_API_KEY"));
}

#[tokio::test]
async fn cross_origin_and_hostile_host_requests_are_rejected() {
    for (name, value) in [("origin", "https://evil.example"), ("host", "evil.example")] {
        let response = app()
            .oneshot(
                Request::get("/api/graph")
                    .header(name, value)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }
}
