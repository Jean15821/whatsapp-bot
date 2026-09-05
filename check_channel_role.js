const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')

async function run() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
    const sock = makeWASocket({ auth: state })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        if (update.connection === 'open') {
            const jid = "120363411968127620@newsletter"
            try {
                await sock.newsletterFollow(jid)
                console.log("Abonnement OK")

                const metadata = await sock.newsletterMetadata("jid", jid)
                console.log("=== NOM ===", metadata.name)
                console.log("=== RÔLE ===", metadata.viewer_metadata?.role || metadata.role)
            } catch (err) {
                console.error("Erreur:", err.message)
            }
            process.exit(0)
        }
    })
}

run()
