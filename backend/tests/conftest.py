"""Konfigurasi test: PostgreSQL test DB via Prisma.

Menunjuk `engineering_test` (docker eng-postgres:5433) lewat env DATABASE_URL.
Fixture autouse mereset seluruh tabel ke seed sebelum tiap test agar deterministik.
"""
import asyncio
import os
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from backend.security import JWT_SECRET, load_env

load_env()

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://engineering:engineering123@localhost:5433/engineering_test",
)


def auth_header(role="admin", *, expired=False, fake=False) -> dict:
    """Buat header Authorization Bearer JWT valid (sama secret dengan frontend)."""
    if fake:
        token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.palsu"
    else:
        exp = datetime.now(timezone.utc) - timedelta(hours=1) if expired else datetime.now(timezone.utc) + timedelta(hours=8)
        token = jwt.encode(
            {"sub": "tester", "role": role, "exp": exp},
            JWT_SECRET,
            algorithm="HS256",
        )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def _state_bersih():
    async def _reset():
        from backend import db
        from backend.engine import RAW, reset_raw, ISSUES, TOOLS, IMPROVEMENTS

        reset_raw()
        await db.init_db()
        await db.replace_all(RAW)
        await db.replace_all_in(
            "issues",
            [
                {
                    "eng_id": i.get("eng_id", i["id"]),
                    "title": i["title"],
                    "line": i["line"],
                    "owner": i["owner"],
                    "priority": i["priority"],
                    "status": i["status"],
                    "due_date": i["due_date"],
                }
                for i in ISSUES
            ],
        )
        await db.replace_all_in("tools", TOOLS)
        await db.replace_all_in("improvements", IMPROVEMENTS)
        await db.replace_all_in("defects", [])
        await db.close_db()

    asyncio.run(_reset())
    yield
