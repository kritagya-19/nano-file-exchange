# ╔══════════════════════════════════════════════════════════════════════╗
# ║  Nano Exchange API — Multi-Stage Dockerfile                          ║
# ║                                                                      ║
# ║  Stages:                                                             ║
# ║    builder  — installs deps into a clean venv (no cache in image)   ║
# ║    dev      — mounts source, hot-reload via uvicorn                 ║
# ║    prod     — minimal runtime image, gunicorn + uvicorn workers     ║
# ╚══════════════════════════════════════════════════════════════════════╝

# ── Pinned base image (slim = ~50MB smaller than full, has gcc for orjson) ──
ARG PYTHON_VERSION=3.11.9
FROM python:${PYTHON_VERSION}-slim AS base

# Prevents Python from writing .pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # PIP tuning — no cache, no version check banner
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    # Virtual environment path (shared across stages)
    VENV_PATH=/opt/venv

# ── Stage 1: builder — compile wheels & install into an isolated venv ───────
FROM base AS builder

# Install build tools needed by orjson (Rust/C extension), mysqlclient, bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libffi-dev \
        default-libmysqlclient-dev \
        pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Create the venv
RUN python -m venv ${VENV_PATH}
ENV PATH="${VENV_PATH}/bin:$PATH"

# Install deps as a separate layer — cached unless requirements.txt changes
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt


# ── Stage 2: dev — live-reload for local development ────────────────────────
FROM base AS dev

# Only copy the venv (not the build tools)
COPY --from=builder ${VENV_PATH} ${VENV_PATH}
ENV PATH="${VENV_PATH}/bin:$PATH"

WORKDIR /app

# Source is mounted via volume in docker-compose.dev.yml — not copied here.
# This means code changes are reflected instantly without rebuilding the image.

EXPOSE 8000

# Use uvicorn with reload for development
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--reload", \
     "--log-level", "info"]


# ── Stage 3: prod — minimal, hardened production runtime ────────────────────
FROM base AS prod

# Install only runtime libs needed by pymysql/bcrypt (not build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libmariadb3 \
    && rm -rf /var/lib/apt/lists/*

# Copy only the virtual environment from the builder
COPY --from=builder ${VENV_PATH} ${VENV_PATH}
ENV PATH="${VENV_PATH}/bin:$PATH"

WORKDIR /app

# Create a non-root user — running as root in production is a security risk
RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser

# Create the uploads directory and set correct ownership
RUN mkdir -p /app/uploads && chown -R appuser:appuser /app

# Copy application source (only the app package + entrypoint, not tests/venv)
COPY --chown=appuser:appuser app/ ./app/
COPY --chown=appuser:appuser run.py ./

# Switch to non-root user
USER appuser

EXPOSE 8000

# Gunicorn with UvicornWorker — the recommended production setup for FastAPI.
# Workers = (2 × CPU cores) + 1. Set via GUNICORN_WORKERS env var, default 3.
CMD ["sh", "-c", \
     "gunicorn app.main:app \
      -k uvicorn.workers.UvicornWorker \
      -w ${GUNICORN_WORKERS:-3} \
      --bind 0.0.0.0:8000 \
      --timeout 120 \
      --graceful-timeout 30 \
      --keep-alive 5 \
      --access-logfile - \
      --error-logfile - \
      --log-level warning"]
