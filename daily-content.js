const versets = [
  { ref: "Jean 3:16", texte: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle." },
  { ref: "Psaume 23:1", texte: "L'Éternel est mon berger: je ne manquerai de rien." },
  { ref: "Philippiens 4:13", texte: "Je puis tout par celui qui me fortifie." },
  { ref: "Proverbes 3:5-6", texte: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse; reconnais-le dans toutes tes voies, et il aplanira tes sentiers." },
  { ref: "Romains 8:28", texte: "Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu." },
  { ref: "Ésaïe 41:10", texte: "Ne crains rien, car je suis avec toi; ne t'inquiète pas, car je suis ton Dieu." },
  { ref: "Matthieu 11:28", texte: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos." },
];

function getDailyContent() {
  const jour = Math.floor(Date.now() / 86400000);
  const v = versets[jour % versets.length];
  return `📖 *Verset du jour*\n\n"${v.texte}"\n— ${v.ref}\n\n_EDILPA - Église de Dieu Liberté par la Parole_`;
}

module.exports = { getDailyContent };
