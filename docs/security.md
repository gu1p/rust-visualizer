# Data and security model

The scanner reads Rust sources and Cargo manifests. It never runs Cargo, build scripts,
repository executables, or macros. Hidden/generated directories and symlinks are skipped,
and ignore files are respected. It is not a secret detector; Rust source can itself contain
sensitive strings. An exported HTML includes the scanned source excerpts: share it only
where you would share that source.

AI requests are initiated by the user. Each includes the current question, up to 12 recent
conversation turns, and at most roughly 95 KB of selected/search-ranked graph and source
context. Individual source excerpts are truncated. The adapter has a 90-second timeout,
a 1 MiB response limit, and one concurrent request per server process. Requests may incur
provider charges. Provider retention and model availability are controlled by the provider.

`OPENAI_API_KEY` and `OPENROUTER_API_KEY` stay in the process. The browser receives only
provider/model status and a randomly generated local session token. API keys are excluded
from configuration Debug output and provider errors do not expose raw upstream bodies.
Custom `RV_AI_BASE_URL` endpoints receive the configured credential; use trusted endpoints.
HTTPS is required except for explicit loopback development endpoints. Redirects are disabled.

The server binds to `127.0.0.1`. Host, Origin, and Fetch Metadata checks reject cross-site
requests; AI requests additionally require the local session token and protobuf content
type. Responses disable caching, sniffing, framing, and browser referrer leakage. No CORS
access is granted. Do not expose the local port through a public reverse proxy.

Provider output is restricted to plain text, existing graph node IDs, and explanatory tour
steps. Unknown fields and unknown nodes are rejected. The browser renders model text and
source through text nodes, never HTML. Models cannot execute JavaScript, edit files, issue
shell commands, or submit arbitrary graph mutations. Comments and source are treated as
untrusted context, and model answers can still be wrong.

Chat history lives in page memory and can be cleared. The application stores no chat data
on disk or in browser storage. The optional read-aloud action uses browser/OS speech
synthesis; voice processing and network use depend on that browser and voice service.

Release archives have SHA-256 checksums but macOS binaries are not Apple-notarized.
Verify release provenance and review the source for your threat model.

Please report security issues privately using GitHub's private vulnerability reporting
when available, rather than putting credentials or sensitive repository content in an issue.
