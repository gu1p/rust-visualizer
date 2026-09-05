//! Single-file offline export with embedded protobuf and bundled assets.
use crate::proto::Graph;
use base64::{Engine, engine::general_purpose::STANDARD};
use prost::Message;

/// Render a self-contained, offline HTML snapshot; AI requires the local server.
pub fn export_html(graph: &Graph) -> String {
    let data = STANDARD.encode(graph.encode_to_vec());
    crate::server::HTML
        .replace(
            "<link rel=\"stylesheet\" href=\"/app.css\">",
            &format!("<style>{}</style>", crate::server::CSS),
        )
        .replace(
            "<!-- GRAPH_DATA -->",
            &format!("<script id=\"graph-data\" type=\"application/x-protobuf\">{data}</script>"),
        )
        .replace("<script src=\"/app.js\" defer></script>", "")
        .replace(
            "</body>",
            &format!(
                "<script>{}</script></body>",
                crate::server::JS.replace("</script", "<\\/script")
            ),
        )
}
