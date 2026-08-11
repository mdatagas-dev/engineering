"""Persistensi PostgreSQL via Prisma Client Python — pakai DATABASE_URL env."""
from __future__ import annotations

from typing import Any

from prisma import Prisma
from prisma.models import RawData, Issue, Tool, Improvement, Defect, User

client: Prisma | None = None

_MODELS = {
    "raw_data": RawData,
    "issues": Issue,
    "tools": Tool,
    "improvements": Improvement,
    "defects": Defect,
    "users": User,
}


def _db() -> Prisma:
    if client is None:
        raise RuntimeError("Prisma client belum dikonek — panggil init_db() (lifespan)")
    return client


async def init_db() -> None:
    """Konek ke PostgreSQL (Prisma). PrismaClient otomatis baca DATABASE_URL env."""
    global client
    if client is not None:
        return
    client = Prisma()
    await client.connect()


async def close_db() -> None:
    global client
    if client is not None:
        await client.disconnect()
        client = None


async def count_rows() -> int:
    return await _db().rawdata.count()


async def load_rows() -> list[dict[str, Any]]:
    rows = await _db().rawdata.find_many(order={"id": "asc"})
    return [r.model_dump() for r in rows]


async def insert_row(row: dict[str, Any]) -> None:
    await _db().rawdata.create(data={k: row[k] for k in row if k in RawData.model_fields})


async def upsert_row(row: dict[str, Any]) -> None:
    """Update baris yang date+model+line-nya sama, else insert (untuk backfill/edit)."""
    db = _db()
    clean = {k: row[k] for k in row if k in RawData.model_fields}
    match = await db.rawdata.find_first(
        where={"date": row["date"], "model": row["model"], "line": row["line"]}
    )
    if match:
        await db.rawdata.update(where={"id": match.id}, data=clean)
    else:
        await db.rawdata.create(data=clean)


async def replace_all(rows: list[dict[str, Any]]) -> None:
    """Hapus semua lalu insert ulang `rows` (dipakai reset/seed)."""
    db = _db()
    await db.rawdata.delete_many()
    if rows:
        await db.rawdata.create_many(data=rows)


# ---------------------------------------------------------------------------
# CRUD generik untuk tabel tambahan (issues, tools, improvements, defects).
# ---------------------------------------------------------------------------

def _delegate(table: str):
    return {
        "issues": _db().issue,
        "tools": _db().tool,
        "improvements": _db().improvement,
        "defects": _db().defect,
        "users": _db().user,
    }[table]


async def list_rows(table: str) -> list[dict[str, Any]]:
    rows = await _delegate(table).find_many(order={"id": "asc"})
    return [r.model_dump() for r in rows]


async def count_rows_in(table: str) -> int:
    return await _delegate(table).count()


async def insert_row_in(table: str, row: dict[str, Any]) -> dict[str, Any]:
    model = _MODELS[table]
    clean = {k: v for k, v in row.items() if k in model.model_fields}
    created = await _delegate(table).create(data=clean)
    return created.model_dump()


async def get_row_in(table: str, id_: int) -> dict[str, Any] | None:
    row = await _delegate(table).find_unique(where={"id": id_})
    return row.model_dump() if row else None


async def update_row_in(table: str, id_: int, patch: dict[str, Any]) -> dict[str, Any] | None:
    model = _MODELS[table]
    clean = {k: v for k, v in patch.items() if k in model.model_fields}
    if not clean:
        return await get_row_in(table, id_)
    try:
        updated = await _delegate(table).update(where={"id": id_}, data=clean)
    except Exception:
        return None
    return updated.model_dump()


async def delete_row_in(table: str, id_: int) -> bool:
    res = await _delegate(table).delete_many(where={"id": id_})
    return res > 0


async def replace_all_in(table: str, rows: list[dict[str, Any]]) -> None:
    model = _MODELS[table]
    delegate = _delegate(table)
    await delegate.delete_many()
    if rows:
        clean = [{k: v for k, v in r.items() if k in model.model_fields} for r in rows]
        await delegate.create_many(data=clean)
