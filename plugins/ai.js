// plugins/ai.js
// ─────────────────────────────────────────────────────────────────────────────
//  Plugin: AI – tanya jawab via Nexray AI
// ─────────────────────────────────────────────────────────────────────────────

import { askAI } from '../lib/nexray.js'
import { reply } from '../lib/utils.js'

export default {
  name: 'ai',
  alias: ['ask', 'gpt', 'tanya'],
  desc: 'Tanya jawab dengan AI',
  category: 'AI',

  /**
   * @param {import('@elrayyxml/baileys').WASocket} sock
   * @param {import('@elrayyxml/baileys').proto.IWebMessageInfo} m
   * @param {string[]} args
   * @param {string} prefix
   */
  async execute(sock, m, args, prefix) {
    const prompt = args.join(' ').trim()

    if (!prompt) {
      return reply(sock, m, `❌ Tulis pertanyaanmu!\nContoh: ${prefix}ai siapa presiden RI?`)
    }

    // Kirim status "sedang mengetik"
    await sock.sendPresenceUpdate('composing', m.key.remoteJid)

    try {
      const answer = await askAI(prompt)
      await reply(sock, m, `🤖 *AI Answer*\n\n${answer}`)
    } catch (err) {
      await reply(sock, m, `⚠️ Gagal menghubungi AI: ${err.message}`)
    } finally {
      await sock.sendPresenceUpdate('paused', m.key.remoteJid)
    }
  },
}
