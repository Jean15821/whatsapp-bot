const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { proto } = require('@whiskeysockets/baileys');

const QUESTIONS_FILE = path.join(__dirname, 'questions.json');
const REPONSES_FILE = path.join(__dirname, 'reponses-quiz.json');
const QUIZ_FILE = path.join(__dirname, 'quiz-actuel.json');

const CANALJID = "120363411968127620@newsletter";

function chargerQuestions() {
  const q = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'));

  if (!Array.isArray(q) || !q.length) {
    throw new Error('questions.json vide ou invalide');
  }

  return q;
}

function chargerReponses() {
  if (!fs.existsSync(REPONSES_FILE)) {
    throw new Error('reponses-quiz.json introuvable');
  }

  const r = JSON.parse(fs.readFileSync(REPONSES_FILE, 'utf8'));

  if (!Array.isArray(r)) {
    throw new Error('reponses-quiz.json invalide');
  }

  return new Map(r.map(x => [Number(x.id), x]));
}

function numeroQuiz() {
  if (!fs.existsSync(QUIZ_FILE)) return 1;

  try {
    const ancien = JSON.parse(
      fs.readFileSync(QUIZ_FILE, 'utf8')
    );

    return Number(ancien.numero || 0) + 1;
  } catch {
    return 1;
  }
}

function choisirQuestion() {
  const questions = chargerQuestions();
  const reponses = chargerReponses();

  const valides = questions.filter(q => {
    const r = reponses.get(Number(q.id));

    return r &&
      ['A', 'B', 'C', 'D'].includes(
        String(r.answer || '').toUpperCase()
      );
  });

  if (!valides.length) {
    throw new Error('Aucune question avec réponse A-D valide');
  }

  return valides[
    Math.floor(Math.random() * valides.length)
  ];
}

async function publierQuizCanal(sock) {
  if (!sock) throw new Error('Socket WhatsApp absent');

  const q = choisirQuestion();
  const reponses = chargerReponses();
  const r = reponses.get(Number(q.id));

  const bonne = String(r.answer).toUpperCase();
  const numero = numeroQuiz();

  const options = [
    { optionName: `A. ${q.option_a}` },
    { optionName: `B. ${q.option_b}` },
    { optionName: `C. ${q.option_c}` },
    { optionName: `D. ${q.option_d}` }
  ];

  const bonneOption = {
    optionName: `${bonne}. ${q[`option_${bonne.toLowerCase()}`]}`
  };

  const quiz = {
    numero,
    id: q.id,
    question: q.question,
    options: {
      A: q.option_a,
      B: q.option_b,
      C: q.option_c,
      D: q.option_d
    },
    bonne,
    explication: q.explication || '',
    reference: q.reference_biblique || '',
    pollMessageId: null,
    date: new Date().toISOString()
  };

  // Message d'introduction
  await sock.sendMessage(CANALJID, {
    text:
`🏆 *QUIZ BIBLIQUE EDILPA*

📖 *Question ${numero}/10*

${q.question}

👇 *Vote directement dans le quiz ci-dessous.*`
  });

  // Construction DIRECTE du protobuf WhatsApp.
  // Important : on ne passe PAS par sendMessage({ poll: ... }),
  // car Baileys 6.7.23 supprime pollType et correctAnswer
  // dans son générateur standard.
  const pollCreationMessage = proto.Message.PollCreationMessage.fromObject({
    name: q.question,
    options,
    selectableOptionsCount: 1,
    pollType: 1, // QUIZ
    correctAnswer: bonneOption
  });

  const messageId = crypto.randomBytes(16).toString('hex');

  await sock.relayMessage(
    CANALJID,
    {
      pollCreationMessage
    },
    {
      messageId
    }
  );

  quiz.pollMessageId = messageId;

  fs.writeFileSync(
    QUIZ_FILE,
    JSON.stringify(quiz, null, 2) + '\n'
  );

  console.log(`✅ QUIZ NATIF PROTOBUF PUBLIÉ — Question ${numero}/10`);
  console.log(`🆔 Poll ID: ${messageId}`);
  console.log(`🎯 Type: QUIZ`);
  console.log(`✅ Bonne réponse: ${bonne}`);

  return quiz;
}

function chargerQuizActuel() {
  if (!fs.existsSync(QUIZ_FILE)) return null;

  try {
    return JSON.parse(
      fs.readFileSync(QUIZ_FILE, 'utf8')
    );
  } catch {
    return null;
  }
}

function construireRevelation(quiz) {
  if (!quiz) return null;

  return `📖 *RÉPONSE — QUIZ N°${quiz.numero}*

✅ *Bonne réponse :*
${quiz.bonne}. ${quiz.options[quiz.bonne]}

📚 *Référence biblique :*
${quiz.reference || 'Voir la question biblique.'}

💡 *Explication :*
${quiz.explication || 'Continue à étudier la Parole de Dieu.'}

🏆 *Parole & Défi | EDILPA*`;
}

module.exports = {
  publierQuizCanal,
  chargerQuizActuel,
  construireRevelation
};
