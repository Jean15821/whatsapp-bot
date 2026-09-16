const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');

async function main() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({ auth: state });
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection }) => {
    if (connection === 'open') {
      const CANALJID = "120363411968127620@newsletter";
      const sent = await sock.sendMessage(CANALJID, {
        poll: {
          name: "TEST — structure du poll",
          values: ["A. Test1", "B. Test2"],
          selectableCount: 1,
          pollType: 1,
          correctAnswer: "A. Test1"
        }
      });
      console.log("=== STRUCTURE COMPLETE DU MESSAGE RETOURNE ===");
      console.log(JSON.stringify(sent, null, 2));
      process.exit(0);
    }
  });
}
main();
