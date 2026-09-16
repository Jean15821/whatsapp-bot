import re

path = "index.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Ajouter traiterVoteSondage à l'import existant
old_import = """const {
  publierQuizCanal,
  chargerQuizActuel,
  construireRevelation
} = require("./quiz-poll-canal");"""

new_import = """const {
  publierQuizCanal,
  chargerQuizActuel,
  construireRevelation,
  traiterVoteSondage
} = require("./quiz-poll-canal");"""

assert content.count(old_import) == 1, "Import non trouvé ou trouvé plusieurs fois — arrêt sans modification."
content = content.replace(old_import, new_import)

# 2. Réinsérer le bloc de traitement du vote (avec resultat.voterJid pour le DM)
old_anchor = """      const msg = messages[0]
      if (!msg.message) return

      const from = msg.key.remoteJid"""

vote_block = """      const msg = messages[0]
      if (!msg.message) return

      // === VOTE NATIF DU QUIZ DANS LE CANAL ===
      if (msg.message.pollUpdateMessage) {
        try {
          const resultat = await traiterVoteSondage(msg)

          if (resultat?.valide) {
            const poll = resultat.poll
            const choix = resultat.lettre

            console.log(
              `🗳️ VOTE CANAL : ${resultat.voterJid} | ` +
              `question ${poll.numero} | choix ${choix} | ` +
              `correct=${resultat.bonne}`
            )

            const message = resultat.bonne
              ? `✅ *BONNE RÉPONSE !*

🎉 Bravo !
🧠 Réponse : *${choix}. ${poll.options[choix]}*

📖 *Explication :*
${poll.explication || 'Continue à étudier la Parole de Dieu.'}

🏆 *Parole & Défi | EDILPA*`
              : `❌ *MAUVAISE RÉPONSE*

🧠 Ta réponse : *${choix}. ${poll.options[choix]}*
✅ La bonne réponse était : *${poll.bonne}. ${poll.options[poll.bonne]}*

📖 *Explication :*
${poll.explication || 'Continue à étudier la Parole de Dieu.'}

🏆 *Parole & Défi | EDILPA*`

            await sock.sendMessage(resultat.voterJid, {
              text: message
            })
          }

          return
        } catch (err) {
          console.error(
            '❌ Erreur traitement vote natif :',
            err.message
          )
          return
        }
      }

      const from = msg.key.remoteJid"""

assert content.count(old_anchor) == 1, "Point d'ancrage non trouvé ou trouvé plusieurs fois — arrêt sans modification."
content = content.replace(old_anchor, vote_block)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("✅ Patch appliqué avec succès.")
