#!/usr/bin/env bash
# Setup auto-start PM2 saat reboot (jalankan SEKALI dengan sudo).
# Menjalankan perintah yang sama dengan: sudo pm2 startup systemd -u <user> --hp <home>
set -euo pipefail

USER_NAME="${SUDO_USER:-$(whoami)}"
HOME_DIR="$(getent passwd "$USER_NAME" | cut -d: -f6)"

echo "Menyiapkan PM2 startup untuk user: $USER_NAME (home: $HOME_DIR)"

NODE_BIN="$(dirname "$(command -v node)")"
PM2_BIN="$(dirname "$(command -v pm2)")/pm2"

sudo -u "$USER_NAME" env PATH="$NODE_BIN:$PATH" "$PM2_BIN" startup systemd -u "$USER_NAME" --hp "$HOME_DIR"

echo "Menyimpan daftar proses PM2..."
sudo -u "$USER_NAME" env PATH="$NODE_BIN:$PATH" "$PM2_BIN" save

echo ""
echo "Selesai. Verifikasi: sudo systemctl status pm2-$USER_NAME"
