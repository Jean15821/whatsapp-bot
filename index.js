const { getNewBadge } = require("./badges");
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
  const number = q.number ?? q.numer ?? q.numero ?? q["numéro"] ?? 1
  const total = q.total ?? 10
  return `📖 *Question ${number}/${total}*\n\n${q.question ?? ""}\n\nA. ${q.a ?? ""}\nB. ${q.b ?? ""}\nC. ${q.c ?? ""}\nD. ${q.d ?? ""}\n\n_Réponds avec A, B, C ou D_`
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
const {
  publierQuizCanal,
  chargerQuizActuel,
  construireRevelation,
  traiterVoteSondage
} = require("./quiz-poll-canal");
const { enregistrerReponse } = require('./quiz-reponses');
const { saveFacebookPost } = require('./facebook-post');
const ADMIN_PHONE = "50940627737";
let canalQuizCronRegistered = false;
let currentSock = null;
let cronRegistered = false;

// Empêche deux commandes JOUER simultanées pour le même numéro.
const quizStartLocks = new Set();
let renderSessionRestored = false;
function registerCanalQuizCron() {
  if (canalQuizCronRegistered) return;
  canalQuizCronRegistered = true;

  const publierQuiz = async () => {
    if (!currentSock) {
      console.error("❌ Bot non connecté, quiz annulé");
      return;
    }

    try {
      await publierQuizCanal(currentSock);

      console.log(
        "✅ QUIZ DIRECT WHATSAPP publié dans le canal"
      );

      // Préparer également la publication Facebook.
      try {
        saveFacebookPost();
        console.log("📘 Publication Facebook préparée.");
      } catch (fbErr) {
        console.error(
          "❌ Erreur préparation Facebook :",
          fbErr.message
        );
      }
    } catch (err) {
      console.error(
        "❌ Erreur publication quiz :",
        err.message
      );
    }
  };

  // Ensuite, un nouveau quiz toutes les heures.
  cron.schedule("0 * * * *", publierQuiz);

  console.log(
    "🧠 Quiz NATIF WhatsApp activé : toutes les heures"
  );
}

function registerDailyCron() {
  if (cronRegistered) return;
  cronRegistered = true;

  const AM_FILE = path.join(__dirname, 'parole_am_last_sent.json');
  const PM_FILE = path.join(__dirname, 'parole_pm_last_sent.json');

  let amLock = false;
  let pmLock = false;

  function todayKey() {
    return new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Port-au-Prince'
    });
  }

  function alreadySent(file) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8')).date === todayKey();
    } catch {
      return false;
    }
  }

  function markSent(file) {
    fs.writeFileSync(
      file,
      JSON.stringify({
        date: todayKey(),
        sentAt: new Date().toISOString()
      }, null, 2)
    );
  }

  async function publishMorningWord() {
    if (!currentSock || amLock) return;

    if (alreadySent(AM_FILE)) {
      console.log('⏭️ Parole AM déjà publiée aujourd’hui.');
      return;
    }

    amLock = true;

    try {
      const text = getDailyContent() + '\n\n🌅 Bonne journée !';

      await currentSock.sendMessage(CANALJID, {
        text
      });

      markSent(AM_FILE);

      console.log('✅ 🌅 PAROLE DU JOUR + BONNE JOURNÉE publiée.');
    } catch (err) {
      console.error('❌ Échec publication AM:', err.message);
    } finally {
      amLock = false;
    }
  }

  async function publishEveningWord() {
    if (!currentSock || pmLock) return;

    if (alreadySent(PM_FILE)) {
      console.log('⏭️ Parole PM déjà publiée aujourd’hui.');
      return;
    }

    pmLock = true;

    try {
      const text = getDailyContent() + '\n\n🌙 Bonne soirée !';

      await currentSock.sendMessage(CANALJID, {
        text
      });

      markSent(PM_FILE);

      console.log('✅ 🌙 PAROLE DU JOUR + BONNE SOIRÉE publiée.');
    } catch (err) {
      console.error('❌ Échec publication PM:', err.message);
    } finally {
      pmLock = false;
    }
  }

  // 🌅 AM : toutes les 30 minutes entre 06h00 et 11h59.
  cron.schedule('*/30 6-11 * * *', publishMorningWord, {
    timezone: 'America/Port-au-Prince'
  });

  // 🌙 PM : toutes les 30 minutes entre 18h00 et 21h59.
  cron.schedule('*/30 18-21 * * *', publishEveningWord, {
    timezone: 'America/Port-au-Prince'
  });

  console.log('🌅 Parole du jour AM activée.');
  console.log('🌙 Parole du jour PM activée.');
}


function isSocketReady(sock) {
  return !!(sock && sock.user && currentSock === sock)
}

async function startBot(attempt = 1) {
  try {
    // 🔐 RESTAURATION DE LA SESSION WHATSAPP SUR RENDER
    // La session AUTH_INFO_B64 est restaurée une seule fois au démarrage.
    const isRender = !!process.env.RENDER || !!process.env.RENDER_SERVICE_ID

    if (isRender && process.env.AUTH_INFO_B64 && !renderSessionRestored) {
      console.log('🔐 Restauration de la session WhatsApp depuis Render...')

      const archive = Buffer.from(process.env.AUTH_INFO_B64, 'base64')
      const archivePath = path.join(__dirname, 'auth_info.tar.gz')

      fs.rmSync(path.join(__dirname, 'auth_info'), {
        recursive: true,
        force: true
      })

      fs.writeFileSync(archivePath, archive)

      const { execFileSync } = require('child_process')
      execFileSync('tar', ['-xzf', archivePath, '-C', __dirname])

      fs.unlinkSync(archivePath)

      renderSessionRestored = true

      console.log('✅ Session WhatsApp restaurée depuis AUTH_INFO_B64.')
    }

    const { state, saveCreds } = await useMultiFileAuthState('auth_info')

    const { version, isLatest } = await fetchLatestBaileysVersion()
    console.log('🌐 Version WhatsApp détectée :', version, '| Dernière :', isLatest)

    const sock = makeWASocket({
         version,
         browser: ["Ubuntu", "Chrome", "22.04.4"],
      auth: state,
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      retryRequestDelayMs: 3000,
    })

    // 🔐 PAIRING UNIQUEMENT EN LOCAL — JAMAIS SUR RENDER

    if (isRender) {
      console.log("☁️ Render détecté : aucun code de pairing ne sera demandé.")
    } else if (!state.creds.registered && !pairingCodeRequested) {
      console.log("🔐 Aucune session WhatsApp enregistrée.")
      console.log("📱 Préparation du code de pairing...")

      try {
        if (!savedPhoneNumber) {
          savedPhoneNumber = "50940627737"
        }

        await sleep(3000)

        console.log(
          "📱 Demande du code de pairing pour :",
          savedPhoneNumber
        )

        const code = await sock.requestPairingCode(
          savedPhoneNumber.trim()
        )

        pairingCodeRequested = true

        console.log("========================================")
        console.log("📱 CODE DE PAIRING WHATSAPP :", code)
        console.log("========================================")
        console.log("👉 WhatsApp > Appareils connectés")
        console.log("👉 Connecter un appareil")
        console.log("👉 Connecter avec un numéro de téléphone")
        console.log("👉 Entrer le code ci-dessus")
        console.log("========================================")

      } catch (err) {
        console.error(
          "❌ Échec de la demande de code :",
          err.message
        )
        pairingCodeRequested = false
      }

    } else if (state.creds.registered) {
      console.log("🔐 Session WhatsApp déjà enregistrée.")
      console.log("✅ Aucun code de pairing nécessaire.")
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update
      if (connection === "close") {
        if (currentSock === sock) currentSock = null
        const code = lastDisconnect?.error?.output?.statusCode
        const shouldReconnect = code !== DisconnectReason.loggedOut
        console.log(`Connexion fermée (code ${code}). Reconnexion: ${shouldReconnect}`)
        if (shouldReconnect) {
          const delay = getBackoffDelay(attempt)
          console.log(`⏳ Nouvelle tentative dans ${Math.round(delay / 1000)} secondes...`)
          setTimeout(() => {
            startBot(attempt + 1).catch(err => {
              console.error("❌ Erreur redémarrage bot:", err.message)
            })
          }, delay)
        } else {
          console.log("❌ Session WhatsApp refusée (401). Render ne demandera AUCUN code de pairing.")
          console.log("🔐 La session doit être recréée localement puis exportée vers AUTH_INFO_B64.")
        }
      } else if (connection === "open") {
        currentSock = sock
        console.log('✅ Bot biblique connecté à WhatsApp — répond à tous (+ toi dans "Tú")')

        if (process.env.TEST_POLL_ONCE === "1") {
          console.log("🧪 TEST UNIQUE : publication du sondage natif...")
          setTimeout(async () => {
            try {
              console.log("✅ TEST QUIZ DIRECT RÉUSSI")
            } catch (err) {
              console.error("❌ TEST QUIZ DIRECT ÉCHEC :", err.message)
            }
          }, 3000)
        }

        registerDailyCron()
        registerCanalQuizCron()

      }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages[0]
      if (!msg.message) return

      // === VOTE NATIF DU QUIZ DANS LE CANAL ===
      if (msg.message.pollUpdateMessage) {
        try {
          const resultat = await traiterVoteSondage(msg)

          if (resultat?.valide) {
            const poll = resultat.poll
            const choix = resultat.lettre

            console.log(
              `🗳️ VOTE CANAL : ${resultat.voterJid} | ` +
              `question ${poll.numero} | choix ${choix} | ` +
              `correct=${resultat.bonne}`
            )

            const message = resultat.bonne
              ? `✅ *BONNE RÉPONSE !*

🎉 Bravo !
🧠 Réponse : *${choix}. ${poll.options[choix]}*

📖 *Explication :*
${poll.explication || 'Continue à étudier la Parole de Dieu.'}

🏆 *Parole & Défi | EDILPA*`
              : `❌ *MAUVAISE RÉPONSE*

🧠 Ta réponse : *${choix}. ${poll.options[choix]}*
✅ La bonne réponse était : *${poll.bonne}. ${poll.options[poll.bonne]}*

📖 *Explication :*
${poll.explication || 'Continue à étudier la Parole de Dieu.'}

🏆 *Parole & Défi | EDILPA*`

            await sock.sendMessage(resultat.voterJid, {
              text: message
            })
          }

          return
        } catch (err) {
          console.error(
            '❌ Erreur traitement vote natif :',
            err.message
          )
          return
        }
      }

      const from = msg.key.remoteJid
      const buttonReplyId = msg.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
        ? (() => { try { return JSON.parse(msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id } catch { return null } })()
        : (msg.message.buttonsResponseMessage?.selectedButtonId || null)

      let text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim()
      if (buttonReplyId === 'confirm_follow') text = 'PRET'
      if (!text) return

      const selfJid = jidNormalizedUser(sock.user.id)
      const selfLid = sock.user?.lid ? jidNormalizedUser(sock.user.lid) : null
      const isSelfChat =
        from === selfJid ||
        (selfLid && from === selfLid) ||
        (from.endsWith('@lid') && from.split('@')[0] === selfLid?.split('@')[0])

      if (text.includes('Vérifie toujours les versets')) return
      if (msg.key.fromMe && !isSelfChat) return

      const isGroup = from.endsWith('@g.us')
      const phone = extractPhone(from)

      console.log(`📩 ${from}: ${text}`)

      const upper = text.toUpperCase()
  console.log("🧪 DEBUG TEXTE:", JSON.stringify(text), "UPPER:", JSON.stringify(upper), "GROUP:", isGroup)
    const botJid = jidNormalizedUser(sock.user.id)
    const ADMIN_LID = "130472835305511@lid"

    const adminAuthorized =
      phone === ADMIN_PHONE ||
      from === ADMIN_LID ||
      from === botJid ||
      from.split('@')[0] === botJid.split('@')[0]


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
        if (!isSocketReady(sock)) {
          console.log("⚠️ JOUER reçu mais WhatsApp est déconnecté.")
          return
        }

        if (quizStartLocks.has(phone)) {
          console.log(`⏳ JOUER ignoré : démarrage déjà en cours pour ${phone}`)
          return
        }

        quizStartLocks.add(phone)

        try {
          const data = await callQuizApi({ action: 'start', phone })

          if (data.type === 'subscribe_required') {
            await sendSubscribeGate(sock, from)
          } else if (data.error) {
            await sock.sendMessage(from, { text: `⚠️ ${data.error}` })
          } else {
            await sock.sendMessage(from, {
              text: `🏆 *QUIZ BIBLIQUE EDILPA*\n\n${formatQuestion(data)}`
            })
          }
        } catch (err) {
          console.error('Erreur quiz start:', err.message)
          await sock.sendMessage(from, {
            text: '⚠️ Erreur de connexion au quiz, réessaie.'
          })
        } finally {
          quizStartLocks.delete(phone)
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
              const score = Number(data.score) || 0
              const total = Number(data.total) || 10
              const bonnes = Math.round(score / 10)
              const pourcentage = Math.round((bonnes / total) * 100)
              const xpGagne = score
              const xpTotal = data.xp_total ?? score
              const niveau = data.niveau ?? "Débutant"

              let progression = ''
              if (pourcentage === 100) {
                progression = '🔥 *Parfait !* Tu as répondu correctement à toutes les questions !'
              } else if (pourcentage >= 80) {
                progression = '🌟 *Excellent résultat !* Continue comme ça !'
              } else if (pourcentage >= 60) {
                progression = '👏 *Très bien !* Encore un peu d’effort pour atteindre le sommet.'
              } else {
                progression = '💪 *Courage !* Chaque partie te permet de progresser dans la Parole de Dieu.'
              }

              let recompenses = ''
              if (data.niveau_up) {
                recompenses += `\n🎉 *NIVEAU SUPÉRIEUR !*`
              }

              if (data.badge) {
                recompenses += `\n🎁 *Nouveau badge :* ${data.badge.icone} ${data.badge.nom}`
              }

              await sock.sendMessage(from, {
                text:
                  `${feedback}\n\n` +
                  `🏆 *QUIZ BIBLIQUE TERMINÉ*\n\n` +
                  `📊 *Résultat*\n` +
                  `✅ Bonnes réponses : *${bonnes}/${total}*\n` +
                  `🎯 Réussite : *${pourcentage}%*\n\n` +
                  `⭐ XP gagné : *+${xpGagne}*\n` +
                  `💎 XP total : *${xpTotal}*\n` +
                  `📈 Niveau : *${niveau}*` +
                  `${recompenses}\n\n` +
                  `${progression}\n\n` +
                  `📖 Continue à apprendre et à grandir dans la Parole de Dieu.\n\n` +
                  `🎮 _Écris JOUER pour commencer une nouvelle partie._\n\n` +
                  `📢 *Parole & Défi*\n` +
                  `Suis notre canal pour ne manquer aucune question du jour :\n` +
                  `${CHANNEL_LINK}`
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
    startBot(attempt + 1).catch(err => console.error("❌ Erreur redémarrage bot:", err.message))
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
