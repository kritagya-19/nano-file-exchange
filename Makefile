# Makefile — Convenience commands for Nano File Exchange
# Usage: make <target>
# Requires: Docker, Docker Compose, npm, Python

.PHONY: help dev dev-build dev-down dev-logs dev-shell \
        test lint build-docker clean

# ── Default: show help ────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  Nano File Exchange — Dev Commands"
	@echo "  ─────────────────────────────────"
	@echo "  make dev          Start full dev stack (API + MySQL) with hot-reload"
	@echo "  make dev-build    Rebuild images before starting"
	@echo "  make dev-down     Stop and remove dev containers"
	@echo "  make dev-logs     Tail API container logs"
	@echo "  make dev-shell    Open a bash shell inside the running API container"
	@echo ""
	@echo "  make test         Run backend test suite (pytest)"
	@echo "  make lint         Run backend flake8 lint"
	@echo "  make lint-fe      Run frontend ESLint"
	@echo "  make build-fe     Build frontend production bundle"
	@echo ""
	@echo "  make build-docker Build the production Docker image"
	@echo "  make clean        Remove all dev Docker volumes (⚠ wipes local DB)"
	@echo ""

# ── Development ───────────────────────────────────────────────────────────────
dev:
	docker compose -f docker-compose.dev.yml up

dev-build:
	docker compose -f docker-compose.dev.yml up --build

dev-down:
	docker compose -f docker-compose.dev.yml down

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f api

dev-shell:
	docker compose -f docker-compose.dev.yml exec api bash

# ── Testing & Quality ─────────────────────────────────────────────────────────
test:
	cd server && .\\venv\\Scripts\\python.exe -m pytest --tb=short

lint:
	cd server && .\\venv\\Scripts\\flake8 app/ tests/ --config=.flake8

lint-fe:
	cd frontend && npm run lint:ci

build-fe:
	cd frontend && npm run build

# ── Docker ────────────────────────────────────────────────────────────────────
build-docker:
	docker build \
		--file server/Dockerfile \
		--target prod \
		--tag nano-api:latest \
		./server

# ── Cleanup ───────────────────────────────────────────────────────────────────
clean:
	@echo "⚠  This will delete all local Docker volumes (DB data will be lost)."
	@read -p "Continue? [y/N] " confirm && [ "$$confirm" = "y" ]
	docker compose -f docker-compose.dev.yml down -v
