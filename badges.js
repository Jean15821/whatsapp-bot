const BADGE_INTERVAL = 1000;

const BADGE_NAMES = [
  "🌱 Graine de la Parole",
  "📖 Chercheur de la Parole",
  "🔥 Passionné de la Parole",
  "🛡️ Défenseur de la Foi",
  "🎯 Maître du Défi",
  "📚 Connaisseur de la Bible",
  "⚡ Puissance de la Parole",
  "🏆 Champion Biblique",
  "👑 Maître de la Parole",
  "💎 Élite Biblique"
];

function getBadgeName(number) {
  if (BADGE_NAMES[number - 1]) {
    return BADGE_NAMES[number - 1];
  }

  return `🏅 Maître de la Parole — Palier ${number}`;
}

function getBadges(xpTotal) {
  const count = Math.floor(Number(xpTotal || 0) / BADGE_INTERVAL);

  return Array.from({ length: count }, (_, i) => ({
    palier: (i + 1) * BADGE_INTERVAL,
    nom: getBadgeName(i + 1)
  }));
}

function getNewBadge(previousXp, currentXp) {
  const oldCount = Math.floor(Number(previousXp || 0) / BADGE_INTERVAL);
  const newCount = Math.floor(Number(currentXp || 0) / BADGE_INTERVAL);

  if (newCount <= oldCount) return null;

  const palier = newCount * BADGE_INTERVAL;

  return {
    palier,
    nom: getBadgeName(newCount)
  };
}

module.exports = {
  BADGE_INTERVAL,
  getBadges,
  getNewBadge
};
