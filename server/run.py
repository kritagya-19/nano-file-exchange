"""
Production-ready server launcher for Nano File Exchange.

Usage:
  Development : python run.py          (auto-reload, single worker)
  Production  : python run.py --prod   (multi-worker, no reload, optimized)

For true production, use Gunicorn (Linux):
  gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
"""

import sys
import uvicorn


def main():
    is_prod = "--prod" in sys.argv

    if is_prod:
        print("🚀 Starting in PRODUCTION mode (multi-worker, no reload)")
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            workers=4,             # Spawn 4 worker processes (adjust to CPU cores)
            reload=False,          # No auto-reload in production
            access_log=False,      # Disable per-request access log for speed
            log_level="warning",   # Only log warnings and errors
        )
    else:
        print("🔧 Starting in DEVELOPMENT mode (auto-reload, single worker)")
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,           # Auto-reload on file changes
            log_level="info",
        )


if __name__ == "__main__":
    main()
