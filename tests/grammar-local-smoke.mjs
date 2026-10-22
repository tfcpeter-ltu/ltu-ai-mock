import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
const root=process.argv[2];if(!root)throw Error('Pass the local runtime directory; token is read privately.');
const token=readFileSync(join(root,'gateway-token.txt'),'utf8').trim();
const response=await fetch('http://127.0.0.1:8781/v1/check',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({text:'She go to school every days. This are a test.',language:'en-GB'})});
assert.equal(response.status,200);const result=await response.json();assert.equal(result.engine,'LanguageTool-selfhost');assert.equal(result.band,null);assert.ok(result.matches.length>0);
console.log(JSON.stringify({status:'passed',engine:result.engine,version:result.engineVersion,syntheticIssues:result.matches.map(m=>({rule:m.ruleId,category:m.category})),band:result.band,remoteStudentConnectivity:'not_verified'}));
