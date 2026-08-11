"""Autentikasi JWT HS256 — verifikasi token dari frontend (WebCrypto → PyJWT kompatibel)."""
import os
from pathlib import Path

import jwt
from dotenv import load_dotenv
from fastapi import Header, HTTPException

ROOT_DIR = Path(__file__).resolve().parents[1]

_dev_secret = "eng-perf-dashboard-secret-2026"
VALID_ROLES = ("admin", "engineer", "viewer")


def load_env() -> None:
    """Muat .env dari root repo (DATABASE_URL, JWT_SECRET) sebelum layanan start."""
    load_dotenv(ROOT_DIR / ".env")


JWT_SECRET = os.environ.get("JWT_SECRET", _dev_secret)
JWT_ALGORITHM = "HS256"


def verify_token(token: str) -> dict | None:
    """Verifikasi JWT HS256; return claim dict kalau valid, None kalau invalid/expired."""
    try:
        claims = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
    sub = claims.get("sub")
    role = claims.get("role")
    if not isinstance(sub, str) or not sub or role not in VALID_ROLES:
        return None
    return {"sub": sub, "role": role}


def get_current_user(authorization: str | None = Header(None)) -> dict:
    """Dependency FastAPI: butuh `Authorization: Bearer <jwt>` valid (semua role boleh)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token tidak ditemukan — login dulu")
    token = authorization.removeprefix("Bearer ").strip()
    user = verify_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Token tidak valid atau kedaluwarsa")
    return user


def get_editor(authorization: str | None = Header(None)) -> dict:
    """Dependency FastAPI: seperti get_current_user, tapi role harus admin/engineer."""
    user = get_current_user(authorization)
    if user["role"] not in ("admin", "engineer"):
        raise HTTPException(status_code=403, detail="Role viewer hanya bisa membaca data")
    return user