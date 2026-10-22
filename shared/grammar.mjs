/** @param {unknown} raw @param {string} text @param {string} language */
export function normalizeGrammar(raw,text,language){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.matches))throw Error('Invalid LanguageTool response');
 const matches=[];
 for(const item of raw.matches.slice(0,60)){
  if(!item||!Number.isInteger(item.offset)||!Number.isInteger(item.length)||item.offset<0||item.length<0||item.offset+item.length>text.length)continue;
  const message=String(item.message||'').slice(0,600),ruleId=String(item.rule?.id||'UNKNOWN').slice(0,120),category=String(item.rule?.category?.id||'OTHER').slice(0,80);
  if(!message)continue;
  matches.push({offset:item.offset,length:item.length,message,ruleId,category,issueType:String(item.rule?.issueType||'other').slice(0,80),replacements:(Array.isArray(item.replacements)?item.replacements:[]).slice(0,5).map(r=>String(r?.value||'').slice(0,150))});
 }
 return {engine:'LanguageTool-selfhost',engineVersion:String(raw.software?.version||'unknown').slice(0,40),language,matches,truncated:raw.matches.length>60,band:null};
}
