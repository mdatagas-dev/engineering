import type { DomainDict } from "./types";

// zh/ja/ko fallback ke en — translate() juga fallback ke en untuk bahasa belum diterjemahkan
const tr = (id: string, en: string) => ({ id, en, zh: en, ja: en, ko: en });

export const bantuanDict: DomainDict = {
  "menu.bantuan": tr("Panduan Penggunaan", "User Guide"),
  "bantuan.title": tr("Bantuan & Panduan Penggunaan", "Help & User Guide"),
  "bantuan.subtitle": tr(
    "Login & peran · informasi per halaman · input data · impor Excel · pengaturan",
    "Login & roles · page overview · data input · Excel import · settings"
  ),
  "bantuan.login.title": tr("Login & Peran Pengguna", "Login & User Roles"),
  "bantuan.login.text": tr(
    "Akses aplikasi dengan username dan password pada halaman Login. Setiap akun memiliki peran yang menentukan fitur yang dapat digunakan:",
    "Access the app with your username and password on the Login page. Each account has a role that determines which features are available:"
  ),
  "bantuan.pages.title": tr("Informasi per Halaman", "Page Overview"),
  "bantuan.pages.dashboard": tr(
    "Dashboard (Beranda) — ringkasan 10 KPI inti (OEE, FPY, Line Balance, Setup Time, Issue Closure) beserta tren 30 hari dan Pareto cacat. Titik awal untuk memantau performa secara menyeluruh.",
    "Dashboard (Home) — summary of 10 core KPIs (OEE, FPY, Line Balance, Setup Time, Issue Closure) with a 30-day trend and defect Pareto. The starting point for an overall performance view."
  ),
  "bantuan.pages.process": tr(
    "Process Performance — detail pilar 1: breakdown OEE (Availability, Performance, Quality), takt time, cycle time vs target, line balance per stasiun, dan setup time standar vs aktual.",
    "Process Performance — Pillar 1 details: OEE breakdown (Availability, Performance, Quality), takt time, cycle time vs target, per-station line balance, and standard vs actual setup time."
  ),
  "bantuan.pages.quality": tr(
    "Quality — pilar 2: FPY harian, defect rate, analisis Pareto jenis cacat, dan perbandingan cacat per lini.",
    "Quality — Pillar 2: daily FPY, defect rate, defect-type Pareto analysis, and defects per line."
  ),
  "bantuan.pages.engineering": tr(
    "Engineering Management — pilar 3: daftar isu engineering (status Terbuka/Berjalan/Tertutup, prioritas, PIC, jatuh tempo), ketersediaan alat, dan efektivitas improvement.",
    "Engineering Management — Pillar 3: engineering issue list (Open/In Progress/Closed status, priority, PIC, due date), tool availability, and improvement effectiveness."
  ),
  "bantuan.pages.setup": tr(
    "Detail Setup Time — breakdown waktu setup aktual vs standar per model dan per lini, tren harian 30 hari, variance, dan achievement.",
    "Setup Time Detail — actual vs standard setup breakdown by model and line, 30-day daily trend, variance, and achievement."
  ),
  "bantuan.input.title": tr("Input Data Harian (Input Manual)", "Daily Data Input (Manual Input)"),
  "bantuan.input.model": tr(
    'Model — diketik manual, mis. "AC 1 PK 9.000 BTU". Wajib diisi, tidak boleh kosong.',
    'Model — typed manually, e.g. "AC 1 PK 9.000 BTU". Required, cannot be empty.'
  ),
  "bantuan.input.line": tr(
    "Lini Produksi — pilih salah satu dari 4 opsi: AC SPLIT, AC PORTABLE, WASHING MACHINE, atau AC COMERCIAL.",
    "Production Line — pick one of 4 options: AC SPLIT, AC PORTABLE, WASHING MACHINE, or AC COMERCIAL."
  ),
  "bantuan.input.date": tr("Tanggal — tanggal produksi; default hari ini.", "Date — production date; defaults to today."),
  "bantuan.input.qty": tr(
    "Input Qty — total unit yang masuk lini. Wajib lebih dari 0.",
    "Input Qty — total units entering the line. Must be greater than 0."
  ),
  "bantuan.input.fpg": tr(
    "First Pass Good — unit yang lolos tanpa cacat pada percobaan pertama. Wajib lebih dari 0.",
    "First Pass Good — units passing without defects on the first attempt. Must be greater than 0."
  ),
  "bantuan.input.defect": tr(
    "Defect Qty — jumlah unit cacat. Boleh 0 atau lebih.",
    "Defect Qty — number of defective units. 0 or more."
  ),
  "bantuan.input.minutes": tr(
    "Planned Minutes — waktu produksi yang direncanakan (wajib > 0). Downtime Minutes — waktu berhenti (boleh 0).",
    "Planned Minutes — planned production time (must be > 0). Downtime Minutes — stopped time (0 allowed)."
  ),
  "bantuan.input.ct": tr(
    "Target CT & Actual CT (detik) — target vs realisasi cycle time. Keduanya wajib > 0; achievement dihitung target ÷ aktual.",
    "Target CT & Actual CT (seconds) — target vs actual cycle time. Both must be > 0; achievement is target ÷ actual."
  ),
  "bantuan.input.setup": tr(
    "Setup Standar & Setup Aktual (menit) — waktu changeover standar vs realisasi. Keduanya wajib > 0.",
    "Standard Setup & Actual Setup (minutes) — standard vs actual changeover time. Both must be > 0."
  ),
  "bantuan.input.validasi": tr(
    "Aturan validasi: model wajib diisi, input qty & first pass good harus > 0, dan first pass good + defect tidak boleh melebihi input qty. Tombol simpan aktif hanya jika semua aturan terpenuhi.",
    "Validation rules: model is required, input qty & first pass good must be > 0, and first pass good + defect cannot exceed input qty. The save button is enabled only when all rules pass."
  ),
  "bantuan.import.title": tr("Impor Excel", "Excel Import"),
  "bantuan.import.text": tr(
    'Unggah file .xlsx (tarik & lepas atau klik). Kolom yang dibaca: date, model, line, input_qty, first_pass_good_qty, defect_qty, planned_minutes, downtime_minutes, target_ct_sec, actual_ct_sec, standard_setup_min, actual_setup_min. Periksa pratinjau, lalu klik "Simpan" untuk meng-commit; baris tidak valid dilewati otomatis.',
    'Upload an .xlsx file (drag & drop or click). Expected columns: date, model, line, input_qty, first_pass_good_qty, defect_qty, planned_minutes, downtime_minutes, target_ct_sec, actual_ct_sec, standard_setup_min, actual_setup_min. Review the preview, then click "Save" to commit; invalid rows are skipped automatically.'
  ),
  "bantuan.engQual.title": tr("Input Engineering & Quality", "Engineering & Quality Data"),
  "bantuan.engQual.text": tr(
    "Isu engineering (deskripsi, lini, prioritas, PIC, jatuh tempo, status) dikelola pada sumber data aplikasi; perubahan langsung tercermin di tabel dan KPI Issue Closure. Halaman Quality menghitung defect rate & FPY otomatis dari raw data yang diinput atau diimpor — pastikan defect_qty diisi dengan benar.",
    "Engineering issues (description, line, priority, PIC, due date, status) are managed in the app's data source; changes are reflected immediately in the table and the Issue Closure KPI. The Quality page computes defect rate & FPY automatically from entered or imported raw data — make sure defect_qty is filled correctly."
  ),
  "bantuan.settings.title": tr("Pengaturan", "Settings"),
  "bantuan.settings.text": tr(
    "Halaman Pengaturan berisi: ganti password, pilihan bahasa (5 bahasa), format tanggal, mode ringkas, notifikasi (isu terlambat, KPI di bawah target, suara), ekspor CSV, reset data seed, dan status sistem.",
    "The Settings page provides: password change, language selection (5 languages), date format, compact mode, notifications (overdue issues, KPI below target, sound), CSV export, seed data reset, and system status."
  ),
  "bantuan.tips.title": tr("Tips Penggunaan", "Usage Tips"),
  "bantuan.tips.text": tr(
    'Input harian yang rutin menjaga KPI tetap akurat · gunakan Impor Excel untuk data dalam jumlah besar · periksa badge "Terlambat" pada isu engineering · manfaatkan filter periode 7/14/30 hari di dashboard untuk melihat tren.',
    'Regular daily input keeps KPIs accurate · use Excel Import for large batches · watch the "Overdue" badge on engineering issues · use the 7/14/30-day period filter on the dashboard to review trends.'
  ),
};
