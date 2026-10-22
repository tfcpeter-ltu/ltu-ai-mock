// Outbound-only worker. Secrets and model weights must remain outside OneDrive.
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {rubricVersion} from '../shared/rubric.mjs';
export function reportForCloud(data,kind){
 const r=data.review,names=kind==='writing'?['task','coherence','lexical','grammar']:['coherence','lexical','grammar'];
 if(!r||r.version!==rubricVersion||r.criteria?.length!==names.length||data.operatorCriteria?.length!==names.length)throw Error('Invalid local report');
 return {summary:kind==='writing'?'依雅思四項規準產生的本機評閱草稿；分數需通過獨立驗證才會顯示。':'僅依逐字稿分析連貫、字彙與文法；發音及完整流暢度須聆聽原音。',nextSteps:[r.nextStep],criteria:r.criteria.map((c,i)=>({name:names[i],band:data.operatorCriteria[i],comment:c.reason+' '+c.revision,evidence:[{quote:c.evidence,explanation:c.reason}]}))};
}
export async function processOne({token,model,fetchImpl=fetch,signal}={}){
 if(typeof token!=='string'||token.length<32)throw Error('Worker secret required');
 const endpoint='https://dashing-quail-760.convex.site';
 const remote=async(path,body)=>{const res=await fetchImpl(endpoint+path,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),redirect:'error',signal:AbortSignal.any([signal||new AbortController().signal,AbortSignal.timeout(30000)])});if(!res.ok)throw Error('Cloud worker request failed: '+res.status);return res.json();};
 const {job}=await remote('/assessor/pull',{});if(!job)return {state:'idle'};
 let data,error;
 if(job.model!==model||job.rubric!==rubricVersion)error='unsupported-model';
 else try{
  const res=await fetchImpl('http://127.0.0.1:8782/review',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:8782','X-LTU-Assessor':'1'},body:JSON.stringify({skill:job.kind==='writing'?'writing':'speaking',taskType:job.task==='ielts-writing-task1'?'letter':'task2',prompt:job.prompt,response:job.text}),redirect:'error',signal:AbortSignal.any([signal||new AbortController().signal,AbortSignal.timeout(245000)])});
  if(!res.ok){error=res.status===400?'insufficient-evidence':'inference-unavailable';}else{data=await res.json();if(data.review?.model!==model)error='unsupported-model';}
 }catch{error='inference-unavailable';}
 if(error){await remote('/assessor/fail',{jobId:job.jobId,leaseToken:job.leaseToken,error});return {state:'failed',reason:error};}
 let report;try{report=reportForCloud(data,job.kind)}catch{await remote('/assessor/fail',{jobId:job.jobId,leaseToken:job.leaseToken,error:'insufficient-evidence'});return {state:'failed',reason:'insufficient-evidence'};}
 await remote('/assessor/complete',{jobId:job.jobId,leaseToken:job.leaseToken,report});return {state:'complete'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const config=JSON.parse(readFileSync(process.argv[2],'utf8'));const token=readFileSync(config.tokenFile,'utf8').trim(),controller=new AbortController();
 process.on('SIGINT',()=>controller.abort());process.on('SIGTERM',()=>controller.abort());
 console.log('Local outbound assessor worker started. No student text or secrets are logged.');
 while(!controller.signal.aborted){try{const result=await processOne({token,model:config.model,signal:controller.signal});if(result.state!=='idle')console.log(new Date().toISOString()+' '+result.state);}catch{if(!controller.signal.aborted)console.error('Worker temporarily unavailable; retrying after 30 seconds.');}if(process.argv.includes('--once')||controller.signal.aborted)break;await new Promise(resolve=>{const done=()=>{clearTimeout(timer);controller.signal.removeEventListener('abort',done);resolve()},timer=setTimeout(done,30000);controller.signal.addEventListener('abort',done,{once:true})});}
}
