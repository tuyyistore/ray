import { readFileSync, writeFileSync, existsSync } from 'fs'

const DB_PATH = './data/premium.json'

function load() {
  if (!existsSync(DB_PATH)) return {}
  return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
}

function save(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

export function isPremium(number) {
  const db = load()
  const user = db[number]
  if (!user) return false
  if (user.expired === 0) return true
  return Date.now() < user.expired
}

export function getPremiumList() {
  return load()
}

export default {
  name: 'premium',
  alias: ['prem'],
  desc: 'Manage premium user',
  category: 'Owner',
  ownerOnly: true,

  async execute(sock, m, args, prefix) {
    const db = load()
    const sub = args[0]
    const target = args[1]?.replace(/\D/g, '') + '@s.whatsapp.net'
    const number = args[1]?.replace(/\D/g, '')

    if (!sub) {
      const text = [
        `*Premium Manager*`,
        ``,
        `${prefix}premium add <nomor> <durasi>`,
        `${prefix}premium remove <nomor>`,
        `${prefix}premium list`,
        `${prefix}premium check <nomor>`,
        ``,
        `Durasi: 1d | 7d | 30d | lifetime`,
      ].join('\n')
      return sock.sendMessage(m.key.remoteJid, { text }, { quoted: m })
    }

    if (sub === 'add') {
      if (!number || !args[2]) {
        return sock.sendMessage(m.key.remoteJid, { text: `Format: ${prefix}premium add <nomor> <durasi>` }, { quoted: m })
      }

      const durMap = { '1d': 86400000, '7d': 604800000, '30d': 2592000000, 'lifetime': 0 }
      const dur = durMap[args[2]]
      if (dur === undefined) {
        return sock.sendMessage(m.key.remoteJid, { text: `Durasi tidak valid. Gunakan: 1d | 7d | 30d | lifetime` }, { quoted: m })
      }

      db[number] = {
        number,
        expired: dur === 0 ? 0 : Date.now() + dur,
        since: Date.now(),
      }
      save(db)

      const expText = dur === 0 ? 'Lifetime' : new Date(db[number].expired).toLocaleString('id-ID')
      return sock.sendMessage(m.key.remoteJid, { text: `✅ ${number} ditambahkan sebagai premium\nExpired: ${expText}` }, { quoted: m })
    }

    if (sub === 'remove') {
      if (!number) return sock.sendMessage(m.key.remoteJid, { text: `Format: ${prefix}premium remove <nomor>` }, { quoted: m })
      if (!db[number]) return sock.sendMessage(m.key.remoteJid, { text: `❌ ${number} bukan premium` }, { quoted: m })
      delete db[number]
      save(db)
      return sock.sendMessage(m.key.remoteJid, { text: `✅ ${number} dihapus dari premium` }, { quoted: m })
    }

    if (sub === 'list') {
      const entries = Object.values(db)
      if (!entries.length) return sock.sendMessage(m.key.remoteJid, { text: `Belum ada user premium` }, { quoted: m })

      const lines = entries.map((u, i) => {
        const exp = u.expired === 0 ? 'Lifetime' : new Date(u.expired).toLocaleString('id-ID')
        const status = u.expired === 0 || Date.now() < u.expired ? '✅' : '❌'
        return `${i + 1}. ${status} ${u.number}\n   Expired: ${exp}`
      })

      return sock.sendMessage(m.key.remoteJid, { text: `*Daftar Premium*\n\n${lines.join('\n\n')}` }, { quoted: m })
    }

    if (sub === 'check') {
      if (!number) return sock.sendMessage(m.key.remoteJid, { text: `Format: ${prefix}premium check <nomor>` }, { quoted: m })
      const user = db[number]
      if (!user) return sock.sendMessage(m.key.remoteJid, { text: `❌ ${number} bukan premium` }, { quoted: m })
      const active = user.expired === 0 || Date.now() < user.expired
      const exp = user.expired === 0 ? 'Lifetime' : new Date(user.expired).toLocaleString('id-ID')
      return sock.sendMessage(m.key.remoteJid, { text: `*Cek Premium*\nNomor: ${number}\nStatus: ${active ? '✅ Aktif' : '❌ Expired'}\nExpired: ${exp}` }, { quoted: m })
    }

    return sock.sendMessage(m.key.remoteJid, { text: `Sub-command tidak dikenal` }, { quoted: m })
  },
}
