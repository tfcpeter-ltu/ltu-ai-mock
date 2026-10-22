const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let source=fs.readFileSync('frontend/GrammarBridge.js','utf8').replace(/^import .*;\r?\n/gm,'').replace('export function','function');
let listener,checks=0;const replies=[],frame={postMessage:p=>replies.push(p)},origin='https://ltuaimock.uwetw.com';
const box={frame,useEffect:fn=>fn(),useRef:()=>({current:false}),useAction:()=>async()=>{checks++;return{status:'checked'}},useQuery:()=>({configured:true}),anyApi:{grammar:{check:'check',status:'status'}},location:{origin},window:{addEventListener:(_n,fn)=>listener=fn,removeEventListener:()=>{}}};
vm.createContext(box);vm.runInContext(source+';useGrammarBridge({current:{contentWindow:frame}});',box);
const request=(extra={})=>({origin,source:frame,data:{type:'ltu-grammar-request',id:'test',kind:'check',text:'She goes to school.',language:'en-GB'},...extra});
(async()=>{
 await listener(request({origin:'https://attacker.invalid'}));await listener(request({source:{postMessage:()=>{throw Error('Untrusted recipient')}}}));assert.equal(checks,0);assert.equal(replies.length,0);
 await listener(request({data:{type:'ltu-grammar-request',id:'bad',kind:'check',text:'x'.repeat(12001),language:'en-GB'}}));assert.equal(checks,0);assert.ok(replies[0].error);
 await listener(request());assert.equal(checks,1);assert.equal(replies[1].value.status,'checked');
 console.log('PASS grammar bridge rejects other origins and frames, validates payloads, and calls authenticated action only for its own learning frame.');
})().catch(e=>{console.error(e);process.exitCode=1});
