import { readFileSync, writeFileSync, existsSync } from 'fs'
import config from '../config.js'

const DB_PATH = './data/owner.json'

function load() {
  if (!existsSync(DB_PATH)) return { owners: [...config.ownerNumber] }
  return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
}

function save(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

export function isOwner(number) {
  const db = load()
  const clean = number.replace('@s.whatsapp.net', '').replace(/\D/g, '')
  return db.owners.includes(clean)
}

export default {
  name: 'owner',
  alias: ['ow'],
  desc: 'Manage daftar owner bot',
  category: 'Owner',
  ownerOnly: true,

  async execute(sock, m, args, prefix) {
    const db = load()
    const sub = args[0]
    const number = args[1]?.replace(/\D/g, '')

    if (!sub) {
      const text = [
        `*Owner Manager*`,
        ``,
        `${prefix}owner list`,
        `${prefix}owner add <nomor>`,
        `${prefix}owner remove <nomor>`,
        `${prefix}owner check <nomor>`,
      ].join('\n')
      return sock.sendMessage(m.key.remoteJid, { text }, { quoted: m })
    }

    if (sub === 'list') {
      if (!db.owners.length) return sock.sendMessage(m.key.remoteJid, { text: `Belum ada owner terdaftar` }, { quoted: m })
      const lines = db.owners.map((n, i) => `${i + 1}. ${n}`)
      return sock.sendMessage(m.key.remoteJid, { text: `*Daftar Owner*\n\n${lines.join('\n')}` }, { quoted: m })
    }

    if (sub === 'add') {
      if (!number) return sock.sendMessage(m.key.remoteJid, { text: `Format: ${prefix}owner add <nomor>` }, { quoted: m })
      if (db.owners.includes(number)) return sock.sendMessage(m.key.remoteJid, { text: `❌ ${number} sudah owner` }, { quoted: m })
      db.owners.push(number)
      save(db)
      return sock.sendMessage(m.key.remoteJid, { text: `✅ ${number} ditambahkan sebagai owner` }, { quoted: m })
    }

    if (sub === 'remove') {
      if (!number) return sock.sendMessage(m.key.remoteJid, { text: `Format: ${prefix}owner remove <nomor>` }, { quoted: m })
      if (!db.owners.includes(number)) return sock.sendMessage(m.key.remoteJid, { text: `❌ ${number} bukan owner` }, { quoted: m })
      db.owners = db.owners.filter((n) => n !== number)
      save(db)
      return sock.sendMessage(m.key.remoteJid, { text: `✅ ${number} dihapus dari owner` }, { quoted: m })
    }

    if (sub === 'check') {
      if (!number) return sock.sendMessage(m.key.remoteJid, { text: `Format: ${prefix}owner check <nomor>` }, { quoted: m })
      const status = db.owners.includes(number)
      return sock.sendMessage(m.key.remoteJid, { text: `${number}: ${status ? '✅ Owner' : '❌ Bukan owner'}` }, { quoted: m })
    }

    return sock.sendMessage(m.key.remoteJid, { text: `Sub-command tidak dikenal` }, { quoted: m })
  },
}
