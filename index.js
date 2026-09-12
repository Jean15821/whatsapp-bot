require("dotenv").config()
let makeWASocket, useMultiFileAuthState, DisconnectReason, jidNormalizedUser, fetchLatestBaileysVersion;
const axios = require('axios')
const crypto = require('crypto')
const http = require('http')
const fs = require('fs')
const path = require('path')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const getBackoffDelay = (attempt) => Math.min(30000 * attempt, 600000)

const SYSTEM_PROMPT = `Tu es un assistant biblique et théologique pour une église chrétienne (EDILPA, Église de Dieu Liberté par la Parole). Réponds aux questions avec des références bibliques précises (livre, chapitre, verset) et une explication théologique claire et simple. Sois respectueux, pastoral et concis.`

const QUIZ_API = "https://quizbib.gamer.free/api/quiz_api.php"
const CHANNEL_LINK = "https://whatsapp.com/channel/0029Vb8Pv2sL7UVMskGv542k"

let savedPhoneNumber = null
let pairingCodeRequested = false
let cachedCookie = null
let cookieExpiry = 0

const BASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
}

function looksLikeAntiBotChallenge(html) {
  return typeof html === 'string' && html.includes('slowAES.decrypt')
}

// Résout le défi anti-bot (AES-128-CBC) sans navigateur
function solveAntiBotChallenge(html) {
  const matches = [...html.matchAll(/toNumbers\("([0-9a-f]+)"\)/g)].map((m) => m[1])
  if (matches.length < 3) throw new Error('Format du challenge anti-bot non reconnu')
  const [aHex, bHex, cHex] = matches
  const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(aHex, 'hex'), Buffer.from(bHex, 'hex'))
  decipher.setAutoPadding(false)
  const decrypted = Buffer.concat([decipher.update(Buffer.from(cHex, 'hex')), decipher.final()])
  return decrypted.toString('hex')
}

async function callQuizApi(params) {
  const headers = { ...BASE_HEADERS }
  if (cachedCookie && Date.now() < cookieExpiry) {
    headers['Cookie'] = `__test=${cachedCookie}`
  }

  let res = await axios.get(QUIZ_API, { params, transformResponse: [(d) => d], headers })

  if (looksLikeAntiBotChallenge(res.data)) {
    console.log('🛡️ Challenge anti-bot détecté, résolution automatique...')
    const cookieValue = solveAntiBotChallenge(res.data)
    cachedCookie = cookieValue
    cookieExpiry = Date.now() + 21000 * 1000
    headers['Cookie'] = `__test=${cookieValue}`
    res = await axios.get(QUIZ_API, { params, transformResponse: [(d) => d], headers })
  }

  console.log('🔎 Réponse brute API:', String(res.data).slice(0, 300))
  try {
    return JSON.parse(res.data)
  } catch (e) {
    console.error('⚠️ JSON invalide reçu de l\'API:', String(res.data).slice(0, 300))
    return { error: 'Réponse invalide du serveur quiz' }
  }
}

function formatQuestion(q) {
  return `📖 *Question ${q.number}/${q.total}*\n\n${q.question}\n\nA. ${q.a}\nB. ${q.b}\nC. ${q.c}\nD. ${q.d}\n\n_Réponds avec A, B, C ou D_`
}

async function sendSubscribeGate(sock, from) {
  await sock.sendMessage(from, {
    text: `🙏 Tu as déjà joué 2 parties gratuites !\n\n👉 Suis le canal *Parole & Défi* ici :\n${CHANNEL_LINK}\n\nPuis reviens ici et écris *PRET* pour continuer à jouer.`
  })
}

function extractPhone(jid) {
  return jid.split('@')[0]
}

const DIGIT_TO_LETTER = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' }

const cron = require('node-cron');
const { getDailyContent } = require('./daily-content');
const CANALJID = "120363411968127620@newsletter";
const ADMIN_PHONE = "50940627737";
let currentSock = null;
let cronRegistered = false;
let hourlyRegistered = false;

const { getHourlyQuestion } = require('./hourly-quiz');
const veille = require('./veille');

function registerHourlyCron() {
  if (hourlyRegistered) return;
  hourlyRegistered = true;
  cron.schedule('0 * * * *', async () => {
    if (!currentSock) return console.error('❌ Bot non connecté, question horaire annulée');
    try {
      await currentSock.sendMessage(CANALJID, { text: getHourlyQuestion() });
      console.log('✅ Question horaire publiée sur le canal');
    } catch (err) {
      console.error('❌ Échec publication question horaire:', err.message);
    }
  });
}

function registerDailyCron() {
  if (cronRegistered) return;
  cronRegistered = true;
  cron.schedule('0 6 * * *', async () => {
    if (!currentSock) return console.error('❌ Bot non connecté, publication annulée');
    try {
      await currentSock.sendMessage(CANALJID, { text: getDailyContent() });
      console.log('✅ 🌸 PAROLE DU JOUR publiée sur le canal');
    } catch (err) {
      console.error('❌ Échec de publication de la PAROLE DU JOUR:', err.message);
    }
  }, {
    timezone: 'America/Port-au-Prince'
  });
}

let veilleScanRegistered = false;
let veilleSummaryRegistered = false;

function registerVeilleScanCron() {
  if (veilleScanRegistered) return;
  veilleScanRegistered = true;
  cron.schedule('0 */3 * * *', async () => {
    if (!currentSock) return console.error('❌ Bot non connecté, veille annulée');
    try { await veille.runScan(currentSock, CANALJID); }
    catch (err) { console.error('❌ Échec scan veille:', err.message); }
  });
}

function registerVeilleSummaryCron() {
  if (veilleSummaryRegistered) return;
  veilleSummaryRegistered = true;
  cron.schedule('0 7 * * *', async () => {
    if (!currentSock) return console.error('❌ Bot non connecté, résumé veille annulé');
    try { await veille.runDailySummary(currentSock, CANALJID); }
    catch (err) { console.error('❌ Échec résumé veille:', err.message); }
  }, { timezone: 'America/Port-au-Prince' });
}

async function startBot(attempt = 1) {
  try {
    // 🔐 RESTAURATION DE LA SESSION WHATSAPP SUR RENDER
    // La session est stockée dans la variable secrète AUTH_INFO_B64.
    if (process.env.AUTH_INFO_B64 && !fs.existsSync('auth_info/creds.json')) {
      console.log('🔐 Restauration de la session WhatsApp depuis Render...')

      const archive = Buffer.from(process.env.AUTH_INFO_B64, 'base64')
      const archivePath = path.join(__dirname, 'auth_info.tar.gz')

      fs.writeFileSync(archivePath, archive)

      const { execFileSync } = require('child_process')
      execFileSync('tar', ['-xzf', archivePath, '-C', __dirname])

      fs.unlinkSync(archivePath)

      console.log('✅ Session WhatsApp restaurée.')
    }

    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const sock = makeWASocket({
         version: [2, 3000, 1043857760],
         browser: ["Ubuntu", "Chrome", "22.04.4"],
      auth: state,
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      retryRequestDelayMs: 3000,
    })

    // 🔐 PAIRING LOCAL UNIQUEMENT
    // Sur Render, aucune nouvelle demande de pairing automatique.
    if (!state.creds.registered && !pairingCodeRequested && !process.env.AUTH_INFO_B64) {
  console.log('🔐 Aucune session WhatsApp enregistrée.')
  console.log('📱 Préparation du code de pairing...')

  try {
    if (!savedPhoneNumber) {
      savedPhoneNumber = "50940627737"
    }

    await sleep(3000)

    console.log('📱 Demande du code de pairing pour :', savedPhoneNumber)

    const code = await sock.requestPairingCode(
      savedPhoneNumber.trim()
    )

    pairingCodeRequested = true

    console.log('========================================')
    console.log('📱 CODE DE PAIRING WHATSAPP :', code)
    console.log('========================================')
    console.log('👉 WhatsApp > Appareils connectés')
    console.log('👉 Connecter un appareil')
    console.log('👉 Connecter avec un numéro de téléphone')
    console.log('👉 Entrer le code ci-dessus')
    console.log('========================================')

  } catch (err) {
    console.error('❌ Échec de la demande de code :', err.message)
    pairingCodeRequested = false
    console.log('🔄 Le prochain démarrage pourra redemander le pairing.')
  }
} else if (state.creds.registered) {
  console.log('🔐 Session WhatsApp déjà enregistrée.')
  console.log('✅ Aucun code de pairing nécessaire.')
}

sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update
      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode
        const shouldReconnect = code !== DisconnectReason.loggedOut
        console.log(`Connexion fermée (code ${code}). Reconnexion: ${shouldReconnect}`)
        if (shouldReconnect) {
          sleep(getBackoffDelay(attempt)).then(() => startBot(attempt + 1))
        } else {
          console.log('❌ Session déconnectée par WhatsApp. Supprime auth_info et relance pour repairer.')
        }
      } else if (connection === 'open') {
        console.log('✅ Bot biblique connecté à WhatsApp — répond à tous (+ toi dans "Tú")')
        currentSock = sock;
        registerDailyCron();
        registerHourlyCron();
      registerVeilleScanCron();
      registerVeilleSummaryCron();
      }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages[0]
      if (!msg.message) return

      const from = msg.key.remoteJid
      const buttonReplyId = msg.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
        ? (() => { try { return JSON.parse(msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id } catch { return null } })()
        : (msg.message.buttonsResponseMessage?.selectedButtonId || null)

      let text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim()
      if (buttonReplyId === 'confirm_follow') text = 'PRET'
      if (!text) return

      const selfJid = jidNormalizedUser(sock.user.id)
      const isSelfChat = from === selfJid

      if (text.includes('Vérifie toujours les versets')) return
      if (msg.key.fromMe && !isSelfChat) return

      const isGroup = from.endsWith('@g.us')
      const phone = extractPhone(from)

      console.log(`📩 ${from}: ${text}`)

      const upper = text.toUpperCase()
    const botJid = jidNormalizedUser(sock.user.id)
    const adminAuthorized =
      phone === ADMIN_PHONE ||
      from === botJid ||
      from.split('@')[0] === botJid.split('@')[0]

    if (adminAuthorized && upper === '!VEILLE') {
      try {
        const count = await veille.runScan(sock, CANALJID)
        await sock.sendMessage(from, { text: `🔍 Veille lancée manuellement.\n${count} alerte(s) URGENT publiée(s).` })
      } catch (err) {
        await sock.sendMessage(from, { text: `⚠️ Erreur veille: ${err.message}` })
      }
      return
    }

    if (adminAuthorized && upper === '!VEILLE STATUS') {
      await sock.sendMessage(from, { text: veille.getStatus() })
      return
    }

      if (!isGroup && upper === 'PRET') {
        try {
          await callQuizApi({ action: 'confirm_follow', phone })
          await sock.sendMessage(from, { text: '✅ Merci ! Écris *JOUER* pour continuer le quiz.' })
        } catch (err) {
          console.error('Erreur confirm_follow:', err.message)
        }
        return
      }

      if (!isGroup && ['JOUER', 'JWE', 'QUIZ', 'JEU'].includes(upper)) {
        try {
          const data = await callQuizApi({ action: 'start', phone })
          if (data.type === 'subscribe_required') {
            await sendSubscribeGate(sock, from)
          } else if (data.error) {
            await sock.sendMessage(from, { text: `⚠️ ${data.error}` })
          } else {
            await sock.sendMessage(from, { text: `🏆 *QUIZ BIBLIQUE EDILPA*\n\n${formatQuestion(data)}` })
          }
        } catch (err) {
          console.error('Erreur quiz start:', err.message)
          await sock.sendMessage(from, { text: '⚠️ Erreur de connexion au quiz, réessaie.' })
        }
        return
      }

      const letter = ['A', 'B', 'C', 'D'].includes(upper) ? upper : DIGIT_TO_LETTER[text]
      if (!isGroup && letter) {
        try {
          const data = await callQuizApi({ action: 'answer', phone, choice: letter })

          if (data.error) {
            // pas de partie en cours -> fallthrough au chat normal
          } else {
            const feedback = data.correct ? '✅ Bonne réponse ! +10 XP' : `❌ Mauvaise réponse\nBonne réponse : ${data.correct_letter}`

            if (data.type === 'finished') {
              let extra = `\nNiveau : ${data.niveau}`
              if (data.niveau_up) extra += ` 🎉 (niveau supérieur !)`
              extra += `\nXP total : ${data.xp_total}`
              if (data.badge) extra += `\n\n🎁 Nouveau badge débloqué : ${data.badge.icone} *${data.badge.nom}*`

              await sock.sendMessage(from, {
                text: `${feedback}\n\n🏆 *QUIZ TERMINÉ*\n\nScore : ${data.score / 10}/${data.total}\nXP : +${data.score}${extra}\n\n_Écris JOUER pour rejouer_\n\n📢 Suis le canal *Parole & Défi* pour ne rater aucune question du jour :\n${CHANNEL_LINK}`
              })
            } else {
              await sock.sendMessage(from, { text: `${feedback}\n\n${formatQuestion(data)}` })
            }
            return
          }
        } catch (err) {
          console.error('Erreur quiz answer:', err.message)
        }
      }
      try {
        await sock.sendMessage(from, {
          text: `🙏 Je réponds pour le moment uniquement au quiz biblique.\n\nÉcris *JOUER* pour commencer une partie, ou suis notre canal *Parole & Défi* :\n${CHANNEL_LINK}`
        })
        console.log('💬 Réponse de repli envoyée (IA désactivée)')
      } catch (err) {
        console.error('Erreur réponse de repli:', err.message)
      }
    })
  } catch (err) {
    console.log(`⚠️ Erreur de démarrage (tentative ${attempt}): ${err.message}`)
    console.log('Nouvelle tentative dans 5s...')
    await sleep(getBackoffDelay(attempt))
    startBot(attempt + 1)
  }
}

const PORT = process.env.PORT || 10000

const httpServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({
      status: 'ok',
      whatsapp: currentSock ? 'connected' : 'disconnected'
    }))
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Parole & Défi — Bot WhatsApp actif')
})

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Serveur HTTP actif sur le port ${PORT}`)
})

;(async () => {
  const baileys = await import('@whiskeysockets/baileys')
  makeWASocket = baileys.default
  useMultiFileAuthState = baileys.useMultiFileAuthState
  DisconnectReason = baileys.DisconnectReason
  jidNormalizedUser = baileys.jidNormalizedUser
       fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion
  startBot()
})()
