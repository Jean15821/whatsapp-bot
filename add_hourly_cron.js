const fs = require('fs');
const path = 'index.js';
let content = fs.readFileSync(path, 'utf8');

const anchor = `function registerDailyCron() {`;
if (!content.includes(anchor)) { console.error('Ancre non trouvée'); process.exit(1); }

const hourlyBlock = `const { getHourlyQuestion } = require('./hourly-quiz');

function registerHourlyCron() {
  if (hourlyRegistered) return;
  hourlyRegistered = true;
  cron.schedule('0 * * * *', async () => {
    if (!currentSock) return console.error('❌ Bot non connecté, question horaire annulée');
    try {
      await currentSock.sendMessage(CANAL_JID, { text: getHourlyQuestion() });
      console.log('✅ Question horaire publiée sur le canal');
    } catch (err) {
      console.error('❌ Échec publication question horaire:', err.message);
    }
  });
}

${anchor}`;

content = content.replace(anchor, hourlyBlock);
content = content.replace('let cronRegistered = false;', 'let cronRegistered = false;\nlet hourlyRegistered = false;');
content = content.replace('registerDailyCron();', 'registerDailyCron();\n        registerHourlyCron();');

fs.writeFileSync(path, content, 'utf8');
console.log('✅ Cron horaire ajouté');
