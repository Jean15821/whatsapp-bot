const fs = require('fs');
const path = './index.js';
let code = fs.readFileSync(path, 'utf8');
let applied = [];

function insertAfter(anchor, addition, label) {
  if (!code.includes(anchor)) { console.log(`❌ ANCRE INTROUVABLE: ${label}`); return; }
  if (code.includes(addition.trim())) { console.log(`⏭️  DÉJÀ APPLIQUÉ: ${label}`); return; }
  code = code.replace(anchor, anchor + addition);
  applied.push(label);
}

function insertBefore(anchor, addition, label) {
  if (!code.includes(anchor)) { console.log(`❌ ANCRE INTROUVABLE: ${label}`); return; }
  if (code.includes(addition.trim())) { console.log(`⏭️  DÉJÀ APPLIQUÉ: ${label}`); return; }
  code = code.replace(anchor, addition + anchor);
  applied.push(label);
}

insertAfter(
  "require('./hourly-quiz');",
  "\nconst veille = require('./veille');",
  "import veille.js"
);

insertBefore(
  "async function startBot(attempt = 1) {",
  `let veilleScanRegistered = false;
let veilleSummaryRegistered = false;

function registerVeilleScanCron() {
  if (veilleScanRegistered) return;
  veilleScanRegistered = true;
  cron.schedule('0 */3 * * *', async () => {
    if (!currentSock) return console.error('❌ Bot non connecté, veille annulée');
    try { await veille.runScan(currentSock, CANALJID); }
    catch (err) { console.error('❌ Échec scan veille:', err.message); }
  });
}

function registerVeilleSummaryCron() {
  if (veilleSummaryRegistered) return;
  veilleSummaryRegistered = true;
  cron.schedule('0 7 * * *', async () => {
    if (!currentSock) return console.error('❌ Bot non connecté, résumé veille annulé');
    try { await veille.runDailySummary(currentSock, CANALJID); }
    catch (err) { console.error('❌ Échec résumé veille:', err.message); }
  }, { timezone: 'America/Port-au-Prince' });
}

`,
  "fonctions cron veille"
);

insertAfter(
  "registerHourlyCron();",
  "\n      registerVeilleScanCron();\n      registerVeilleSummaryCron();",
  "appel des crons veille à la connexion"
);

insertAfter(
  "const upper = text.toUpperCase()",
  `
    if (isSelfChat && upper === '!VEILLE') {
      try {
        const count = await veille.runScan(sock, CANALJID)
        await sock.sendMessage(from, { text: \`🔍 Veille lancée manuellement.\\n\${count} alerte(s) URGENT publiée(s).\` })
      } catch (err) {
        await sock.sendMessage(from, { text: \`⚠️ Erreur veille: \${err.message}\` })
      }
      return
    }
    if (isSelfChat && upper === '!VEILLE STATUS') {
      await sock.sendMessage(from, { text: veille.getStatus() })
      return
    }`,
  "commandes !veille et !veille status"
);

fs.writeFileSync(path, code);
console.log('\n✅ Patch appliqué:', applied.join(', ') || 'AUCUNE MODIFICATION');
