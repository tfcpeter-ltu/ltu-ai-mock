export const FILE_CAP=8*1024*1024, STORAGE_CAP=200*1024*1024, QUEUE_CAP=100;
export function audioHeaderMatches(bytes:Uint8Array,mime:string){const starts=(header:number[])=>header.every((b,i)=>bytes[i]===b);const ascii=(offset:number,text:string)=>Array.from(text).every((c,i)=>bytes[offset+i]===c.charCodeAt(0));if(bytes.length<12)return false;if(mime==='audio/webm')return starts([0x1a,0x45,0xdf,0xa3]);if(mime==='audio/ogg')return ascii(0,'OggS');if(mime==='audio/wav')return ascii(0,'RIFF')&&ascii(8,'WAVE');if(mime==='audio/mp4')return ascii(4,'ftyp');if(mime==='audio/mpeg')return ascii(0,'ID3')||(bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0);return false;}
export function boundedText(value:string,max:number,label:string){if(!value.trim()||value.length>max)throw Error(`Invalid ${label}`);}
export function validBand(value:number){return Number.isFinite(value)&&value>=0&&value<=9&&Number.isInteger(value*2);}
export function validateReview(review:any){
 for(const name of ['fluency','lexical','grammar','pronunciation']){if(!validBand(review[name]?.band))throw Error('Invalid criterion band');boundedText(review[name].comment,4000,'criterion comment');if(!review.evidence.some((e:any)=>e.criterion===name))throw Error('Evidence required for every criterion');}
 boundedText(review.overallComment,8000,'comment');
 if(review.listenedOriginal!==true)throw Error('Original audio must be listened to');
 if(review.evidence.length<3||review.evidence.length>24)throw Error('Evidence required for all three parts');
 for(const part of [1,2,3])if(!review.evidence.some((e:any)=>e.part===part))throw Error('Evidence required for all three parts');
 for(const e of review.evidence){if(!Number.isFinite(e.startSeconds)||!Number.isFinite(e.endSeconds)||e.startSeconds<0||e.endSeconds<=e.startSeconds||e.endSeconds>1800)throw Error('Invalid audio timestamp');boundedText(e.quote,1000,'quote');boundedText(e.note,2000,'evidence');}
}
export function validateReport(report:any,text:string,kind:string){
 boundedText(report.summary,8000,'summary');if(!report.nextSteps.length||report.nextSteps.length>8)throw Error('Invalid next steps');for(const step of report.nextSteps)boundedText(step,2000,'next step');
 const names=kind==='writing'?['task','coherence','lexical','grammar']:['coherence','lexical','grammar'];
 if(report.criteria.length!==names.length||new Set(report.criteria.map((c:any)=>c.name)).size!==names.length)throw Error('Invalid criterion set');
 for(const c of report.criteria){if(!names.includes(c.name)||!validBand(c.band))throw Error('Invalid criterion');boundedText(c.comment,4000,'criterion comment');if(!c.evidence.length||c.evidence.length>8)throw Error('Evidence required');for(const e of c.evidence){boundedText(e.quote,1000,'quote');boundedText(e.explanation,2000,'explanation');if(!text.includes(e.quote))throw Error('Evidence must quote submitted text exactly');}}
}
export function publicReport(report:any,allowed:boolean){if(!report)return null;return {summary:report.summary,nextSteps:report.nextSteps,criteria:report.criteria.map((c:any)=>({name:c.name,comment:c.comment,evidence:c.evidence,band:allowed?c.band:null}))};}
