# Development contract

- Use strict TDD: behavioral/UI contracts first, then unit tests, then integration tests,
  then implementation. Reproduce bugs with a failing test before fixing them.
- Run `make check` for each change. Keep the change small and reversible.
- Use protobuf for Rust/browser payloads. `proto/graph.proto` is the source of truth.
  Run `make proto-types` after schema edits; commit generated JavaScript and TypeScript declarations.
  JSON is confined to the external provider boundary and build tool configuration.
- Keep analysis pure. Repository IO belongs in scan, HTTP/provider IO in adapters.
- All public Rust items need documentation; Result-returning functions document errors.
- Handwritten code files stay below 400 lines and Rust functions below 50 lines.
  Unit tests live in sibling `*_tests.rs` files. Generated files are exempt from size limits.
- Identifiers and documentation are English. Interface text is pt-BR.
- UI tests use semantic roles/labels and cover loading, empty, error, keyboard access,
  graph actions and source presence.
- Never assert static analysis is an actual execution trace. Surface unresolved calls,
  macro expansion and type-resolution limitations.
- Never send provider keys to the browser or execute provider-supplied code.
