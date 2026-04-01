import 'dotenv/config'
import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidBroadcast,
} from '@elrayyxml/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import { mkdirSync } from 'fs'

import config from './config.js'
import { loadPlugins, getMessageText, parseCommand } from './lib/utils.js'
import { runGuard } from './lib/guard.js'

mkdirSync('./sessions', { recursive: true })
mkdirSync('./data', { recursive: true })

const logger = pino({
  level: config.logLevel,
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
  },
})

let commands = new Map()

async function requestPairingCode(sock) {
  const number = config.botNumber.replace(/\D/g, '')
  logger.info(`[PAIRING] Meminta pairing code untuk: ${number}`)
  try {
    const code = await sock.requestPairingCode(number)
    const formatted = code?.match(/.{1,4}/g)?.join('-') ?? code
    logger.info(`\n\n  ╔══════════════════════╗`)
    logger.info(`  ║  PAIRING CODE: ${formatted}  ║`)
    logger.info(`  ╚══════════════════════╝\n`)
  } catch (err) {
    logger.error(`[PAIRING] Gagal: ${err.message}`)
  }
}

async function startBot() {
  commands = await loadPlugins(config.pluginsDir, logger)
  logger.info(`[BOOT] ${commands.size} command terdaftar`)

  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir)
  const { version } = await fetchLatestBaileysVersion()
  logger.info(`[BOOT] Baileys v${version.join('.')}`)

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    printQRInTerminal: false,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
    browser: ['MyBot', 'Chrome', '120.0.0'],
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update

    if (!sock.authState.creds.registered) {
      await requestPairingCode(sock)
    }

    if (connection === 'open') {
      logger.info(`[WA] ✅ Terhubung sebagai ${sock.user?.id}`)
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      logger.warn(`[WA] Koneksi terputus. Kode: ${reason}`)

      if (reason === DisconnectReason.loggedOut) {
        logger.error('[WA] Session logout. Hapus folder sessions/ lalu restart.')
        process.exit(1)
      } else {
        logger.info('[WA] Reconnect dalam 5 detik...')
        setTimeout(startBot, 5000)
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      try {
        if (msg.key.fromMe) continue
        if (isJidBroadcast(msg.key.remoteJid)) continue

        const text = getMessageText(msg)
        if (!text) continue

        const { isCommand, command, args } = parseCommand(text, config.prefix)
        if (!isCommand) continue

        const plugin = commands.get(command)
        if (!plugin) continue

        const senderNumber = msg.key.participant
          ? msg.key.participant.replace('@s.whatsapp.net', '')
          : msg.key.remoteJid.replace('@s.whatsapp.net', '')

        logger.info(`[CMD] ${senderNumber} → ${config.prefix}${command}`)

        const allowed = await runGuard(sock, msg, plugin, senderNumber)
        if (!allowed) continue

        await plugin.execute(sock, msg, args, config.prefix, commands)
      } catch (err) {
        logger.error(`[MSG] ${err.message}`)
      }
    }
  })

  return sock
}

startBot().catch((err) => {
  logger.fatal(`[FATAL] ${err.message}`)
  process.exit(1)
})

process.on('uncaughtException', (err) => logger.error(`[UNCAUGHT] ${err.message}`))
process.on('unhandledRejection', (reason) => logger.error(`[UNHANDLED] ${reason}`))
