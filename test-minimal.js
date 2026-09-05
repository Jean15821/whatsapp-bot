const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const CANAL_JID = '120363411968127620@newsletter'

async function testMinimal() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({ auth: state })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (update) => {
    if (update.connection === 'open') {
      console.log('Envoi minimal...')
      try {
        const result = await sock.sendMessage(CANAL_JID, { text: 'test' })
        console.log('Résultat complet:', JSON.stringify(result, null, 2))
      } catch (err) {
        console.error('Erreur directe:', err.message)
      }
      setTimeout(() => process.exit(0), 4000)
    }
  })
}
testMinimal()
