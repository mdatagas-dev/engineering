# Engineering Performance Dashboard

Dashboard terpusat performa tim engineering: **10 KPI inti + Setup Time** dalam satu
tampilan **Smart Factory Control Center** bernuansa navy/teal + cyan (ala Hisense),
dihitung otomatis oleh **Calculation Engine**.

## Fitur

- **Dashboard Utama** — 5 kartu KPI (FPY, OEE, Line Balance, Setup Time, Issue Closure)
  + Engineering Trend, Defect Pareto, Setup Time vs Standar, Cycle Time vs Target,
  Issue Status, banner alert overdue.
- **Process Performance** — Detail OEE (A×P×Q), Takt Time, Cycle Time Achievement,
  Line Balance per lini dengan penanda bottleneck, tren Setup Time.
- **Quality** — FPY harian, Defect Rate, Analisis Pareto, cacat per lini,
  + **Input Defect Manual** (persisten): catat defect per tanggal/lini/model.
- **Engineering Management** — daftar isu, issue closure rate, isu terlambat,
  tool availability, improvement effectiveness; **CRUD penuh** (tambah issue/tool/
  improvement, ubah status issue, hapus) tersimpan persisten di SQLite.
- **Input Manual** (`/input`) — form raw data → tersimpan ke Calculation Engine,
  seluruh KPI dihitung otomatis & dashboard langsung ter-update (real-time).
- **Impor Excel** (`/impor`) — upload .xlsx → pratinjau + validasi per baris → simpan.
- **Detail Setup Time** (`/setup`) — setup aktual vs standar per model/lini,
  variance, achievement, tren harian.
- **Pengaturan** (`/settings`) — ganti password, bahasa (5 bahasa), format tanggal,
  mode ringkas, notifikasi, ekspor CSV, reset data, status sistem.
- **Bantuan** (`/bantuan`) — panduan penggunaan lengkap: peran user, informasi per
  halaman, cara input tiap field, impor excel, pengaturan.
- **Kebijakan Privasi** (`/privacy`) — sesuai UU PDP No. 27/2022 + prinsip GDPR.
- **Sidebar collapse** — sembunyikan/kerutkan sidebar; logo (kiri atas) dapat diklik
  menuju dashboard.
- **i18n** — Indonesia · English · 中文 · 日本語 · 한국어 (tanpa dependency).
- **Filter Periode** — 30 / 14 / 7 hari / harian di dashboard utama.
- **Auth JWT + RBAC** — login (admin / engineer / viewer), halaman input hanya
  untuk admin & engineer, viewer read-only.
- **Persistence PostgreSQL + Prisma** — raw data, issues/tools/improvements, dan
  defect quality tersimpan di PostgreSQL via **Prisma Client Python** (`prisma/`
  schema + generated client). Data tetap ada setelah restart server.

## Desain & Animasi (Smart Factory Theme)

- Palet: background navy/teal `#06151B`–`#071C22`, aksen cyan `#00D6C9`,
  teks cool-gray, amber untuk peringatan, merah untuk kritis.
- Glassmorphism card + border cyan tipis + soft glow; font Space Grotesk & Inter.
- Animasi pembuka sinematik ±2.5s: ambient glow → logo scale-in → judul fade →
  LIVE pulse → KPI fade+slide + **count-up** → chart digambar kiri-ke-kanan.
- Animasi idle: LIVE pulse 2s, icon breathing, **data-flow dot** menyusuri garis chart,
  hover card terangkat + glow, background grid drift halus, alert glow (amber/merah).
- Filter periode: `src/lib/kalkulator.ts` + halaman dashboard.

## Akun Demo

| Username | Password | Role | Akses |
|---|---|---|---|
| `admin` | `admin123` | Administrator | Semua fitur |
| `engineer` | `engineer123` | Engineer | Dashboard + input + impor |
| `viewer` | `viewer123` | Viewer | Hanya melihat |

Session JWT (HMAC-SHA256, httpOnly cookie). Password dapat diganti dari halaman
Pengaturan (in-memory, reset saat server restart) atau di `src/lib/auth.ts`.

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
| Database | PostgreSQL 16 (docker) + Prisma Client Python |
| Data | Pandas + Openpyxl (impor Excel) |

## Database (PostgreSQL + Prisma)

1. Jalankan PostgreSQL (docker):

   ```bash
   docker run -d --name eng-postgres --restart unless-stopped \
     -e POSTGRES_USER=engineering -e POSTGRES_PASSWORD=engineering123 \
     -e POSTGRES_DB=engineering -p 5433:5432 \
     -v eng-pg-data:/var/lib/postgresql/data postgres:16-alpine
   ```

   (database test `engineering_test` dibuat otomatis oleh `backend/tests/conftest.py`.)

2. Schema (`prisma/schema.prisma`) → database:

   ```bash
   export DATABASE_URL="postgresql://engineering:engineering123@localhost:5433/engineering"
   PATH="$(pwd)/.venv/bin:$PATH" .venv/bin/prisma generate   # regenerate client Python
   PATH="$(pwd)/.venv/bin:$PATH" .venv/bin/prisma db push     # sinkronisasi tabel
   ```

3. `DATABASE_URL` dibaca saat backend jalan; `npm run backend` sudah otomatis
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

## Deployment (PM2 — production)

Frontend & backend dikelola **PM2** (`ecosystem.config.js`): frontend `next start -p 3011`,
backend `uvicorn 2 workers` di `127.0.0.1:8101`, Postgres tetap via docker.

```bash
# 1. Pastikan Postgres jalan (lihat bagian Database di atas)

# 2. Build production frontend
npm run build

# 3. Start via PM2 (auto-restart + save ke dump)
npm run pm2:start        # atau: pm2 start ecosystem.config.js && pm2 save

# 4. (Sekali saja) auto-start saat server reboot — butuh sudo, isi password:
#    sudo env PATH=$PATH:/home/lutvi/.nvm/versions/node/v24.16.0/bin \
#      /home/lutvi/.nvm/versions/node/v24.16.0/lib/node_modules/pm2/bin/pm2 \
#      startup systemd -u lutvi --hp /home/lutvi

# Monitoring
npm run pm2:logs         # pm2 logs (gabungan)
pm2 status               # status kedua app
```

Kredensial dibaca dari `ecosystem.config.js`: `DATABASE_URL` & `JWT_SECRET` bisa
di-override via env saat `pm2 start` (mis. `DATABASE_URL=... npm run pm2:start`).

Perintah lain: `npm run pm2:restart` · `npm run pm2:stop` · `pm2 save` (setelah stop/delete).

## API Backend (port 8101, docs: /docs)

| Endpoint | Fungsi |
|---|---|
| `GET /api/kpi` | Ringkasan seluruh KPI dari Calculation Engine |
| `GET /api/trend` · `GET /api/pareto` · `GET /api/defect-per-line` | Data grafik |
| `GET /api/process` · `GET /api/quality` · `GET /api/engineering` | Detail per pilar |
| `POST /api/raw-data` | Input manual 1 baris raw data → KPI terhitung ulang |
| `GET /api/raw-data` · `POST /api/raw-data/reset` | Lihat / reset seed |
| `POST /api/impor-excel` | Upload .xlsx → pratinjau + validasi per baris |
| `POST /api/impor-excel/commit` | Simpan hasil impor → KPI terhitung ulang |

## Struktur

```
src/
  app/            # Halaman: /, /process, /quality, /engineering, /setup, /input, /impor, /settings, /login
  components/     # Chart (ECharts + flow dot), TiltPanel 3D, KpiCard (count-up), Sidebar, Shell, PanelHeader, UserSession
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
