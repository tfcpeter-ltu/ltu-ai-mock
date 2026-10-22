(function(root){
 const version='local-ielts-20261023-prose1';
 function hideScore(text){return text.replace(/\b(?:IELTS\s+)?(?:band(?:\s+score)?|score)\s*(?:(?:of|is|at|around|approximately)\s*)?[:=]?\s*\d+(?:\.\d+)?(?:\s*(?:\/|out\s+of)\s*9\b)?/gi,'[分數待驗證]').replace(/\b\d+(?:\.\d+)?\s+bands?\b/gi,'[分數待驗證]').replace(/\b[0-9](?:\.\d+)?\s*\/\s*9\b/g,'[分數待驗證]');}
 const criteria=['Task Achievement / Response','Coherence & Cohesion','Lexical Resource','Grammatical Range & Accuracy'];
 function inspect(essay,target=250){
  const words=String(essay).match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[];
  const paragraphs=String(essay).trim().split(/\n\s*\n/).filter(Boolean);
  const tips=[];
  if(words.length<target)tips.push(`目前 ${words.length} 個英文單字；本題目標 ${target} 字，請補足論點與例子。字數本身不能決定 Band。`);
  if(paragraphs.length<3)tips.push('檢查是否有清楚的開頭、主體與結尾；請使用空白行分段。段落數不是評分公式。');
  if(/\b(very|good|bad|thing)\b/i.test(essay))tips.push('檢查 very / good / bad / thing 是否可以換成更精確且符合語境的表達。');
  tips.push('逐段檢查是否回應題目、發展原因與具體例證，再檢查主謂一致、時態與標點。');
  return {assessmentVersion:version,provider:'local-checklist',reviewedEssay:essay,words:words.length,paragraphs:paragraphs.length,tips,band:null,createdAt:new Date().toISOString()};
 }
 function validate(raw,essay){
  const s=raw.replace(/^```(?:json)?\s*|\s*```$/g,'').trim();
  const r=JSON.parse(s);
  if(!Array.isArray(r.criteria)||r.criteria.length!==4)throw Error('模型未傳回四項評分，請改用免費檢查或交由教師覆核。');
  const sentences=essay.toLowerCase();
  for(let i=0;i<4;i++){
   const c=r.criteria[i];
   if(!Number.isInteger(c.band)||c.band<1||c.band>9||typeof c.reason!=='string'||!c.reason.trim()||typeof c.evidence!=='string'||c.evidence.trim().length<8||!sentences.includes(c.evidence.toLowerCase()))throw Error('模型評分缺少有效分數或作文原句依據；本次不產生成績。');
   c.name=criteria[i];
  }
  if(typeof r.nextStep!=='string'||!r.nextStep.trim()||/^(one personalised revision task|nextStep|revision task)$/i.test(r.nextStep.trim()))throw Error('模型未提供個人化改善任務，請重新評閱。');
  return {assessmentVersion:version,provider:'browser-local-ai',reviewedEssay:essay,criteria:r.criteria.map(c=>({...c,reason:hideScore(c.reason),band:null})),nextStep:hideScore(r.nextStep),band:null,status:'uncalibrated-draft',provisional:true,createdAt:new Date().toISOString()};
 }
 root.LTUWriting={version,criteria,inspect,validate};
})(typeof window==='undefined'?globalThis:window);
