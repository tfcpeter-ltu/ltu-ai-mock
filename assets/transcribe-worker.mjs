// Public weights are downloaded; audio never leaves this worker's device.
let pipelinePromise,active=false;
self.onmessage=async({data})=>{
 const {id,samples}=data;if(active){self.postMessage({id,error:'已有轉寫進行中'});return;}active=true;
 try{
  if(!(samples instanceof Float32Array)||samples.length<16000||samples.length>16000*360)throw Error('錄音應為 1 秒至 6 分鐘');
  if(!pipelinePromise)pipelinePromise=(async()=>{const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');env.allowLocalModels=false;env.backends.onnx.wasm.numThreads=1;return pipeline('automatic-speech-recognition','onnx-community/whisper-tiny.en',{revision:'2575352d61be1bf7225cf8f8b268a4678025fc58',device:'wasm',dtype:'q8',progress_callback:p=>{if(p.status==='progress')self.postMessage({id,progress:'下載本機轉寫模型 '+Math.round(p.progress||0)+'%'});}});})();
  const transcriber=await pipelinePromise;
  self.postMessage({id,progress:'正在此裝置轉寫錄音，沒有上傳音訊…'});
  const result=await transcriber(samples,{chunk_length_s:30,stride_length_s:5,return_timestamps:true});
  self.postMessage({id,result:{text:result.text,chunks:result.chunks}});
 }catch(e){pipelinePromise=null;self.postMessage({id,error:e.message||'本機轉寫失敗'});}finally{active=false;}
};
