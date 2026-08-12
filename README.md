# Engineering Performance Dashboard

Dashboard terpusat performa tim engineering: **10 KPI inti + Setup Time** dalam satu
tampilan **Smart Factory Control Center** bernuansa navy/teal + cyan (ala Hisense),
dihitung otomatis oleh **Calculation Engine**.

## Fitur

- **Dashboard Utama** — 5 kartu KPI (FPY, OEE, Line Balance, Setup Time, Issue Closure)
  + Engineering Trend, Defect Pareto, Setup Time vs Standar, Cycle Time vs Target,
  Issue Status, banner alert overdue. **Auto-refresh 5 menit**.
- **Display Mode** (`/display`) — tampilan kiosk fullscreen **hanya dashboard utama**
  (tanpa sidebar/menu) untuk layar monitor terpisah; tombol "Tampilkan di Display"
  di dashboard, fullscreen toggle, **auto-refresh 60 detik**.
- **Process Performance** — Detail OEE (A×P×Q), Takt Time, Cycle Time Achievement,
  Line Balance per lini dengan penanda bottleneck, tren Setup Time.
- **Quality** — FPY harian, Defect Rate, Analisis Pareto, cacat per lini,
  + **Input Defect Manual** (persisten): catat defect per tanggal/lini/model.
- **Engineering Management** — daftar isu, issue closure rate, isu terlambat,
  tool availability, improvement effectiveness; **CRUD penuh** (tambah issue/tool/
  improvement, ubah status issue, hapus) tersimpan persisten di PostgreSQL.
- **Input Manual** (`/input`) — form raw data → tersimpan ke Calculation Engine,
  seluruh KPI dihitung otomatis & dashboard langsung ter-update.
  **Edit/Backfill data lama**: pilih baris tanggal yang terlewat, isi ulang, simpan
  (upsert berdasarkan `date + model + line`, bukan duplikat).
- **Impor Excel** (`/impor`) — upload .xlsx → pratinjau + validasi per baris → simpan.
  **File standar**: tombol "Unduh Template Standar" (12 kolom wajib + contoh baris)
  dan "Export Data (Excel)" (unduh seluruh raw data).
- **Detail Setup Time** (`/setup`) — setup aktual vs standar per model/lini,
  variance, achievement, tren harian.
- **Pengaturan** (`/settings`) — ganti password, bahasa (5 bahasa), format tanggal,
  mode ringkas, notifikasi, ekspor CSV, reset data, status sistem.
- **Bantuan** (`/bantuan`) — panduan penggunaan lengkap: peran user, informasi per
  halaman, cara input tiap field, impor excel, pengaturan.
  Panduan lengkap juga ada di file **`PANDUAN-PENGGUNAAN.md`**.
- **Kebijakan Privasi** (`/privacy`) — sesuai UU PDP No. 27/2022 + prinsip GDPR.
- **Sidebar collapse** — sembunyikan/kerutkan sidebar; logo (kiri atas) dapat diklik
  menuju dashboard.
- **i18n** — Indonesia · English · 中文 · 日本語 · 한국어 (tanpa dependency).
- **Filter Periode** — 30 / 14 / 7 hari / harian di dashboard utama.
- **Auth JWT + RBAC** — login (admin / engineer / viewer / qc), halaman input hanya
  untuk admin & engineer, viewer read-only, qc khusus defect quality.
- **Persistence PostgreSQL + Prisma** — raw data, issues/tools/improvements, dan
  defect quality tersimpan di PostgreSQL via **Prisma Client Python** (`prisma/`
  schema + generated client). Data tetap ada setelah restart server.
- **Versi & Log Update** — `VERSION` + `CHANGELOG.md` + git tag `vX.Y.Z`
  (lihat bagian "Versi & Rollback").

## Desain & Animasi (Smart Factory Theme)

- Palet: background navy/teal `#06151B`–`#071C22`, aksen cyan `#00D6C9`,
  teks cool-gray, amber untuk peringatan, merah untuk kritis.
- Glassmorphism card + border cyan tipis + soft glow; font Space Grotesk & Inter.
- Animasi pembuka sinematik ±2.5s: ambient glow → logo scale-in → judul fade →
  KPI fade+slide + **count-up** → chart digambar kiri-ke-kanan.
- Animasi idle: icon breathing, **data-flow dot** menyusuri garis chart,
  hover card terangkat + glow, background grid drift halus, alert glow (amber/merah).
- Filter periode: `src/lib/kalkulator.ts` + halaman dashboard.

## Akun Demo

| Username | Password | Role | Akses |
|---|---|---|---|
| `admin` | `admin123` | Administrator | Semua fitur + manajemen user |
| `engineer` | `engineer123` | Engineer | Dashboard + input + impor |
| `viewer` | `viewer123` | Viewer | Hanya melihat |
| `qc` | `qc123` | Quality Control | Dashboard + input defect |

> **Ganti password default sebelum produksi!** via Settings → User Management
> (admin). Password & role tersimpan **persisten di PostgreSQL** (bukan in-memory),
> bertahan setelah restart.

Session JWT (HMAC-SHA256, httpOnly cookie, masa berlaku 8 jam).

Konsep: **Input Manual → Raw Engineering Data → Calculation Engine → Visual Dashboard**.
Pengguna cukup input data mentah; seluruh KPI dihitung otomatis.

## Rumus KPI (Calculation Engine)

| KPI | Rumus |
|---|---|
| FPY | first_pass_good ÷ input × 100% |
| Defect Rate | defect ÷ input × 100% |
| OEE | Availability × Performance × Quality |
| Cycle Time Achievement | target_ct ÷ actual_ct × 100% |
| Line Balance | Total Work Content ÷ (Bottleneck CT × Jumlah Stasiun) × 100% |
| Setup Time Achievement | standard_setup ÷ actual_setup × 100% |
| Setup Time Variance | actual_setup − standard_setup |
| Issue Closure Rate | closed ÷ total × 100% |
| Overdue Issue Rate | overdue ÷ total × 100% |
| Tool Availability | actual_available ÷ planned_available × 100% |
| Improvement Effectiveness | (baseline − after) ÷ baseline × 100% |

Urutan perhitungan: **Demand → Takt Time → Cycle Time → Line Balance → Setup Time → OEE → Quality**.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| Visualisasi | Apache ECharts + echarts-gl (grafik 3D, gradient, glow) |
| Backend | Python FastAPI (Calculation Engine) |
| Database | PostgreSQL 18 native (dikelola PM2) + Prisma Client Python |
| Data | Pandas + Openpyxl (impor Excel) |

## Database (PostgreSQL + Prisma)

Postgres berjalan **native** (bukan docker) sebagai cluster di
`/home/lutvi/eng-pgdata` (PostgreSQL 18, port `5433`, user `engineering`,
DB `engineering` + `engineering_test`), dikelola **PM2** sebagai app
`eng-postgres`. Tidak pakai systemd (butuh sudo).

```bash
pm2 status eng-postgres    # cek status
pm2 restart eng-postgres   # restart
pm2 logs eng-postgres      # cek log app postgres
```

Start/stop manual (tanpa PM2):

```bash
/usr/lib/postgresql/18/bin/pg_ctl -D /home/lutvi/eng-pgdata start -o "-p 5433" -k /tmp
/usr/lib/postgresql/18/bin/pg_ctl -D /home/lutvi/eng-pgdata stop -m fast
```

### Inisialisasi cluster dari nol

```bash
/usr/lib/postgresql/18/bin/initdb -D /home/lutvi/eng-pgdata
/usr/lib/postgresql/18/bin/pg_ctl -D /home/lutvi/eng-pgdata start -o "-p 5433" -k /tmp
psql -h /tmp -p 5433 -d postgres -c "CREATE USER engineering WITH PASSWORD '<password-kuat>';"
psql -h /tmp -p 5433 -d postgres -c "CREATE DATABASE engineering OWNER engineering;"
psql -h /tmp -p 5433 -d postgres -c "CREATE DATABASE engineering_test OWNER engineering;"
# lalu samakan password di .env (DATABASE_URL) + backend/tests/conftest.py
```

Restore dump (bila ada):

```bash
psql -h /tmp -p 5433 -U engineering -d engineering -f backup.sql
psql -h /tmp -p 5433 -U engineering -d engineering_test -f backup_test.sql
```

> Data postgres ada di `/home/lutvi/eng-pgdata` — backup:
> `pg_dump -h /tmp -p 5433 -U engineering engineering > backup.sql`.

### Backup database (otomatis)

Script `deploy/backup.sh` membuat dump DB `engineering` format custom
(`-Fc`) ke `/home/lutvi/eng-pgdata/backups/` dengan nama
`engineering-YYYYMMDD-HHMM.dump`, retensi **14 hari** (dump lebih tua
dihapus otomatis). Kredensial dibaca dari `.env` (`DATABASE_URL`), tidak
hardcode. Log ada di `backups/backup.log`.

Cron user (berjalan tiap hari **02:30**, via `crontab` user, tanpa sudo):

```bash
30 2 * * * /bin/bash /home/lutvi/Engineering-Performance/deploy/backup.sh >> /home/lutvi/eng-pgdata/backups/cron.log 2>&1
```

Jalankan manual: `bash deploy/backup.sh`

Restore dump custom:

```bash
pg_restore -h localhost -p 5433 -U engineering -d engineering --clean --if-exists /home/lutvi/eng-pgdata/backups/engineering-YYYYMMDD-HHMM.dump
```
> (DB test `engineering_test` juga dibuat otomatis oleh `backend/tests/conftest.py`.)

Schema (`prisma/schema.prisma`) → database:

```bash
export DATABASE_URL="postgresql://engineering:<password-kuat>@localhost:5433/engineering"
PATH="$(pwd)/.venv/bin:$PATH" .venv/bin/prisma generate   # regenerate client Python
PATH="$(pwd)/.venv/bin:$PATH" .venv/bin/prisma db push     # sinkronisasi tabel
```

`DATABASE_URL` dibaca saat backend jalan; `npm run backend` sudah otomatis
memakainya (bisa di-override via env `DATABASE_URL`).

## Menjalankan

```bash
# Frontend — http://localhost:3011
npm install
npm run dev

# Backend — http://localhost:8101 (docs: /docs)
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
npm run backend
```

> Port 3011 dipilih agar tidak bentrok (3000, 3005, 3008, 3010, 3007 dipakai aplikasi lain).
> Postgres harus jalan — pastikan app PM2 `eng-postgres` aktif (lihat bagian Database).

## Deployment (PM2 — production)

Tiga app dikelola **PM2** (`ecosystem.config.js`):

| App PM2 | Proses | Port |
|---|---|---|
| `eng-postgres` | `postgres -D /home/lutvi/eng-pgdata -p 5433 -k /tmp` | 5433 |
| `eng-frontend` | `next start -p 3011` | 3011 |
| `eng-backend` | `uvicorn 0.0.0.0:8101` | 8101 |

```bash
# 1. Build production frontend
npm run build

# 2. Start via PM2 (auto-restart + save ke dump)
npm run pm2:start        # atau: pm2 start ecosystem.config.js && pm2 save

# 3. (Sekali saja) auto-start saat server reboot — jalankan dengan sudo, isi password:
#    sudo bash deploy/pm2-startup.sh
#    (setara dengan: sudo env PATH=$PATH:/home/lutvi/.nvm/versions/node/v24.16.0/bin \
#      /home/lutvi/.nvm/versions/node/v24.16.0/lib/node_modules/pm2/bin/pm2 \
#      startup systemd -u lutvi --hp /home/lutvi)
#    Lalu verifikasi: sudo systemctl status pm2-lutvi

# Monitoring
npm run pm2:logs         # pm2 logs (gabungan)
pm2 status               # status ketiga app
pm2 restart eng-postgres eng-frontend eng-backend   # restart ketiganya
```

Kredensial dibaca dari **`.env`** (root repo): `DATABASE_URL`, `JWT_SECRET`,
`ALLOWED_ORIGINS` — backend memuatnya saat start (`load_env`). PM2 tidak lagi
menyuntik fallback. `ecosystem.config.js` meneruskan env dari proses.
Lihat `.env.example` untuk daftar variabel. **Jangan commit `.env`.**

### Konfigurasi CORS backend

Backend hanya melayani origin frontend yang terdaftar di `ALLOWED_ORIGINS`
(comma-separated). Default: `http://localhost:3011,http://127.0.0.1:3011`.
Untuk akses dari perangkat lain di LAN, tambah IP server lalu restart backend:

```bash
ALLOWED_ORIGINS="http://localhost:3011,http://127.0.0.1:3011,http://192.168.1.50:3011" \
  pm2 restart eng-backend
```

Nilai `*` = izinkan semua origin (tidak disarankan di production).

### Keamanan (hardening)

- **Rate limiting login** — 5 percobaan/menit per IP, lockout 15 menit
  (`backend/ratelimit.py`). Semua endpoint POST juga dibatasi 120 req/menit.
- **Firewall** — aktifkan sekali dengan sudo:
  `sudo bash deploy/secure-network.sh` (izinkan SSH 22, frontend 3011,
  backend 8101; default deny incoming; postgres 5433 tetap lokal).
- **Auto-start saat reboot** — `sudo bash deploy/pm2-startup.sh`.
- **CORS allowlist** — lihat bagian di atas; non-allowlist ditolak.
- **HTTPS** — untuk akses internet, pasang reverse proxy (Caddy/nginx +
  Let's Encrypt) di depan port 3011/8101.
- **Audit dependency** — `.venv/bin/pip-audit` (Python) · `npm audit` (JS).

Perintah lain: `npm run pm2:restart` · `npm run pm2:stop` · `pm2 save` (setelah stop/delete).

## API Backend (port 8101, docs: /docs)

| Endpoint | Fungsi |
|---|---|
| `GET /api/kpi` | Ringkasan seluruh KPI dari Calculation Engine |
| `GET /api/trend` · `GET /api/pareto` · `GET /api/defect-per-line` | Data grafik |
| `GET /api/process` · `GET /api/quality` · `GET /api/engineering` | Detail per pilar |
| `POST /api/raw-data` | Input manual 1 baris → **upsert** (date+model+line sama = update/backfill) |
| `GET /api/raw-data` · `POST /api/raw-data/reset` | Lihat / reset seed |
| `GET /api/raw-data/export` | Unduh seluruh raw data sebagai `.xlsx` |
| `GET /api/impor-excel/template` | Unduh template Excel standar (12 kolom + contoh) |
| `POST /api/impor-excel` | Upload .xlsx → pratinjau + validasi per baris |
| `POST /api/impor-excel/commit` | Simpan hasil impor (upsert) → KPI terhitung ulang |
| `GET/POST/PUT/DELETE /api/engineering/...` | CRUD issues, tools, improvements |
| `GET/POST/DELETE /api/quality/defects` | CRUD defect quality |
| `POST /api/auth/login` · `change-password` | Autentikasi + ganti password |
| `GET/POST/PUT/DELETE /api/users` | Manajemen user (admin only) |

Semua endpoint kecuali login butuh `Authorization: Bearer <JWT>`; POST umum
dibatasi rate limit 120 req/menit/IP, login 5 percobaan/menit dengan lockout
15 menit.

## Versi & Rollback

- Versi saat ini ada di `VERSION`; riwayat lengkap di `CHANGELOG.md`
  (fitur, perbaikan, **patch keamanan**, konvensi update).
- Setiap rilis diberi tag git: `git tag vX.Y.Z`.
- Rollback ke checkpoint terakhir: `git checkout vX.Y.Z` (contoh: `v1.0.0`).

## Struktur

```
src/
  app/            # Halaman: /, /process, /quality, /engineering, /setup, /input, /impor, /display, /settings, /login
  components/     # Chart (ECharts + flow dot), TiltPanel 3D, KpiCard (count-up), DashboardView, Sidebar, Shell, PanelHeader, UserSession
  lib/            # data.ts (seed), kalkulator.ts (engine TS), store.ts (reaktif), api.ts, auth.ts (JWT+RBAC)
  lib/i18n/       # i18n 5 bahasa: provider + dictionary per domain
  middleware.ts   # Proteksi rute + RBAC (admin/engineer untuk input & impor)
backend/
  main.py         # FastAPI app + endpoint + validasi Pydantic + CORS
  engine.py       # Calculation Engine (rumus KPI) + seed data
  db.py           # Persistensi PostgreSQL via Prisma Client Python (async)
prisma/
  schema.prisma   # Model: RawData, Issue, Tool, Improvement, Defect
```

`CHANGELOG.md` · `VERSION` — log update & versi (lihat "Versi & Rollback").
