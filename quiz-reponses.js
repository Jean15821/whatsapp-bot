const fs = require('fs');
const path = require('path');

const RESULTATS_FILE = path.join(__dirname, 'resultats-quiz.json');

function chargerResultats() {
  try {
    if (!fs.existsSync(RESULTATS_FILE)) return {};
    return JSON.parse(fs.readFileSync(RESULTATS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function sauvegarderResultats(data) {
  fs.writeFileSync(
    RESULTATS_FILE,
    JSON.stringify(data, null, 2) + '\n'
  );
}

function enregistrerReponse(participant, quiz, lettre) {
  const reponse = String(lettre || '').trim().toUpperCase();

  if (!['A', 'B', 'C', 'D'].includes(reponse)) {
    return {
      valide: false,
      message: 'Réponse invalide. Réponds seulement par A, B, C ou D.'
    };
  }

  const data = chargerResultats();

  if (!data[participant]) {
    data[participant] = {
      total: 0,
      bonnes: 0,
      mauvaises: 0,
      questions: {}
    };
  }

  const joueur = data[participant];

  if (joueur.questions[quiz.id]) {
    return {
      valide: false,
      dejaRepondu: true,
      message: '⏳ Tu as déjà répondu à cette question.'
    };
  }

  const bonne = reponse === quiz.bonne;

  joueur.total++;
  if (bonne) joueur.bonnes++;
  else joueur.mauvaises++;

  joueur.questions[quiz.id] = {
    reponse,
    bonne: quiz.bonne,
    date: new Date().toISOString()
  };

  sauvegarderResultats(data);

  const pourcentage = joueur.total
    ? Math.round((joueur.bonnes / joueur.total) * 100)
    : 0;

  let message;

  if (bonne) {
    message =
`✅ *BONNE RÉPONSE !*

🎉 Bravo !

🧠 Tu as répondu : *${reponse}*

📖 *Explication :*
${quiz.explication}

📊 *Ton résultat*
✅ Bonnes réponses : ${joueur.bonnes}
❌ Mauvaises réponses : ${joueur.mauvaises}
🎯 Réussite : ${pourcentage} %

— *Parole & Défi | EDILPA*`;
  } else {
    message =
`❌ *MAUVAISE RÉPONSE*

Tu as répondu : *${reponse}*

✅ *La bonne réponse était : ${quiz.bonne}*

📖 *Explication :*
${quiz.explication}

📊 *Ton résultat*
✅ Bonnes réponses : ${joueur.bonnes}
❌ Mauvaises réponses : ${joueur.mauvaises}
🎯 Réussite : ${pourcentage} %

💪 Continue à apprendre la Parole de Dieu !

— *Parole & Défi | EDILPA*`;
  }

  return {
    valide: true,
    bonne,
    message,
    statistiques: joueur
  };
}

module.exports = {
  enregistrerReponse,
  chargerResultats
};
