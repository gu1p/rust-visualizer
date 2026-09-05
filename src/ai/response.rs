//! Strict provider-boundary decoding and graph-command allowlisting.
use crate::proto::{ChatResponse, Graph, TourStep};
use anyhow::{Result, ensure};
use serde::Deserialize;
use serde_json::{Value, json};

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Answer {
    answer: String,
    highlights: Vec<String>,
    steps: Vec<Step>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Step {
    node_id: String,
    explanation: String,
}

pub(crate) fn parse_answer(content: &str, graph: &Graph) -> Result<ChatResponse> {
    let answer: Answer = serde_json::from_str(content)
        .map_err(|_| anyhow::anyhow!("O modelo retornou um formato inválido; tente novamente"))?;
    ensure!(
        !answer.answer.trim().is_empty() && answer.answer.len() <= 16_000,
        "Resposta de IA vazia ou muito longa"
    );
    ensure!(
        answer.highlights.len() <= 64 && answer.steps.len() <= 32,
        "A resposta contém passos demais"
    );
    let valid = |id: &String| graph.nodes.iter().any(|n| &n.id == id);
    ensure!(
        answer.highlights.iter().all(valid) && answer.steps.iter().all(|s| valid(&s.node_id)),
        "A IA referenciou um nó inexistente; tente novamente"
    );
    ensure!(
        answer
            .steps
            .iter()
            .all(|s| !s.explanation.trim().is_empty() && s.explanation.len() <= 4000),
        "Explicação de passo inválida"
    );
    Ok(ChatResponse {
        answer: answer.answer,
        highlights: answer.highlights,
        steps: answer
            .steps
            .into_iter()
            .map(|s| TourStep {
                node_id: s.node_id,
                explanation: s.explanation,
            })
            .collect(),
        error: String::new(),
    })
}

pub(crate) fn schema() -> Value {
    json!({"type":"json_schema","json_schema":{"name":"graph_answer","strict":true,"schema":{
        "type":"object", "additionalProperties":false,
        "required":["answer","highlights","steps"],
        "properties":{
            "answer":{"type":"string"},
            "highlights":{"type":"array","items":{"type":"string"}},
            "steps":{"type":"array","items":{
                "type":"object","additionalProperties":false,
                "required":["node_id","explanation"],
                "properties":{"node_id":{"type":"string"},"explanation":{"type":"string"}}
            }}
        }
    }}})
}
