//! Control-flow construction with explicit branch exits and deferred boundaries.
use crate::analysis::{Analysis, SourceFile, edge, node, text};
use proc_macro2::Span;
use std::collections::HashSet;
use syn::{Block, Expr, Stmt, spanned::Spanned};

pub(crate) struct LoopContext {
    pub label: String,
    pub header: String,
    pub exit: String,
}

pub(crate) struct Flow<'a> {
    pub analysis: &'a mut Analysis,
    pub file: &'a SourceFile,
    pub owner: &'a str,
    pub scope: &'a str,
    pub pending: Vec<(String, String)>,
    pub exit: String,
    pub loops: Vec<LoopContext>,
    pub shadowed: HashSet<String>,
    counter: usize,
}

pub(crate) fn build(
    a: &mut Analysis,
    file: &SourceFile,
    owner: &str,
    scope: &str,
    signature: &syn::Signature,
    block: &Block,
) {
    let mut flow = Flow {
        analysis: a,
        file,
        owner,
        scope,
        pending: Vec::new(),
        exit: String::new(),
        loops: Vec::new(),
        shadowed: bindings(signature, block),
        counter: 0,
    };
    flow.exit = flow.detached("exit", "Saída", block.span());
    flow.step("entry", "Entrada", block.span());
    flow.block(block);
    flow.connect(&flow.exit.clone());
}

fn bindings(signature: &syn::Signature, block: &Block) -> HashSet<String> {
    use syn::visit::Visit;
    #[derive(Default)]
    struct Bindings(HashSet<String>);
    impl<'ast> Visit<'ast> for Bindings {
        fn visit_pat_ident(&mut self, pattern: &'ast syn::PatIdent) {
            self.0.insert(pattern.ident.to_string());
            syn::visit::visit_pat_ident(self, pattern);
        }
    }
    let mut bindings = Bindings::default();
    bindings.visit_signature(signature);
    bindings.visit_block(block);
    bindings.0
}

impl Flow<'_> {
    pub(crate) fn detached(&mut self, kind: &str, name: &str, span: Span) -> String {
        self.counter += 1;
        let mut n = node(self.file, name, name, kind, span);
        n.id = format!("{}#{}", self.owner, self.counter);
        n.parent = self.owner.into();
        n.qualified_name = self.scope.into();
        let id = n.id.clone();
        self.analysis.graph.nodes.push(n);
        id
    }

    pub(crate) fn step(&mut self, kind: &str, name: &str, span: Span) -> String {
        let id = self.detached(kind, name, span);
        self.connect(&id);
        self.pending = vec![(id.clone(), String::new())];
        id
    }

    pub(crate) fn connect(&mut self, to: &str) {
        for (from, label) in self.pending.drain(..) {
            self.analysis
                .graph
                .edges
                .push(edge(&from, to, "flow", &label));
        }
    }

    pub(crate) fn link(&mut self, from: &str, to: &str, label: &str) {
        self.analysis
            .graph
            .edges
            .push(edge(from, to, "flow", label));
    }

    pub(crate) fn block(&mut self, block: &Block) {
        for stmt in &block.stmts {
            match stmt {
                Stmt::Local(local) => {
                    if let Some(init) = &local.init {
                        self.expr(&init.expr);
                        if let Some((_, diverge)) = &init.diverge {
                            self.let_else(local, diverge);
                        }
                    }
                    self.step(
                        "statement",
                        &format!("let {}", text(&local.pat)),
                        local.span(),
                    );
                }
                Stmt::Expr(expr, _) => self.expr(expr),
                Stmt::Macro(m) => {
                    self.step("macro", &format!("{}!", text(&m.mac.path)), m.span());
                }
                Stmt::Item(_) => {} // A declaration does not execute its body.
            }
        }
    }

    fn let_else(&mut self, local: &syn::Local, diverge: &Expr) {
        let id = self.step(
            "branch",
            &format!("let {} corresponde?", text(&local.pat)),
            local.span(),
        );
        self.pending = vec![(id.clone(), "não corresponde".into())];
        self.expr(diverge);
        self.pending.push((id, "corresponde".into()));
    }

    pub(crate) fn expr(&mut self, expr: &Expr) {
        match expr {
            Expr::If(e) => self.branch(e),
            Expr::Match(e) => self.match_expr(e),
            Expr::ForLoop(_) | Expr::While(_) | Expr::Loop(_) => self.repeat_expr(expr),
            Expr::Return(e) => {
                if let Some(value) = &e.expr {
                    self.expr(value);
                }
                self.step("return", "return", e.span());
                self.connect(&self.exit.clone());
            }
            Expr::Break(e) => {
                if let Some(value) = &e.expr {
                    self.expr(value);
                }
                self.jump("break", e.label.as_ref(), e.span());
            }
            Expr::Continue(e) => self.jump("continue", e.label.as_ref(), e.span()),
            Expr::Try(e) => self.try_expr(e),
            Expr::Await(e) => {
                self.expr(&e.base);
                self.step("await", ".await · suspender / retomar", e.span());
            }
            Expr::Closure(_) | Expr::Async(_) => {
                self.step("deferred", "Corpo adiado · closure / async", expr.span());
            }
            Expr::Call(e) => self.call(e),
            Expr::MethodCall(e) => self.method_call(e),
            Expr::Block(e) => self.block(&e.block),
            Expr::Unsafe(e) => self.block(&e.block),
            Expr::Binary(e) => self.binary(e),
            Expr::Macro(e) => {
                self.step(
                    "macro",
                    &format!("{}! · expansão não analisada", text(&e.mac.path)),
                    e.span(),
                );
            }
            _ => self.value_expr(expr),
        }
    }

    fn try_expr(&mut self, expr: &syn::ExprTry) {
        self.expr(&expr.expr);
        let id = self.step("try", "? · propagar erro", expr.span());
        self.link(&id, &self.exit.clone(), "Err / None");
        self.pending = vec![(id, "Ok / Some".into())];
    }
}
