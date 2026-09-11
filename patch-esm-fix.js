const fs = require('fs');
let content = fs.readFileSync('index.js', 'utf8');

const oldRequire = `const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, jidNormalizedUser } = require('@whiskeysockets/baileys')`;
const newRequire = `let makeWASocket, useMultiFileAuthState, DisconnectReason, jidNormalizedUser;`;

if (!content.includes(oldRequire)) {
  console.error('❌ Ligne require() non trouvée — arrêt.');
  process.exit(1);
}
content = content.replace(oldRequire, newRequire);

const oldEnd = `httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(\`🌐 Serveur HTTP actif sur le port \${PORT}\`)
})

startBot()`;

const newEnd = `httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(\`🌐 Serveur HTTP actif sur le port \${PORT}\`)
})

;(async () => {
  const baileys = await import('@whiskeysockets/baileys')
  makeWASocket = baileys.default
  useMultiFileAuthState = baileys.useMultiFileAuthState
  DisconnectReason = baileys.DisconnectReason
  jidNormalizedUser = baileys.jidNormalizedUser
  startBot()
})()`;

if (!content.includes(oldEnd)) {
  console.error('❌ Bloc de fin non trouvé — arrêt.');
  process.exit(1);
}
content = content.replace(oldEnd, newEnd);

fs.writeFileSync('index.js', content);
console.log('✅ index.js corrigé avec succès');
