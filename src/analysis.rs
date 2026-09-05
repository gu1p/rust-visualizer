//! Pure source parsing. No filesystem access, compilation, or macro execution.
use crate::proto::{Edge, Graph, Node};
use proc_macro2::Span;
use quote::ToTokens;
use std::collections::BTreeMap;

/// One Rust file and its lexical module context.
pub struct SourceFile {
    /// Relative source path.
    pub path: String,
    /// Package name, normalized as a Rust identifier.
    pub crate_name: String,
    /// Lexical module path including the package name.
    pub module: String,
    /// UTF-8 source text.
    pub source: String,
}

pub(crate) struct PendingCall {
    pub owner: String,
    pub site: String,
    pub path: String,
    pub scope: String,
    pub method: bool,
}

#[derive(Default)]
pub(crate) struct Analysis {
    pub graph: Graph,
    pub calls: Vec<PendingCall>,
    pub imports: BTreeMap<(String, String), String>,
    pub relations: Vec<(String, String, String, String)>,
}

/// Analyze a source string without touching the filesystem.
///
/// # Errors
/// Returns the syntax error if the source cannot be parsed as Rust.
pub fn analyze_source(path: &str, crate_name: &str, source: &str) -> anyhow::Result<Graph> {
    syn::parse_file(source)?;
    Ok(analyze_sources(&[SourceFile {
        path: path.into(),
        crate_name: crate_name.into(),
        module: crate_name.into(),
        source: source.into(),
    }]))
}

/// Analyze files together so calls can resolve across module boundaries.
pub fn analyze_sources(files: &[SourceFile]) -> Graph {
    let mut analysis = Analysis::default();
    for file in files {
        match syn::parse_file(&file.source) {
            Ok(ast) => {
                analysis.graph.file_count += 1;
                crate::symbols::collect(&mut analysis, file, &ast.items, &file.module, "");
            }
            Err(error) => analysis
                .graph
                .diagnostics
                .push(format!("{}: {error}", file.path)),
        }
    }
    crate::resolve::resolve(&mut analysis);
    analysis.graph
}

pub(crate) fn text(tokens: &impl ToTokens) -> String {
    tokens.to_token_stream().to_string()
}

pub(crate) fn excerpt(source: &str, span: Span) -> String {
    let start = span.start();
    let end = span.end();
    source
        .lines()
        .enumerate()
        .filter_map(|(i, line)| {
            let number = i + 1;
            if number < start.line || number > end.line {
                return None;
            }
            let from = if number == start.line {
                start.column
            } else {
                0
            };
            let to = if number == end.line {
                end.column
            } else {
                line.len()
            };
            Some(line.get(from..to).unwrap_or(line))
        })
        .collect::<Vec<_>>()
        .join("\n")
}

pub(crate) fn node(file: &SourceFile, name: &str, qualified: &str, kind: &str, span: Span) -> Node {
    Node {
        id: format!(
            "{qualified}@{}:{}:{}",
            file.path,
            span.start().line,
            span.start().column
        ),
        name: name.into(),
        qualified_name: qualified.into(),
        kind: kind.into(),
        file: file.path.clone(),
        line: span.start().line as u32,
        end_line: span.end().line as u32,
        source: excerpt(&file.source, span),
        ..Default::default()
    }
}

pub(crate) fn edge(from: &str, to: &str, kind: &str, label: &str) -> Edge {
    Edge {
        from: from.into(),
        to: to.into(),
        kind: kind.into(),
        label: label.into(),
    }
}

#[cfg(test)]
#[path = "analysis_tests.rs"]
mod analysis_tests;
