.DEFAULT_GOAL := check
CARGO ?= cargo
NPM ?= npm
export CARGO_TARGET_DIR ?= $(CURDIR)/target

.PHONY: check proto-types check-proto-types build-ui test build

proto-types:
	$(NPM) run proto

check-proto-types: proto-types
	git diff --exit-code -- web/gen

build-ui:
	$(NPM) run build

test: build-ui
	$(CARGO) test --locked
	$(NPM) run test:unit
	$(NPM) test

check: build-ui
	$(CARGO) fmt --all -- --check
	$(CARGO) clippy --all-targets --locked -- -D warnings
	$(CARGO) test --locked
	$(NPM) run typecheck
	$(NPM) run test:unit
	$(NPM) test
	node scripts/policy.mjs

build: build-ui
	$(CARGO) build --release --locked
