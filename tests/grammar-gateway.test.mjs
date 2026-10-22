import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createGateway} from '../selfhost/gateway.mjs';
import {normalizeGrammar} from '../shared/grammar.mjs';
const token='synthetic-test-token-not-used-in-production-123456789';
const raw={software:{version:'test'},matches:[{offset:0,length:3,message:'Use a plural verb.',rule:{id:'TEST',category:{id:'GRAMMAR'},issueType:'grammar'},replacements:[{value:'These'}]}]};
let calls=0;
const server=createGateway({token,fetchImpl:async()=>{calls++;return new Response(JSON.stringify(raw),{headers:{'Content-Type':'application/json'}})}});
server.listen(0,'127.0.0.1');await once(server,'listening');const base='http://127.0.0.1:'+server.address().port;
const send=(body,auth=token)=>fetch(base+'/v1/check',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+auth},body:JSON.stringify(body)});
try{
 assert.equal((await send({text:'She go to school.',language:'en-GB'},'wrong')).status,401);assert.equal(calls,0);
 assert.equal((await send({text:'x'.repeat(12001),language:'en-GB'})).status,400);
 assert.equal((await send({text:'Test text.',language:'auto'})).status,400);assert.equal(calls,0);
 const response=await send({text:'She go to school.',language:'en-GB'}),result=await response.json();assert.equal(response.status,200);assert.equal(result.matches[0].ruleId,'TEST');assert.equal(result.band,null);assert.equal(calls,1);
 assert.equal(normalizeGrammar({matches:[{offset:100,length:1,message:'invalid'}]},'short','en-US').matches.length,0);
 assert.equal(normalizeGrammar({matches:Array.from({length:70},()=>raw.matches[0])},'She go.','en-GB').matches.length,60);
 assert.equal(normalizeGrammar({matches:Array.from({length:70},()=>raw.matches[0])},'She go.','en-GB').truncated,true);
 assert.throws(()=>createGateway({token,engineUrl:'https://api.languagetool.org/v2/check'}),/local/);
 console.log('PASS gateway auth, local-only upstream, language and length limits, response sanitization, and no Band conversion.');
}finally{server.close();server.closeAllConnections();}
