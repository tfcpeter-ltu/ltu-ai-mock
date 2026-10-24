// Export numeric research results only. Never copy essays, prompts, raw output or secrets.
import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
const [directory,destination]=process.argv.slice(2);if(!directory||!destination)throw Error('Supply private experiment directory and numeric report destination');
const groups=new Map();
for(const name of readdirSync(directory).filter(n=>/^writing-experiment.*\.json$/.test(n))){
 const report=JSON.parse(readFileSync(directory+'/'+name,'utf8'));
 for(const row of report.rows||[]){
  if(typeof row.id!=='string'||!Number.isFinite(row.expected))throw Error('Invalid experiment row');
  const groupKey=JSON.stringify([report.model,row.strategy,row.id]);
  if(!groups.has(groupKey))groups.set(groupKey,{model:report.model,strategy:row.strategy,id:row.id,expected:row.expected,runs:[]});
  const group=groups.get(groupKey),seed=row.seed??report.seed??42;
  // Old and newer filenames may represent the same run; never count them twice.
  if(group.runs.some(r=>r.seed===seed))continue;
  const predicted=Number.isFinite(row.predicted)?row.predicted:null;
  group.runs.push({seed,predicted,criteria:Array.isArray(row.criteria)&&row.criteria.length===4?row.criteria.map(Number):null,seconds:Number.isFinite(row.seconds)?row.seconds:null,status:predicted===null?'failed':'completed'});
 }
}
const rows=[...groups.values()].sort((a,b)=>a.model.localeCompare(b.model)||a.strategy.localeCompare(b.strategy)||a.id.localeCompare(b.id));
const methods=new Map();for(const row of rows){const key=row.model+'|'+row.strategy;if(!methods.has(key))methods.set(key,{model:row.model,strategy:row.strategy,samples:[]});methods.get(key).samples.push(row);}
const comparisons=[...methods.values()].map(method=>{
 const complete=method.samples.filter(s=>s.runs.some(r=>r.predicted!==null));
 const errors=complete.map(s=>{const scored=s.runs.filter(r=>r.predicted!==null);return scored.reduce((sum,r)=>sum+Math.abs(r.predicted-s.expected),0)/scored.length;});
 return {model:method.model,strategy:method.strategy,uniqueScripts:method.samples.length,attempted:method.samples.reduce((n,s)=>n+s.runs.length,0),completedScripts:complete.length,mae:errors.length?errors.reduce((a,b)=>a+b,0)/errors.length:null,maxError:complete.length?Math.max(...complete.flatMap(s=>s.runs.filter(r=>r.predicted!==null).map(r=>Math.abs(r.predicted-s.expected)))):null,maxRepeatSpread:complete.length?Math.max(...complete.map(s=>{const predictions=s.runs.filter(r=>r.predicted!==null).map(r=>r.predicted);return Math.max(...predictions)-Math.min(...predictions)})):null};
});
const output={testedAt:new Date().toISOString(),independent:false,calibrationPassed:false,paidInferenceApiCalls:0,note:'Research only. Two typed health scripts and three provisionally transcribed scanned scripts; not 20 independent validated scripts. Repeats do not add essays. Methods have different sample sets, so their aggregate metrics are not a fair model ranking. No criterion-level reference scores are available. Interrupted unlimited thinking trial is recorded separately.',sources:['https://ielts.org/cdn/computer-delivered-sample-tests-academic-writing/ielts-academic-writing-example-responses-to-parts-1-and-2-with-band-scores-and-examiner-comments.pdf','https://ielts.org/cdn/Sample-tests/ielts-academic-writing-sample-tasks-2023.pdf'],comparisons,rows};
writeFileSync(destination,JSON.stringify(output,null,2));console.log(JSON.stringify(comparisons));
