const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')

async function run() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
    const sock = makeWASocket({ auth: state })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        if (update.connection === 'open') {
            try {
                const metadata = await sock.newsletterMetadata("invite", "0029Vb8Pv2sL7UVMskGv542k")
                console.log("=== JID DU CANAL ===")
                console.log(metadata.id)
                console.log("=== NOM ===")
                console.log(metadata.name)
                console.log("=== TU ES ABONNÉ/PROPRIÉTAIRE ===")
                console.log(metadata.viewer_metadata)
            } catch (err) {
                console.error("Erreur:", err.message)
            }
            process.exit(0)
        }
    })
}

run()
