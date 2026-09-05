const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')

async function run() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
    const sock = makeWASocket({ auth: state })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        if (update.connection === 'open') {
            const jid = "120363411968127620@newsletter"
            try {
                const result = await sock.sendMessage(jid, {
                    text: "🧪 Test de publication automatique — EDILPA Bot"
                })
                console.log("=== ENVOI RÉUSSI ===")
                console.log(JSON.stringify(result, null, 2))
            } catch (err) {
                console.error("=== ENVOI ÉCHOUÉ ===")
                console.error(err.message)
            }
            process.exit(0)
        }
    })
}

run()
