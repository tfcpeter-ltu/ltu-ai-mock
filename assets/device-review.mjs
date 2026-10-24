import {makeRequest,validateReview,studentReview} from '../shared/rubric.mjs?v=5';
let engine,busy=false;
export async function reviewText({onProgress=()=>{},signal,...input}){
 signal?.throwIfAborted();
 if(busy||window.LTULocalInferenceBusy)throw Error('已有裝置端評閱進行中');if(!navigator.gpu)throw Error('此裝置不支援 WebGPU，請保存作答供教師評閱。');
 const request=makeRequest(input),model='Phi-3.5-mini-instruct-q4f16_1-MLC';busy=true;window.LTULocalInferenceBusy=true;const interrupt=()=>engine?.interruptGenerate();signal?.addEventListener('abort',interrupt,{once:true});
 try{
  if(!engine){const webllm=await import('https://esm.run/@mlc-ai/web-llm@0.2.86');onProgress('首次需下載本機模型，可能數 GB；未上傳作答。');engine=await webllm.CreateMLCEngine(model,{initProgressCallback:p=>onProgress(p.text)},{context_window_size:8192});}
  signal?.throwIfAborted();
  onProgress('正在此裝置依規準分析文字；不使用付費 API。');
  const criteria=[];let nextStep='';
  for(const name of request.criteria){
   signal?.throwIfAborted();
   onProgress('裝置端正在分析 '+name+'；不使用付費 API。');
   const schema={...request.schema,properties:{...request.schema.properties,criteria:{...request.schema.properties.criteria,minItems:1,maxItems:1}}};
   const focus=name==='Lexical Resource'?'Discuss vocabulary precision, range, collocation or paraphrase in the actual response. Topic relevance is NOT lexical resource.':name==='Grammatical Range and Accuracy'?'Discuss grammatical structures, clause variety, tense, agreement and accuracy in the actual sentences. Topic relevance is NOT grammar. Do not invent an error.':'Discuss connections and organisation in the transcript only. You cannot assess acoustic fluency.';
   const messages=[{role:'system',content:request.messages[0].content+'\nEvaluate ONLY '+name+' in this call. Return exactly ONE criterion. '+focus+' Give a specific revision based on the selected evidence sentence.'},request.messages[1]];
   const result=await engine.chat.completions.create({temperature:0.4,top_p:0.9,presence_penalty:1.2,frequency_penalty:0.2,max_tokens:1600,response_format:{type:'json_object',schema:JSON.stringify(schema)},messages});
   if(result.choices[0]?.finish_reason==='length')throw Error('評論未完成，請縮短回答或改用教師評閱');
   const partial=JSON.parse(result.choices[0]?.message?.content);partial.nextStep=partial.criteria?.[0]?.revision;validateReview(partial,{...request,criteria:[name]},{model});criteria.push(partial.criteria[0]);if(!nextStep)nextStep=partial.nextStep;
  }
  return studentReview(validateReview({criteria,nextStep,unscorable:false},request,{model}));
 }finally{signal?.removeEventListener('abort',interrupt);try{if(engine)await engine.unload();}finally{busy=false;engine=null;window.LTULocalInferenceBusy=false;}}
}
