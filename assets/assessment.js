/* Source-derived practice estimates; never presented as an official answer key. */
window.LTUAssessment = (() => {
  const normalize = value => String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');
  function grade(answer,record) {
    if(!record?.evidence || !record.acceptedAnswers?.length)return 'unverified';
    if(record.confidence!=='high')return 'review';
    const value=normalize(answer);
    if(!value)return 'unanswered';
    const limit=record.instruction?.match(/NO MORE THAN (ONE|TWO|THREE|FOUR|FIVE) WORDS?/i);
    if(limit){const max={ONE:1,TWO:2,THREE:3,FOUR:4,FIVE:5}[limit[1].toUpperCase()];const words=value.split(/\s+/).filter(w=>!(/AND\/OR A NUMBER|OR A NUMBER/i.test(record.instruction)&&/^[£$]?\d[\d.,%:–-]*$/.test(w)));if(words.length>max)return 'review';}
    if(record.acceptedAnswers.some(a=>normalize(a)===value))return 'correct';
    // Alternative free-text answers require review; an absent variant is not proof of error.
    const closed=/matching|choice|true|false|yes\/no/i.test(record.type||'') || record.acceptedAnswers.every(a=>/^(?:[a-z]{1,2}|[ivx]+|yes|no|true|false|not given)$/i.test(a));
    return closed?'incorrect':'review';
  }
  function objective(answers,keySet,submitted) {
    const records=keySet?.status==='ai-derived'?keySet.records||{}:{};
    const rows=Array.from({length:40},(_,i)=>{const q=i+1;return {q,status:submitted?grade(answers?.[q],records[q]):'not_submitted',answer:String(answers?.[q]||'')};});
    const covered=Object.keys(records).length,correct=rows.filter(r=>r.status==='correct').length;
    const pending=rows.filter(r=>['review','unverified'].includes(r.status)).length;
    const assessed=rows.filter(r=>['correct','incorrect','unanswered'].includes(r.status)).length;
    return {answered:Object.values(answers||{}).filter(v=>normalize(v)).length,total:40,covered,correct,assessed,pending,rows,status:!submitted?'not_submitted':pending?'partial_reference':'ai_reference',score:submitted&&!pending?correct:null,range:submitted?[correct,correct+pending]:null,official:false};
  }
  function writing(essay,review){
    const words=String(essay||'').trim().split(/\s+/).filter(Boolean).length;
    const valid=review?.assessmentVersion==='ielts-rubric-v1'&&review.reviewedEssay===essay&&review.provider==='remote-ai';
    const names=['taskResponse','coherence','vocabularyScore','grammar'],values=valid?names.map(k=>review[k]):[];
    const numeric=values.length===4&&values.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=9);
    return {words,status:!words?'not_submitted':numeric?'ai_reference':'awaiting_review',taskBand:numeric?Math.round(values.reduce((a,b)=>a+b,0)/4*2)/2:null,criteria:numeric?Object.fromEntries(names.map((k,i)=>[k,values[i]])):null};
  }
  function bandReference(result,skill){
    if(result.covered!==40||!result.range)return null;
    // Only published IELTS whole-band anchors are used. This is not an EPT calibration.
    const boundaries=skill==='reading'?[15,23,30,35]:[16,23,30,35];
    const interval=n=>n<boundaries[0]?[1,5]:n<boundaries[1]?[5,6]:n<boundaries[2]?[6,7]:n<boundaries[3]?[7,8]:[8,9];
    return [interval(result.range[0])[0],interval(result.range[1])[1]];
  }
  return {normalize,grade,objective,writing,bandReference};
})();
function referenceFor(skill,q){return window.LTU_AI_KEYS?.[current.mock?.id]?.[skill]?.records?.[q]||null;}
function currentAssessmentReport(){
 const m=current.mock,keys=window.LTU_AI_KEYS?.[m.id]||{};
 const report={version:2,mock:m.code,createdAt:new Date().toISOString(),mode:current.mode,answerKeyVersion:keys.reading?.version||null,official:false,
 listening:LTUAssessment.objective(state.answers[key(m.id,'listening')],keys.listening,!!state.submitted[key(m.id,'listening')]),
 reading:LTUAssessment.objective(state.answers[key(m.id,'reading')],keys.reading,!!state.submitted[key(m.id,'reading')]),
 writing:LTUAssessment.writing(state.answers[key(m.id,'writing')]?.essay||'',state.writingReviews[m.id]),speaking:{status:'awaiting_recorded_assessment',band:null},overall:{band:null,status:'insufficient_evidence'}};
 for(const skill of ['listening','reading'])report[skill].ieltsTableReference=LTUAssessment.bandReference(report[skill],skill);
 report.limitations='答案為AI依來源推導，非官方答案。待核對題不自動扣分。IELTS表格對照未經EPT試卷難度校準，不是正式IELTS成績或已驗證能力換算。';
 return report;
}
function showAssessmentReport(){
 if(!current.mock)return;const report=currentAssessmentReport();
 const card=(label,r,skill)=>`<section class="card"><h3>${label}</h3><strong style="font-size:26px">${r.status==='not_submitted'?'尚未提交':r.assessed?r.correct+' / '+r.assessed+' 題':'待核對'}</strong><p>已作答 ${r.answered} / 40 · 參考答案 ${r.covered} / 40</p><p>${r.status==='not_submitted'?'提交後顯示判分及逐題依據。':`已判分 ${r.assessed} 題，待核對 ${r.pending} 題。${r.covered===40?`全卷暫定範圍 ${r.range[0]}–${r.range[1]} / 40。`:'答案建置中，不推算全卷分數。'}`}</p>${r.ieltsTableReference?`<p><b>IELTS 表格對照區間：${r.ieltsTableReference.join('–')}</b><br><small>僅將暫定答對數對照 IELTS 門檻，未校準 EPT 難度；不可視為等值能力分數。</small></p>`:''}${r.status!=='not_submitted'?`<details><summary>逐題判分與依據</summary>${r.rows.map(row=>`<div style="padding:8px 0;border-bottom:1px solid #ddd"><b>Q${row.q}</b> · ${{correct:'符合參考答案',incorrect:'與參考答案不符',unanswered:'未作答',review:'待核對，不扣分',unverified:'答案建置中'}[row.status]} <button class="btn outline sm" onclick="showReferenceAnswer('${skill}',${row.q})">查看依據</button></div>`).join('')}</details>`:''}</section>`;
 $('#aiModalTitle').textContent=`${current.mock.code} · 成績與能力評估`;
 $('#aiModalBody').innerHTML=`<div class="notice"><strong>AI 推導參考評分</strong><br>按原文或原音建立答案。歧義題、未收錄的填空寫法會待核對，不直接當成答錯。可信度是推導判斷，不是統計機率。</div><div class="grid g2" style="margin-top:16px">${card('Listening',report.listening,'listening')}${card('Reading',report.reading,'reading')}<section class="card"><h3>Writing</h3><strong>${report.writing.taskBand===null?'待評閱':report.writing.taskBand.toFixed(1)+' · 單篇參考'}</strong><p>${report.writing.words} words。需要有效的內容、組織、字彙與文法評閱；不以字數生成分數。</p></section><section class="card"><h3>Speaking</h3><strong>待錄音評閱</strong><p>需評估完整口說錄音，包含發音與流暢度。</p></section></div><p><b>IELTS 總分：資料不足，暫不計算。</b></p><p>本題庫未經 IELTS 難度校準。<a href="https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail" target="_blank" rel="noopener">官方門檻說明</a>指出不同試卷門檻可能略有差異。表格對照以1–9的寬區間呈現，不假裝精確到半分。</p><button class="btn gold" onclick="exportAssessmentReport()">下載成績報告</button>`;openModal('aiModal');
}
function showReferenceAnswer(skill,q){
 if(current.mode==='strict'&&!state.submitted[key(current.mock.id,skill)]){toast('請先提交本部分再查看參考答案');return;}
 const r=referenceFor(skill,q);$('#aiModalTitle').textContent=`${current.mock.code} · ${skill} Q${q}`;
 if(!r){$('#aiModalBody').innerHTML='<div class="notice">此題尚在建立來源依據，暫不提供猜測答案或扣分。</div><button class="btn outline" onclick="showAssessmentReport()">返回成績</button>';openModal('aiModal');return;}
 const answer=state.answers[key(current.mock.id,skill)]?.[q]||'',status=LTUAssessment.grade(answer,r);
 $('#aiModalBody').innerHTML=`<div class="notice"><b>AI 推導參考答案，非官方答案</b><br>可信度：${r.confidence==='high'?'高':'需複核'} · ${status==='correct'?'符合參考答案':status==='incorrect'?'與參考答案不符':status==='unanswered'?'未作答':'待核對，不自動扣分'}</div><h3>參考答案：${escapeHtml(r.acceptedAnswers.join(' / '))}</h3><p>你的作答：${escapeHtml(answer||'尚未作答')}</p><p>${escapeHtml(r.explanation)}</p><blockquote>${escapeHtml(r.evidence)}</blockquote>${r.audioSrc?`<p>依據為原始錄音的機器轉錄，辨識仍可能有誤。原音位置 ${Math.floor(r.audioStart/60)}:${String(Math.floor(r.audioStart%60)).padStart(2,'0')}。</p><audio controls preload="none" style="width:100%" src="${escapeAttr(r.audioSrc)}#t=${r.audioStart},${r.audioEnd}"></audio>`:'<p>依據：本套模考閱讀文章。</p>'}<button class="btn outline" onclick="showAssessmentReport()">返回成績</button>`;openModal('aiModal');
}
function exportAssessmentReport(){downloadJSON(currentAssessmentReport(),current.mock.code.replace(' ','_')+'_assessment.json')}
