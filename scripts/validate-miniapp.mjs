import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const normalized = html.toLowerCase();
const required = ['01 · master','02 · post','03 · refs','04 · control','mini app authority','render gate','fail-closed','image + video core','/health','/gateway-test'];
const forbidden = ['Coming Soon','TODO','Placeholder','Demo Only'];
const missing = required.filter((value) => !normalized.includes(value.toLowerCase()));
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
