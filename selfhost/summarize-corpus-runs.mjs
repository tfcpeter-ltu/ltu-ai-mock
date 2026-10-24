// Numeric export only; never export raw model output, essays or target prompts.
import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
export function summarizeCorpusRuns(reports){
 const groups=new Map();
 for(const report of reports){
  if(!report.complete||!Array.isArray(report.rows)||!report.protocol||!report.corpusHash)continue;
  const key=report.protocol+':'+report.corpusHash;
  if(!groups.has(key))groups.set(key,{model:report.model,protocol:report.protocol,corpusHash:report.corpusHash,strategy:report.strategy,samples:new Map()});
  const group=groups.get(key);
  for(const row of report.rows){
   if(!Number.isFinite(row.expected)||!['completed','failed'].includes(row.status))throw Error('Invalid result');
   if(!group.samples.has(row.id))group.samples.set(row.id,{id:row.id,source:row.source,pages:row.pages,split:row.split,responseHash:row.responseHash,promptHash:row.promptHash,expected:row.expected,runs:[]});
   const sample=group.samples.get(row.id);
   if(sample.expected!==row.expected||sample.responseHash!==row.responseHash)throw Error('Inconsistent reference or transcript');
   if(sample.runs.some(run=>run.seed===report.seed))throw Error('Duplicate seed');
   sample.runs.push({seed:report.seed,status:row.status,predicted:row.status==='completed'&&Number.isFinite(row.predicted)?row.predicted:null,criteria:row.criteria,seconds:row.seconds});
  }
 }
 const methods=[...groups.values()].map(({samples,...method})=>{
  const rows=[...samples.values()],scored=rows.filter(s=>s.runs.some(r=>r.predicted!==null));
  const perEssay=(s,fn)=>{const valid=s.runs.filter(r=>r.predicted!==null);return valid.reduce((sum,r)=>sum+fn(r.predicted-s.expected),0)/valid.length;};
  const mean=fn=>scored.length?scored.reduce((sum,s)=>sum+perEssay(s,fn),0)/scored.length:null;
  const repeated=scored.filter(s=>s.runs.filter(r=>r.predicted!==null).length>1);
  return {...method,uniqueScripts:rows.length,attempts:rows.reduce((sum,s)=>sum+s.runs.length,0),minRunsPerScript:rows.length?Math.min(...rows.map(s=>s.runs.length)):0,failed:rows.reduce((sum,s)=>sum+s.runs.filter(r=>r.predicted===null).length,0),mae:mean(Math.abs),bias:mean(e=>e),withinOne:mean(e=>Math.abs(e)<=1?1:0),maxError:scored.length?Math.max(...scored.flatMap(s=>s.runs.filter(r=>r.predicted!==null).map(r=>Math.abs(r.predicted-s.expected)))):null,maxRepeatSpread:repeated.length?Math.max(...repeated.map(s=>{const p=s.runs.filter(r=>r.predicted!==null).map(r=>r.predicted);return Math.max(...p)-Math.min(...p)})):null,rows};
 });
 return {testedAt:new Date().toISOString(),independent:false,calibrationPassed:false,paidInferenceApiCalls:0,note:'Public official research samples; same-assistant visual transcription review, not independent human double marking. Development and new-topic cohorts are reported separately by corpus hash. Repeats do not add essays. This report cannot authorize production scores.',methods};
}
if(process.argv[1]&&import.meta.url===(await import('node:url')).pathToFileURL(process.argv[1]).href){
 const [directory,destination]=process.argv.slice(2);if(!directory||!destination)throw Error('Supply private run directory and numeric report destination');
 const reports=readdirSync(directory).filter(name=>/^(score-only|criterion-evidence|official-anchors)-[a-f0-9]{12}-\d+\.json$/.test(name)).map(name=>JSON.parse(readFileSync(directory+'/'+name,'utf8')));
 const summary=summarizeCorpusRuns(reports);writeFileSync(destination,JSON.stringify(summary,null,2));console.log(JSON.stringify(summary.methods.map(({rows,...method})=>method)));
}
