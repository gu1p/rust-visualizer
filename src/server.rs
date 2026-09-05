//! Loopback-only HTTP transport; keys stay in this process.
use crate::{
    ai::{ProviderConfig, ask},
    proto::{ChatRequest, ChatResponse, Graph, Session},
};
use axum::{
    Router,
    body::{Body, Bytes},
    extract::{DefaultBodyLimit, State},
    http::{HeaderMap, Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use prost::Message;
use std::sync::Arc;
use tokio::sync::Semaphore;

pub(crate) const HTML: &str = include_str!("../dist/index.html");
pub(crate) const JS: &str = include_str!("../dist/app.js");
pub(crate) const CSS: &str = include_str!("../dist/app.css");

struct App {
    graph: Graph,
    encoded_graph: Vec<u8>,
    config: Option<ProviderConfig>,
    session: Session,
    permits: Semaphore,
}

/// Build the local application with an explicit session token.
/// Bind the resulting router to a loopback listener only.
pub fn router(graph: Graph, config: Option<ProviderConfig>, token: String) -> Router {
    let session = Session {
        ai_enabled: config.is_some(),
        token,
        provider: config
            .as_ref()
            .map(|c| c.provider.clone())
            .unwrap_or_default(),
        model: config.as_ref().map(|c| c.model.clone()).unwrap_or_default(),
    };
    let state = Arc::new(App {
        encoded_graph: graph.encode_to_vec(),
        graph,
        config,
        session,
        permits: Semaphore::new(1),
    });
    Router::new()
        .route(
            "/",
            get(|| async { ([("content-type", "text/html; charset=utf-8")], HTML) }),
        )
        .route(
            "/app.js",
            get(|| async { ([("content-type", "text/javascript; charset=utf-8")], JS) }),
        )
        .route(
            "/app.css",
            get(|| async { ([("content-type", "text/css; charset=utf-8")], CSS) }),
        )
        .route("/api/graph", get(graph_handler))
        .route("/api/session", get(session_handler))
        .route("/api/chat", post(chat_handler))
        .layer(DefaultBodyLimit::max(64 * 1024))
        .layer(middleware::from_fn(local_only))
        .with_state(state)
}

async fn graph_handler(State(app): State<Arc<App>>) -> Response {
    binary(StatusCode::OK, app.encoded_graph.clone())
}

async fn session_handler(State(app): State<Arc<App>>) -> Response {
    binary(StatusCode::OK, app.session.encode_to_vec())
}

async fn chat_handler(State(app): State<Arc<App>>, headers: HeaderMap, body: Bytes) -> Response {
    if headers.get("x-rv-session").and_then(|v| v.to_str().ok()) != Some(&app.session.token) {
        return error(
            StatusCode::FORBIDDEN,
            "Sessão inválida. Recarregue a página.",
        );
    }
    if headers.get("content-type").and_then(|v| v.to_str().ok()) != Some("application/x-protobuf") {
        return error(
            StatusCode::UNSUPPORTED_MEDIA_TYPE,
            "Envie application/x-protobuf",
        );
    }
    let request = match ChatRequest::decode(body) {
        Ok(request) => request,
        Err(_) => return error(StatusCode::BAD_REQUEST, "Mensagem protobuf inválida"),
    };
    let Some(config) = &app.config else {
        return error(
            StatusCode::SERVICE_UNAVAILABLE,
            "Configure OPENAI_API_KEY ou OPENROUTER_API_KEY e reinicie o servidor.",
        );
    };
    let Ok(_permit) = app.permits.try_acquire() else {
        return error(
            StatusCode::TOO_MANY_REQUESTS,
            "Aguarde a resposta em andamento.",
        );
    };
    match ask(config, &app.graph, &request).await {
        Ok(answer) => binary(StatusCode::OK, answer.encode_to_vec()),
        Err(problem) => error(StatusCode::BAD_GATEWAY, &problem.to_string()),
    }
}

fn binary(status: StatusCode, bytes: Vec<u8>) -> Response {
    (status, [("content-type", "application/x-protobuf")], bytes).into_response()
}

fn error(status: StatusCode, message: &str) -> Response {
    binary(
        status,
        ChatResponse {
            error: message.into(),
            ..Default::default()
        }
        .encode_to_vec(),
    )
}

async fn local_only(request: Request<Body>, next: Next) -> Response {
    let headers = request.headers();
    let host = headers.get("host").and_then(|v| v.to_str().ok());
    let origin = headers.get("origin").and_then(|v| v.to_str().ok());
    let valid_host = host.is_none_or(|h| {
        h.parse::<axum::http::uri::Authority>()
            .is_ok_and(|a| ["127.0.0.1", "localhost", "[::1]"].contains(&a.host()))
    });
    let valid_origin = origin.is_none_or(|o| host.is_some_and(|h| o == format!("http://{h}")));
    let cross_site = headers
        .get("sec-fetch-site")
        .is_some_and(|v| v == "cross-site");
    if !valid_host || !valid_origin || cross_site {
        return error(
            StatusCode::FORBIDDEN,
            "Acesso permitido apenas pela interface local",
        );
    }
    let mut response = next.run(request).await;
    for (name, value) in [
        ("cache-control", "no-store"),
        ("x-content-type-options", "nosniff"),
        ("referrer-policy", "no-referrer"),
        (
            "content-security-policy",
            "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src data:; media-src 'self' blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        ),
    ] {
        response
            .headers_mut()
            .insert(name, value.parse().expect("constant header"));
    }
    response
}
