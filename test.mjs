import test from 'node:test';
import assert from 'node:assert/strict';
import {run} from './engine.mjs';
import {sample} from './sample.mjs';
test('domain behavior and boundary cases',()=>{assert.equal(run(sample).metrics.spent,1.6);assert.equal(run(sample).metrics.rejected,1);assert.throws(()=>run({...sample,budget:-1}));});
test('decimal composition accepts 0.1 plus 0.2 without granting an over-budget tolerance',()=>{
 const report=run({budget:0.3,queries:[{id:'one-tenth',epsilon:0.1},{id:'two-tenths',epsilon:0.2},{id:'overrun',epsilon:1e-13}]});
 assert.deepEqual(report.rows.map(row=>row.decision),['accepted','accepted','rejected']);
 assert.equal(report.metrics.spentExact,'0.3');assert.equal(report.metrics.remainingExact,'0');
 assert.equal(report.rows[2].spentBeforeExact,'0.3');assert.equal(report.rows[2].overrunExact,'0.0000000000001');
});
test('small positive epsilon remains visible in exact ledger values',()=>{
 const report=run({budget:2e-13,queries:[{id:'a',epsilon:1e-13},{id:'b',epsilon:1e-13}]});
 assert.equal(report.metrics.spent,2e-13);assert.equal(report.metrics.spentExact,'0.0000000000002');
 assert.equal(report.rows[0].remainingExact,'0.0000000000001');assert.equal(report.rows[1].remainingExact,'0');
});
test('deterministic result and input preservation',()=>{const copy=JSON.stringify(sample);assert.deepEqual(run(sample),run(sample));assert.equal(JSON.stringify(sample),copy);});
test('reject malformed root and oversized input',()=>{assert.throws(()=>run(null));assert.throws(()=>run([]));assert.throws(()=>run({...sample,oversized:'x'.repeat(200001)}));});
