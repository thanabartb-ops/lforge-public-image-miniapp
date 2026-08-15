#!/usr/bin/env node
// validate.js
// Validate a Structured Command JSON against the LFORGE contract required fields.

const fs = require('fs');

const requiredFields = [
  'intent',
  'subject',
  'identity',
  'references',
  'composition',
  'environment',
  'visual_style',
  'color',
  'lighting',
  'typography',
  'materials',
  'camera',
  'motion',
  'negative_constraints',
  'output_format',
  'quality_requirements',
  'command_text'
];

function validateObject(obj){
  const missing = [];
  const problems = [];
  for(const f of requiredFields){
    if(!(f in obj)){
      missing.push(f);
    } else {
      const v = obj[f];
      if(v === null || v === undefined || (typeof v === 'string' && v.trim() === '')){
        // allow empty arrays/objects for some fields? treat empty string as missing
        // For references we expect an array
        if(f === 'references'){
          if(!Array.isArray(v) || v.length === 0) problems.push(`${f} should be a non-empty array`);
        } else {
          // for most fields, empty string is considered missing
          if(typeof v === 'string' && v.trim() === '') missing.push(f);
        }
      } else {
        // type checks
        if(f === 'references' && !Array.isArray(v)) problems.push(`${f} must be an array`);
      }
    }
  }
  return { ok: missing.length === 0 && problems.length === 0, missing, problems };
}

if(require.main === module){
  const arg = process.argv[2];
  if(!arg){
    console.error('Usage: node validate.js <path-to-structured-command.json>');
    process.exit(2);
  }
  try{
    const raw = fs.readFileSync(arg,'utf8');
    const obj = JSON.parse(raw);
    const res = validateObject(obj);
    if(res.ok){
      console.log('OK: Structured Command contains all required fields');
      process.exit(0);
    } else {
      console.error('MISSING or INVALID fields detected');
      if(res.missing.length) console.error('Missing fields:', res.missing.join(', '));
      if(res.problems.length) console.error('Problems:', res.problems.join('; '));
      process.exit(3);
    }
  }catch(err){
    console.error('Failed to read/parse file:', err.message || err);
    process.exit(2);
  }
}

module.exports = { validateObject, requiredFields };
