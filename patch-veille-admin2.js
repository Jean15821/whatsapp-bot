const fs = require('fs');
const path = './index.js';
let code = fs.readFileSync(path, 'utf8');
let changed = [];

// 1. Ajoute une constante ADMIN_PHONE fixe, indépendante du pairing
const anchor1 = "const CANALJID = \"120363411968127620@newsletter\";";
const addition1 = "\nconst ADMIN_PHONE = \"50940627737\";";
if (code.includes(anchor1) && !code.includes('ADMIN_PHONE')) {
  code = code.replace(anchor1, anchor1 + addition1);
  changed.push('ADMIN_PHONE ajouté');
}

// 2. Remplace les 2 conditions pour utiliser ADMIN_PHONE au lieu de savedPhoneNumber
const before1 = "if (phone === savedPhoneNumber && upper === '!VEILLE') {";
const after1 = "if (phone === ADMIN_PHONE && upper === '!VEILLE') {";
if (code.includes(before1)) { code = code.replace(before1, after1); changed.push('condition !VEILLE corrigée'); }

const before2 = "if (phone === savedPhoneNumber && upper === '!VEILLE STATUS') {";
const after2 = "if (phone === ADMIN_PHONE && upper === '!VEILLE STATUS') {";
if (code.includes(before2)) { code = code.replace(before2, after2); changed.push('condition !VEILLE STATUS corrigée'); }

fs.writeFileSync(path, code);
console.log(changed.length ? '✅ Appliqué: ' + changed.join(', ') : '⚠️ Rien trouvé à corriger — vérifie index.js manuellement');
