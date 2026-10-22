import assert from 'node:assert/strict';
import {studentReview,hideUnvalidatedScoreText} from '../shared/rubric.mjs';
const reason='Spelling limits lexical resource to Band 6.',quote='I want to achieve Band 7 in 2027.';
const report={candidateBand:6,band:null,nextStep:'Aim for a band score: 7.5.',criteria:[{candidateBand:6,evidence:quote,reason,revision:'Revise sentence 3 with 2 examples.'}]};
const safe=studentReview(report);assert.equal(safe.criteria[0].band,null);assert.equal(safe.criteria[0].evidence,quote);assert.ok(!safe.criteria[0].reason.includes('Band 6'));assert.ok(!safe.nextStep.includes('7.5'));assert.equal(safe.criteria[0].revision,'Revise sentence 3 with 2 examples.');assert.equal(safe.candidateBand,undefined);
assert.equal(studentReview({...report,band:6}).criteria[0].reason,reason);
for(const phrase of ['Band 6','IELTS band score: 7.5','score of 8/9','7.5 bands','7/9'])assert.equal(hideUnvalidatedScoreText(phrase),'[分數待驗證]');
assert.equal(hideUnvalidatedScoreText('3 paragraphs, 250 words and 2 examples.'),'3 paragraphs, 250 words and 2 examples.');
console.log('PASS: unvalidated grades hidden in feedback prose; original quotations and ordinary task numbers preserved.');
