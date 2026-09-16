/* EPT marks and IELTS rubric feedback are separate assessments. */
window.LTUAssessment = (() => {
  const normalize = value => String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
  function objective(answers, keySet, submitted) {
    const answered = Array.from({length:40},(_,i)=>i+1).filter(q=>normalize(answers?.[q])).length;
    const trusted = keySet?.status === 'verified' && !!keySet.source && !!keySet.version;
    const rows = Array.from({length:40},(_,i)=>{
      const q=i+1, accepted=trusted ? keySet.answers?.[q] : null;
      if (!Array.isArray(accepted) || !accepted.length || accepted.some(a=>typeof a!=='string'||!normalize(a))) return {q,status:'unverified'};
      return {q,status:accepted.some(a=>normalize(a)===normalize(answers?.[q]))?'correct':normalize(answers?.[q])?'incorrect':'unanswered'};
    });
    const verified=rows.filter(r=>r.status!=='unverified').length;
    const correct=rows.filter(r=>r.status==='correct').length;
    return {answered,total:40,verified,correct,rows,status:!submitted?'not_submitted':verified===40?'graded':'awaiting_key',score:submitted&&verified===40?correct:null,ieltsBand:null};
  }
  function writing(essay, review) {
    const words=String(essay||'').trim().split(/\s+/).filter(Boolean).length;
    const valid=review?.assessmentVersion==='ielts-rubric-v1' && review.reviewedEssay===essay && review.provider==='remote-ai';
    const names=['taskResponse','coherence','vocabularyScore','grammar'];
    const values=valid?names.map(k=>review[k]):[];
    const numeric=values.length===4 && values.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=9);
    return {words,status:!words?'not_submitted':numeric?'ai_reference':'awaiting_review',taskBand:numeric?Math.round(values.reduce((a,b)=>a+b,0)/4*2)/2:null,criteria:numeric?Object.fromEntries(names.map((name,i)=>[name,values[i]])):null};
  }
  return {objective,writing};
})();

function currentAssessmentReport() {
  const m=current.mock;
  const keys=window.LTU_VERIFIED_KEYS?.[m.id]||{};
  return {version:1,mock:m.code,createdAt:new Date().toISOString(),mode:current.mode,
    listening:LTUAssessment.objective(state.answers[key(m.id,'listening')],keys.listening,!!state.submitted[key(m.id,'listening')]),
    reading:LTUAssessment.objective(state.answers[key(m.id,'reading')],keys.reading,!!state.submitted[key(m.id,'reading')]),
    writing:LTUAssessment.writing(state.answers[key(m.id,'writing')]?.essay||'',state.writingReviews[m.id]),
    speaking:{status:'awaiting_recorded_assessment',band:null},
    overall:{band:null,status:'insufficient_validated_evidence',reason:'EPT 題庫尚無經驗證的 IELTS 等值換算；單篇作文及文字口說練習不能代替完整四科成績。'}};
}
function showAssessmentReport() {
  if(!current.mock)return;
  const report=currentAssessmentReport();
  const objectiveCard=(label,r)=>`<section class="card"><h3>${label}</h3><strong style="font-size:28px">${r.score===null?'待評分':r.score+' / 40'}</strong><p>已作答 ${r.answered} / 40 題<br>已核對答案鍵 ${r.verified} / 40 題</p><p>${r.status==='not_submitted'?'請先提交本部分。':r.status==='awaiting_key'?'等待核對過的答案鍵；未核對題目不算答錯。':'以上為 EPT 原始分數，尚不能直接換算 IELTS。'}</p></section>`;
  $('#aiModalTitle').textContent=`${current.mock.code} · 成績與能力評估`;
  $('#aiModalBody').innerHTML=`<div class="notice"><strong>IELTS 整體參考分數：待評估</strong><br>先分別核對各科表現。資料不足時不顯示 0 分，也不以完成率或字數代替能力分數。</div><div class="grid g2" style="margin-top:16px">${objectiveCard('Listening',report.listening)}${objectiveCard('Reading',report.reading)}<section class="card"><h3>Writing</h3><strong style="font-size:28px">${report.writing.taskBand===null?'待評閱':report.writing.taskBand.toFixed(1)+' · 單篇參考'}</strong><p>目前 ${report.writing.words} words</p><p>${report.writing.taskBand===null?'需要真實評閱內容、組織、字彙與文法；舊版離線推估不列入成績。':'此為 AI 依 IELTS 寫作規準評閱單篇作文的參考分數，不是完整 IELTS Writing 成績。'}</p></section><section class="card"><h3>Speaking</h3><strong style="font-size:28px">待錄音評閱</strong><p>需要完整口說錄音評估流暢度、字彙、文法及發音。語音轉文字不能用來評定發音分數。</p></section></div><details style="margin-top:18px"><summary>IELTS 官方計分參考</summary><p>以下是 IELTS 正式試卷的平均門檻，並非本站 EPT 試卷的換算表。</p><table style="width:100%;text-align:left;border-spacing:8px"><thead><tr><th>IELTS Band</th><th>Listening / 40</th><th>Academic Reading / 40</th></tr></thead><tbody><tr><td>5</td><td>16</td><td>15</td></tr><tr><td>6</td><td>23</td><td>23</td></tr><tr><td>7</td><td>30</td><td>30</td></tr><tr><td>8</td><td>35</td><td>35</td></tr></tbody></table><p><a href="https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail" target="_blank" rel="noopener">IELTS 官方評分說明</a>：門檻會因試卷而略有不同。</p></details><div class="note-actions"><button class="btn gold" onclick="exportAssessmentReport()">下載成績報告</button></div>`;
  openModal('aiModal');
}
function exportAssessmentReport(){downloadJSON(currentAssessmentReport(),current.mock.code.replace(' ','_')+'_assessment.json')}
