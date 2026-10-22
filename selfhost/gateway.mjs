import http from 'node:http';
import {readFileSync} from 'node:fs';
import {timingSafeEqual} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {normalizeGrammar} from '../shared/grammar.mjs';

export function createGateway({token,engineUrl='http://127.0.0.1:8081/v2/check',fetchImpl=fetch,maxConcurrent=2}={}){
 if(typeof token!=='string'||token.length<32)throw Error('Gateway requires a strong server-side token');
 const engine=new URL(engineUrl);
 if(engine.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(engine.hostname)||engine.pathname!=='/v2/check')throw Error('Engine must be your local LanguageTool instance');
 const expected=Buffer.from('Bearer '+token);let active=0;
 const server=http.createServer(async(req,res)=>{
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
  const supplied=Buffer.from(req.headers.authorization||'');
  if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return send(401,{error:'Authentication required'});
  if(req.method!=='POST'||req.url!=='/v1/check')return send(404,{error:'Not found'});
  if(!String(req.headers['content-type']||'').startsWith('application/json'))return send(415,{error:'JSON required'});
  if(Number(req.headers['content-length']||0)>65536)return send(413,{error:'Request too large'});
  if(active>=maxConcurrent)return send(429,{error:'Service busy; retry later'});
  active++;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
   let size=0;const parts=[];
   for await(const part of req){size+=part.length;if(size>65536)throw Error('Request too large');parts.push(part);}
   let input;try{input=JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{return send(400,{error:'Invalid JSON'});}
   if(typeof input.text!=='string'||!input.text.trim()||input.text.length>12000||!['en-GB','en-US'].includes(input.language))return send(400,{error:'Use 1–12000 characters and en-GB or en-US'});
   const response=await fetchImpl(engine,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({text:input.text,language:input.language}),redirect:'error',signal:controller.signal});
   if(!response.ok)return send(502,{error:'Local grammar engine unavailable'});
   if(Number(response.headers.get('content-length')||0)>2000000)throw Error('Engine response too large');
   const chunks=[];let bytes=0;
   for await(const chunk of response.body){bytes+=chunk.length;if(bytes>2000000)throw Error('Engine response too large');chunks.push(chunk);}
   const result=normalizeGrammar(JSON.parse(Buffer.concat(chunks).toString('utf8')),input.text,input.language);
   return send(200,result);
  }catch{return send(503,{error:'Grammar service unavailable; original text was not changed'});}
  finally{clearTimeout(timer);active--;}
 });
 server.requestTimeout=10000;server.headersTimeout=10000;
 return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const token=process.env.LT_GATEWAY_TOKEN_FILE?readFileSync(process.env.LT_GATEWAY_TOKEN_FILE,'utf8').trim():process.env.LT_GATEWAY_TOKEN;
 const server=createGateway({token,engineUrl:process.env.LT_ENGINE_URL});
 server.listen(Number(process.env.LT_GATEWAY_PORT||8781),process.env.LT_GATEWAY_HOST||'127.0.0.1',()=>console.log('Authenticated local grammar gateway ready. Essay content is not logged.'));
}
