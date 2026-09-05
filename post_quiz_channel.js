const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')

const CHANNEL_JID = "120363411968127620@newsletter"
const BASE_URL = "https://quizbib.gamer.free"
const API_PATH = "/quiz-api/random_question.php"

async function getQuestion() {
    const { createAxiosClient } = await import('@samuraitruong/php-cookie-challenge')
    const client = createAxiosClient({ baseURL: BASE_URL, timeout: 15000 })
    const res = await client.get(API_PATH)
    return typeof res.data === 'string' ? JSON.parse(res.data) : res.data
}

function formatMessage(q) {
    return `📖 *QUIZ BIBLIQUE DU JOUR* 🧠\n\n` +
        `*${q.question}*\n\n` +
        `A. ${q.option_a}\n` +
        `B. ${q.option_b}\n` +
        `C. ${q.option_c}\n` +
        `D. ${q.option_d}\n\n` +
        `📚 Catégorie : ${q.categorie} | Niveau : ${q.difficulte}\n\n` +
        `⏳ Réponds avant demain !\n` +
        `👉 Joue en ligne : https://quizbib.gamer.free`
}

async function run() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
    const sock = makeWASocket({ auth: state })
    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        if (update.connection === 'open') {
            try {
                const q = await getQuestion()
                const result = await sock.sendMessage(CHANNEL_JID, { text: formatMessage(q) })
                console.log("=== QUESTION PUBLIÉE ===")
                console.log("Référence:", q.reference_biblique)
                console.log("ID message:", result.key.id)
            } catch (err) {
                console.error("=== ERREUR ===", err.message)
            }
            process.exit(0)
        }
    })
}

run()
