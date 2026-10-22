// The complete copyrighted descriptor text stays in the local runtime, never the public site.
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const [deps,runtime]=process.argv.slice(2);if(!deps||!runtime)throw Error('Supply dependency and runtime directories');
const {getDocument}=await import(pathToFileURL(deps+'/node_modules/pdfjs-dist/legacy/build/pdf.mjs'));
const source='https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf';
const bytes=new Uint8Array(await(await fetch(source)).arrayBuffer());const pdf=await getDocument({data:bytes,useSystemFonts:true}).promise;
const sections={letter:[],task2:[]};
for(let n=3;n<=9;n++){if(n===6)continue;const content=await(await pdf.getPage(n)).getTextContent();const text=content.items.map(x=>x.str+(x.hasEOL?'\n':' ')).join('').replace(/[ \t]+/g,' ');sections[n<=5?'letter':'task2'].push(text);}
writeFileSync(runtime+'/official-rubrics.json',JSON.stringify({source,preparedAt:new Date().toISOString(),letter:sections.letter.join('\n'),task2:sections.task2.join('\n')}));console.log('Official rubric text prepared in the local runtime only.');
