const fs = require('fs');
const path = require('path');
const questions = JSON.parse(fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8'));

function getHourlyQuestion() {
  const heure = Math.floor(Date.now() / 3600000); // change chaque heure
  const q = questions[heure % questions.length];
  return `🏆 *QUIZ BIBLIQUE - Question du moment*\n\n${q.question}\n\nA. ${q.option_a}\nB. ${q.option_b}\nC. ${q.option_c}\nD. ${q.option_d}\n\n📲 Écris *JOUER* à ce numéro pour jouer : wa.me/50940627737`;
}

module.exports = { getHourlyQuestion };
