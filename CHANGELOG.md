# Change Log — Engineering Performance Dashboard

Semua perubahan versi, patch keamanan, dan update dicatat di sini. Format: [Semantic Versioning](https://semver.org) (`MAJOR.MINOR.PATCH`).

- **MAJOR** — perubahan besar / tidak kompatibel
- **MINOR** — fitur baru (kompatibel)
- **PATCH** — perbaikan bug / patch keamanan

Setiap versi diberi **git tag** (`vX.Y.Z`) sebagai titik rollback. Lihat `git tag`, rollback via `git checkout vX.Y.Z`.

## [1.0.0] — 2026-08-11 — CHECKPOINT: Web App Selesai

Status: titik rollback resmi. Semua fitur inti berjalan: dashboard, input manual + backfill, impor/export Excel standar, display mode, autentikasi multi-role.

### Fitur
- Dashboard utama (KPI: FPY, OEE, Line Balance, Setup, Issue Closure) + auto-refresh 5 menit
- Display mode `/display` — kiosk fullscreen hanya dashboard, auto-refresh 60 detik
- Input manual + **backfill/edit data lama** (upsert date+model+line)
- Impor Excel (panduan kolom otomatis, preview, warning) + **file standar template & export**
- Manajemen user multi-role (admin/engineer/viewer/qc), ganti password
- Rate limiting login anti brute-force
- PostgreSQL persistence via Prisma, seed demo 30 hari

### Keamanan
- **Kritis:** `.env` (berisi `JWT_SECRET`, `DATABASE_URL`) sebelumnya ter-track di git. Sekarang **di-untrack** (`git rm --cached .env`). **Segera rotasi `JWT_SECRET` + password default** (admin123, engineer123, viewer123, qc123) — lihat Settings → User Management.
- Validasi server-side `fpg + defect <= input` (sebelumnya hanya frontend)
- Excel import menolak baris `fpg + defect > input`

### Perbaikan Bug (audit)
- Crash `ZeroDivisionError` saat improvement `baseline = 0` (backend + frontend)
- `defectRate` NaN di dashboard saat `input = 0`
- Duplikat data saat commit Excel berulang — sekarang upsert
- Stale read `GET /api/raw-data` antar worker (`--workers 2`) — sekarang sync dari DB
- Upsert `date+model+line` untuk edit/backfill data lama

### Teknis
- Backend: FastAPI + uvicorn `--workers 2`, port 8101
- Frontend: Next.js (production build), port 3011
- PostgreSQL lokal port 5433 (PM2 `eng-postgres`)

---

### Konvensi Update ke Depan
1. Naikkan versi di `VERSION` + tambah entri `CHANGELOG.md` di **setiap** update.
2. Patch keamanan wajib masuk seksi `### Keamanan` dengan deskripsi dampak.
3. Setiap rilis: `git tag vX.Y.Z` untuk titik rollback.
4. Test wajib hijau: `pytest backend/tests` + `npx tsc --noEmit` + `npx next build`.
