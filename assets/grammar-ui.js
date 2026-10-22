(function(){
 const pending=new Map();
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=='ltu-grammar-response')return;
  const request=pending.get(event.data.id);if(!request)return;
  clearTimeout(request.timer);pending.delete(event.data.id);
  event.data.error?request.reject(Error(event.data.error)):request.resolve(event.data.value);
 });
 function request(kind,text,language){
  if(window.parent===window)return Promise.reject(Error('請從正式網站登入後使用文法檢查；獨立預覽不會連到公共 API。'));
  return new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('文法檢查連線逾時；作文已保留。'));},35000);pending.set(id,{resolve,reject,timer});window.parent.postMessage({type:'ltu-grammar-request',id,kind,text,language},location.origin);});
 }
 window.renderGrammarPanel=function(){
  const m=current.mock,essay=state.answers[key(m.id,'writing')]?.essay||'',r=state.grammarReviews?.[m.id],valid=r?.reviewedEssay===essay;
  const matches=valid?r.result.matches:[];
  return '<section class="notice" style="margin-top:16px"><h4>免費文法檢查（LanguageTool 自架）</h4><p>檢查拼寫、文法與標點，不使用付費 AI API，也不把錯誤數換成雅思 Band。主機尚未連線時，仍可使用上方免費寫作檢查。</p><label>檢查語系 <select id="grammarLanguage"><option value="en-GB">英式英文</option><option value="en-US">美式英文</option></select></label> <button class="btn outline" onclick="checkWritingGrammar(this)">檢查這篇作文</button><div id="grammarProgress" role="status"></div>'+
  (r&&!valid?'<p>作文已更動，舊文法報告不套用到新版，請重新檢查。</p>':'')+
  (valid?'<p>LanguageTool '+escapeHtml(r.result.engineVersion)+' · '+escapeHtml(r.result.language)+' · 偵測到 '+matches.length+' 項建議'+(r.result.truncated?'（僅顯示前 60 項）':'')+'；建議可能有誤，請確認後採用。</p>'+matches.map((item,i)=>'<div class="explain-box" style="margin-top:8px"><b>'+escapeHtml(item.category)+'</b><blockquote>'+escapeHtml(essay.slice(Math.max(0,item.offset-35),Math.min(essay.length,item.offset+item.length+35)))+'</blockquote><p>'+escapeHtml(item.message)+'</p><p>可參考：'+escapeHtml(item.replacements.join(' / ')||'請依語境修訂')+'</p><button class="btn outline sm" onclick="addGrammarWeakness('+i+')">加入待確認弱點</button></div>').join('')+(matches.length?'':'<p>未偵測到規則錯誤，不代表作文無誤或已達高 Band。</p>'):'')+
  '<p><a href="https://writeandimprove.com/" target="_blank" rel="noopener">Cambridge Write &amp; Improve 免費寫作練習</a>：另站自行使用，基本版提供 CEFR 回饋；IELTS Test Zone 與班級管理為付費功能。本網站不會自動送出您的作文。</p></section>';
 };
 window.checkWritingGrammar=async function(button){
  const m=current.mock,essay=state.answers[key(m.id,'writing')]?.essay||'',language=document.querySelector('#grammarLanguage').value,progress=document.querySelector('#grammarProgress');
  if(!essay.trim())return toast('請先完成作文');if(essay.length>12000)return toast('文法檢查上限為 12000 字元');
  button.disabled=true;progress.textContent='正在確認文法服務…';
  try{
   const status=await request('status');if(!status?.configured){progress.textContent='自架文法主機尚未完成公開連線。目前可使用免費寫作檢查，作文會照常保存。';return;}
   const prior=state.grammarReviews?.[m.id];if(prior?.reviewedEssay===essay&&prior.result.language===language&&Date.now()-Date.parse(prior.createdAt)<7*86400000){progress.textContent='使用這篇作文已保存的檢查結果，未重新呼叫服務。';return;}
   progress.textContent='正在檢查；作文僅送到本站自架文法服務。';
   const response=await request('check',essay,language);
   if(response?.status!=='checked')throw Error(response?.message||'文法服務暫時無法使用');
   state.grammarReviews??={};state.grammarReviews[m.id]={reviewedEssay:essay,result:response.result,createdAt:new Date().toISOString()};save();
   if(current.mock?.id===m.id)renderWriting();
  }catch(e){progress.textContent=e.message||'檢查失敗；作文已保留。';}finally{button.disabled=false;}
 };
 window.addGrammarWeakness=function(index){
  const m=current.mock,essay=state.answers[key(m.id,'writing')]?.essay||'',report=state.grammarReviews?.[m.id];
  if(!report||report.reviewedEssay!==essay)return toast('作文已變更，請先重新檢查');
  const item=report.result.matches[index];if(!item)return;
  const id='grammar:'+m.id+':'+item.ruleId+':'+item.offset;
  if(state.notesPending.some(n=>n.id===id)||state.notesConfirmed.some(n=>n.id===id))return toast('這項建議已在弱點筆記中');
  state.notesPending.unshift({id,mockId:m.id,mockCode:m.code,skill:'writing',q:index+1,userAnswer:essay.slice(item.offset,item.offset+item.length),referenceAnswer:item.replacements.join(' / '),tag:'文法待確認 · '+item.category,diagnosis:item.message,strategy:'先確認建議是否符合原意，再修訂並用相同句型造句。',confidence:0,evidence:essay.slice(Math.max(0,item.offset-35),item.offset+item.length+35),sourceKey:id,source:'LanguageTool-selfhost',createdAt:new Date().toISOString()});
  save();toast('已加入待確認弱點，請到弱點筆記確認後收錄');
 };
})();
