import {useEffect,useRef} from 'react';
import {useAction,useQuery} from 'convex/react';
import {anyApi} from 'convex/server';

export function useGrammarBridge(frameRef){
 const check=useAction(anyApi.grammar.check),status=useQuery(anyApi.grammar.status,{}),busy=useRef(false);
 useEffect(()=>{
  const receive=async event=>{
   if(event.origin!==location.origin||event.source!==frameRef.current?.contentWindow||event.data?.type!=='ltu-grammar-request')return;
   const {id,kind,text,language}=event.data,source=event.source;
   if(typeof id!=='string'||id.length>80)return;
   const reply=payload=>source.postMessage({type:'ltu-grammar-response',id,...payload},location.origin);
   if(kind==='status'){reply({value:{configured:!!status?.configured}});return;}
   if(kind!=='check'||typeof text!=='string'||!text.trim()||text.length>12000||!['en-US','en-GB'].includes(language)){reply({error:'文法檢查請求格式不正確。'});return;}
   if(!status?.configured){reply({error:'自架文法主機尚未完成公開連線，請先使用免費檢查。'});return;}
   if(busy.current){reply({error:'已有文法檢查進行中，請稍候。'});return;}
   busy.current=true;
   try{reply({value:await check({text,language})});}catch{reply({error:'文法檢查暫時無法完成，請稍候再試；作文已保留。'});}finally{busy.current=false;}
  };
  window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);
 },[check,status?.configured,frameRef]);
}
