//! Expression ordering and unresolved call-site preservation.
use crate::{
    analysis::{PendingCall, text},
    flow::Flow,
};
use syn::{Expr, spanned::Spanned};

impl Flow<'_> {
    pub(crate) fn call(&mut self, expr: &syn::ExprCall) {
        if !matches!(&*expr.func, Expr::Path(_)) {
            self.expr(&expr.func);
        }
        for arg in &expr.args {
            self.expr(arg);
        }
        let path = text(&expr.func).replace(' ', "");
        let site = self.step("call", &format!("{path}(…)"), expr.span());
        self.record_call(site, path, !matches!(&*expr.func, Expr::Path(_)));
    }

    pub(crate) fn method_call(&mut self, expr: &syn::ExprMethodCall) {
        self.expr(&expr.receiver);
        for arg in &expr.args {
            self.expr(arg);
        }
        let site = self.step(
            "call",
            &format!("{}.{}(…)", text(&expr.receiver), expr.method),
            expr.span(),
        );
        self.record_call(site, expr.method.to_string(), true);
    }

    fn record_call(&mut self, site: String, path: String, method: bool) {
        let method = method || self.shadowed.contains(&path);
        if let Some(n) = self.analysis.graph.nodes.iter_mut().find(|n| n.id == site) {
            n.detail =
                "Chamada não resolvida: dependência externa, receiver, alias ou despacho dinâmico."
                    .into();
        }
        self.analysis.calls.push(PendingCall {
            owner: self.owner.into(),
            site,
            path,
            scope: self.scope.into(),
            method,
        });
    }

    pub(crate) fn value_expr(&mut self, expr: &Expr) {
        match expr {
            Expr::Paren(e) => self.expr(&e.expr),
            Expr::Group(e) => self.expr(&e.expr),
            Expr::Reference(e) => self.expr(&e.expr),
            Expr::Unary(e) => self.expr(&e.expr),
            Expr::Cast(e) => self.expr(&e.expr),
            Expr::Field(e) => self.expr(&e.base),
            Expr::Index(e) => {
                self.expr(&e.expr);
                self.expr(&e.index);
            }
            Expr::Assign(e) => {
                self.expr(&e.right);
                self.expr(&e.left);
                self.step("statement", &text(e), e.span());
            }
            Expr::Let(e) => self.expr(&e.expr),
            Expr::Tuple(e) => {
                for item in &e.elems {
                    self.expr(item);
                }
            }
            Expr::Array(e) => {
                for item in &e.elems {
                    self.expr(item);
                }
            }
            Expr::Struct(e) => self.struct_expr(e),
            Expr::Repeat(e) => self.expr(&e.expr),
            Expr::Range(e) => {
                if let Some(start) = &e.start {
                    self.expr(start);
                }
                if let Some(end) = &e.end {
                    self.expr(end);
                }
            }
            Expr::Lit(_) | Expr::Path(_) => {}
            _ => {
                self.step("expression", &text(expr), expr.span());
            }
        }
    }

    fn struct_expr(&mut self, expr: &syn::ExprStruct) {
        for field in &expr.fields {
            self.expr(&field.expr);
        }
        if let Some(rest) = &expr.rest {
            self.expr(rest);
        }
    }
}
