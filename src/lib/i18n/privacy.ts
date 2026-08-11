import type { DomainDict } from "./types";

// zh/ja/ko fallback ke en — translate() juga fallback ke en untuk bahasa belum diterjemahkan
const tr = (id: string, en: string) => ({ id, en, zh: en, ja: en, ko: en });

export const privacyDict: DomainDict = {
  "menu.privacy": tr("Kebijakan Privasi", "Privacy Policy"),
  "privacy.title": tr("Kebijakan Privasi", "Privacy Policy"),
  "privacy.subtitle": tr(
    "Transparansi data — UU PDP No. 27/2022 & praktik umum GDPR",
    "Data transparency — Indonesia PDP Law No. 27/2022 & GDPR-aligned practices"
  ),
  "privacy.intro": tr(
    'Engineering Performance Dashboard ("aplikasi") dikelola untuk kebutuhan internal tim Engineering. Kebijakan ini menjelaskan data yang dikumpulkan, tujuan pengolahannya, cara penyimpanan, serta hak Anda sebagai pengguna. Dengan menggunakan aplikasi ini, Anda menyetujui praktik yang dijelaskan di bawah.',
    'Engineering Performance Dashboard ("the app") is operated for the internal needs of the Engineering team. This policy explains what data is collected, how it is used and stored, and your rights as a user. By using this app, you agree to the practices described below.'
  ),
  "privacy.data.title": tr("Data yang Dikumpulkan", "Data We Collect"),
  "privacy.data.account": tr(
    "Data akun: username dan password untuk login; sesi dijaga dengan token JWT.",
    "Account data: username and password for sign-in; sessions are secured with a JWT token."
  ),
  "privacy.data.production": tr(
    "Data produksi yang diinput: baris raw data harian (model, lini, qty, first pass good, defect, waktu), catatan isu engineering, dan data kualitas.",
    "Production data you enter: daily raw data rows (model, line, qty, first pass good, defect, times), engineering issue records, and quality data."
  ),
  "privacy.data.technical": tr(
    "Data teknis: preferensi yang tersimpan di localStorage browser — bahasa, tema, dan state sidebar.",
    "Technical data: preferences stored in browser localStorage — language, theme, and sidebar state."
  ),
  "privacy.purpose.title": tr("Tujuan Pengolahan", "Purpose of Processing"),
  "privacy.purpose.kpi": tr(
    "Menampilkan KPI performa engineering (OEE, FPY, cycle time, setup, dan lainnya) kepada pengguna yang berhak.",
    "Displaying engineering performance KPIs (OEE, FPY, cycle time, setup, and more) to authorized users."
  ),
  "privacy.purpose.storage": tr(
    "Penyimpanan data produksi untuk analisis — disimpan di backend lokal (SQLite) maupun localStorage browser pada mode demo.",
    "Storing production data for analysis — kept on the local backend (SQLite) and in browser localStorage in demo mode."
  ),
  "privacy.purpose.personalization": tr(
    "Personalisasi antarmuka: bahasa, format tanggal, dan preferensi tampilan per pengguna.",
    "Interface personalization: language, date format, and display preferences per user."
  ),
  "privacy.legal.title": tr("Dasar Hukum & Hak Pengguna", "Legal Basis & Your Rights"),
  "privacy.legal.text": tr(
    "Pengolahan data dilakukan berdasarkan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (Indonesia) dan prinsip umum GDPR: kepentingan organisasi, pelaksanaan tugas, dan persetujuan pengguna. Anda berhak atas:",
    "Data processing is based on Indonesia's Law No. 27 of 2022 on Personal Data Protection and general GDPR principles: legitimate organizational interest, task execution, and user consent. You have the right to:"
  ),
  "privacy.rights.text": tr(
    "Akses — meminta salinan data yang dikumpulkan.\nPerbaikan — memperbaiki data yang tidak akurat atau tidak lengkap.\nPenghapusan — meminta penghapusan data, sepanjang tidak bertentangan dengan kewajiban hukum.\nPembatasan — membatasi pengolahan dalam kondisi tertentu.\nPencabutan persetujuan — mencabut persetujuan yang pernah diberikan, kapan saja.",
    "Access — request a copy of the data collected.\nRectification — correct inaccurate or incomplete data.\nErasure — request deletion of data, unless conflicting with legal obligations.\nRestriction — restrict processing under certain conditions.\nWithdraw consent — revoke previously given consent at any time."
  ),
  "privacy.security.title": tr("Penyimpanan & Keamanan", "Storage & Security"),
  "privacy.security.storage": tr(
    "Data produksi disimpan di penyimpanan lokal (SQLite/backend lokal); pada mode demo juga di localStorage browser.",
    "Production data is stored locally (SQLite/local backend); in demo mode also in browser localStorage."
  ),
  "privacy.security.auth": tr(
    "Sesi login diamankan dengan JWT (HMAC-SHA256) dengan masa berlaku 8 jam. Catatan: akun demo pada kode contoh menyimpan password dalam teks biasa (plaintext) — ganti dengan mekanisme hashing sebelum dipakai di lingkungan produksi.",
    "Login sessions are secured with JWT (HMAC-SHA256) valid for 8 hours. Note: the demo accounts in the sample code store passwords in plaintext — replace with a hashing scheme before production use."
  ),
  "privacy.security.roles": tr(
    "Akses dibatasi per peran: admin (penuh), engineer (input & impor), viewer (hanya melihat). Akses di luar peran ditolak otomatis.",
    "Access is limited by role: admin (full), engineer (input & import), viewer (read-only). Out-of-role access is denied automatically."
  ),
  "privacy.cookies.title": tr("Cookie & Penyimpanan Lokal", "Cookies & Local Storage"),
  "privacy.cookies.text": tr(
    "Aplikasi hanya menggunakan cookie untuk token sesi login dan localStorage untuk preferensi (bahasa, tema, state sidebar). Tidak ada cookie pelacakan pihak ketiga. Anda dapat menolak dengan menghapus cookie/localStorage — aplikasi akan meminta login ulang.",
    "The app uses cookies only for the login session token and localStorage for preferences (language, theme, sidebar state). No third-party tracking cookies. You may decline by clearing cookies/localStorage — the app will ask you to sign in again."
  ),
  "privacy.updates.title": tr("Retensi Data, Perubahan Kebijakan & Kontak", "Data Retention, Policy Changes & Contact"),
  "privacy.updates.text": tr(
    "Data demo dapat di-reset kapan saja dari menu Pengaturan; data produksi disimpan selama diperlukan untuk analisis engineering. Kebijakan ini dapat diperbarui sewaktu-waktu — revisi dicantumkan bersama versi aplikasi. Untuk pertanyaan atau permintaan hak data, hubungi admin sistem.",
    "Demo data can be reset anytime from the Settings menu; production data is kept as long as needed for engineering analysis. This policy may be updated from time to time — revisions accompany the app version. For questions or data-right requests, contact the system admin."
  ),
};
