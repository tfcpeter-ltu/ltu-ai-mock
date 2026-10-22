// Run outside OneDrive. Official scripts are downloaded for local analysis, not republished.
import {writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {benchmark,rubricVersion} from '../shared/rubric.mjs';
const workspace=process.argv[2];if(!workspace)throw Error('Supply the local benchmark dependency directory');
const {getDocument}=await import(pathToFileURL(workspace+'/node_modules/pdfjs-dist/legacy/build/pdf.mjs'));
const source='https://ielts.org/cdn/computer-delivered-sample-tests-academic-writing/ielts-academic-writing-example-responses-to-parts-1-and-2-with-band-scores-and-examiner-comments.pdf';
const pdf=await getDocument({data:new Uint8Array(await(await fetch(source)).arrayBuffer()),useSystemFonts:true}).promise;
const rows=[];
for(const pageNo of [4,5]){
 const page=await pdf.getPage(pageNo),content=await page.getTextContent();
 // PDF hasEOL marks printed line wraps, not paragraph boundaries. Reconstruct
 // the original single-column paragraph spacing before judging cohesion.
 const lines=[];
 for(const item of content.items){if(!item.str?.trim())continue;const y=item.transform[5],x=item.transform[4];let line=lines.find(l=>Math.abs(l.y-y)<2);if(!line){line={y,items:[]};lines.push(line)}line.items.push({x,text:item.str});}
 lines.sort((a,b)=>b.y-a.y);
 const gaps=lines.slice(1).map((l,i)=>lines[i].y-l.y).filter(v=>v>3&&v<25).sort((a,b)=>a-b),spacing=gaps[Math.floor(gaps.length/2)]||12;
 const text=lines.map((l,i)=>(i?(lines[i-1].y-l.y>spacing*1.45?'\n\n':' '):'')+l.items.sort((a,b)=>a.x-b.x).map(x=>x.text).join(' ')).join('').replace(/[ \t]+/g,' ');
 const expected=Number(text.match(/Band\s*(\d(?:\.\d)?)/)?.[1]);
 const response=text.split(/Candidate Response \d\s*/)[1]?.split(/Examiner comment/)[0]?.replace(/^\s*WRITING TASK 2\s*/,'').trim();
 if(!Number.isFinite(expected)||!response)throw Error('Official sample parsing failed');
 // Paraphrased topic; this is explicitly not a verbatim-task fidelity benchmark.
 const prompt='Argue whether future populations will be less healthy than those alive today. Explain your degree of agreement, with reasons and examples, in at least 250 words.';
 const start=Date.now();
 const result=await fetch('http://127.0.0.1:8782/review',{method:'POST',headers:{'Content-Type':'application/json','Origin':'http://127.0.0.1:8782','X-LTU-Assessor':'1'},body:JSON.stringify({skill:'writing',taskType:'task2',prompt,response}),signal:AbortSignal.timeout(970000)});
 const data=await result.json();if(!result.ok)throw Error(data.error);
 writeFileSync(workspace+'/review-'+pageNo+'.json',JSON.stringify(data,null,2));
 rows.push({id:'academic-task2-response-'+(pageNo-3),model:data.review.model,source,page:pageNo,expected,predicted:data.operatorCandidateBand,criteria:data.operatorCriteria,seconds:Math.round((Date.now()-start)/1000),studentBand:data.review.band});
 console.log(JSON.stringify(rows.at(-1)));
}
const report={testedAt:new Date().toISOString(),rubricVersion,model:rows[0].model,strategy:'per-criterion-full-official-v1',layout:'pdf-baseline-paragraph-spacing-v2',independent:false,calibrationPassed:false,note:'Topic is paraphrased. Public samples may have occurred in model training. Two scripts are a smoke benchmark, not independent calibration or EPT validation.',...benchmark(rows),rows};
mkdirSync(workspace,{recursive:true});writeFileSync(workspace+'/official-benchmark.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
