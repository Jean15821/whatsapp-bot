const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const { getHourlyQuestion } = require('./hourly-quiz')

const CANAL_JID = '120363411968127620@newsletter'

async function testSend() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({ auth: state })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (update) => {
    if (update.connection === 'open') {
      console.log('Connecté, envoi de la question test...')
      try {
        await sock.sendMessage(CANAL_JID, { text: getHourlyQuestion() })
        console.log('✅ Question envoyée sur le canal')
      } catch (err) {
        console.error('❌ Échec:', err.message)
      }
      setTimeout(() => process.exit(0), 3000)
    }
  })
}
testSend()
