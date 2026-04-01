import { isOwner } from '../plugins/owner.js'
import { isPremium } from '../plugins/premium.js'
import { hasLimit, useLimit } from '../plugins/limit.js'

export async function runGuard(sock, m, plugin, senderNumber) {
  if (plugin.ownerOnly && !isOwner(senderNumber)) {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Command ini hanya untuk owner` }, { quoted: m })
    return false
  }

  if (plugin.premiumOnly && !isPremium(senderNumber) && !isOwner(senderNumber)) {
    await sock.sendMessage(m.key.remoteJid, { text: `⭐ Command ini hanya untuk pengguna premium` }, { quoted: m })
    return false
  }

  if (plugin.useLimit && !isOwner(senderNumber) && !isPremium(senderNumber)) {
    if (!hasLimit(senderNumber)) {
      await sock.sendMessage(m.key.remoteJid, { text: `⚠️ Limit kamu habis. Hubungi owner untuk menambah limit` }, { quoted: m })
      return false
    }
    useLimit(senderNumber)
  }

  return true
}
