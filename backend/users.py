"""Manajemen akun — PBKDF2-SHA256 (sama format dengan WebCrypto frontend) + CRUD."""
from __future__ import annotations

import base64
import hashlib
import hmac
import os
from typing import Any

ITERATIONS = 100_000
KEY_LENGTH = 32


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def hash_password(password: str, salt_b64: str | None = None) -> tuple[str, str]:
    """Return (salt_b64url, hash_b64url) — PBKDF2-HMAC-SHA256, 100k iter."""
    salt = _b64url_decode(salt_b64) if salt_b64 else os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS, dklen=KEY_LENGTH)
    return _b64url_encode(salt), _b64url_encode(dk)


def verify_password(password: str, salt_b64: str, hash_b64: str) -> bool:
    try:
        salt = _b64url_decode(salt_b64)
        expected = _b64url_decode(hash_b64)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS, dklen=KEY_LENGTH)
        return hmac.compare_digest(dk, expected)
    except Exception:
        return False


DEFAULT_USERS: dict[str, tuple[str, str]] = {
    "admin": ("admin123", "admin"),
    "engineer": ("engineer123", "engineer"),
    "viewer": ("viewer123", "viewer"),
    "qc": ("qc123", "qc"),
}

VALID_ROLES = ("admin", "engineer", "viewer", "qc")


async def seed_default_users() -> None:
    from . import db

    if await db.count_rows_in("users") > 0:
        return
    for username, (password, role) in DEFAULT_USERS.items():
        salt, pw_hash = hash_password(password)
        await db.insert_row_in("users", {"username": username, "salt": salt, "hash": pw_hash, "role": role})


def public_user(row: dict[str, Any]) -> dict[str, Any]:
    """Proyeksi user tanpa field hash/salt."""
    return {"username": row["username"], "role": row["role"]}
