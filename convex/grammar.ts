import {query,action} from './_generated/server';
import {internal} from './_generated/api';
import {getAuthUserId} from '@convex-dev/auth/server';
import {v} from 'convex/values';
import type {Infer} from 'convex/values';
import {grammarResult} from './grammarValidators';
import {normalizeGrammar} from '../shared/grammar.mjs';

function settings(){
 const endpoint=process.env.GRAMMAR_GATEWAY_URL,token=process.env.GRAMMAR_GATEWAY_TOKEN;
 if(!endpoint||!token||token.length<32)return null;
 try{const url=new URL(endpoint);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/v1/check'||/(^|\.)(languagetool\.org|languagetoolplus\.com|grammarly\.com)$/.test(url.hostname))return null;return {url:url.toString(),token};}catch{return null;}
}
export const status=query({args:{},returns:v.object({configured:v.boolean()}),handler:async(ctx)=>({configured:!!(await getAuthUserId(ctx))&&!!settings()})});
export const check=action({args:{text:v.string(),language:v.union(v.literal('en-GB'),v.literal('en-US'))},returns:v.union(v.object({status:v.literal('checked'),cached:v.boolean(),result:grammarResult}),v.object({status:v.literal('unavailable'),message:v.string()})),handler:async(ctx,{text,language}):Promise<{status:'checked';cached:boolean;result:Infer<typeof grammarResult>}|{status:'unavailable';message:string}>=>{
 if(!await getAuthUserId(ctx))throw Error('Authentication required');
 if(!text.trim()||text.length>12000)throw Error('請輸入 1–12000 字元的作文。');
 const config=settings();if(!config)return {status:'unavailable',message:'自架文法主機尚未完成公開連線；作文已保留，請先使用免費檢查。'};
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([process.env.GRAMMAR_ENGINE_REVISION||'LanguageTool-6.6-v1',language,text])));
 const cacheKey=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 const reservation=await ctx.runMutation(internal.grammarState.reserve,{cacheKey});
 if(reservation.cached)return {status:'checked',cached:true,result:reservation.result};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
 try{
  const response=await fetch(config.url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.token},body:JSON.stringify({text,language}),redirect:'error',signal:controller.signal});
  if(!response.ok)return {status:'unavailable',message:response.status===429?'文法主機忙碌，請稍後再試。':'文法主機暫時無法使用；作文已保留。'};
  const raw=await response.json();
  // Revalidate trusted gateway data before storing or returning it.
  if(raw.engine!=='LanguageTool-selfhost'||!Array.isArray(raw.matches))throw Error('Invalid gateway response');
  const result=normalizeGrammar({software:{version:raw.engineVersion},matches:raw.matches.map((m:any)=>({...m,rule:{id:m.ruleId,category:{id:m.category},issueType:m.issueType},replacements:m.replacements?.map((value:string)=>({value}))}))},text,language);
  result.truncated=!!raw.truncated||result.truncated;
  await ctx.runMutation(internal.grammarState.complete,{cacheKey,result});
  return {status:'checked',cached:false,result};
 }catch{return {status:'unavailable',message:'文法服務連線失敗；作文仍保留，未改用任何付費服務。'};}finally{clearTimeout(timer);}
}});
