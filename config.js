// config.js
// ─────────────────────────────────────────────────────────────────────────────
//  Centralised configuration – membaca .env dan mengekspos satu object global
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config'

const config = {
  // Nomor HP bot (wajib isi di .env)
  botNumber: process.env.BOT_NUMBER || '',

  // Prefix command, default '.'
  prefix: process.env.PREFIX || '.',

  // Nama bot
  botName: process.env.BOT_NAME || 'MyBot',

  // Owner numbers (array)
  ownerNumber: (process.env.OWNER_NUMBER || '')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean),

  // Nexray API key
  nexrayKey: process.env.NEXRAY_KEY || '',

  // Pino log level
  logLevel: process.env.LOG_LEVEL || 'info',

  // Folder session Baileys
  sessionDir: './sessions',

  // Folder plugin
  pluginsDir: './plugins',
}

// Validasi minimal: BOT_NUMBER wajib ada
if (!config.botNumber) {
  console.error('[CONFIG] BOT_NUMBER belum diisi di .env!')
  process.exit(1)
}

export default config
