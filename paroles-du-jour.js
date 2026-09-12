const paroles = [
  `🌸🌺🌷 *PAROLE DU JOUR* 🌷🌺🌸

💐 Ne laisse pas les blessures d’hier voler la beauté de ton aujourd’hui. Dieu voit tes larmes, connaît ton combat et prépare encore ton chemin. 🌹

📖 *« Ceux qui sèment avec larmes moissonneront avec chants d’allégresse. »*
— Psaume 126:5

🌺🌸 Garde la foi. Prie encore. Espère encore. Dieu n’a pas fini avec toi. 🌷💐`,

  `🌹🌸 *PAROLE DU JOUR* 🌸🌹

💐 Même lorsque tu ne comprends pas ce que Dieu fait, fais-lui confiance. Le silence de Dieu n’est pas son absence. 🌺

📖 *« Confie-toi en l’Éternel de tout ton cœur. »*
— Proverbes 3:5

🌷🌼 Ce que Dieu prépare pour toi vaut la peine d’attendre. 🌸💐`,

  `🌺🌷 *PAROLE DU JOUR* 🌷🌺

💐 Ne méprise jamais les petits commencements. Une petite graine peut devenir un grand arbre. 🌱🌸

📖 *« Ne méprisez pas le jour des faibles commencements. »*
— Zacharie 4:10

🌹🌼 Continue d’avancer. Même lentement, avance avec Dieu. 💐🌺`,

  `🌸🌹 *PAROLE DU JOUR* 🌹🌸

💐 Une parole douce peut guérir un cœur que personne ne voit souffrir. Aujourd’hui, choisis de construire plutôt que de détruire. 🌷

📖 *« Une réponse douce calme la fureur. »*
— Proverbes 15:1

🌺🌼 Que ta bouche soit une source de vie. 💐🌸`,

  `🌷🌺 *PAROLE DU JOUR* 🌺🌷

💐 Tu peux tomber sans être vaincu. Tu peux pleurer sans être faible. Tu peux recommencer sans avoir honte. Dieu donne la force de se relever. 🌹

📖 *« Le juste tombe sept fois, et il se relève. »*
— Proverbes 24:16

🌸💐 Relève-toi encore. Ta dernière page n’est pas encore écrite. 🌺🌼`
];

let index = 0;

function getDailyContent() {
  const parole = paroles[index];
  index = (index + 1) % paroles.length;
  return parole;
}

module.exports = { getDailyContent };
