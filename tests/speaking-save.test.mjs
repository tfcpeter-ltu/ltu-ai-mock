import assert from 'node:assert/strict';
import {open} from '../assets/speaking-lab.mjs';
class Element {
 constructor(){this.value='';this.children=[];this.isConnected=true;this.classList={contains:()=>true};}
 append(...items){this.children.push(...items)}
 replaceChildren(...items){this.children=items}
 closest(){return this}
}
globalThis.document={body:new Element(),createElement:()=>new Element()};
globalThis.MutationObserver=class{observe(){}disconnect(){}};
async function setup(reviewText){
 const elements=new Map(),host=new Element();host.querySelector=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)};
 const state={speakingHistory:[]},snapshots=[];
 await open({set:{part1:'Do you celebrate birthdays?',part2:'Describe a book.',part3:'Discuss libraries.'},index:0,namespace:'student-a',host,state,save:()=>snapshots.push(structuredClone(state)),escapeHtml:x=>x,reviewText});
 host.querySelector('#speakingPart').value='1';host.querySelector('#speakingTranscript').value='I celebrate with my family because we enjoy sharing a meal.';
 return {host,state,snapshots};
}
const failed=await setup(async()=>{throw Error('Model failed')});
await failed.host.querySelector('#speakingReview').onclick();
assert.equal(failed.state.speakingHistory.length,1);assert.equal(failed.snapshots.length,1);
assert.match(failed.state.speakingHistory[0].answer,/family/);assert.equal(failed.state.speakingHistory[0].feedback.status,'pending-audio-review');
assert.match(failed.host.querySelector('#speakingStatus').textContent,/作答已保存/);
let finish,entered;const started=new Promise(resolve=>entered=resolve);
const stale=await setup(()=>{entered();return new Promise(resolve=>finish=resolve)});
const pending=stale.host.querySelector('#speakingReview').onclick();await started;
stale.host.querySelector('#speakingTranscript').value='This is a newer answer which has not been reviewed.';
stale.host.querySelector('#speakingTranscript').oninput();finish({criteria:[],nextStep:'obsolete feedback'});await pending;
assert.equal(stale.snapshots.length,1);assert.equal(stale.state.speakingHistory[0].feedback.status,'pending-audio-review');
assert.ok(!JSON.stringify(stale.state).includes('obsolete feedback'));
console.log('PASS: speaking answer is saved before inference; model failure preserves the answer; superseded feedback never overwrites the saved attempt.');
