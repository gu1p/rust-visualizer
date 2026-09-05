//! Bounded lexical retrieval, with selected sources and graph neighbors ranked first.
use crate::proto::{ChatRequest, Graph, Node};
use std::collections::HashSet;

pub(crate) fn context_for(graph: &Graph, request: &ChatRequest) -> String {
    let mut out = format!(
        "Repository: {}. Total nodes: {}. This is a bounded subset.\n",
        graph.name,
        graph.nodes.len()
    );
    let mut included = HashSet::new();
    for n in ranked_nodes(graph, request).into_iter().take(160) {
        let source: String = n.source.chars().take(2500).collect();
        let name = if n.qualified_name.is_empty() {
            &n.name
        } else {
            &n.qualified_name
        };
        let record = format!(
            "\nNODE {}\n{} [{}] {}:{}\n{}\nSOURCE (may be truncated):\n{}\nEND SOURCE\n",
            n.id,
            name,
            n.kind,
            n.file,
            n.line,
            n.detail.chars().take(500).collect::<String>(),
            source
        );
        if out.len() + record.len() > 75_000 {
            continue;
        }
        out.push_str(&record);
        included.insert(n.id.as_str());
    }
    out.push_str("\nEDGES (static):\n");
    for e in &graph.edges {
        if included.contains(e.from.as_str()) && included.contains(e.to.as_str()) {
            let record = format!("{} -> {} [{}: {}]\n", e.from, e.to, e.kind, e.label);
            if out.len() + record.len() > 95_000 {
                break;
            }
            out.push_str(&record);
        }
    }
    out
}

fn ranked_nodes<'a>(graph: &'a Graph, request: &ChatRequest) -> Vec<&'a Node> {
    let selected: HashSet<_> = request.selected_ids.iter().map(String::as_str).collect();
    let neighbors: HashSet<_> = graph
        .edges
        .iter()
        .filter(|e| selected.contains(e.from.as_str()) || selected.contains(e.to.as_str()))
        .flat_map(|e| [e.from.as_str(), e.to.as_str()])
        .collect();
    let query = request.question.to_lowercase();
    let terms: Vec<_> = query
        .split(|c: char| !c.is_alphanumeric() && c != '_')
        .filter(|s| s.len() > 2)
        .collect();
    let mut ranked: Vec<_> = graph
        .nodes
        .iter()
        .map(|n| {
            let label =
                format!("{} {} {}", n.name, n.qualified_name, n.documentation).to_lowercase();
            let score = usize::from(selected.contains(n.id.as_str())) * 1000
                + usize::from(selected.contains(n.parent.as_str())) * 500
                + usize::from(neighbors.contains(n.id.as_str())) * 100
                + terms.iter().filter(|term| label.contains(**term)).count() * 10
                + usize::from(n.entry_point) * 5;
            (score, n)
        })
        .collect();
    ranked.sort_by(|a, b| b.0.cmp(&a.0).then(a.1.id.cmp(&b.1.id)));
    ranked.into_iter().map(|(_, node)| node).collect()
}
