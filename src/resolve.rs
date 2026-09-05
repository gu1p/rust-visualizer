//! Conservative lexical resolution; unknown receivers remain unresolved.
use crate::analysis::{Analysis, edge};
use std::collections::BTreeMap;

pub(crate) fn resolve(a: &mut Analysis) {
    let mut symbols: BTreeMap<String, Vec<String>> = BTreeMap::new();
    for n in &a.graph.nodes {
        if ["function", "struct", "enum", "trait", "module"].contains(&n.kind.as_str()) {
            symbols
                .entry(n.qualified_name.clone())
                .or_default()
                .push(n.id.clone());
        }
    }
    for call in &a.calls {
        let target = if call.method {
            None
        } else {
            lookup(&symbols, &a.imports, &call.path, &call.scope)
        };
        if let Some(target) = target {
            a.graph
                .edges
                .push(edge(&call.owner, target, "calls", "chamada sintática"));
            if let Some(site) = a.graph.nodes.iter_mut().find(|n| n.id == call.site) {
                site.target_id = target.into();
                site.detail =
                    "Destino identificado por caminho lexical; não é prova de execução.".into();
            }
        }
    }
    for (from, path, scope, kind) in &a.relations {
        let origin = if a.graph.nodes.iter().any(|n| &n.id == from) {
            Some(from.as_str())
        } else {
            symbols
                .get(from)
                .filter(|v| v.len() == 1)
                .map(|v| v[0].as_str())
        };
        if let (Some(origin), Some(target)) = (origin, lookup(&symbols, &a.imports, path, scope)) {
            a.graph.edges.push(edge(origin, target, kind, kind));
        }
    }
}

fn lookup<'a>(
    symbols: &'a BTreeMap<String, Vec<String>>,
    imports: &BTreeMap<(String, String), String>,
    path: &str,
    scope: &str,
) -> Option<&'a str> {
    let root = scope.split("::").next().unwrap_or(scope);
    let first = path.split("::").next().unwrap_or(path);
    let expanded = imports
        .get(&(scope.into(), first.into()))
        .map(|prefix| format!("{prefix}{}", &path[first.len()..]));
    let path = expanded.as_deref().unwrap_or(path);
    let candidates = if let Some(rest) = path.strip_prefix("crate::") {
        vec![format!("{root}::{rest}")]
    } else if let Some(rest) = path.strip_prefix("self::") {
        vec![format!("{scope}::{rest}")]
    } else if path.starts_with("super::") {
        vec![super_path(scope, path)]
    } else {
        let mut candidates = vec![format!("{scope}::{path}")];
        if expanded.is_some() {
            candidates.push(format!("{root}::{path}"));
        }
        if path.contains("::") {
            candidates.push(path.into());
        }
        candidates
    };
    for candidate in candidates {
        if let Some(ids) = symbols.get(&candidate) {
            return (ids.len() == 1).then(|| ids[0].as_str());
        }
    }
    None
}

fn super_path(scope: &str, path: &str) -> String {
    let mut scope: Vec<_> = scope.split("::").collect();
    let mut rest = path;
    while let Some(next) = rest.strip_prefix("super::") {
        if scope.len() > 1 {
            scope.pop();
        }
        rest = next;
    }
    format!("{}::{rest}", scope.join("::"))
}
