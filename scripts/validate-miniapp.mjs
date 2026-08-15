import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const required = ['01 · MASTER','02 · POST','03 · REFS','04 · CONTROL','Mini App Authority','RENDER GATE','FAIL-CLOSED','Image + Video Core','/health','/gateway-test'];
const forbidden = ['Coming Soon','TODO','Placeholder','Demo Only'];
const missing = required.filter((value) => !html.includes(value));
const forbiddenFound = forbidden.filter((value) => html.includes(value));
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).filter(Boolean);
let scriptError = null;
for (const script of scripts) {
  try { new Function(script); } catch (error) { scriptError = error instanceof Error ? error.message : String(error); break; }
}
if (missing.length || forbiddenFound.length || scriptError) {
  console.error(JSON.stringify({ missing, forbiddenFound, scriptError }, null, 2));
  process.exit(1);
}
console.log('LFORGE Mini App validation: PASS');
