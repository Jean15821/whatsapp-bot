const axios = require('axios');
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const SOURCES = require('./veille-sources');
const SEEN_FILE = path.join(__dirname, 'veille_seen.json');
const PENDING_FILE = path.join(__dirname, 'veille_pending.json');
const MAX_SEEN = 500;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
};

const URGENT_KEYWORDS = ['tué', 'tués', 'assassiné', 'martyr', 'exécuté', 'attentat', 'massacre',
  'arrêté', 'arrestation', 'emprisonné', 'interdiction totale', 'expulsé', 'guerre', 'persécution grave'];
const IMPORTANT_KEYWORDS = ['nouvelle traduction', 'découverte archéolog', 'sommet chrétien',
  'persécution', 'liberté religieuse', 'intelligence artificielle', 'ia générative',
  'whatsapp channels', 'whatsapp business', 'nouvelle fonctionnalité whatsapp', 'meta annonce'];
const USEFUL_KEYWORDS = ['bible', 'église', 'évangél', 'mission', 'whatsapp', 'ia', 'ai ',
  'intelligence artificielle', 'outil', 'application'];

const parser = new Parser({ requestOptions: { headers: HEADERS } });

function loadJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function classify(text) {
  const t = text.toLowerCase();
  if (URGENT_KEYWORDS.some(k => t.includes(k))) return 'URGENT';
  if (IMPORTANT_KEYWORDS.some(k => t.includes(k))) return 'IMPORTANT';
  if (USEFUL_KEYWORDS.some(k => t.includes(k))) return 'UTILE';
  return 'IGNORER';
}

const EMOJI = { URGENT: '🔴', IMPORTANT: '🟠', UTILE: '🟢' };

function formatMessage(item) {
  return `📰 *VEILLE — PAROLE & DÉFI*\n\n${EMOJI[item.level]} *${item.title}*\n\n` +
    `Que s'est-il passé ?\n${item.summary}\n\n` +
    `Source : ${item.source}\n🔗 ${item.link}`;
}

let lastRun = null;
let lastError = null;

async function scanFeeds() {
  const seen = loadJSON(SEEN_FILE, []);
  const pending = loadJSON(PENDING_FILE, []);
  const newUrgent = [];
  let errors = [];

  for (const src of SOURCES) {
    try {
      const res = await axios.get(src.url, { timeout: 10000, headers: HEADERS });
      const feed = await parser.parseString(res.data);
      for (const entry of (feed.items || []).slice(0, 10)) {
        const id = entry.guid || entry.link;
        if (!id || seen.includes(id)) continue;
        const text = `${entry.title || ''} ${entry.contentSnippet || ''}`;
        const level = classify(text);
        if (level === 'IGNORER') { seen.push(id); continue; }

        const item = {
          id, level,
          title: entry.title,
          summary: (entry.contentSnippet || '').slice(0, 280),
          source: src.name,
          link: entry.link
        };

        seen.push(id);
        if (level === 'URGENT') newUrgent.push(item);
        else pending.push(item);
      }
    } catch (err) {
      errors.push(`${src.name}: ${err.message}`);
    }
  }

  while (seen.length > MAX_SEEN) seen.shift();
  saveJSON(SEEN_FILE, seen);
  saveJSON(PENDING_FILE, pending);
  lastRun = new Date();
  lastError = errors.length ? errors.join(' | ') : null;

  return { newUrgent, pendingCount: pending.length, errors };
}

async function runScan(sock, channelJid) {
  const { newUrgent, errors } = await scanFeeds();
  for (const item of newUrgent) {
    try {
      await sock.sendMessage(channelJid, { text: formatMessage(item) });
      console.log(`✅ Alerte URGENT publiée: ${item.title}`);
    } catch (err) {
      console.error('❌ Échec envoi alerte veille:', err.message);
    }
  }
  if (errors.length) console.error('⚠️ Erreurs veille:', errors.join(' | '));
  return newUrgent.length;
}

async function runDailySummary(sock, channelJid) {
  const pending = loadJSON(PENDING_FILE, []);
  if (!pending.length) return 0;
  for (const item of pending) {
    try {
      await sock.sendMessage(channelJid, { text: formatMessage(item) });
    } catch (err) {
      console.error('❌ Échec envoi résumé veille:', err.message);
    }
  }
  saveJSON(PENDING_FILE, []);
  return pending.length;
}

function getStatus() {
  return `📊 *Statut veille*\n\n` +
    `Dernière analyse : ${lastRun ? lastRun.toLocaleString('fr-FR') : 'jamais'}\n` +
    `Sources : ${SOURCES.length}\n` +
    `Erreurs récentes : ${lastError || 'aucune'}`;
}

module.exports = { runScan, runDailySummary, scanFeeds, getStatus };
