//! Portable Rust source analysis, embedded visualization, and grounded AI graph tours.

/// Configurable OpenAI-compatible provider adapter.
pub mod ai;
/// Pure syntax analysis and conservative relationship resolution.
pub mod analysis;
/// Generated protobuf transport contract.
pub mod proto {
    include!(concat!(env!("OUT_DIR"), "/visualizer.rs"));
}
mod export;
mod flow;
mod flow_control;
mod flow_expr;
mod repository;
mod resolve;
mod scan;
/// Loopback HTTP application serving embedded assets and protobuf APIs.
pub mod server;
mod symbols;

pub use export::export_html;
pub use scan::analyze;
