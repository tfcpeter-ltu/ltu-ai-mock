const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const sandbox={window:{}};
vm.createContext(sandbox);
for(const file of ['assets/assessment.js','assets/ai-reference-keys.js'])vm.runInContext(fs.readFileSync(file,'utf8'),sandbox);
const {LTUAssessment:A,LTU_AI_KEYS:keys}=sandbox.window;
let count=0;
for(const [mid,data] of Object.entries(keys)){
 assert.equal(Object.keys(data.reading.records).length,40);
 for(const [skill,set] of Object.entries(data))for(const [n,r] of Object.entries(set.records)){
  count++;
  assert.equal(r.q,Number(n));assert.ok(r.evidence.trim());
  if(!r.acceptedAnswers.length){assert.equal(mid,'mock-22');assert.equal(skill,'reading');assert.equal(n,'34');}
  assert.equal(r.official,false);assert.ok(['high','medium'].includes(r.confidence));
  if(skill==='listening'){assert.ok(fs.existsSync(r.audioSrc));assert.ok(r.audioStart>=0&&r.audioEnd>r.audioStart);}
  for(const accepted of r.acceptedAnswers){
   assert.ok(['correct','review'].includes(A.grade(accepted,r)),`${mid} ${skill} ${n}: ${accepted}`);
  }
 }
}
assert.equal(count,2295);
assert.equal(A.objective({},keys['mock-22'].reading,true).covered,39);
assert.equal(A.bandReference(A.objective({},keys['mock-22'].reading,true),'reading'),null);
assert.equal(keys['mock-18'].listening.records['16'],undefined);
assert.equal(keys['mock-27'].listening.records['27'],undefined);
assert.equal(keys['mock-28'].listening.records['25'],undefined);
for(const mid of ['mock-18','mock-27','mock-28']){
 const set=keys[mid].listening, report=A.objective({},set,true);
 assert.equal(A.bandReference(report,'listening'),null);
 assert.equal(Object.keys(set.records).length+Object.keys(set.unavailable).length,40);
}
// Shared table prompts must retain question-specific answers.
assert.notDeepEqual(keys['mock-16'].listening.records['1'].acceptedAnswers,keys['mock-16'].listening.records['3'].acceptedAnswers);
// Reversed multi-select order gets full credit; duplicated choices do not.
let result=A.objective({12:'E',13:'D',14:'B'},keys['mock-19'].reading,true);
assert.equal(result.rows.slice(11,14).filter(r=>r.status==='correct').length,3);
result=A.objective({12:'B',13:'B',14:'B'},keys['mock-19'].reading,true);
assert.equal(result.rows.slice(11,14).filter(r=>r.status==='correct').length,1);
result=A.objective({25:'respect',26:'communication',27:'influence'},keys['mock-17'].listening,true);
assert.equal(result.rows.slice(24,27).filter(r=>r.status==='correct').length,3);
result=A.objective({25:'communication',26:'effective communication',27:'respect'},keys['mock-17'].listening,true);
assert.equal(result.rows.slice(24,27).filter(r=>r.status==='correct').length,2);
const record={evidence:'source',acceptedAnswers:['word','two words','10 words','10 11'],confidence:'high',type:'Completion',instruction:'ONE WORD ONLY'};
assert.equal(A.grade('word',record),'correct');assert.equal(A.grade('two words',record),'review');
assert.equal(A.grade('another',record),'review');assert.equal(A.grade('',record),'unanswered');
assert.equal(A.grade('10 11',{...record,instruction:'NO MORE THAN ONE WORD AND/OR A NUMBER'}),'review');
assert.equal(A.grade('10 words',{...record,instruction:'NO MORE THAN ONE WORD AND/OR A NUMBER'}),'correct');
assert.equal(A.grade('10 words',{...record,instruction:'NO MORE THAN ONE WORD OR A NUMBER'}),'review');
assert.equal(A.grade('A',{...record,acceptedAnswers:['B'],type:'Multiple choice'}),'incorrect');
assert.equal(A.grade('word',{...record,confidence:'medium'}),'review');
assert.equal(A.grade('anything',null),'unverified');
assert.equal(A.writing('A long essay '.repeat(100),null).taskBand,null);
assert.equal(A.objective({},keys['mock-29'].reading,false).status,'not_submitted');
for(const mid of ['mock-19','mock-26','mock-27','mock-28'])for(const q of ['2','3'])assert.ok(!/^\d+ below/.test(keys[mid].reading.records[q].questionPrompt));
console.log(`PASS: ${count} evidence-backed records; unordered groups, duplicate prevention, limits, gaps and honest scoring.`);
