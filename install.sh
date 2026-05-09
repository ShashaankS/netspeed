#!/bin/bash
set -e

EXT_UUID="netspeed@fedora"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$EXT_UUID"

echo "Installing Net Speed Monitor extension..."

mkdir -p "$EXT_DIR"
cp extension.js "$EXT_DIR/"
cp metadata.json "$EXT_DIR/"

echo "Files copied to $EXT_DIR"
echo ""
echo "Enabling extension..."
gnome-extensions enable "$EXT_UUID" 2>/dev/null || true

echo ""
echo "Done! To activate:"
echo "  1. Press Alt+F2, type 'r', press Enter  (X11 only)"
echo "     OR log out and log back in (Wayland)"
echo "  2. Then run: gnome-extensions enable $EXT_UUID"
echo ""
echo "To check status:  gnome-extensions info $EXT_UUID"
echo "To disable:       gnome-extensions disable $EXT_UUID"
