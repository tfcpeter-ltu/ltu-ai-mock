import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import htm from 'htm';
import {ConvexReactClient,Authenticated,Unauthenticated,AuthLoading,useQuery,useMutation,useConvexAuth} from 'convex/react';
import {ConvexAuthProvider,useAuthActions} from '@convex-dev/auth/react';
import {anyApi} from 'convex/server';
import {useGrammarBridge} from './GrammarBridge.js';
import {AssessmentPanel} from './AssessmentPanel.js';
const html=htm.bind(React.createElement);
const CONVEX_URL='https://dashing-quail-760.convex.cloud';
const client=new ConvexReactClient(CONVEX_URL);

function PublicHome(){
 return html`<${React.Fragment}>
  <header className="nav"><div className="brand"><img src="assets/ltu-logo.jpg" onError=${e=>e.currentTarget.style.display='none'}/><div><b>LTU 國際學術中心</b><small>EPT AI MOCK · PERSONALISED LEARNING</small></div></div><a href="#login"><button className="btn gold">學生登入</button></a></header>
  <section className="hero"><div><div className="eyebrow">PERSONALISED 60-DAY PREPARATION</div><h1>不是只做模擬考<br/>而是讓 AI 找出你為什麼錯</h1><h2>29 套 Mock × AI 弱點修復 × 四能力訓練</h2><p>把歷次練習、閱讀與聽力作答、Writing、Speaking、單字與弱點集中在同一個個人帳號。AI 不只告訴你答案，而是協助你建立可重複複習的弱點模型。</p><a href="#login"><button className="btn gold">開始我的 EPT 計畫</button></a></div><aside className="heroVisual" aria-label="EPT 學習內容"><div className="studyHeading"><span>YOUR EPT STUDY PLAN</span><span>LTU</span></div><div className="studyTotal"><strong>29</strong><div><b>套模擬試題</b><span>Strict / Practice 雙模式</span></div></div><div className="studySkills"><span>Listening</span><span>Reading</span><span>Writing</span><span>Speaking</span></div><ol className="studySteps"><li><span className="stepNumber">01</span><div><b>練習模擬試題</b><p>從作答中找出需要加強的觀念。</p></div></li><li><span className="stepNumber">02</span><div><b>整理弱點與單字</b><p>確認錯題原因，建立自己的複習筆記。</p></div></li><li><span className="stepNumber">03</span><div><b>安排下一次複習</b><p>搭配 60 天學習計畫，持續練習四項能力。</p></div></li></ol><a className="studyLink" href="#login">登入，開始你的學習計畫 <span aria-hidden="true">↗</span></a></aside></section>
  <section className="features"><h2>一套系統完成 EPT 全程準備</h2><p className="sub">從今天要做什麼，到每一次錯題如何修復，都建立在同一個學生學習履歷中。</p><div className="grid">
   ${[['29 套模擬考','Strict / Practice 兩種模式，按進度完成完整題庫。'],['AI 逐題詳解','答案、證據、中文解析、策略與題目相關單字。'],['60 天個人計畫','模考與弱點修復交錯安排，不只一直刷題。'],['Weakness Inbox','AI 偵測先待確認，由學生決定是否列為真正弱點。'],['AI 單字庫','從錯題直接收藏，配合 1→3→7→14 天複習。'],['Writing AI','免費檢查＋可選裝置端 AI 評閱草稿；正式分數待教師覆核，不使用付費 API。'],['Speaking AI','Part 1–3 可錄音、回放與本機轉寫；文字與評論同步，可主動提交三部分原音，由授權教師提供四項規準完整評論。'],['跨裝置學習履歷','登入後同步至本站 Convex 專案；顯示實際儲存狀態，依免費額度運作。']].map(x=>html`<div className="card"><b>${x[0]}</b><p>${x[1]}</p></div>`)}
  </div></section>
  <section className="why"><h2>和一般線上題庫最大的不同</h2><div className="whyGrid"><div className="whyBox"><h3>錯題不是終點，而是下一次學習任務</h3><p>每一題錯誤都可以進入 Weakness Inbox。學生確認後才進正式弱點筆記，再依複習週期回來重新練習，避免錯題本越存越多卻沒有真正改善。</p></div><div className="whyBox"><h3>AI 參考答案不假裝是官方答案</h3><p>沒有官方答案鍵的題目，系統使用「本站 AI 參考答案」，保留證據與信心度，讓學生知道推導依據，而不是把 AI 判斷包裝成官方答案。</p></div></div></section>
  <p style=${{padding:"0 7vw"}}><a href="writing-method.html" style=${{color:"#efd6a9"}}>查看免費評閱模型比較、雅思規準與雲端資料位置</a></p><section id="login" className="loginWrap"><div className="loginCard"><div className="loginPitch"><div className="eyebrow">LTU STUDENT ACCOUNT</div><h2>你的 EPT 學習紀錄，從今天開始累積。</h2><p>正式帳號會保存 Mock 作答、弱點、單字、Writing、Speaking 與會員期限，換電腦或手機後仍可接著學習。</p><p><b>會員方案：NT$5,000 / 30 天</b><br/>到期後保留學習資料，續費後恢復完整練習與 AI 功能。</p></div><${LoginForm}/></div></section>
 </${React.Fragment}>`;
}

function LoginForm(){
 const {signIn}=useAuthActions(); const [mode,setMode]=useState('signIn'); const [msg,setMsg]=useState(''); const [busy,setBusy]=useState(false); const [stalled,setStalled]=useState(false);
 async function submit(e){
 e.preventDefault();if(busy||stalled)return;setBusy(true);setMsg('');
 const f=new FormData(e.currentTarget);let timeout;
 try{
  await Promise.race([
   signIn('password',{email:String(f.get('email')||'').trim().toLowerCase(),password:String(f.get('password')||''),name:String(f.get('name')||''),flow:mode}),
   new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('LTU_LOGIN_TIMEOUT')),20000)})
  ]);
 }catch(err){
  if(err?.message==='LTU_LOGIN_TIMEOUT'){setStalled(true);setMsg('登入連線逾時。請重新載入頁面後再試一次。');}
  else{setMsg(mode==='signUp'?'建立帳號失敗：此 Email 可能已註冊，或密碼格式不符。':'登入未成功。請確認 Email 與密碼；若尚未註冊，請先選擇「建立帳號」。');}
 }finally{clearTimeout(timeout);setBusy(false)}
 }

 return html`<form className="form" onSubmit=${submit}><div className="tabs"><button type="button" className=${mode==='signIn'?'active':''} onClick=${()=>setMode('signIn')}>登入</button><button type="button" className=${mode==='signUp'?'active':''} onClick=${()=>setMode('signUp')}>建立帳號</button></div><h3>${mode==='signIn'?'歡迎回來':'建立學生帳號'}</h3><p style=${{color:'#756c60',lineHeight:1.6}}>使用同一組 Email 登入，即可跨裝置同步進度。</p>${mode==='signUp'&&html`<div className="field"><label>姓名</label><input name="name" required placeholder="學生姓名"/></div>`}<div className="field"><label>Email</label><input name="email" type="email" required placeholder="student@example.com"/></div><div className="field"><label>密碼</label><input name="password" type="password" required minLength="8" placeholder="至少 8 個字元"/></div><button className="btn gold" disabled=${busy||stalled}>${busy?'處理中…':(mode==='signIn'?'登入學習系統':'建立帳號')}</button><div className="msg" role="status" aria-live="polite">${msg}</div>${stalled&&html`<button type="button" className="btn gold" onClick=${()=>location.reload()}>重新載入</button>`}</form>`;
}

function StudentCloud(){
 const grammarFrame=useRef(null);useGrammarBridge(grammarFrame);
 const {signOut}=useAuthActions(); const ensure=useMutation(anyApi.student.ensureProfile); const saveCloud=useMutation(anyApi.student.saveCloudState); const me=useQuery(anyApi.student.me,{}); const cloud=useQuery(anyApi.student.getCloudState,{}); const [ready,setReady]=useState(false); const [frameKey,setFrameKey]=useState(0); const [syncText,setSyncText]=useState('初始化中'); const [conflict,setConflict]=useState(false); const [snapshot,setSnapshot]=useState({});const profile=me?.profile; const code=profile?.studentCode;
 const session=useMemo(()=>({initialized:false,stamp:0,base:null,inflight:null,busy:false,conflict:false,remote:null}),[code]);
 const localKey='ltuEPT:'+code;
 function showStats(value){try{setSnapshot(JSON.parse(value||'{}'))}catch{setSnapshot({})}}
 useEffect(()=>{if(me&&!profile)ensure({}).catch(()=>setSyncText('無法建立學習檔案，請重新登入'));},[me,profile]);
 useEffect(()=>{
  if(!code||cloud===undefined)return;
  session.remote=cloud;
  const local=localStorage.getItem(localKey)||localStorage.getItem('ltu_ept_'+code);
  const stampKey=localKey+':cloudStamp',baseKey=localKey+':cloudBase';
  const apply=()=>{if(cloud?.stateJson){localStorage.setItem(localKey,cloud.stateJson);localStorage.setItem(baseKey,cloud.stateJson);localStorage.setItem(stampKey,String(cloud.updatedAt));session.base=cloud.stateJson;showStats(cloud.stateJson);setFrameKey(v=>v+1);}else{session.base=null;showStats(local)}session.stamp=cloud?.updatedAt||0;};
  if(!session.initialized){
   const previousBase=localStorage.getItem(baseKey),previousStamp=Number(localStorage.getItem(stampKey)||0);
   session.initialized=true;session.stamp=cloud?.updatedAt||0;
   if(cloud&&local&&local!==cloud.stateJson&&local!==previousBase){
    if(previousStamp===cloud.updatedAt){session.base=cloud.stateJson;localStorage.setItem(localKey,local);showStats(local);setSyncText('有本機變更，等待儲存');}
    else{session.conflict=true;setConflict(true);session.base=previousBase;showStats(local);setSyncText('本機與雲端版本不同，請選擇要保留的版本');}
   }else{apply();if(!cloud&&local)localStorage.setItem(localKey,local);setSyncText(cloud?'已載入雲端紀錄':'尚無雲端紀錄，等待首次儲存');}
   localStorage.setItem('ltu_ept_active',code);setReady(true);return;
  }
  if(!cloud||cloud.updatedAt===session.stamp)return;
  if(cloud.stateJson===session.inflight){session.base=cloud.stateJson;session.stamp=cloud.updatedAt;return;}
  if(local!==session.base&&local!==cloud.stateJson){session.conflict=true;setConflict(true);setSyncText('另一裝置已有更新；本機資料已保留，請先處理衝突');return;}
  if(!session.busy&&!session.conflict){apply();setSyncText('已收到其他裝置更新');}
 },[code,cloud,session]);
 async function pushState(){
  if(!code||!session.initialized||session.busy||session.conflict)return;
  const value=localStorage.getItem(localKey);if(!value||value===session.base)return;
  session.busy=true;session.inflight=value;setSyncText('儲存中…');showStats(value);
  try{const r=await saveCloud({stateJson:value,expectedUpdatedAt:session.stamp});if(r.conflict){session.conflict=true;setConflict(true);setSyncText('同步衝突，本機作答已保留');return;}session.stamp=r.updatedAt;session.base=value;localStorage.setItem(localKey+':cloudStamp',String(r.updatedAt));localStorage.setItem(localKey+':cloudBase',value);setSyncText('已儲存 '+new Date(r.updatedAt).toLocaleTimeString('zh-TW'));}
  catch{setSyncText('儲存失敗，資料保留在此裝置；連線恢復後重試');}finally{session.busy=false;session.inflight=null;}
 }
 useEffect(()=>{if(!ready||!code)return;let timer;const changed=e=>{if(e.key===localKey){showStats(e.newValue);setSyncText(session.conflict?'同步衝突，請先選擇版本':'本機已保存，等待雲端儲存');clearTimeout(timer);timer=setTimeout(pushState,1200)}};window.addEventListener('storage',changed);window.addEventListener('online',pushState);const interval=setInterval(pushState,15000);pushState();return()=>{window.removeEventListener('storage',changed);window.removeEventListener('online',pushState);clearTimeout(timer);clearInterval(interval)}},[ready,code,session]);
 function resolveCloud(){const r=session.remote;if(!r)return;const local=localStorage.getItem(localKey);if(local)localStorage.setItem(localKey+':conflictBackup:'+Date.now(),local);localStorage.setItem(localKey,r.stateJson);localStorage.setItem(localKey+':cloudBase',r.stateJson);localStorage.setItem(localKey+':cloudStamp',String(r.updatedAt));session.base=r.stateJson;session.stamp=r.updatedAt;session.conflict=false;setConflict(false);showStats(r.stateJson);setFrameKey(v=>v+1);setSyncText('已使用雲端版本；原本機版本保存在此裝置');}
 function keepLocal(){if(session.remote?.stateJson)localStorage.setItem(localKey+':conflictCloudBackup:'+Date.now(),session.remote.stateJson);session.stamp=session.remote?.updatedAt||0;session.conflict=false;setConflict(false);pushState();}
 const dash={completedMocks:Object.values(snapshot.completedMocks||{}).filter(Boolean).length,pendingWeaknesses:snapshot.notesPending?.length||0,confirmedWeaknesses:snapshot.notesConfirmed?.length||0,vocabCount:snapshot.vocab?.length||0,writingCount:Object.keys(snapshot.answers||{}).filter(k=>k.endsWith(':writing')&&snapshot.answers[k]?.essay?.trim()).length,speakingCount:snapshot.speakingHistory?.length||0};
 const status=profile?.membershipStatus||'trial'; const allowed=status==='trial'||(status==='active'&&profile?.membershipEndAt>Date.now()); const end=profile?.membershipEndAt?new Date(profile.membershipEndAt).toLocaleDateString('zh-TW'):null;
 return html`<div className="cloud"><div className="cloudTop"><div className="brand"><img src="assets/ltu-logo.jpg" onError=${e=>e.currentTarget.style.display='none'}/><div><b>LTU EPT AI Mock</b><small>${code||'建立個人學習檔案中…'}</small></div></div><button className="btn ghost" onClick=${async()=>{await pushState();await signOut()}}>登出</button></div><div className="dash"><div className="statusbar"><div><b>${profile?.displayName||me?.user?.name||'LTU Student'}</b><div className="sync">會員狀態：${status==='active'?'已付費':status==='trial'?'試用中':status}${end?' · 到期 '+end:''}</div></div><div className="sync">☁ 雲端同步 ${syncText} · NT$5,000 / 30 天</div></div>${conflict&&html`<div className="statusbar" role="alert"><p>兩個版本都含有學習紀錄。使用雲端版會保留本機備份；保留本機版會取代目前雲端版。</p><button className="btn ghost" style=${{color:"#191713"}} onClick=${resolveCloud}>使用雲端版，保留本機備份</button><button className="btn gold" onClick=${keepLocal}>保留本機版並同步</button></div>`}<div className="stats"><div className="stat"><small>完成 Mock</small><strong>${dash?.completedMocks??0}/29</strong></div><div className="stat"><small>待確認弱點</small><strong>${dash?.pendingWeaknesses??0}</strong></div><div className="stat"><small>已確認弱點</small><strong>${dash?.confirmedWeaknesses??0}</strong></div><div className="stat"><small>單字庫</small><strong>${dash?.vocabCount??0}</strong></div><div className="stat"><small>Writing</small><strong>${dash?.writingCount??0}</strong></div><div className="stat"><small>Speaking</small><strong>${dash?.speakingCount??0}</strong></div></div><${AssessmentPanel} snapshot=${snapshot} code=${code} role=${profile?.role}/><div style=${{height:16}}></div>${allowed&&ready?html`<iframe ref=${grammarFrame} key=${frameKey} className="appFrame" allow="microphone" src=${"legacy.html?v=speaking-local4&student="+encodeURIComponent(code)} title="LTU EPT AI Learning App"></iframe>`:!ready?html`<p role="status">正在載入個人學習紀錄…</p>`:html`<div className="blocked"><h2>會員資格已到期</h2><p>你的所有學習紀錄仍然保留。完成續費後即可繼續 29 套 Mock、AI 詳解與個人化複習。</p><p><b>LTU EPT AI：NT$5,000 / 30 天</b></p></div>`}</div></div>`;
}

function App(){return html`<${ConvexAuthProvider} client=${client}><${AuthLoading}><div className="loader"><div><div className="spinner"></div><p>正在連線 LTU 學習雲端…</p></div></div></${AuthLoading}><${Unauthenticated}><${PublicHome}/></${Unauthenticated}><${Authenticated}><${StudentCloud}/></${Authenticated}></${ConvexAuthProvider}>`}
class AppErrorBoundary extends React.Component {
 constructor(props){super(props);this.state={failed:false};}
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(error){console.error('LTU application failed to render',error);}
 render(){return this.state.failed?html`<div className="loader"><div><h1>學習系統暫時無法載入</h1><p>請重新整理頁面，若仍無法使用，請聯絡 LTU。</p><button className="btn gold" onClick=${()=>location.reload()}>重新載入</button></div></div>`:this.props.children;}
}
createRoot(document.getElementById('root')).render(html`<${AppErrorBoundary}><${App}/></${AppErrorBoundary}>`);
