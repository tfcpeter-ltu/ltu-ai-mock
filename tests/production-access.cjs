const assert=require('node:assert/strict');
(async()=>{
 const base='https://dashing-quail-760.convex.cloud';
 for(const [kind,path,args] of [['query','student:getCloudState',{}],['mutation','student:saveCloudState',{stateJson:'{}',expectedUpdatedAt:0}]]){
  const r=await fetch(base+'/api/'+kind,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path,args,format:'json'})});const body=await r.json();
  assert.equal(body.status,'error');assert.equal(body.value,undefined);assert.match(body.errorMessage,/Authentication required|Server Error/);console.log('PASS production rejects anonymous '+path);
 }
 console.log('Production redacts error details; version validation and authenticated ownership are covered by local mutation tests, not this anonymous smoke check.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
