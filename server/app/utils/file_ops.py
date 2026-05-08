"""
Shared file-system utilities for safely resolving and deleting uploaded files.

SECURITY: All paths are jailed inside UPLOAD_DIR. Absolute paths or
directory traversal sequences (../../) are rejected outright.
"""

import os
import logging

from app.config import settings

logger = logging.getLogger(__name__)


def resolve_abs_file_path(file_path: str | None) -> str | None:
    """Safely resolve a stored relative filename to an absolute path.

    Returns the absolute path if safe, or None if the path is suspicious.
    """
    if not file_path:
        return None
    basename = os.path.basename(file_path)
    if not basename or basename != file_path:
        logger.warning("Rejected suspicious file_path from DB: %s", file_path)
        return None
    upload_dir = os.path.realpath(settings.UPLOAD_DIR)
    full_path = os.path.realpath(os.path.join(upload_dir, basename))
    if not full_path.startswith(upload_dir + os.sep) and full_path != upload_dir:
        logger.warning("Path jail escape attempt: %s", full_path)
        return None
    return full_path


def delete_file_from_disk(file_path: str | None) -> None:
    """Delete a file from disk if it exists inside the upload directory."""
    full_path = resolve_abs_file_path(file_path)
    if not full_path:
        return
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except OSError as e:
            logger.error("Failed to delete file %s: %s", full_path, e)
