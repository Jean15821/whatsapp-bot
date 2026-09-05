const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

async function connectBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: ['Firefox', 'Windows', '10.0'],
    version: [2, 2412, 1],
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;
    
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('\n📱 Scanne ce QR avec WhatsApp Web');
      console.log('➡️ Menu WhatsApp > Appareils connectés > Lier un appareil');
    }

    if (connection === 'open') {
      console.log('✅ Connecté avec ton numéro !');
    }

    if (connection === 'close') {
      console.log('❌ Déconnecté, reconnexion...');
      setTimeout(connectBot, 5000);
    }
  });

  return sock;
}

connectBot();
