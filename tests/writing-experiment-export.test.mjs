import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const directory=mkdtempSync(join(tmpdir(),'ltu-writing-export-'));
try{
 const row={id:'sample',expected:7,predicted:6.5,strategy:'score-only',seed:42,criteria:[6,7,6,7],seconds:1,response:'DO NOT EXPORT ESSAY',prompt:'DO NOT EXPORT PROMPT',error:'DO NOT EXPORT RAW ERROR'};
 const report={model:'fixed-model',rows:[row],token:'DO NOT EXPORT TOKEN'};
 writeFileSync(join(directory,'writing-experiment-old.json'),JSON.stringify(report));
 writeFileSync(join(directory,'writing-experiment-copy.json'),JSON.stringify(report));
 const out=join(directory,'summary.json');
 execFileSync(process.execPath,[fileURLToPath(new URL('../selfhost/summarize-writing-experiments.mjs',import.meta.url)),directory,out]);
 const text=readFileSync(out,'utf8'),summary=JSON.parse(text);
 assert.ok(!text.includes('DO NOT EXPORT'));assert.equal(summary.calibrationPassed,false);
 assert.equal(summary.comparisons[0].uniqueScripts,1);assert.equal(summary.comparisons[0].attempted,1);assert.equal(summary.comparisons[0].mae,.5);
 console.log('PASS: exported report excludes essay/prompt/error/token fields, duplicate files never inflate trials, research cannot claim calibration.');
}finally{rmSync(directory,{recursive:true,force:true});}
