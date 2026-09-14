const fs = require('fs');
const path = require('path');

const QUESTIONS_FILE = path.join(__dirname, 'questions.json');
const POSTS_FILE = path.join(__dirname, 'facebook_posts.json');

function getQuestion() {
  const questions = JSON.parse(
    fs.readFileSync(QUESTIONS_FILE, 'utf8')
  );

  const heure = Math.floor(Date.now() / 3600000);
  return questions[heure % questions.length];
}

function createFacebookPost() {
  const q = getQuestion();
  const reference = q.reference || q.verset || q.ref || '';

  return `🏆 *QUIZ BIBLIQUE - QUESTION DU MOMENT*

${q.question}

A. ${q.option_a}
B. ${q.option_b}
C. ${q.option_c}
D. ${q.option_d}

${reference ? `📖 *Référence :* ${reference}\n\n` : ''}👉 *Réponds avec A, B, C ou D*

📲 *Abonne-toi à notre canal WhatsApp* pour recevoir chaque jour les quiz bibliques, versets et paroles d'encouragement :

https://whatsapp.com/channel/0029Vb8Pv2sL7UVMskGv542k

#QuizBiblique #ParoleEtDefi #EDILPA`;
}

function saveFacebookPost() {
  const post = {
    createdAt: new Date().toISOString(),
    status: 'pending',
    text: createFacebookPost()
  };

  let posts = [];

  if (fs.existsSync(POSTS_FILE)) {
    try {
      posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
      if (!Array.isArray(posts)) posts = [];
    } catch {
      posts = [];
    }
  }

  posts.push(post);

  if (posts.length > 100) {
    posts = posts.slice(-100);
  }

  fs.writeFileSync(
    POSTS_FILE,
    JSON.stringify(posts, null, 2),
    'utf8'
  );

  console.log('✅ Publication Facebook préparée.');
  console.log(post.text);

  return post;
}

if (require.main === module) {
  saveFacebookPost();
}

module.exports = {
  getQuestion,
  createFacebookPost,
  saveFacebookPost
};
