const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let source=fs.readFileSync('frontend/app.js','utf8');source=source.slice(source.indexOf('function StudentCloud()'),source.indexOf(' const status=',source.indexOf('function StudentCloud()')))+' return {pushState,resolveCloud,keepLocal,ready,syncText,conflict,dash:null,session}; }';
const slots=[],effects=[],storage=new Map(),listeners={};let cursor=0,cloud,code='STUDENT-A',writes=0;
function equal(a,b){return a&&b&&a.length===b.length&&a.every((v,i)=>v===b[i])}
const sandbox={console,Date,JSON,encodeURIComponent,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},window:{addEventListener:(n,f)=>listeners[n]=f,removeEventListener:()=>{}},setInterval:()=>1,clearInterval:()=>{},setTimeout:()=>1,clearTimeout:()=>{},anyApi:{student:{ensureProfile:'ensure',saveCloudState:'save',me:'me',getCloudState:'cloud'}},
useAuthActions:()=>({signOut:async()=>{}}),useQuery:n=>n==='me'?{profile:{studentCode:code}}:cloud,
useMutation:n=>n==='ensure'?async()=>{}:async a=>{writes++;return {updatedAt:200,conflict:false}},
useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v]},
useMemo(fn,deps){const i=cursor++;if(!equal(slots[i]?.deps,deps))slots[i]={deps,value:fn()};return slots[i].value},
useEffect(fn,deps){const i=cursor++;if(!equal(slots[i]?.deps,deps)){slots[i]={deps};effects.push(fn)}}};
vm.createContext(sandbox);vm.runInContext(source+';globalThis.render=StudentCloud',sandbox);
function render(){cursor=0;const r=sandbox.render();while(effects.length)effects.shift()();return r}
(async()=>{
 render();assert.equal(writes,0); // no iframe or write before cloud read completes
 cloud=null;render();let r=render();assert.equal(r.ready,true);assert.equal(writes,0);
 storage.set('ltuEPT:STUDENT-A','{"answers":{"essay":"local"}}');await r.pushState();assert.equal(writes,1);
 await r.pushState();assert.equal(writes,1); // unchanged data stays free of repeat writes
 storage.set('ltuEPT:STUDENT-A','{"answers":{"essay":"unsynced"}}');
 cloud={stateJson:'{"answers":{"essay":"other device"}}',updatedAt:300};render();r=render();assert.equal(r.conflict,true);
 await r.pushState();assert.equal(writes,1);assert.match(storage.get('ltuEPT:STUDENT-A'),/unsynced/);
 r.resolveCloud();assert.match(storage.get('ltuEPT:STUDENT-A'),/other device/);assert.ok([...storage.keys()].some(k=>k.includes('conflictBackup:')));
 // Another account never receives the first account's namespace or baseline.
 code='STUDENT-B';cloud=null;render();r=render();assert.equal(r.session.base,null);await r.pushState();assert.equal(writes,1);
 console.log('PASS: client initialization, canonical account namespace, unchanged write suppression, remote conflict preservation and account isolation.');
})().catch(e=>{console.error(e);process.exitCode=1});
