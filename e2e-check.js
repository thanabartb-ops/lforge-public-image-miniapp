#!/usr/bin/env node
// e2e-check.js
// Run E2E checks against:
// - LLM: POST /lforge-command
// - Runtime: GET /health, POST /approve, POST /render
// Uses validate.js to validate the structured command.

const fs = require('fs').promises;
const path = require('path');
const { validateObject } = require('./validate.js');

const SUPABASE = 'https://gkzyymcxjgpuflnnbocd.supabase.co/functions/v1/lforge-command';
const RUNTIME = 'https://wforge-image-mcp-wxx.thanabartb.workers.dev';

const DEFAULT_BRIEF = 'สร้างภาพ streetwear premium โทนดำ น้ำเงิน และส้ม สำหรับ editorial poster';

function now(){ return new Date().toISOString(); }

async function fetchJson(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch(e) { json = { raw: text }; }
    return { ok: res.ok, status: res.status, statusText: res.statusText, body: json, headers: Object.fromEntries(res.headers.entries()) };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

function shortReport(code){
  if(code >=200 && code < 300) return 'PASS';
  if(code === 401 || code === 403) return 'BLOCKED (auth)';
  if(code === 404) return 'BLOCKED (not found)';
  if(code === 422) return 'FAIL (unprocessable)';
  if(code >=500) return 'BLOCKED (server error)';
  return 'UNKNOWN';
}

async function run(briefText, savePath='e2e-report.json') {
  const report = { startedAt: now(), steps: {}, summary: 'UNKNOWN' };

  // 1) health
  report.steps.health = { startedAt: now(), url: RUNTIME + '/health' };
  const h = await fetchJson(RUNTIME + '/health');
  report.steps.health.endedAt = now();
  report.steps.health.result = h;
  report.steps.health.status = h.ok ? shortReport(h.status) : 'BLOCKED';
  if(!h.ok && h.error) report.steps.health.error = h.error;
  if(!h.ok) {
    report.summary = 'BLOCKED';
    await fs.writeFile(savePath, JSON.stringify(report, null, 2));
    console.log('Health check failed or blocked:', h.error || h.status);
    return report;
  }

  // 2) compile -> lforge-command
  report.steps.compile = { startedAt: now(), url: SUPABASE };
  const payload = {
    user_request: briefText || DEFAULT_BRIEF,
    references: [{ name: 'logo.png', type: 'image', role: 'logo' }],
    identity: '',
    color: '#25A7FF',
    output: 'image',
    background_studio: ''
  };
  const comp = await fetchJson(SUPABASE, { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
  report.steps.compile.endedAt = now();
  report.steps.compile.request = payload;
  report.steps.compile.response = comp;
  if(!comp.ok){
    report.steps.compile.status = comp.status ? shortReport(comp.status) : 'BLOCKED';
    report.summary = 'BLOCKED';
    await fs.writeFile(savePath, JSON.stringify(report, null, 2));
    console.log('LLM compile blocked/failure:', comp.error || comp.status, comp.body);
    return report;
  }

  const structured = comp.body;
  const v = validateObject(structured);
  report.steps.compile.validation = v;
  if(!v.ok){
    report.steps.compile.status = 'FAIL (schema mismatch / missing fields)';
    report.summary = 'FAIL';
    await fs.writeFile(savePath, JSON.stringify(report, null, 2));
    console.log('Validation failed. Missing:', v.missing, 'Problems:', v.problems);
    return report;
  } else {
    report.steps.compile.status = 'PASS';
  }

  const structuredPath = path.resolve('llm-structured-command.json');
  await fs.writeFile(structuredPath, JSON.stringify(structured, null, 2));
  report.steps.compile.structuredPath = structuredPath;

  // 3) approve
  report.steps.approve = { startedAt: now(), url: RUNTIME + '/approve', requestBodyHint: 'approved_command (structured command)' };
  const approvePayload = { approved_command: structured };
  const appr = await fetchJson(RUNTIME + '/approve', { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(approvePayload) });
  report.steps.approve.endedAt = now();
  report.steps.approve.request = approvePayload;
  report.steps.approve.response = appr;
  if(!appr.ok){
    report.steps.approve.status = appr.status ? shortReport(appr.status) : 'BLOCKED';
    report.summary = 'BLOCKED';
    await fs.writeFile(savePath, JSON.stringify(report, null, 2));
    console.log('Approve blocked/failure:', appr.error || appr.status, appr.body);
    return report;
  } else {
    report.steps.approve.status = 'PASS';
  }

  // 4) render
  report.steps.render = { startedAt: now(), url: RUNTIME + '/render', requestBodyHint: 'approved_command (structured command)' };
  const renderPayload = { approved_command: structured };
  const rend = await fetchJson(RUNTIME + '/render', { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(renderPayload) });
  report.steps.render.endedAt = now();
  report.steps.render.request = renderPayload;
  report.steps.render.response = rend;
  if(!rend.ok){
    report.steps.render.status = rend.status ? shortReport(rend.status) : 'BLOCKED';
    report.summary = 'BLOCKED';
    await fs.writeFile(savePath, JSON.stringify(report, null, 2));
    console.log('Render blocked/failure:', rend.error || rend.status, rend.body);
    return report;
  }

  const body = rend.body || {};
  if(body.jobId || body.preview || body.artifact){
    report.steps.render.status = 'PASS';
    report.steps.render.artifact = { jobId: body.jobId, preview: body.preview, artifact: body.artifact };
    report.summary = 'PASS';
  } else {
    report.steps.render.status = 'FAIL (missing jobId/artifact)';
    report.summary = 'FAIL';
  }

  report.endedAt = now();
  await fs.writeFile(savePath, JSON.stringify(report, null, 2));
  console.log('E2E finished. Summary:', report.summary);
  return report;
}

if(require.main === module){
  const briefArgIndex = process.argv.indexOf('--brief');
  const brief = briefArgIndex >= 0 ? process.argv[briefArgIndex + 1] : DEFAULT_BRIEF;
  const outIndex = process.argv.indexOf('--out');
  const out = outIndex >=0 ? process.argv[outIndex + 1] : 'e2e-report.json';
  (async ()=> {
    try{
      const r = await run(brief, out);
      console.log('Report written to', out);
      if(r && r.summary) console.log('Summary:', r.summary);
    }catch(err){
      console.error('E2E runner error:', err);
      process.exit(2);
    }
  })();
}

module.exports = { run };
