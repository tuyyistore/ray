import { readFileSync, writeFileSync, existsSync } from 'fs'

const DB_PATH = './data/limit.json'
const DEFAULT_LIMIT = 20

function load() {
  if (!existsSync(DB_PATH)) return {}
  return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
}

function save(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

export function getLimit(number) {
  const db = load()
  return db[number]?.limit ?? DEFAULT_LIMIT
}

export function useLimit(number) {
  const db = load()
  if (!db[number]) db[number] = { limit: DEFAULT_LIMIT, used: 0 }
  if (db[number].limit <= 0) return false
  db[number].limit -= 1
  db[number].used = (db[number].used || 0) + 1
  save(db)
  return true
}

export function hasLimit(number) {
  const db = load()
  return (db[number]?.limit ?? DEFAULT_LIMIT) > 0
}

export default {
  name: 'limit',
  alias: ['lmt'],
  desc: 'Manage limit user',
  category: 'Owner',
  ownerOnly: true,

  async execute(sock, m, args, prefix) {
    const db = load()
    const sub = args[0]
    const number = args[1]?.replace(/\D/g, '')
    const amount = parseInt(args[2])

    if (!sub) {
      const text = [
        `*Limit Manager*`,
        ``,
        `${prefix}limit set <nomor> <jumlah>`,
        `${prefix}limit add <nomor> <jumlah>`,
        `${prefix}limit reset <nomor>`,
        `${prefix}limit resetall`,
        `${prefix}limit check <nomor>`,
        `${prefix}limit list`,
        `${prefix}limit default <jumlah>`,
      ].join('\n')
      return sock.sendMessage(m.key.remoteJid, { text }, { quoted: m })
    }

    if (sub === 'set') {
      if (!number || isNaN(amount)) return sock.sendMessage(m.key.remoteJid, { text: `Format: ${prefix}limit set <nomor> <jumlah>` }, { quoted: m })
      if (!db[number]) db[number] = { limit: DEFAULT_LIMIT, used: 0 }
      db[number].limit = amount
      save(db)
      return sock.sendMessage(m.key.remoteJid, { text: `✅ Limit ${number} diset ke ${amount}` }, { quoted: m })
    }

    if (sub === 'add') {
      if (!number || isNaN(amount)) return sock.sendMessage(m.key.remoteJid, { text: `Format: ${prefix}limit add <nomor> <jumlah>` }, { quoted: m })
      if (!db[number]) db[number] = { limit: DEFAULT_LIMIT, used: 0 }
      db[number].limit += amount
      save(db)
      return sock.sendMessage(m.key.remoteJid, { text: `✅ Limit ${number} ditambah ${amount} → total ${db[number].limit}` }, { quoted: m })
    }

    if (sub === 'reset') {
      if (!number) return sock.sendMessage(m.key.remoteJid, { text: `Format: ${prefix}limit reset <nomor>` }, { quoted: m })
      db[number] = { limit: DEFAULT_LIMIT, used: 0 }
      save(db)
      return sock.sendMessage(m.key.remoteJid, { text: `✅ Limit ${number} direset ke ${DEFAULT_LIMIT}` }, { quoted: m })
    }

    if (sub === 'resetall') {
      for (const key of Object.keys(db)) {
        db[key].limit = DEFAULT_LIMIT
        db[key].used = 0
      }
      save(db)
      return sock.sendMessage(m.key.remoteJid, { text: `✅ Semua limit direset ke ${DEFAULT_LIMIT}` }, { quoted: m })
    }

    if (sub === 'check') {
      if (!number) return sock.sendMessage(m.key.remoteJid, { text: `Format: ${prefix}limit check <nomor>` }, { quoted: m })
      const user = db[number] ?? { limit: DEFAULT_LIMIT, used: 0 }
      return sock.sendMessage(m.key.remoteJid, { text: `*Limit ${number}*\nSisa: ${user.limit}\nTerpakai: ${user.used ?? 0}` }, { quoted: m })
    }

    if (sub === 'list') {
      const entries = Object.entries(db)
      if (!entries.length) return sock.sendMessage(m.key.remoteJid, { text: `Belum ada data limit` }, { quoted: m })
      const lines = entries.map(([num, val], i) => `${i + 1}. ${num} → Sisa: ${val.limit} | Pakai: ${val.used ?? 0}`)
      return sock.sendMessage(m.key.remoteJid, { text: `*Daftar Limit*\n\n${lines.join('\n')}` }, { quoted: m })
    }

    if (sub === 'default') {
      if (isNaN(parseInt(args[1]))) return sock.sendMessage(m.key.remoteJid, { text: `Format: ${prefix}limit default <jumlah>` }, { quoted: m })
      return sock.sendMessage(m.key.remoteJid, { text: `ℹ️ Ubah DEFAULT_LIMIT di plugins/limit.js ke ${args[1]}` }, { quoted: m })
    }

    return sock.sendMessage(m.key.remoteJid, { text: `Sub-command tidak dikenal` }, { quoted: m })
  },
}
