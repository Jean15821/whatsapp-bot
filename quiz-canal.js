const fs = require('fs');
const path = require('path');

const QUESTIONS_FILE = path.join(__dirname, 'questions.json');
const REPONSES_FILE = path.join(__dirname, 'reponses-quiz.json');

function chargerQuestions() {
  const data = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'));

  if (!Array.isArray(data) || !data.length) {
    throw new Error('questions.json est vide ou invalide.');
  }

  return data;
}

function chargerReponses() {
  const data = JSON.parse(fs.readFileSync(REPONSES_FILE, 'utf8'));

  if (!Array.isArray(data) || !data.length) {
    throw new Error('reponses-quiz.json est vide ou invalide.');
  }

  return new Map(data.map(x => [Number(x.id), x]));
}

function choisirQuestion() {
  const questions = chargerQuestions();
  return questions[Math.floor(Math.random() * questions.length)];
}

function construireQuiz() {
  const q = choisirQuestion();
  const reponses = chargerReponses();
  const r = reponses.get(Number(q.id));

  if (!r || !['A','B','C','D'].includes(r.answer)) {
    throw new Error(`Réponse introuvable pour la question ${q.id}`);
  }

  return {
    id: q.id,
    question: q.question,
    options: {
      A: q.option_a,
      B: q.option_b,
      C: q.option_c,
      D: q.option_d
    },
    bonne: r.answer,
    confidence: r.confidence,
    explication: q.explication,

    texte:
`📖 *PAROLE & DÉFI*

🧠 *QUIZ BIBLIQUE DU JOUR*

❓ ${q.question}

🅰️ ${q.option_a}
🅱️ ${q.option_b}
©️ ${q.option_c}
🇩 ${q.option_d}

✍️ *Réponds simplement : A, B, C ou D*

⏳ La réponse sera révélée après ta participation.

📖 _« Vous connaîtrez la vérité, et la vérité vous affranchira. »_
*Jean 8:32*

— *EDILPA | Parole & Défi*`
  };
}

module.exports = {
  construireQuiz
};
