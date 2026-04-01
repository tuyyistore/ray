// plugins/ping.js
// ─────────────────────────────────────────────────────────────────────────────
//  Plugin: Ping – cek latensi bot
// ─────────────────────────────────────────────────────────────────────────────

import { reply } from '../lib/utils.js'

export default {
  name: 'ping',
  alias: ['p', 'speed'],
  desc: 'Cek latensi bot',
  category: 'Utility',

  /**
   * @param {import('@elrayyxml/baileys').WASocket} sock
   * @param {import('@elrayyxml/baileys').proto.IWebMessageInfo} m
   * @param {string[]} args
   * @param {string} prefix
   */
  async execute(sock, m, args, prefix) {
    const start = Date.now()
    const sent = await sock.sendMessage(
      m.key.remoteJid,
      { text: '🏓 Pinging...' },
      { quoted: m }
    )
    const latency = Date.now() - start
    await sock.sendMessage(
      m.key.remoteJid,
      { text: `🏓 Pong!\n⚡ Latency: *${latency}ms*` },
      { edit: sent.key }
    )
  },
}
