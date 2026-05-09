# Net Speed Monitor

A GNOME Shell extension that displays live download and upload speeds in the top panel.

## Features

- Shows download/upload speed in the GNOME Shell top bar
- Displays current active network interface in the extension menu
- Supports GNOME Shell 42 through 49

## Files

- `extension.js` — GNOME Shell extension implementation
- `metadata.json` — extension metadata and supported shell versions
- `install.sh` — install script to copy the extension into the GNOME extensions directory and enable it

## Installation

1. Make the installer executable (if needed):

   ```bash
   chmod +x install.sh
   ```

2. Run the installer:

   ```bash
   ./install.sh
   ```

3. Restart GNOME Shell:

   - On X11: press `Alt+F2`, type `r`, and press Enter
   - On Wayland: log out and log back in

4. If the extension is not already enabled, enable it manually:

   ```bash
   gnome-extensions enable netspeed@fedora
   ```

## Usage

After installation, the extension adds a panel item with:

- `▼` download speed
- `▲` upload speed

Open the extension popup to see the current active interface and exact values.

## Uninstallation

Remove the installed extension directory:

```bash
rm -rf "$HOME/.local/share/gnome-shell/extensions/netspeed"
```

Then disable the extension:

```bash
gnome-extensions disable netspeed
```

## Notes

- `install.sh` copies only `extension.js` and `metadata.json`.
- This extension reads `/proc/net/dev`, so it is intended for Linux.
