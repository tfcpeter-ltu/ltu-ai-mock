const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={window:{}};vm.createContext(box);vm.runInContext(fs.readFileSync('assets/writing-local.js','utf8'),box);
const W=box.window.LTUWriting,essay='Public transport can reduce traffic.\n\nFor example, reliable buses help workers travel.\n\nCities should improve bus services.';
assert.equal(W.inspect(essay).band,null);
const raw={criteria:Array.from({length:4},()=>({band:6,evidence:'Public transport',reason:'Addresses transport but needs development'})),nextStep:'Develop a concrete example.'};
assert.equal(W.validate(JSON.stringify(raw),essay).band,null);
assert.throws(()=>W.validate(JSON.stringify({...raw,criteria:raw.criteria.slice(0,3)}),essay));
assert.throws(()=>W.validate(JSON.stringify({...raw,criteria:raw.criteria.map(c=>({...c,band:6.5}))}),essay));
assert.throws(()=>W.validate(JSON.stringify({...raw,criteria:raw.criteria.map(c=>({...c,evidence:'Invented quotation'}))}),essay));
assert.throws(()=>W.validate(JSON.stringify({...raw,nextStep:''}),essay));
vm.runInContext(fs.readFileSync('assets/assessment.js','utf8'),box);
const review=W.validate(JSON.stringify(raw),essay);
assert.equal(box.window.LTUAssessment.writing(essay,review).taskBand,null);
assert.equal(box.window.LTUAssessment.writing(essay,review).status,'uncalibrated_draft');
assert.throws(()=>W.validate(JSON.stringify({...raw,nextStep:'one personalised revision task'}),essay));
assert.equal(box.window.LTUAssessment.writing(essay+' changed',review).taskBand,null);
assert.equal(box.window.LTUAssessment.writing(essay,W.inspect(essay)).taskBand,null);
// Exercise the actual backend mutation with an authenticated per-user indexed store.
async function backend(){
 const esbuild=require('../frontend/node_modules/esbuild');
 let source=fs.readFileSync('convex/student.ts','utf8').replace(/^import .*;\r?\n/gm,'').replace(/export const /g,'const ');
 source+='\nglobalThis.handlers={saveCloudState,getCloudState};';
 const validators=new Proxy({}, {get:()=>()=>({})});
 const sandbox={getAuthUserId:async c=>c.user,mutation:x=>x,query:x=>x,v:validators};vm.createContext(sandbox);
 vm.runInContext(esbuild.transformSync(source,{loader:'ts',format:'cjs'}).code,sandbox);
 const rows=new Map();let next=0;
 function ctx(user){return {user,db:{query(){let uid;return {withIndex(_name,cb){cb({eq(_k,v){uid=v;return this}});return this},unique:async()=>[...rows.values()].find(r=>r.userId===uid)||null}},insert:async(_t,r)=>{const id='cloud'+(++next);rows.set(id,{...r,_id:id});return id},patch:async(id,p)=>rows.set(id,{...rows.get(id),...p})}}}
 const save=sandbox.handlers.saveCloudState.handler,get=sandbox.handlers.getCloudState.handler;
 await assert.rejects(save(ctx(null),{stateJson:'{}',expectedUpdatedAt:0}),/Authentication/);
 const a=await save(ctx('a'),{stateJson:'{"answers":{"one":1}}',expectedUpdatedAt:0});
 assert.equal(await get(ctx('b')),null);
 const identical=await save(ctx('a'),{stateJson:'{"answers":{"one":1}}',expectedUpdatedAt:a.updatedAt});assert.equal(identical.updatedAt,a.updatedAt);
 const b=await save(ctx('a'),{stateJson:'{"answers":{"two":2}}',expectedUpdatedAt:a.updatedAt});assert.ok(b.updatedAt>a.updatedAt);
 const stale=await save(ctx('a'),{stateJson:'{"answers":{"lost":3}}',expectedUpdatedAt:a.updatedAt});assert.equal(stale.conflict,true);
 assert.match((await get(ctx('a'))).stateJson,/two/);
 await assert.rejects(save(ctx('a'),{stateJson:'[]',expectedUpdatedAt:b.updatedAt}),/Invalid/);
 await assert.rejects(save(ctx('a'),{stateJson:'x'.repeat(900001)}),/large/);
 console.log('PASS: local scoring evidence, stale review rejection, auth isolation, unchanged-save deduplication, conflict prevention, payload validation.');
}
backend().catch(e=>{console.error(e);process.exitCode=1});
