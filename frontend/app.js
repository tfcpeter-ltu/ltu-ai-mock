import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import htm from 'htm';
import {ConvexReactClient,Authenticated,Unauthenticated,AuthLoading,useQuery,useMutation,useConvexAuth} from 'convex/react';
import {ConvexAuthProvider,useAuthActions} from '@convex-dev/auth/react';
import {anyApi} from 'convex/server';
const html=htm.bind(React.createElement);
const CONVEX_URL='https://dashing-quail-760.convex.cloud';
const client=new ConvexReactClient(CONVEX_URL,{expectAuth:true});

function PublicHome(){
 return html`<>
  <header className="nav"><div className="brand"><img src="assets/ltu-logo.jpg" onError=${e=>e.currentTarget.style.display='none'}/><div><b>LTU 國際學術中心</b><small>EPT AI MOCK · PERSONALISED LEARNING</small></div></div><a href="#login"><button className="btn gold">學生登入</button></a></header>
  <section className="hero"><div><div className="eyebrow">PERSONALISED 60-DAY PREPARATION</div><h1>不是只做模擬考<br/>而是讓 AI 找出你為什麼錯</h1><h2>29 套 Mock × AI 弱點修復 × 四能力訓練</h2><p>把歷次練習、閱讀與聽力作答、Writing、Speaking、單字與弱點集中在同一個個人帳號。AI 不只告訴你答案，而是協助你建立可重複複習的弱點模型。</p><a href="#login"><button className="btn gold">開始我的 EPT 計畫</button></a></div><div className="heroVisual"><div className="fallback"><b>LTU EPT AI Mock</b><br/>29 Sets · AI Review · Vocabulary · Writing · Speaking</div></div></section>
  <section className="features"><h2>一套系統完成 EPT 全程準備</h2><p className="sub">從今天要做什麼，到每一次錯題如何修復，都建立在同一個學生學習履歷中。</p><div className="grid">
   ${[['29 套模擬考','Strict / Practice 兩種模式，按進度完成完整題庫。'],['AI 逐題詳解','答案、證據、中文解析、策略與題目相關單字。'],['60 天個人計畫','模考與弱點修復交錯安排，不只一直刷題。'],['Weakness Inbox','AI 偵測先待確認，由學生決定是否列為真正弱點。'],['AI 單字庫','從錯題直接收藏，配合 1→3→7→14 天複習。'],['Writing AI','題意拆解、架構、語彙、批改，再要求重寫。'],['Speaking AI','Part 1→2→3 練習、回饋、追問與第二次作答。'],['跨裝置學習履歷','帳號、作答、弱點與進度同步到雲端。']].map(x=>html`<div className="card"><b>${x[0]}</b><p>${x[1]}</p></div>`)}
  </div></section>
  <section className="why"><h2>和一般線上題庫最大的不同</h2><div className="whyGrid"><div className="whyBox"><h3>錯題不是終點，而是下一次學習任務</h3><p>每一題錯誤都可以進入 Weakness Inbox。學生確認後才進正式弱點筆記，再依複習週期回來重新練習，避免錯題本越存越多卻沒有真正改善。</p></div><div className="whyBox"><h3>AI 參考答案不假裝是官方答案</h3><p>沒有官方答案鍵的題目，系統使用「本站 AI 參考答案」，保留證據與信心度，讓學生知道推導依據，而不是把 AI 判斷包裝成官方答案。</p></div></div></section>
  <section id="login" className="loginWrap"><div className="loginCard"><div className="loginPitch"><div className="eyebrow">LTU STUDENT ACCOUNT</div><h2>你的 EPT 學習紀錄，從今天開始累積。</h2><p>正式帳號會保存 Mock 作答、弱點、單字、Writing、Speaking 與會員期限，換電腦或手機後仍可接著學習。</p><p><b>會員方案：NT$5,000 / 30 天</b><br/>到期後保留學習資料，續費後恢復完整練習與 AI 功能。</p></div><${LoginForm}/></div></section>
 </>`;
}

function LoginForm(){
 const {signIn}=useAuthActions(); const [mode,setMode]=useState('signIn'); const [msg,setMsg]=useState(''); const [busy,setBusy]=useState(false);
 async function submit(e){e.preventDefault();setBusy(true);setMsg('');const f=new FormData(e.currentTarget);try{await signIn('password',{email:String(f.get('email')||'').trim().toLowerCase(),password:String(f.get('password')||''),name:String(f.get('name')||''),flow:mode});}catch(err){setMsg(mode==='signUp'?'建立帳號失敗：此 Email 可能已註冊，或密碼格式不符。':'登入失敗：請確認 Email 與密碼。');}finally{setBusy(false)}}
 return html`<form className="form" onSubmit=${submit}><div className="tabs"><button type="button" className=${mode==='signIn'?'active':''} onClick=${()=>setMode('signIn')}>登入</button><button type="button" className=${mode==='signUp'?'active':''} onClick=${()=>setMode('signUp')}>建立帳號</button></div><h3>${mode==='signIn'?'歡迎回來':'建立學生帳號'}</h3><p style=${{color:'#756c60',lineHeight:1.6}}>使用同一組 Email 登入，即可跨裝置同步進度。</p>${mode==='signUp'&&html`<div className="field"><label>姓名</label><input name="name" required placeholder="學生姓名"/></div>`}<div className="field"><label>Email</label><input name="email" type="email" required placeholder="student@example.com"/></div><div className="field"><label>密碼</label><input name="password" type="password" required minLength="8" placeholder="至少 8 個字元"/></div><button className="btn gold" disabled=${busy}>${busy?'處理中…':(mode==='signIn'?'登入學習系統':'建立帳號')}</button><div className="msg">${msg}</div></form>`;
}

function StudentCloud(){
 const {signOut}=useAuthActions(); const ensure=useMutation(anyApi.student.ensureProfile); const saveCloud=useMutation(anyApi.student.saveCloudState); const me=useQuery(anyApi.student.me,{}); const dash=useQuery(anyApi.student.dashboard,{}); const cloud=useQuery(anyApi.student.getCloudState,{}); const [ready,setReady]=useState(false); const [frameKey,setFrameKey]=useState(0); const syncTimer=useRef(null); const profile=me?.profile; const code=profile?.studentCode;
 useEffect(()=>{if(me&& !profile) ensure({}).catch(()=>{});},[me,profile]);
 useEffect(()=>{if(!code)return; localStorage.setItem('ltu_ept_active',code); const localKey='ltu_ept_'+code; const localStamp=Number(localStorage.getItem('ltu_ept_cloud_synced_at')||0); if(cloud?.stateJson&&cloud.updatedAt>localStamp){try{localStorage.setItem(localKey,cloud.stateJson);localStorage.setItem('ltu_ept_cloud_synced_at',String(cloud.updatedAt));setFrameKey(v=>v+1);}catch{}} setReady(true);},[code,cloud?.updatedAt]);
 async function pushState(){if(!code)return;const value=localStorage.getItem('ltu_ept_'+code);if(!value)return;try{const r=await saveCloud({stateJson:value});localStorage.setItem('ltu_ept_cloud_synced_at',String(r.updatedAt));}catch{}}
 useEffect(()=>{if(!code)return;const onStorage=e=>{if(e.key==='ltu_ept_'+code){clearTimeout(syncTimer.current);syncTimer.current=setTimeout(pushState,900)}};window.addEventListener('storage',onStorage);const id=setInterval(pushState,6000);return()=>{window.removeEventListener('storage',onStorage);clearInterval(id)}},[code]);
 const status=profile?.membershipStatus||'trial'; const allowed=status==='trial'||(status==='active'&&profile?.membershipEndAt>Date.now()); const end=profile?.membershipEndAt?new Date(profile.membershipEndAt).toLocaleDateString('zh-TW'):null;
 return html`<div className="cloud"><div className="cloudTop"><div className="brand"><img src="assets/ltu-logo.jpg" onError=${e=>e.currentTarget.style.display='none'}/><div><b>LTU EPT AI Mock</b><small>${code||'建立個人學習檔案中…'}</small></div></div><button className="btn ghost" onClick=${()=>signOut()}>登出</button></div><div className="dash"><div className="statusbar"><div><b>${profile?.displayName||me?.user?.name||'LTU Student'}</b><div className="sync">會員狀態：${status==='active'?'已付費':status==='trial'?'試用中':status}${end?' · 到期 '+end:''}</div></div><div className="sync">☁ 雲端同步 ${ready?'已連線':'初始化中'} · NT$5,000 / 30 天</div></div><div className="stats"><div className="stat"><small>完成 Mock</small><strong>${dash?.completedMocks??0}/29</strong></div><div className="stat"><small>待確認弱點</small><strong>${dash?.pendingWeaknesses??0}</strong></div><div className="stat"><small>已確認弱點</small><strong>${dash?.confirmedWeaknesses??0}</strong></div><div className="stat"><small>單字庫</small><strong>${dash?.vocabCount??0}</strong></div><div className="stat"><small>Writing</small><strong>${dash?.writingCount??0}</strong></div><div className="stat"><small>Speaking</small><strong>${dash?.speakingCount??0}</strong></div></div><div style=${{height:16}}></div>${allowed?html`<iframe key=${frameKey} className="appFrame" src="legacy.html" title="LTU EPT AI Learning App"></iframe>`:html`<div className="blocked"><h2>會員資格已到期</h2><p>你的所有學習紀錄仍然保留。完成續費後即可繼續 29 套 Mock、AI 詳解與個人化複習。</p><p><b>LTU EPT AI：NT$5,000 / 30 天</b></p></div>`}</div></div>`;
}

function App(){return html`<${ConvexAuthProvider} client=${client}><${AuthLoading}><div className="loader"><div><div className="spinner"></div><p>正在連線 LTU 學習雲端…</p></div></div></${AuthLoading}><${Unauthenticated}><${PublicHome}/></${Unauthenticated}><${Authenticated}><${StudentCloud}/></${Authenticated}></${ConvexAuthProvider}>`}
class AppErrorBoundary extends React.Component {
 constructor(props){super(props);this.state={failed:false};}
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(error){console.error('LTU application failed to render',error);}
 render(){return this.state.failed?html`<div className="loader"><div><h1>學習系統暫時無法載入</h1><p>請重新整理頁面，若仍無法使用，請聯絡 LTU。</p><button className="btn gold" onClick=${()=>location.reload()}>重新載入</button></div></div>`:this.props.children;}
}
createRoot(document.getElementById('root')).render(html`<${AppErrorBoundary}><${App}/></${AppErrorBoundary}>`);
