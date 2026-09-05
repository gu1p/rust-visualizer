//! Branches, short-circuit evaluation, and labeled loop control.
use crate::{
    analysis::text,
    flow::{Flow, LoopContext},
};
use proc_macro2::Span;
use syn::{Expr, spanned::Spanned};

impl Flow<'_> {
    pub(crate) fn repeat_expr(&mut self, expr: &Expr) {
        match expr {
            Expr::ForLoop(e) => {
                self.expr(&e.expr);
                self.loop_body(
                    &e.body,
                    e.label.as_ref(),
                    &format!("for {} in {}", text(&e.pat), text(&e.expr)),
                    None,
                    e.span(),
                    true,
                );
            }
            Expr::While(e) => self.loop_body(
                &e.body,
                e.label.as_ref(),
                &format!("while {}", text(&e.cond)),
                Some(&e.cond),
                e.span(),
                true,
            ),
            Expr::Loop(e) => {
                self.loop_body(&e.body, e.label.as_ref(), "loop", None, e.span(), false)
            }
            _ => {}
        }
    }

    pub(crate) fn branch(&mut self, expr: &syn::ExprIf) {
        self.expr(&expr.cond);
        let id = self.step(
            "branch",
            &format!("if {}", text(&expr.cond)),
            expr.cond.span(),
        );
        self.pending = vec![(id.clone(), "sim".into())];
        self.block(&expr.then_branch);
        let yes = std::mem::take(&mut self.pending);
        self.pending = vec![(id, "não".into())];
        if let Some((_, branch)) = &expr.else_branch {
            self.expr(branch);
        }
        self.pending.extend(yes);
    }

    pub(crate) fn match_expr(&mut self, expr: &syn::ExprMatch) {
        self.expr(&expr.expr);
        let id = self.step(
            "match",
            &format!("match {}", text(&expr.expr)),
            expr.expr.span(),
        );
        let mut ends = Vec::new();
        for arm in &expr.arms {
            let label = match &arm.guard {
                Some((_, guard)) => format!("{} if {} (guarda)", text(&arm.pat), text(guard)),
                None => text(&arm.pat),
            };
            self.pending = vec![(id.clone(), label)];
            self.expr(&arm.body);
            ends.append(&mut self.pending);
        }
        self.pending = ends;
    }

    #[allow(clippy::too_many_arguments)]
    pub(crate) fn loop_body(
        &mut self,
        body: &syn::Block,
        label: Option<&syn::Label>,
        name: &str,
        condition: Option<&Expr>,
        span: Span,
        can_finish: bool,
    ) {
        let label = label.map(|l| l.name.ident.to_string()).unwrap_or_default();
        let name = if label.is_empty() {
            name.into()
        } else {
            format!("'{label}: {name}")
        };
        let header = self.step("loop", &name, span);
        let exit = self.detached("merge", "Após o laço", span);
        self.loops.push(LoopContext {
            label,
            header: header.clone(),
            exit: exit.clone(),
        });
        let decision = if let Some(condition) = condition {
            self.expr(condition);
            self.step("branch", &text(condition), condition.span())
        } else {
            header.clone()
        };
        if can_finish {
            self.link(&decision, &exit, "fim / falso");
        }
        self.pending = vec![(decision, "corpo".into())];
        self.block(body);
        for (_, label) in &mut self.pending {
            *label = "repetir".into();
        }
        self.connect(&header);
        self.loops.pop();
        self.pending = vec![(exit, String::new())];
    }

    pub(crate) fn jump(&mut self, kind: &str, label: Option<&syn::Lifetime>, span: Span) {
        let label = label.map(|l| l.ident.to_string());
        let context = self
            .loops
            .iter()
            .rev()
            .find(|c| label.as_ref().is_none_or(|l| l == &c.label));
        let target = context.map(|c| {
            if kind == "break" {
                c.exit.clone()
            } else {
                c.header.clone()
            }
        });
        self.step(kind, kind, span);
        if let Some(target) = target {
            self.connect(&target);
        }
        self.pending.clear();
    }

    pub(crate) fn binary(&mut self, expr: &syn::ExprBinary) {
        self.expr(&expr.left);
        if matches!(expr.op, syn::BinOp::And(_) | syn::BinOp::Or(_)) {
            let and = matches!(expr.op, syn::BinOp::And(_));
            let id = self.step(
                "branch",
                &format!("{} · curto-circuito", text(&expr.op)),
                expr.span(),
            );
            self.pending = vec![(id.clone(), if and { "sim" } else { "não" }.into())];
            self.expr(&expr.right);
            self.pending
                .push((id, if and { "não" } else { "sim" }.into()));
        } else {
            self.expr(&expr.right);
            self.step("expression", &text(expr), expr.span());
        }
    }
}
