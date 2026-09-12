const fs = require('fs');
let content = fs.readFileSync('index.js', 'utf8');

const oldGetBackoff = `const getBackoffDelay = (attempt) => Math.min(5000 * attempt, 60000)`;
const newGetBackoff = `const getBackoffDelay = (attempt) => Math.min(30000 * attempt, 600000)`;

if (!content.includes(oldGetBackoff)) {
  console.error('Ligne getBackoffDelay non trouvee - arret.');
  process.exit(1);
}
content = content.replace(oldGetBackoff, newGetBackoff);

fs.writeFileSync('index.js', content);
console.log('OK: Backoff corrige, 30s a 10 minutes max entre tentatives');
