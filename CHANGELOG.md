# Change Log — Engineering Performance Dashboard

Semua perubahan versi, patch keamanan, dan update dicatat di sini. Format: [Semantic Versioning](https://semver.org) (`MAJOR.MINOR.PATCH`).

- **MAJOR** — perubahan besar / tidak kompatibel
- **MINOR** — fitur baru (kompatibel)
- **PATCH** — perbaikan bug / patch keamanan

Setiap versi diberi **git tag** (`vX.Y.Z`) sebagai titik rollback. Lihat `git tag`, rollback via `git checkout vX.Y.Z`.

## [1.1.2] — 2026-08-12 — Tambah Lini Produksi LINE 1

### Fitur
- Lini produksi (`line`) kini: `IDU` / `ODU` / **`LINE 1`** (input manual, impor excel,
  quality defect, seed demo 270 baris). Unit kategori tetap 4 pilihan (AC SPLIT dkk).

## [1.1.1] — 2026-08-12 — Perbaikan Semantik: IDU/ODU = Lini, Unit = Kategori

### Fitur
- **Pertukaran semantik** (per arahan user): IDU/ODU kini **lini produksi** (`line`),
  dan `AC SPLIT` / `AC PORTABLE` / `WASHING MACHINE` / `AC COMERCIAL` kini
  **unit kategori** (`category`).
  - Input manual: lini IDU/ODU + unit kategori 4 pilihan (keduanya wajib, tampil selalu).
  - Dashboard + display: filter **Semua / IDU / ODU** tetap, kini memfilter `line`.
  - Impor Excel: kolom `line` (IDU/ODU) + `category` (4 unit); template & contoh diperbarui.
  - Quality defect: lini IDU/ODU.
  - Validasi server & excel mengikuti aturan baru.

## [1.1.0] — 2026-08-12 — Kategori Unit IDU/ODU

### Fitur
- **Kategori unit IDU (indoor) / ODU (outdoor)** untuk setiap model:
  - Input manual: toggle IDU/ODU muncul saat lini `AC SPLIT` (wajib diisi).
  - Impor Excel: kolom opsional `category` (alias: `kategori`, `unit_type`), nilai `IDU`/`ODU`/kosong.
  - Template standar kini 13 kolom (termasuk `category`) dengan contoh baris IDU.
  - Dashboard utama + display mode: **filter Semua / IDU / ODU** di atas kartu KPI.
  - Badge kategori di daftar Edit/Backfill data lama.
  - Validasi server: `category` hanya `"" | IDU | ODU` (case-insensitive, dinormalisasi uppercase).

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
