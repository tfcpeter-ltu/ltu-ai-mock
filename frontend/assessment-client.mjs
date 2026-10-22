export async function submitSpeakingAttempt({sessionId,setNumber,loadSession,readPart,create,save,upload,submit,onSession=()=>{},onProgress=()=>{}}){
 const existing=sessionId?await loadSession(sessionId):null;
 if(existing&&(existing.status!=='draft'||existing.setNumber!==setNumber))throw Error('這次測驗已提交或題組不同，請選擇正確草稿。');
 const inputs=[];
 // Resolve and validate every missing part before creating a cloud session.
 for(const part of [1,2,3]){
  if(existing?.parts.some(p=>p.part===part&&p.audioId))continue;
  const value=await readPart(part);
  if(!value?.prompt?.trim()||value.prompt.length>4000||!value.answerText?.trim()||value.answerText.length>16000)throw Error('請先在練習區保存三部分完整作答，再逐一選擇。');
  const audio=value.audio;
  if(!audio)throw Error('Part '+part+' 的原音不在這台裝置；請選擇同次作答的原音檔。');
  if(!audio.size||audio.size>8*1024*1024)throw Error('每段原音上限 8 MB；請選擇較小的原音。');
  const mime=audio.type.split(';')[0].replace('audio/x-wav','audio/wav');
  if(!['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav'].includes(mime))throw Error('請使用 WebM、Ogg、M4A、MP3 或 WAV 原音。');
  inputs.push({part,prompt:value.prompt,answerText:value.answerText,audio,mime});
 }
 const id=sessionId||await create({setNumber});onSession(id);
 for(const {part,prompt,answerText,audio,mime} of inputs){onProgress('保存 Part '+part+' 原音…');await save({sessionId:id,part,prompt,answerText});await upload({sessionId:id,part,audio,mime});}
 await submit({sessionId:id});return id;
}
