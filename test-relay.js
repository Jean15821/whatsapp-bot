const { default: makeWASocket, useMultiFileAuthState, generateWAMessageID } = require('@whiskeysockets/baileys')
const CANAL_JID = '120363411968127620@newsletter'

async function testRelay() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({ auth: state })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (update) => {
    if (update.connection === 'open') {
      console.log('Envoi via relayMessage (sans messageContextInfo)...')
      try {
        const msgId = await sock.relayMessage(CANAL_JID, { conversation: 'test relay' }, {})
        console.log('ID envoyé:', msgId)
      } catch (err) {
        console.error('Erreur relayMessage:', err.message)
      }
      setTimeout(() => process.exit(0), 4000)
    }
  })
}
testRelay()
