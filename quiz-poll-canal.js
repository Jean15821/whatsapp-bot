const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let proto = null;
let decryptPollVote = null;

async function getBaileys() {
  if (!proto || !decryptPollVote) {
    const b = await import('@whiskeysockets/baileys');
    proto = b.proto;
    decryptPollVote = b.decryptPollVote;
  }
  return { proto, decryptPollVote };
}

const QUESTIONS_FILE = path.join(__dirname, 'questions.json');
const REPONSES_FILE = path.join(__dirname, 'reponses-quiz.json');
const QUIZ_FILE = path.join(__dirname, 'quiz-actuel.json');
const POLLS_FILE = path.join(__dirname, 'quiz-polls.json');

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

function chargerPolls() {
  if (!fs.existsSync(POLLS_FILE)) return {};

  try {
    const data = JSON.parse(
      fs.readFileSync(POLLS_FILE, 'utf8')
    );

    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function sauvegarderPolls(data) {
  fs.writeFileSync(
    POLLS_FILE,
    JSON.stringify(data, null, 2) + '\n'
  );
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
    throw new Error(
      'Aucune question avec réponse A-D valide'
    );
  }

  return valides[
    Math.floor(Math.random() * valides.length)
  ];
}

async function publierQuizCanal(sock) {
  if (!sock) {
    throw new Error('Socket WhatsApp absent');
  }

  const q = choisirQuestion();
  const reponses = chargerReponses();
  const r = reponses.get(Number(q.id));

  const bonne = String(r.answer).toUpperCase();
  const numero = numeroQuiz();

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

  const reference = quiz.reference
    ? `\n📖 *Référence :* ${quiz.reference}\n`
    : '';

  const message =
`🏆 *QUIZ BIBLIQUE - QUESTION DU MOMENT*

${q.question}

A. ${q.option_a}
B. ${q.option_b}
C. ${q.option_c}
D. ${q.option_d}
${reference}
👉 _Réponds avec A, B, C ou D_

📲 Écris *JOUER* à ce numéro pour jouer :
wa.me/50940627737`;

  await sock.sendMessage(CANALJID, {
    text: message
  });

  fs.writeFileSync(
    QUIZ_FILE,
    JSON.stringify(quiz, null, 2) + '\n'
  );

  console.log(
    `✅ QUIZ DIRECT PUBLIÉ — Question ${numero}`
  );
  console.log(`🎯 Bonne réponse : ${bonne}`);

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

function trouverPoll(pollMessageId) {
  const polls = chargerPolls();
  return polls[pollMessageId] || null;
}

function construireRevelation(quiz) {
  if (!quiz) return null;

  return
`📖 *RÉPONSE — QUIZ N°${quiz.numero}*

✅ *Bonne réponse :*
${quiz.bonne}. ${quiz.options[quiz.bonne]}

📚 *Référence biblique:*
${quiz.reference || 'Voir la question biblique.'}

💡 *Explication:*
${quiz.explication || 'Continue à étudier la Parole de Dieu.'}

🏆 *Parole & Défi | EDILPA*`;
}

async function traiterVoteSondage(msg) {
  const content = msg?.message;

  if (!content?.pollUpdateMessage) {
    return null;
  }

  const update = content.pollUpdateMessage;
  const creationKey = update.pollCreationMessageKey;

  if (!creationKey?.id) {
    console.error('❌ Vote sans pollMessageId');
    return null;
  }

  const pollMessageId = creationKey.id;
  const poll = trouverPoll(pollMessageId);

  if (!poll) {
    console.warn(
      `⚠️ Sondage inconnu : ${pollMessageId}`
    );
    return null;
  }

  const { decryptPollVote } = await getBaileys();

  const voterJid =
    msg.key.participant ||
    msg.key.remoteJid;

  if (!voterJid) {
    console.error('❌ Votant introuvable');
    return null;
  }

  const creatorJid =
    creationKey.participant ||
    creationKey.remoteJid ||
    CANALJID;

  const pollEncKey =
    Buffer.from(poll.messageSecret, 'base64');

  let vote;

  try {
    vote = decryptPollVote(
      update.vote,
      {
        pollEncKey,
        pollCreatorJid: creatorJid,
        pollMsgId: pollMessageId,
        voterJid
      }
    );
  } catch (err) {
    console.error(
      '❌ Échec déchiffrement vote :',
      err.message
    );

    return null;
  }

  const selectedHashes =
    vote?.selectedOptions || [];

  if (!selectedHashes.length) {
    return null;
  }

  const optionIndexByHash = {};

  const optionNames = [
    `A. ${poll.options.A}`,
    `B. ${poll.options.B}`,
    `C. ${poll.options.C}`,
    `D. ${poll.options.D}`
  ];

  for (let i = 0; i < optionNames.length; i++) {
    const hash = crypto
      .createHash('sha256')
      .update(optionNames[i])
      .digest('hex');

    optionIndexByHash[hash] =
      ['A', 'B', 'C', 'D'][i];
  }

  let lettre = null;

  for (const selected of selectedHashes) {
    const hash = Buffer.from(selected)
      .toString('hex');

    if (optionIndexByHash[hash]) {
      lettre = optionIndexByHash[hash];
      break;
    }
  }

  if (!lettre) {
    console.warn(
      '⚠️ Option votée impossible à identifier'
    );

    return null;
  }

  const polls = chargerPolls();

  if (!polls[pollMessageId].participants) {
    polls[pollMessageId].participants = {};
  }

  const participants =
    polls[pollMessageId].participants;

  if (participants[voterJid]) {
    return {
      dejaRepondu: true,
      poll,
      lettre,
      voterJid
    };
  }

  const bonne =
    lettre === poll.bonne;

  participants[voterJid] = {
    reponse: lettre,
    bonne,
    date: new Date().toISOString()
  };

  sauvegarderPolls(polls);

  return {
    valide: true,
    poll,
    lettre,
    bonne,
    voterJid
  };
}

module.exports = {
  publierQuizCanal,
  chargerQuizActuel,
  construireRevelation,
  traiterVoteSondage,
  trouverPoll
};
