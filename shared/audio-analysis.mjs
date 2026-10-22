// Signal measurements support practice; they are not IELTS scores or a phoneme diagnosis.
export function analysePCM(samples,sampleRate){
 if(!(samples instanceof Float32Array)||sampleRate<8000||sampleRate>96000||samples.length/sampleRate>360||!samples.length)throw Error('錄音應為 1 秒至 6 分鐘，取樣率需有效。');
 if(samples.length/sampleRate<1)throw Error('錄音過短，請至少錄製 1 秒。');
 const step=Math.round(sampleRate*.02),frames=[];let clipped=0,totalSquare=0;
 for(let i=0;i<samples.length;i+=step){let square=0;const n=Math.min(step,samples.length-i);for(let j=0;j<n;j++){const v=samples[i+j];if(!Number.isFinite(v))throw Error('錄音包含無效數值');square+=v*v;if(Math.abs(v)>=.995)clipped++;}frames.push(Math.sqrt(square/n));totalSquare+=square;}
 const sorted=[...frames].sort((a,b)=>a-b),noise=sorted[Math.floor(sorted.length*.15)],threshold=Math.max(.008,Math.min(.04,noise*3));
 const intervals=[];let start=null;
 frames.forEach((rms,i)=>{if(rms<threshold&&start===null)start=i*.02;if((rms>=threshold||i===frames.length-1)&&start!==null){const end=Math.min(samples.length/sampleRate,i===frames.length-1?(i+1)*.02:i*.02);if(end-start>=.5)intervals.push({start:+start.toFixed(2),end:+end.toFixed(2)});start=null;}});
 const duration=samples.length/sampleRate,rms=Math.sqrt(totalSquare/samples.length),silenceSeconds=intervals.reduce((n,p)=>n+p.end-p.start,0);
 return {duration:+duration.toFixed(2),rms:+rms.toFixed(5),threshold:+threshold.toFixed(5),clippingRatio:clipped/samples.length,lowEnergyIntervals:intervals.slice(0,80),lowEnergySeconds:+silenceSeconds.toFixed(2),status:rms<.003?'too-quiet':clipped/samples.length>.02?'clipping':'measurable',band:null,caution:'低能量區間可能是停頓、收音距離或背景聲；不能判定猶豫原因、發音正確性或流暢度 Band。'};
}
export function speechPractice(transcript,signal){
 const words=String(transcript).match(/[a-z]+(?:['’-][a-z]+)*/gi)||[];
 const fillers=(String(transcript).match(/\b(?:um|uh|erm)\b/gi)||[]).length;
 return {...signal,transcriptWords:words.length,wordsPerMinute:signal?.duration>0?Math.round(words.length*60/signal.duration):null,transcriptFillers:fillers,band:null,caution:'每分鐘字數包含停頓；轉寫可能省略贅詞或修正文法。這些觀察不是能力分數。'};
}
