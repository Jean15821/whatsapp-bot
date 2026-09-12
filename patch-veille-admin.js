const fs = require('fs');
const path = './index.js';
let code = fs.readFileSync(path, 'utf8');

const before1 = "if (isSelfChat && upper === '!VEILLE') {";
const after1 = "if (phone === savedPhoneNumber && upper === '!VEILLE') {";
const before2 = "if (isSelfChat && upper === '!VEILLE STATUS') {";
const after2 = "if (phone === savedPhoneNumber && upper === '!VEILLE STATUS') {";

let changed = 0;
if (code.includes(before1)) { code = code.replace(before1, after1); changed++; }
if (code.includes(before2)) { code = code.replace(before2, after2); changed++; }

if (changed === 2) {
  fs.writeFileSync(path, code);
  console.log('✅ 2 conditions corrigées (isSelfChat → phone === savedPhoneNumber)');
} else {
  console.log(`⚠️ ${changed}/2 conditions trouvées et corrigées — vérifie index.js manuellement si <2`);
}
