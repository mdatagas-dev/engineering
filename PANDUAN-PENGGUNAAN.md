# Panduan Penggunaan — Engineering Performance Dashboard

Dokumen ini menjelaskan **cara input data keseluruhan** di aplikasi. Alur inti:

```
Input Manual / Impor Excel  →  Raw Engineering Data  →  Calculation Engine  →  Dashboard & Grafik
```

Aplikasi hanya butuh **data mentah** (jumlah produksi, cacat, waktu). Semua KPI
(FPY, OEE, Line Balance, dll) dihitung otomatis oleh Calculation Engine.

---

## 1. Login & Peran Pengguna

Buka aplikasi (`http://<server>:3011`), login dengan akun Anda.

| Role | Bisa Melakukan |
|---|---|
| **admin** | Semua fitur + kelola user (tambah/hapus/ubah role/reset password) |
| **engineer** | Dashboard + input manual + impor excel + edit data |
| **qc** | Dashboard + input defect quality |
| **viewer** | Hanya melihat semua halaman |

- Password bisa diganti sendiri di **Pengaturan → Ganti Password**.
- Admin mengganti/reset password user lain di **Pengaturan → User Management**.
- Sesi login berlaku 8 jam, lalu harus login ulang.

> **Keamanan:** ganti password default (`admin123`, `engineer123`, `viewer123`, `qc123`)
> sebelum digunakan luas.

---

## 2. Dashboard Utama (`/`)

Menampilkan ringkasan: 5 kartu KPI + grafik (Engineering Trend, Defect Pareto,
Setup vs Standar, Cycle Time vs Target, Issue Status).

**Memilih periode data yang dilihat:**
- **Tombol periode** — 1 hari / 7 / 14 / 30 hari terakhir (default 30).
- **Tanggal mulai — tanggal akhir** — pilih rentang tanggal spesifik, misal
  ingin lihat data tanggal tertentu di masa lalu. Klik **Reset** untuk kembali
  ke mode periode.
- Data auto-refresh tiap **5 menit**.

**Tampilkan di Display** — membuka halaman `/display` di tab baru: tampilan kiosk
fullscreen **hanya dashboard utama** (tanpa menu), cocok untuk monitor terpisah.
Data di halaman itu auto-refresh tiap **60 detik**, ada tombol fullscreen di kanan atas.

---

## 3. Input Data Harian (Manual) — `/input`

Menu **Input** → isi form, lalu **Simpan & Hitung KPI Otomatis**.

### 3.1 Field Wajib

| Field | Penjelasan | Contoh |
|---|---|---|
| **Model** | Nama produk / model yang diproduksi | `AC 1 PK 9.000 BTU` |
| **Tanggal** | Tanggal produksi (default hari ini) | `2026-08-11` |
| **Lini Produksi** | Pilih salah satu: `AC SPLIT`, `AC PORTABLE`, `WASHING MACHINE`, `AC COMERCIAL` | `AC SPLIT` |

### 3.2 Data Produksi & Kualitas

| Field | Penjelasan |
|---|---|
| **Input Qty** | Total unit yang masuk ke lini pada hari itu |
| **First Pass Good** | Unit lolos **tanpa cacat** (sekali proses) |
| **Defect Qty** | Unit cacat yang terdeteksi |
| **Rumus** | `First Pass Good + Defect ≤ Input Qty` (form menolak bila melebihi) |

### 3.3 Waktu & Siklus

| Field | Penjelasan | Satuan |
|---|---|---|
| **Planned Minutes** | Waktu produksi terencana | menit |
| **Downtime Minutes** | Waktu berhenti mesin/lini | menit |
| **Target CT** | Cycle time target per unit | detik |
| **Actual CT** | Cycle time aktual per unit | detik |
| **Setup Standar** | Waktu setup/changeover standar | menit |
| **Setup Aktual** | Waktu setup/changeover aktual | menit |

### 3.4 Backfill / Edit Data Lama

Terlewat input beberapa hari/minggu? Halaman Input punya panel
**"Edit / Backfill Data Lama"** di kolom kanan:

1. Daftar semua data unik (`model · tanggal · lini`) ditampilkan.
2. Klik **Edit** pada baris yang ingin diisi ulang → form terisi otomatis.
3. Perbaiki/isi nilainya, klik **Simpan**.
4. Baris lama **diperbarui** (kunci `tanggal + model + lini`), bukan dibuat duplikat.
5. Banner kuning "Mengedit: …" muncul; tombol **Batal** untuk kembali ke mode baru.

> Konsekuensi backfill: KPI dihitung ulang dari seluruh data — nilai historis
> berubah sesuai data baru yang diinput.

---

## 4. Impor Excel — `/impor`

Untuk input banyak baris sekaligus (backfill satu bulan, dsb.).

### 4.1 Format File Standar

Gunakan tombol **"Unduh Template Standar"** — file `.xlsx` berisi 12 kolom wajib
+ 1 baris contoh. Kolom wajib (urutan bebas, nama boleh pakai alias Indonesia):

| Kolom | Keterangan |
|---|---|
| `date` | Format `YYYY-MM-DD` (alias: `tanggal`, `production_date`) |
| `model` | Nama model (alias: `model_name`, `product`, `produk`) |
| `line` | Salah satu: `AC SPLIT` / `AC PORTABLE` / `WASHING MACHINE` / `AC COMERCIAL` (alias: `lini`, `production_line`) |
| `input_qty` | Total input (alias: `input`, `qty_input`, `jumlah_input`) |
| `first_pass_good_qty` | First pass good (alias: `fpy`, `first_pass`, `good_qty`) |
| `defect_qty` | Jumlah cacat (alias: `defect`, `jumlah_defect`) |
| `planned_minutes` | Waktu terencana (alias: `planned`, `plan_min`) |
| `downtime_minutes` | Downtime (alias: `downtime`, `dt_min`) |
| `target_ct_sec` | Target cycle time (alias: `target_ct`, `ct_target`) |
| `actual_ct_sec` | Actual cycle time (alias: `actual_ct`, `ct_actual`) |
| `standard_setup_min` | Setup standar (alias: `std_setup`, `setup_standard`) |
| `actual_setup_min` | Setup aktual (alias: `act_setup`, `setup_actual`) |

### 4.2 Alur Impor

1. **Unduh Template Standar** → isi sesuai data produksi (satu baris = satu
   `tanggal + model + lini`).
2. Tarik & lepas file `.xlsx` (atau klik area upload).
3. Sistem mem-parsing + memvalidasi per baris:
   - Baris dengan kolom kosong/negatif/`line` tak dikenal/`date` invalid →
     **di-skip** dan masuk daftar warning (ditampilkan di pratinjau).
   - Baris valid → pratinjau (5 baris pertama).
4. Klik **Simpan N Baris** untuk commit.
5. **Duplikat otomatis ter-update** (upsert `tanggal + model + lini`) — aman
   kalau salah upload file yang sama dua kali.

### 4.3 Export Data

Tombol **"Export Data (Excel)"** → mengunduh seluruh raw data saat ini sebagai
`.xlsx` (hasil paling baru, sudah sync dari database).

---

## 5. Quality — Defect Manual — `/quality`

- Lihat FPY harian, defect rate, Pareto, cacat per lini.
- **Input Defect Manual**: catat `tanggal + lini + model + jenis cacat + qty`
  (role admin / engineer / qc). Defect bisa dihapus kembali.

---

## 6. Engineering Management — `/engineering`

- Daftar **Issues** (isu engineering): tambah, ubah status (`open → progress →
  closed`), prioritas (`high / medium / low`), hapus.
- **Tools**: tambah / hapus tool beserta planned vs actual available hours.
- **Improvements**: catat improvement (baseline → after, satuan).
- Semua tersimpan persisten di database. KPI Issue Closure, Tool Availability,
  dan Improvement Effectiveness dihitung otomatis dari data ini.

---

## 7. Detail Setup Time — `/setup`

Perbandingan setup aktual vs standar per model/lini: variance, achievement,
tren harian. Data diambil dari kolom setup pada input manual/Excel.

---

## 8. Pengaturan — `/settings`

- **Ganti password** (untuk diri sendiri).
- **User Management** (admin): tambah user, ubah role, reset password, hapus.
- **Bahasa** — 5 bahasa (Indonesia, English, 中文, 日本語, 한국어).
- **Format tanggal** — `yyyy-mm-dd` / `dd/mm/yyyy` / `mm/dd/yyyy`.
- **Reset data** — "Reset Seed" mengembalikan data ke contoh demo awal 30 hari;
  "Hapus Semua Data" mengosongkan semua (raw, issues, tools, improvements, defects).

---

## 9. Alur Perhitungan KPI (Calculation Engine)

```
Demand → Takt Time → Cycle Time → Line Balance → Setup Time → OEE → Quality
```

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

---

## 10. Troubleshooting

| Masalah | Solusi |
|---|---|
| "ChunkLoadError" / halaman patah setelah update | Hard refresh browser: `Ctrl+Shift+R` |
| Data tidak muncul setelah input | Pastikan tombol **Simpan** sukses (banner hijau); dashboard refresh otomatis |
| Import Excel semua baris di-skip | Cek kolom wajib & format `date` (`YYYY-MM-DD`); lihat daftar warning |
| Lupa password sendiri | Minta admin reset di Pengaturan → User Management |
| "Terlalu banyak permintaan" | Tunggu 1–15 menit (rate limit anti brute-force) |
| Data terlihat sama terus | Cek periode/rentang tanggal yang aktif di dashboard |
