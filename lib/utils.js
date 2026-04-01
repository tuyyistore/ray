// lib/utils.js
// ─────────────────────────────────────────────────────────────────────────────
//  Kumpulan helper function yang dipakai di seluruh bot
// ─────────────────────────────────────────────────────────────────────────────

import { readdir } from 'fs/promises'
import { pathToFileURL } from 'url'
import path from 'path'
import config from '../config.js'

// ── Message helpers ───────────────────────────────────────────────────────────

/**
 * Ekstrak teks dari berbagai tipe pesan Baileys.
 *
 * @param {import('@elrayyxml/baileys').proto.IWebMessageInfo} msg
 * @returns {string}
 */
export function getMessageText(msg) {
  const m = msg.message
  if (!m) return ''
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.title ||
    ''
  )
}

/**
 * Balas pesan dengan teks.
 *
 * @param {import('@elrayyxml/baileys').WASocket} sock
 * @param {import('@elrayyxml/baileys').proto.IWebMessageInfo} msg
 * @param {string} text
 */
export async function reply(sock, msg, text) {
  await sock.sendMessage(
    msg.key.remoteJid,
    { text },
    { quoted: msg }
  )
}

/**
 * Kirim pesan tanpa quote.
 *
 * @param {import('@elrayyxml/baileys').WASocket} sock
 * @param {string} jid
 * @param {string} text
 */
export async function send(sock, jid, text) {
  await sock.sendMessage(jid, { text })
}

// ── Command parser ────────────────────────────────────────────────────────────

/**
 * Parse pesan masuk menjadi komponen command.
 *
 * @param {string} text   - Teks mentah dari pesan
 * @param {string} prefix - Prefix command (dari config)
 * @returns {{ isCommand: boolean, command: string, args: string[], body: string }}
 */
export function parseCommand(text, prefix = config.prefix) {
  if (!text.startsWith(prefix)) {
    return { isCommand: false, command: '', args: [], body: text }
  }
  const body = text.slice(prefix.length).trim()
  const [command, ...args] = body.split(/\s+/)
  return {
    isCommand: true,
    command: command.toLowerCase(),
    args,
    body: args.join(' '),
  }
}

// ── Plugin loader ─────────────────────────────────────────────────────────────

/**
 * Scan folder plugins/ dan load semua file .js secara dinamis.
 * Setiap plugin wajib export default { name, alias[], desc, category, execute }
 *
 * @param {string} pluginsDir - Path folder plugins
 * @param {import('pino').Logger} logger
 * @returns {Promise<Map<string, object>>} Map command → plugin object
 */
export async function loadPlugins(pluginsDir, logger) {
  const commands = new Map()

  let files
  try {
    files = await readdir(pluginsDir)
  } catch {
    logger.warn(`[PLUGINS] Folder ${pluginsDir} tidak ditemukan, skip.`)
    return commands
  }

  const jsFiles = files.filter((f) => f.endsWith('.js'))

  for (const file of jsFiles) {
    try {
      const filePath = path.resolve(pluginsDir, file)
      const fileURL = pathToFileURL(filePath).href

      // Import dinamis (ESM-safe)
      const mod = await import(fileURL)
      const plugin = mod.default

      if (!plugin?.name || typeof plugin.execute !== 'function') {
        logger.warn(`[PLUGINS] ${file} tidak punya name/execute, skip.`)
        continue
      }

      // Daftarkan command utama
      commands.set(plugin.name.toLowerCase(), plugin)

      // Daftarkan alias
      if (Array.isArray(plugin.alias)) {
        for (const alias of plugin.alias) {
          commands.set(alias.toLowerCase(), plugin)
        }
      }

      logger.info(`[PLUGINS] Loaded: ${file} (${plugin.name})`)
    } catch (err) {
      logger.error(`[PLUGINS] Gagal load ${file}: ${err.message}`)
    }
  }

  return commands
}

// ── Misc ──────────────────────────────────────────────────────────────────────

/**
 * Format uptime ms menjadi string human-readable.
 * @param {number} ms
 * @returns {string}
 */
export function formatUptime(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  return `${d}d ${h % 24}h ${m % 60}m ${s % 60}s`
}
