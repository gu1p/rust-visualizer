//! Declaration collection and lexical imports, separate from flow construction.
use crate::analysis::{Analysis, SourceFile, edge, node, text};
use syn::{Item, spanned::Spanned};

pub(crate) fn collect(
    a: &mut Analysis,
    file: &SourceFile,
    items: &[Item],
    scope: &str,
    parent: &str,
) {
    for item in items {
        match item {
            Item::Fn(f) => function(a, file, &f.sig, &f.block, &f.attrs, scope, parent),
            Item::Mod(m) => {
                let qualified = format!("{scope}::{}", m.ident);
                let mut n = node(file, &m.ident.to_string(), &qualified, "module", m.span());
                n.documentation = docs(&m.attrs);
                let id = insert(a, n, parent);
                if let Some((_, items)) = &m.content {
                    collect(a, file, items, &qualified, &id);
                }
            }
            Item::Use(u) => imports(a, scope, "", &u.tree),
            Item::Impl(i) => implementation(a, file, i, scope, parent),
            Item::Struct(s) => {
                type_item(a, file, (&s.ident, "struct", &s.attrs), item, scope, parent)
            }
            Item::Enum(e) => type_item(a, file, (&e.ident, "enum", &e.attrs), item, scope, parent),
            Item::Trait(t) => {
                type_item(a, file, (&t.ident, "trait", &t.attrs), item, scope, parent)
            }
            _ => {}
        }
    }
}

fn type_item(
    a: &mut Analysis,
    file: &SourceFile,
    info: (&syn::Ident, &str, &[syn::Attribute]),
    item: &Item,
    scope: &str,
    parent: &str,
) {
    let (name, kind, attrs) = info;
    let mut n = node(
        file,
        &name.to_string(),
        &format!("{scope}::{name}"),
        kind,
        item.span(),
    );
    n.documentation = docs(attrs);
    n.detail = text(item);
    let id = insert(a, n, parent);
    if let Item::Struct(s) = item {
        for field in &s.fields {
            a.relations.push((
                id.clone(),
                text(&field.ty).replace(' ', ""),
                scope.into(),
                "uses".into(),
            ));
        }
    }
}

fn implementation(
    a: &mut Analysis,
    file: &SourceFile,
    imp: &syn::ItemImpl,
    scope: &str,
    parent: &str,
) {
    let ty = text(&imp.self_ty).replace(' ', "");
    let method_scope = match &imp.trait_ {
        Some((_, path, _)) => format!("{scope}::<{ty} as {}>", text(path)),
        None => format!("{scope}::{ty}"),
    };
    for item in &imp.items {
        if let syn::ImplItem::Fn(f) = item {
            function(a, file, &f.sig, &f.block, &f.attrs, &method_scope, parent);
        }
    }
    if let Some((_, path, _)) = &imp.trait_ {
        a.relations.push((
            format!("{scope}::{ty}"),
            text(path).replace(' ', ""),
            scope.into(),
            "implements".into(),
        ));
    }
}

#[allow(clippy::too_many_arguments)]
fn function(
    a: &mut Analysis,
    file: &SourceFile,
    sig: &syn::Signature,
    block: &syn::Block,
    attrs: &[syn::Attribute],
    scope: &str,
    parent: &str,
) {
    let name = sig.ident.to_string();
    let qualified = format!("{scope}::{name}");
    let span = sig.span().join(block.span()).unwrap_or(block.span());
    let mut n = node(file, &name, &qualified, "function", span);
    n.documentation = docs(attrs);
    n.detail = text(sig);
    n.is_async = sig.asyncness.is_some();
    // Public visibility is a candidate, not a claim about effective reachability.
    let declaration = file
        .source
        .lines()
        .nth(sig.span().start().line.saturating_sub(1))
        .unwrap_or("");
    n.entry_point = name == "main"
        || declaration.trim_start().starts_with("pub ")
        || attrs
            .iter()
            .any(|a| a.path().is_ident("test") || text(a).contains(":: test"));
    let id = insert(a, n, parent);
    crate::flow::build(a, file, &id, scope, sig, block);
}

pub(crate) fn insert(a: &mut Analysis, mut n: crate::proto::Node, parent: &str) -> String {
    n.parent = parent.into();
    let id = n.id.clone();
    if !parent.is_empty() {
        a.graph.edges.push(edge(parent, &id, "contains", "contém"));
    }
    a.graph.nodes.push(n);
    id
}

fn docs(attrs: &[syn::Attribute]) -> String {
    attrs
        .iter()
        .filter_map(|attr| {
            if !attr.path().is_ident("doc") {
                return None;
            }
            if let syn::Meta::NameValue(value) = &attr.meta
                && let syn::Expr::Lit(lit) = &value.value
                && let syn::Lit::Str(s) = &lit.lit
            {
                return Some(s.value().trim().to_string());
            }
            None
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn imports(a: &mut Analysis, scope: &str, prefix: &str, tree: &syn::UseTree) {
    match tree {
        syn::UseTree::Path(p) => imports(a, scope, &format!("{prefix}{}::", p.ident), &p.tree),
        syn::UseTree::Name(n) => {
            a.imports.insert(
                (scope.into(), n.ident.to_string()),
                format!("{prefix}{}", n.ident),
            );
        }
        syn::UseTree::Rename(r) => {
            a.imports.insert(
                (scope.into(), r.rename.to_string()),
                format!("{prefix}{}", r.ident),
            );
        }
        syn::UseTree::Group(g) => {
            for item in &g.items {
                imports(a, scope, prefix, item);
            }
        }
        syn::UseTree::Glob(_) => {}
    }
}
