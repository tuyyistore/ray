// plugins/menu.js
// ─────────────────────────────────────────────────────────────────────────────
//  Plugin: Menu – tampilkan daftar semua command
//  Butuh akses ke Map commands, jadi execute menerima arg ke-5 (commands)
// ─────────────────────────────────────────────────────────────────────────────

import config from '../config.js'
import { formatUptime } from '../lib/utils.js'

export default {
  name: 'menu',
  alias: ['help', 'start'],
  desc: 'Tampilkan menu semua command',
  category: 'General',

  /**
   * @param {import('@elrayyxml/baileys').WASocket} sock
   * @param {import('@elrayyxml/baileys').proto.IWebMessageInfo} m
   * @param {string[]} args
   * @param {string} prefix
   * @param {Map<string, object>} commands  – diteruskan dari index.js
   */
  async execute(sock, m, args, prefix, commands) {
    // Kumpulkan plugin unik (hindari duplikat dari alias)
    const seen = new Set()
    const grouped = {}

    for (const plugin of commands.values()) {
      if (seen.has(plugin.name)) continue
      seen.add(plugin.name)

      const cat = plugin.category || 'Lainnya'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(plugin)
    }

    // Susun teks menu
    let text = `╔══════════════════╗\n`
    text += `║  🤖 *${config.botName}*  ║\n`
    text += `╚══════════════════╝\n\n`
    text += `⏱ Uptime: *${formatUptime(process.uptime() * 1000)}*\n`
    text += `📌 Prefix: *${prefix}*\n\n`

    for (const [category, plugins] of Object.entries(grouped)) {
      text += `┌── *${category}* ──\n`
      for (const p of plugins) {
        const aliasStr = p.alias?.length ? ` [${p.alias.join('|')}]` : ''
        text += `│ ${prefix}${p.name}${aliasStr}\n`
        text += `│   └ ${p.desc || '-'}\n`
      }
      text += `└─────────────────\n\n`
    }

    text += `_Powered by @elrayyxml/baileys_`

    await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m })
  },
}
