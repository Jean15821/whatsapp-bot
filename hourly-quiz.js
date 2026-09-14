const fs = require('fs');
const path = require('path');

const questions = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8')
);

function getHourlyQuestion() {
  const heure = Math.floor(Date.now() / 3600000);
  const q = questions[heure % questions.length];

  const reference = q.reference || q.verset || q.ref || '';

  return `🏆 *QUIZ BIBLIQUE - QUESTION DU MOMENT*

${q.question}

A. ${q.option_a}
B. ${q.option_b}
C. ${q.option_c}
D. ${q.option_d}

${reference ? `📖 *Référence :* ${reference}\n\n` : ''}
👉 _Réponds avec A, B, C ou D_`;
}

module.exports = { getHourlyQuestion };
