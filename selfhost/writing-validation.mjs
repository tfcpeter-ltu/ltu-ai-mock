// Local evaluation policy. Never treat public/development scripts as independent evidence.
import {createHash} from 'node:crypto';
const sha=value=>createHash('sha256').update(value).digest('hex');
const normal=value=>value.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
export function identifySample(sample){
 if(typeof sample.prompt!=='string'||!sample.prompt.trim()||typeof sample.response!=='string'||!sample.response.trim())throw Error('Missing original task or response');
 return {responseHash:sha(normal(sample.response)),promptHash:sha(normal(sample.prompt))};
}
export function inferenceInput(sample){
 identifySample(sample);
 // Explicit allowlist: reference scores and examiner comments cannot enter target inference.
 return {skill:'writing',taskType:sample.taskType||'task2',prompt:sample.prompt,response:sample.response};
}
export function verifyResearchCorpus(corpus){
 if(!Array.isArray(corpus)||!corpus.length)throw Error('Empty corpus');
 const ids=new Set(),responses=new Set();
 for(const sample of corpus){
  if(!/^[A-Za-z0-9-]+$/.test(sample.id)||sample.taskType!=='task2'||sample.transcriptionVerified!==true||sample.taskVerified!==true||sample.exclusion||sample.referenceConflict)throw Error('Unverified, conflicting or unsupported sample');
  const identity=identifySample(sample);if(ids.has(sample.id)||responses.has(identity.responseHash))throw Error('Duplicate sample');ids.add(sample.id);responses.add(identity.responseHash);
  if(!Number.isFinite(sample.expected)||sample.expected<0||sample.expected>9||sample.expected*2%1!==0)throw Error('Invalid reference');
 }
 return corpus;
}
export function assertNoAnchorLeakage(corpus,anchors){
 verifyResearchCorpus(corpus);verifyResearchCorpus(anchors);
 if(anchors.some(s=>s.split!=='development'))throw Error('Development anchors required');
 const ids=new Set(anchors.map(s=>identifySample(s).responseHash)),tasks=new Set(anchors.map(s=>identifySample(s).promptHash));
 if(corpus.some(s=>s.split!=='validation'||ids.has(identifySample(s).responseHash)||tasks.has(identifySample(s).promptHash)))throw Error('Anchor/validation task or response leakage');
}
export function evaluateWritingRuns(samples,runs,{model,protocol,taskType='task2',minimum=20}={}){
 if(!model||!protocol)throw Error('Pinned model and protocol required');
 if(!['task2','letter','ept'].includes(taskType))throw Error('Unsupported validation task');
 if(!Number.isInteger(minimum)||minimum<20)throw Error('Release minimum cannot be lowered below 20');
 const byId=new Map(),seenResponses=new Set(),promptSplits=new Map();
 for(const sample of samples){
  const hashes=identifySample(sample);
  if(!sample.id||byId.has(sample.id)||seenResponses.has(hashes.responseHash))throw Error('Duplicate sample id or response');
  if(!['development','validation'].includes(sample.split))throw Error('Explicit split required');
  if(!Number.isFinite(sample.expected)||sample.expected<0||sample.expected>9||sample.expected*2%1!==0)throw Error('Invalid reference band');
  const prior=promptSplits.get(hashes.promptHash);
  if(prior&&prior!==sample.split)throw Error('Same task appears in development and validation');
  promptSplits.set(hashes.promptHash,sample.split);seenResponses.add(hashes.responseHash);byId.set(sample.id,{...sample,...hashes});
 }
 const grouped=new Map(),seenRuns=new Set();
 for(const run of runs){
  if(!byId.has(run.id)||run.model!==model||run.protocol!==protocol||!Number.isInteger(run.seed))throw Error('Unknown sample or mismatched inference configuration');
  const runKey=run.id+':'+run.seed;if(seenRuns.has(runKey))throw Error('Duplicate run');seenRuns.add(runKey);
  if(run.predicted!==null&&(!Number.isFinite(run.predicted)||run.predicted<0||run.predicted>9||run.predicted*2%1!==0))throw Error('Invalid prediction');
  if(!grouped.has(run.id))grouped.set(run.id,[]);grouped.get(run.id).push(run);
 }
 const validation=[...byId.values()].filter(s=>s.split==='validation'&&(s.taskType||'task2')===taskType),rows=[];
 for(const sample of validation){
  const attempts=grouped.get(sample.id)||[],completed=attempts.filter(r=>r.predicted!==null);
  const errors=completed.map(r=>r.predicted-sample.expected);
  rows.push({id:sample.id,responseHash:sample.responseHash,promptHash:sample.promptHash,expected:sample.expected,attempted:attempts.length,completed:completed.length,
   // Repeats measure stability, not extra independent essays. Never choose the best seed.
   absoluteError:errors.length?errors.reduce((a,b)=>a+Math.abs(b),0)/errors.length:null,
   bias:errors.length?errors.reduce((a,b)=>a+b,0)/errors.length:null,
   withinHalf:errors.length?errors.filter(e=>Math.abs(e)<=.5).length/errors.length:null,
   withinOne:errors.length?errors.filter(e=>Math.abs(e)<=1).length/errors.length:null,
   maxError:errors.length?Math.max(...errors.map(Math.abs)):null,
   spread:completed.length?Math.max(...completed.map(r=>r.predicted))-Math.min(...completed.map(r=>r.predicted)):null});
 }
 const completedRows=rows.filter(r=>r.completed),mean=key=>completedRows.length?completedRows.reduce((sum,r)=>sum+r[key],0)/completedRows.length:null;
 const reasons=[];
 if(validation.length<minimum)reasons.push('insufficient-unique-validation-samples');
 if(validation.some(s=>s.provenance!=='independently-marked'||s.trainingExposure!=='excluded'))reasons.push('independent-reference-not-established');
 if(validation.some(s=>s.transcriptionVerified!==true||s.taskVerified!==true))reasons.push('original-task-or-transcription-unverified');
 if(rows.some(r=>r.attempted<3||r.completed!==r.attempted))reasons.push('missing-repeats-or-inference-failures');
 if(mean('absoluteError')===null||mean('absoluteError')>.5)reasons.push('mae-exceeds-limit');
 if(mean('withinOne')===null||mean('withinOne')<.95)reasons.push('within-one-below-limit');
 if(rows.some(r=>r.spread>1))reasons.push('unstable-repeat-scoring');
 return {model,protocol,taskType,sampleCount:validation.length,completedSampleCount:completedRows.length,mae:mean('absoluteError'),bias:mean('bias'),withinHalf:mean('withinHalf'),withinOne:mean('withinOne'),maxError:completedRows.length?Math.max(...completedRows.map(r=>r.maxError)):null,passed:reasons.length===0,reasons,rows};
}
