const axios = require('axios');
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const SEEN_FILE = path.join(__dirname, 'veille_seen.json');
const MAX_SEEN = 1000;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0'
};

const parser = new Parser({
  requestOptions: { headers: HEADERS }
});

// ======================================================
// 1. SAVOIR-VIVRE CHRÉTIEN — PRIORITÉ
// ======================================================

const SAVOIR_VIVRE = [
  {
    fr: "Parle avec douceur, même lorsque tu dois corriger quelqu’un. Une parole vraie n’a pas besoin d’être méchante.",
    es: "Habla con dulzura, incluso cuando tengas que corregir a alguien. Una palabra verdadera no necesita ser cruel.",
    ht: "Pale avèk dousè, menm lè ou bezwen korije yon moun. Yon pawòl ki vre pa bezwen mechan."
  },
  {
    fr: "Apprends à écouter avant de répondre. Celui qui écoute avec attention montre du respect.",
    es: "Aprende a escuchar antes de responder. Quien escucha con atención demuestra respeto.",
    ht: "Aprann koute anvan ou reponn. Moun ki koute avèk atansyon montre respè."
  },
  {
    fr: "Ne rends pas le mal pour le mal. Le chrétien cherche la paix même lorsqu’il est injustement traité.",
    es: "No devuelvas mal por mal. El cristiano busca la paz incluso cuando recibe un trato injusto.",
    ht: "Pa rann mal pou mal. Kretyen an chèche lapè menm lè yo trete l mal."
  },
  {
    fr: "Respecte les personnes âgées, aide les faibles et sois attentif aux personnes qui souffrent.",
    es: "Respeta a los mayores, ayuda a los débiles y presta atención a quienes sufren.",
    ht: "Respekte granmoun, ede moun ki fèb yo epi pran swen moun k ap soufri."
  },
  {
    fr: "Un chrétien doit être ponctuel, honnête et fidèle à sa parole.",
    es: "Un cristiano debe ser puntual, honesto y fiel a su palabra.",
    ht: "Yon kretyen dwe ponktyèl, onèt epi fidèl ak pawòl li."
  },
  {
    fr: "Ne divulgue pas les secrets qu’une personne t’a confiés. La confiance est une responsabilité.",
    es: "No divulgues los secretos que una persona te confió. La confianza es una responsabilidad.",
    ht: "Pa gaye sekrè yon moun te konfye w. Konfyans se yon responsablite."
  },
  {
    fr: "Demande pardon rapidement lorsque tu as mal agi. Reconnaître son erreur est une force, pas une faiblesse.",
    es: "Pide perdón rápidamente cuando hayas actuado mal. Reconocer un error es una fuerza, no una debilidad.",
    ht: "Mande padon vit lè ou fè sa ki mal. Rekonèt erè ou se yon fòs, se pa yon feblès."
  },
  {
    fr: "Ne méprise personne à cause de sa pauvreté, de son apparence ou de son niveau d’instruction.",
    es: "No desprecies a nadie por su pobreza, apariencia o nivel de educación.",
    ht: "Pa meprize pèsonn poutèt li pòv, aparans li oswa nivo edikasyon li."
  },
  {
    fr: "Garde ton cœur loin des querelles inutiles. Toutes les batailles ne méritent pas une réponse.",
    es: "Mantén tu corazón lejos de las discusiones inútiles. No todas las batallas merecen una respuesta.",
    ht: "Kenbe kè w lwen diskisyon ki pa itil. Se pa tout batay ki merite yon repons."
  },
  {
    fr: "Aide sans humilier. Fais le bien sans chercher à faire honte à celui que tu aides.",
    es: "Ayuda sin humillar. Haz el bien sin avergonzar a quien ayudas.",
    ht: "Ede san imilye. Fè byen san w pa fè moun w ap ede a wont."
  },
  {
    fr: "Sois reconnaissant pour les petites choses. La reconnaissance protège le cœur contre l’ingratitude.",
    es: "Sé agradecido por las pequeñas cosas. La gratitud protege el corazón de la ingratitud.",
    ht: "Se pou w rekonesan pou ti bagay yo. Rekonesans pwoteje kè a kont engratitid."
  },
  {
    fr: "Avant de partager une information, vérifie-la. La vérité vaut mieux qu’une rumeur rapidement diffusée.",
    es: "Antes de compartir una información, verifícala. La verdad vale más que un rumor difundido rápidamente.",
    ht: "Anvan w pataje yon enfòmasyon, verifye li. Verite gen plis valè pase rimè."
  }
];

// ======================================================
// 2. GRANDS PROVERBES
// ======================================================

const PROVERBES = [
  {
    fr: "« Mieux vaut peu avec la crainte de l’Éternel qu’un grand trésor avec le trouble. » — Proverbes 15:16",
    es: "« Mejor es lo poco con el temor de Jehová que un gran tesoro donde hay turbación. » — Proverbios 15:16",
    ht: "« Li pi bon pou yon moun gen yon ti kras bagay avèk krentif pou Seyè a, pase pou li gen anpil richès avèk tèt chaje. » — Pwovèb 15:16"
  },
  {
    fr: "« Une réponse douce calme la fureur. » — Proverbes 15:1",
    es: "« La blanda respuesta quita la ira. » — Proverbios 15:1",
    ht: "« Yon repons ki dous kalme kòlè. » — Pwovèb 15:1"
  },
  {
    fr: "« L’orgueil précède la ruine, et l’esprit arrogant précède la chute. » — Proverbes 16:18",
    es: "« Antes del quebrantamiento es la soberbia, y antes de la caída la altivez de espíritu. » — Proverbios 16:18",
    ht: "« Ògèy mache devan destriksyon, epi awogans mache devan tonbe. » — Pwovèb 16:18"
  },
  {
    fr: "« Celui qui garde sa bouche et sa langue garde son âme de détresses. » — Proverbes 21:23",
    es: "« El que guarda su boca y su lengua guarda su alma de angustias. » — Proverbios 21:23",
    ht: "« Moun ki veye bouch li ak lang li pwoteje nanm li kont pwoblèm. » — Pwovèb 21:23"
  },
  {
    fr: "« Le commencement de la sagesse, c’est la crainte de l’Éternel. » — Proverbes 9:10",
    es: "« El principio de la sabiduría es el temor de Jehová. » — Proverbios 9:10",
    ht: "« Kòmansman sajès se krentif pou Seyè a. » — Pwovèb 9:10"
  }
];

// ======================================================
// 3. HISTOIRES BIBLIQUES
// ======================================================

const HISTOIRES = [
  {
    fr: "DAVID ET GOLIATH — David semblait faible face à Goliath, mais il plaça sa confiance en Dieu. La victoire ne dépend pas toujours de la taille de l’adversaire, mais de la foi et du courage.",
    es: "DAVID Y GOLIAT — David parecía débil frente a Goliat, pero puso su confianza en Dios. La victoria no siempre depende del tamaño del adversario, sino de la fe y del valor.",
    ht: "DAVID AK GOLYAT — David te sanble fèb devan Golyat, men li te mete konfyans li nan Bondye. Viktwa pa toujou depann de gwosè advèsè a, men de lafwa ak kouraj."
  },
  {
    fr: "LE BON SAMARITAIN — Jésus montre qu’aimer son prochain signifie agir avec compassion. La véritable bonté ne demande pas d’abord qui mérite notre aide.",
    es: "EL BUEN SAMARITANO — Jesús enseñó que amar al prójimo significa actuar con compasión. La verdadera bondad no pregunta primero quién merece nuestra ayuda.",
    ht: "BON SAMARITEN AN — Jezi montre renmen pwochen nou vle di aji avèk konpasyon. Vrè bonte pa mande anvan kiyès ki merite èd nou.",
  },
  {
    fr: "JOSEPH — Malgré la trahison de ses frères et les années difficiles, Joseph resta fidèle. Dieu transforma finalement son épreuve en bénédiction pour beaucoup.",
    es: "JOSÉ — A pesar de la traición de sus hermanos y de los años difíciles, José permaneció fiel. Dios finalmente transformó su prueba en bendición para muchos.",
    ht: "JOZÈF — Malgre frè l yo te trayi l ak anpil ane difisil, Jozèf te rete fidèl. Bondye te finalman transfòme eprèv li an benediksyon pou anpil moun."
  },
  {
    fr: "DANIEL — Daniel refusa d’abandonner sa fidélité à Dieu malgré la pression du pouvoir. Son histoire enseigne le courage et la fidélité.",
    es: "DANIEL — Daniel se negó a abandonar su fidelidad a Dios a pesar de la presión del poder. Su historia enseña valor y fidelidad.",
    ht: "DANYÈL — Danyèl te refize abandone fidelite li anvè Bondye malgre presyon otorite yo. Istwa li anseye kouraj ak fidelite."
  },
  {
    fr: "LE FILS PRODIGUE — Jésus raconte l’histoire d’un fils qui revient vers son père après s’être éloigné. Elle montre la puissance du pardon et de la repentance.",
    es: "EL HIJO PRÓDIGO — Jesús contó la historia de un hijo que regresó a su padre después de alejarse. Enseña el poder del perdón y del arrepentimiento.",
    ht: "PITIT GASON KI TE PÈDI A — Jezi rakonte istwa yon pitit gason ki retounen lakay papa l apre li te kite l. Istwa a montre pouvwa padon ak repantans."
  }
];

// ======================================================
// OUTILS
// ======================================================

function loadJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function saveJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('❌ Erreur sauvegarde:', e.message);
  }
}

function clean(text) {
  return String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function recent(item) {
  const date = new Date(item.pubDate || item.isoDate || 0);
  if (isNaN(date.getTime())) return false;

  const age = Date.now() - date.getTime();

  return age >= 0 && age <= 24 * 60 * 60 * 1000;
}

// ======================================================
// ACTUALITÉS — FILTRE STRICT
// ======================================================

const CHRISTIAN_WORDS = [
  'bible',
  'biblical',
  'biblique',
  'christian',
  'christianity',
  'chrétien',
  'chrétienne',
  'christianisme',
  'église',
  'eglise',
  'church',
  'gospel',
  'évangile',
  'evangel',
  'mission',
  'missionnaire',
  'prière',
  'priere',
  'religious freedom',
  'liberté religieuse',
  'persecution',
  'persécution',
  'christianos',
  'cristiano',
  'biblia',
  'iglesia',
  'evangelio',
  'misión',
  'persecución',
  'libertad religiosa',
  'kretyen',
  'legliz',
  'levanjil',
  'misyon',
  'lapriyè'
];

const TECH_WORDS = [
  'whatsapp',
  'meta',
  'artificial intelligence',
  'intelligence artificielle',
  'inteligencia artificial',
  'openai',
  'ia générative'
];

const HAITI_WORDS = [
  'haïti',
  'haiti',
  'haití',
  'haitian',
  'haïtien',
  'haïtienne',
  'haitiano',
  'haitiana',
  'ayisyen'
];

const BAD_WORDS = [
  'ronaldo',
  'football',
  'soccer',
  'match',
  'championnat',
  'acteur',
  'actrice',
  'cinéma',
  'cinema',
  'people',
  'mode',
  'musique',
  'concert'
];

function relevantNews(text) {
  const t = text.toLowerCase();

  if (BAD_WORDS.some(w => t.includes(w))) {
    return false;
  }

  const christian = CHRISTIAN_WORDS.some(w => t.includes(w));
  const tech = TECH_WORDS.some(w => t.includes(w));
  const haiti = HAITI_WORDS.some(w => t.includes(w));

  return christian || tech || haiti;
}

function classify(text) {
  const t = text.toLowerCase();

  if (
    t.includes('persécution') ||
    t.includes('persecution') ||
    t.includes('massacre') ||
    t.includes('attentat') ||
    t.includes('attaque') ||
    t.includes('guerre') ||
    t.includes('killed')
  ) {
    return 'URGENT';
  }

  return 'IMPORTANT';
}

// ======================================================
// RECHERCHE WEB
// ======================================================

const SEARCHES = [
  'Bible chrétien église évangile mission',
  'persécution chrétiens liberté religieuse',
  'Christian Bible church gospel mission',
  'Christian persecution religious freedom',
  'Biblia cristianos iglesia evangelio misión',
  'persecución cristianos libertad religiosa',
  'Kreyòl kretyen legliz levanjil',
  'Haïti église chrétien',
  'Haiti Christian church',
  'WhatsApp Meta intelligence artificielle'
];

function googleNews(query) {
  return (
    'https://news.google.com/rss/search?q=' +
    encodeURIComponent(query + ' when:1d') +
    '&hl=fr&gl=FR&ceid=FR:fr'
  );
}

async function search(query) {
  try {
    const r = await axios.get(googleNews(query), {
      timeout: 15000,
      headers: HEADERS
    });

    const feed = await parser.parseString(r.data);

    return feed.items || [];
  } catch (e) {
    console.error('⚠️ Recherche:', e.message);
    return [];
  }
}

async function scanFeeds() {
  const seen = loadJSON(SEEN_FILE, []);
  const seenSet = new Set(seen);
  const results = [];

  for (const query of SEARCHES) {
    const items = await search(query);

    for (const entry of items.slice(0, 10)) {
      const id = entry.guid || entry.link;

      if (!id || seenSet.has(id)) continue;
      if (!recent(entry)) continue;

      const title = clean(entry.title);
      const description = clean(
        entry.contentSnippet ||
        entry.content ||
        entry.summary ||
        ''
      );

      const text = `${title} ${description}`;

      if (!relevantNews(text)) {
        seen.push(id);
        seenSet.add(id);
        continue;
      }

      results.push({
        id,
        level: classify(text),
        title,
        description: description.slice(0, 450),
        link: entry.link || '',
        publishedAt: new Date(entry.pubDate || entry.isoDate)
      });

      seen.push(id);
      seenSet.add(id);
    }
  }

  const unique = [];
  const titles = new Set();

  for (const item of results) {
    const key = item.title.toLowerCase();

    if (titles.has(key)) continue;

    titles.add(key);
    unique.push(item);
  }

  unique.sort((a, b) => b.publishedAt - a.publishedAt);

  while (seen.length > MAX_SEEN) {
    seen.shift();
  }

  saveJSON(SEEN_FILE, seen);

  return {
    newUrgent: unique.slice(0, 2),
    errors: []
  };
}

// ======================================================
// CONTENU PRIORITAIRE
// ======================================================

function contenuDuJour() {
  const now = new Date();
  const day = Math.floor(
    now.getTime() / (24 * 60 * 60 * 1000)
  );

  // Rotation : savoir-vivre en premier lieu
  const savoir = SAVOIR_VIVRE[day % SAVOIR_VIVRE.length];

  return (
    `🌿 *SAVOIR-VIVRE CHRÉTIEN*\n\n` +
    `🇫🇷 ${savoir.fr}\n\n` +
    `🇪🇸 ${savoir.es}\n\n` +
    `🇭🇹 ${savoir.ht}\n\n` +
    `📖 *Parole & Défi*`
  );
}

function proverbeDuJour() {
  const now = new Date();
  const day = Math.floor(
    now.getTime() / (24 * 60 * 60 * 1000)
  );

  const p = PROVERBES[day % PROVERBES.length];

  return (
    `📖 *GRAND PROVERBE BIBLIQUE*\n\n` +
    `🇫🇷 ${p.fr}\n\n` +
    `🇪🇸 ${p.es}\n\n` +
    `🇭🇹 ${p.ht}\n\n` +
    `🌿 *Parole & Défi*`
  );
}

function histoireDuJour() {
  const now = new Date();
  const day = Math.floor(
    now.getTime() / (24 * 60 * 60 * 1000)
  );

  const h = HISTOIRES[day % HISTOIRES.length];

  return (
    `📚 *HISTOIRE BIBLIQUE*\n\n` +
    `🇫🇷 ${h.fr}\n\n` +
    `🇪🇸 ${h.es}\n\n` +
    `🇭🇹 ${h.ht}\n\n` +
    `🌿 *Parole & Défi*`
  );
}

// ======================================================
// ACTUALITÉ MULTILINGUE
// ======================================================

async function formatNews(item) {
  const title = item.title;
  const description = item.description;

  let fr = description;
  let es = description;
  let ht = description;

  try {
    const translate = async (text, lang) => {
      const r = await axios.get(
        'https://translate.googleapis.com/translate_a/single',
        {
          timeout: 10000,
          params: {
            client: 'gtx',
            sl: 'auto',
            tl: lang,
            dt: 't',
            q: text
          }
        }
      );

      return r.data[0]
        .map(x => x[0])
        .filter(Boolean)
        .join('');
    };

    fr = await translate(description, 'fr');
    es = await translate(description, 'es');
    ht = await translate(description, 'ht');
  } catch (e) {
    console.log('⚠️ Traduction automatique indisponible.');
  }

  return (
    `📰 *VEILLE — ACTUALITÉ RÉCENTE*\n\n` +
    `${item.level === 'URGENT' ? '🔴' : '🟠'} *${title}*\n\n` +
    `🇫🇷 *FRANÇAIS*\n${fr}\n\n` +
    `🇪🇸 *ESPAÑOL*\n${es}\n\n` +
    `🇭🇹 *KREYÒL*\n${ht}\n\n` +
    `🔗 ${item.link}\n\n` +
    `🌿 *Parole & Défi*`
  );
}

// ======================================================
// PUBLICATION
// ======================================================

let scanCounter = 0;
let lastRun = null;
let lastError = null;

async function runScan(sock, channelJid, publishDailyContent = true) {
  if (!sock) {
    console.error('❌ WhatsApp non connecté.');
    return 0;
  }

  scanCounter++;
  lastRun = new Date();

  /*
   * PRIORITÉ :
   * 1 = savoir-vivre
   * 2 = proverbe
   * 3 = histoire
   * puis actualité.
   */


  if (publishDailyContent) {


    try {


      let message;


      if (scanCounter % 3 === 1) {


        message = contenuDuJour();


      } else if (scanCounter % 3 === 2) {


        message = proverbeDuJour();


      } else {


        message = histoireDuJour();


      }



      await sock.sendMessage(channelJid, {


        text: message


      });



      console.log('✅ Contenu chrétien publié.');


    } catch (e) {


      console.error('❌ Publication contenu:', e.message);


    }


  }

  // Recherche ensuite les actualités réellement pertinentes
  try {
    const result = await scanFeeds();

    for (const item of result.newUrgent) {
      const message = await formatNews(item);

      await sock.sendMessage(channelJid, {
        text: message
      });

      console.log(`✅ Actualité publiée: ${item.title}`);
    }

    return result.newUrgent.length + 1;
  } catch (e) {
    lastError = e.message;
    console.error('❌ Veille actualité:', e.message);
    return 1;
  }
}

// Désactivé : pas de deuxième publication massive à 07h.
async function runDailySummary() {
  console.log(
    'ℹ️ Résumé quotidien désactivé : la veille publie directement.'
  );

  return 0;
}

function getStatus() {
  return (
    `📊 *STATUT VEILLE*\n\n` +
    `Dernier scan : ${
      lastRun
        ? lastRun.toLocaleString('fr-FR', {
            timeZone: 'America/Port-au-Prince'
          })
        : 'jamais'
    }\n` +
    `Priorité : Savoir-vivre → Proverbes → Histoires → Actualités\n` +
    `Langues : 🇫🇷 🇪🇸 🇭🇹\n` +
    `Actualités : dernières 24 h\n` +
    `Dernière erreur : ${lastError || 'aucune'}`
  );
}

module.exports = {
  runScan,
  runDailySummary,
  scanFeeds,
  getStatus
};
