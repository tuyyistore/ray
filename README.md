# 🤖 WhatsApp Multi-Device Bot

Bot WhatsApp berbasis **@elrayyxml/baileys** – pure ESM, Pairing Code, VPS-ready.

---

## 📁 Struktur Folder

```
wa-bot-md/
├── index.js          ← Entry point utama
├── config.js         ← Konfigurasi terpusat
├── lib/
│   ├── nexray.js     ← Wrapper API Nexray
│   └── utils.js      ← Helper (parser, loader, dll)
├── plugins/
│   ├── menu.js       ← Tampilkan semua command
│   ├── ping.js       ← Cek latensi bot
│   └── ai.js         ← Tanya jawab AI via Nexray
├── sessions/         ← Auto-dibuat, jangan di-push ke git
├── .env.example
└── package.json
```

---

## ⚙️ Setup di VPS

### 1. Clone & install dependencies
```bash
git clone <repo-url> wa-bot && cd wa-bot
npm install
```

### 2. Buat file .env
```bash
cp .env.example .env
nano .env
```

Isi minimal:
```env
BOT_NUMBER=628xxxxxxxxxx   # nomor HP yang akan ditautkan
PREFIX=.
BOT_NAME=MyBot
```

### 3. Jalankan pertama kali (dapatkan Pairing Code)
```bash
node index.js
```

Terminal akan menampilkan:
```
╔══════════════════════╗
║  PAIRING CODE: ABCD-EFGH  ║
╚══════════════════════╝
```

Buka WhatsApp di HP → **Perangkat Tertaut → Tautkan Perangkat → Tautkan dengan Nomor Telepon** → masukkan kode.

### 4. Jalankan dengan PM2 (produksi)
```bash
npm install -g pm2

# Start bot
pm2 start index.js --name wa-bot --interpreter node

# Auto-start saat VPS reboot
pm2 startup
pm2 save

# Lihat log live
pm2 logs wa-bot

# Restart
pm2 restart wa-bot

# Stop
pm2 stop wa-bot
```

---

## 🔌 Cara Membuat Plugin Baru

Buat file baru di folder `plugins/`, misalnya `plugins/sticker.js`:

```js
// plugins/sticker.js
import { reply } from '../lib/utils.js'

export default {
  name: 'sticker',           // nama command utama
  alias: ['s', 'stiker'],   // alias opsional
  desc: 'Buat sticker dari gambar',
  category: 'Media',

  async execute(sock, m, args, prefix, commands) {
    // sock   → WASocket instance (kirim pesan, dll)
    // m      → pesan masuk (proto.IWebMessageInfo)
    // args   → array kata setelah command
    // prefix → prefix yang dipakai (dari .env)
    // commands → Map semua command (untuk plugin menu)

    await reply(sock, m, 'Fitur sticker segera hadir!')
  },
}
```

Bot akan **otomatis mendeteksi** file baru di `plugins/` saat restart.
Tidak perlu import manual di manapun.

---

## 📡 API Nexray

`lib/nexray.js` mengekspos dua fungsi utama:

```js
import { askAI, searchImage } from '../lib/nexray.js'

// Tanya AI
const jawaban = await askAI('Apa itu fotosintesis?')

// Cari gambar
const url = await searchImage('kucing lucu')
```

Isi `NEXRAY_KEY` di `.env` jika membutuhkan key (opsional tergantung paket).

---

## 🔄 Reset Session

Jika bot logout atau error credentials:
```bash
pm2 stop wa-bot
rm -rf sessions/
pm2 start wa-bot
```

---

## 📝 Environment Variables

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `BOT_NUMBER` | ✅ | - | Nomor HP format 628xxx |
| `PREFIX` | ❌ | `.` | Prefix command |
| `BOT_NAME` | ❌ | `MyBot` | Nama bot di menu |
| `OWNER_NUMBER` | ❌ | - | Nomor owner (koma-separated) |
| `NEXRAY_KEY` | ❌ | - | API key Nexray |
| `LOG_LEVEL` | ❌ | `info` | Level log pino |
