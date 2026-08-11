#!/usr/bin/env bash
# Hardening jaringan — jalankan SEKALI dengan sudo.
# - Aktifkan ufw (firewall) dengan default deny incoming
# - Izinkan: SSH (22), frontend (3011), backend LAN (8101)
# - Hati-hati: pastikan SSH diizinkan SEBELUM enable, jangan terkunci.
set -euo pipefail

echo "==> Mengaktifkan firewall ufw (default deny incoming)..."

# 1. Selalu izinkan SSH dulu — kalau SSH pakai port lain, ubah di sini.
sudo ufw allow 22/tcp comment "SSH"
sudo ufw allow 3011/tcp comment "EPD frontend"
sudo ufw allow 8101/tcp comment "EPD backend API"

# 2. Kalau hanya LAN internal, batasi ke subnet (contoh: 192.168.150.0/24).
#    Hapus tanda # pada baris di bawah untuk mengaktifkan pembatasan subnet.
# sudo ufw allow from 192.168.150.0/24 to any port 3011 proto tcp
# sudo ufw allow from 192.168.150.0/24 to any port 8101 proto tcp
# sudo ufw delete allow 3011/tcp
# sudo ufw delete allow 8101/tcp

# 3. Default deny + enable.
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw --force enable

echo ""
echo "==> Status firewall:"
sudo ufw status verbose

echo ""
echo "Selesai. Verifikasi akses: buka http://<ip-server>:3011 dari perangkat lain."
echo "Catatan: port 5433 (postgres) TIDAK dibuka ke jaringan — tetap lokal (127.0.0.1)."
