import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const REFRESH_INTERVAL = 1;
const NET_DEV_PATH = '/proc/net/dev';
const IGNORE_IFACES = ['lo'];

function readNetDev() {
    try {
        const [ok, contents] = GLib.file_get_contents(NET_DEV_PATH);
        if (!ok) return null;
        const text = new TextDecoder().decode(contents);
        const result = {};
        for (const line of text.split('\n').slice(2)) {
            const parts = line.trim().split(/\s+/);
            if (parts.length < 10) continue;
            const iface = parts[0].replace(':', '');
            if (IGNORE_IFACES.includes(iface)) continue;
            result[iface] = {
                rx: parseInt(parts[1]),
                tx: parseInt(parts[9]),
            };
        }
        return result;
    } catch (e) {
        return null;
    }
}

function formatSpeed(bytesPerSec) {
    const value = (bytesPerSec >= 1024 * 1024)
        ? bytesPerSec / (1024 * 1024)
        : bytesPerSec >= 1024
            ? bytesPerSec / 1024
            : bytesPerSec;

    const unit = bytesPerSec >= 1024 * 1024
        ? 'MB/s'
        : bytesPerSec >= 1024
            ? 'KB/s'
            : 'B/s';

    return value.toFixed(2).replace(/\.?0+$/, '') + ' ' + unit;
}

const NetSpeedIndicator = GObject.registerClass(
class NetSpeedIndicator extends PanelMenu.Button {

    _init() {
        super._init(0.0, 'Net Speed Monitor');

        this._prevData = null;
        this._prevTime = null;
        this._timerId = null;

        this._buildWidget();
        this._buildMenu();
        this._startTimer();
    }

    _buildWidget() {
        const box = new St.BoxLayout({
            style_class: 'panel-status-menu-box',
            vertical: true,
            y_align: Clutter.ActorAlign.CENTER,
        });

        this._dlLabel = new St.Label({
            text: '▼ --',
            style: 'font-size: 10px; color: #60a5fa; font-family: monospace; line-height: 1.1;',
            y_align: Clutter.ActorAlign.CENTER,
        });

        this._ulLabel = new St.Label({
            text: '▲ --',
            style: 'font-size: 10px; color: #fbbf24; font-family: monospace; line-height: 1.1;',
            y_align: Clutter.ActorAlign.CENTER,
        });

        box.add_child(this._dlLabel);
        box.add_child(this._ulLabel);
        this.add_child(box);
    }

    _buildMenu() {
        this._menuSection = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._menuSection);

        this._menuDl = new PopupMenu.PopupMenuItem('Download: --', { reactive: false });
        this._menuUl = new PopupMenu.PopupMenuItem('Upload:   --', { reactive: false });
        this._menuIface = new PopupMenu.PopupMenuItem('Interface: detecting...', { reactive: false });

        this._menuSection.addMenuItem(this._menuDl);
        this._menuSection.addMenuItem(this._menuUl);
        this._menuSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._menuSection.addMenuItem(this._menuIface);
    }

    _startTimer() {
        this._prevData = readNetDev();
        this._prevTime = GLib.get_monotonic_time();

        this._timerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, REFRESH_INTERVAL, () => {
            this._update();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _update() {
        const now = GLib.get_monotonic_time();
        const curr = readNetDev();

        if (!curr || !this._prevData) {
            this._prevData = curr;
            this._prevTime = now;
            return;
        }

        const elapsed = (now - this._prevTime) / 1_000_000;
        if (elapsed <= 0) return;

        let totalRx = 0, totalTx = 0;
        const activeIfaces = [];

        for (const iface of Object.keys(curr)) {
            const prev = this._prevData[iface];
            if (!prev) continue;
            const rx = Math.max(0, curr[iface].rx - prev.rx);
            const tx = Math.max(0, curr[iface].tx - prev.tx);
            if (rx > 0 || tx > 0) activeIfaces.push(iface);
            totalRx += rx;
            totalTx += tx;
        }

        const dlSpeed = totalRx / elapsed;
        const ulSpeed = totalTx / elapsed;

        this._dlLabel.set_text('▼ ' + formatSpeed(dlSpeed));
        this._ulLabel.set_text('▲ ' + formatSpeed(ulSpeed));

        this._menuDl.label.set_text('Download:  ' + formatSpeed(dlSpeed));
        this._menuUl.label.set_text('Upload:    ' + formatSpeed(ulSpeed));
        this._menuIface.label.set_text('Interface: ' + (activeIfaces.join(', ') || 'idle'));

        this._prevData = curr;
        this._prevTime = now;
    }

    destroy() {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = null;
        }
        super.destroy();
    }
});

export default class NetSpeedExtension extends Extension {
    enable() {
        this._indicator = new NetSpeedIndicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator, 1, 'right');
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
