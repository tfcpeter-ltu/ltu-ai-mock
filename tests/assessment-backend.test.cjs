const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise registered handlers, not source-string assertions. Convex supplies
// transactional OCC and runtime validators in production; this indexed mock
// verifies our authorization, quota, evidence, and lease decisions.
function harness() {
  let now = 1_800_000_000_000, sequence = 0;
  const rows = new Map(), storage = new Map(), modules = {};
  const v = new Proxy({}, {get: () => () => ({})});
  const internal = {
    speaking: Object.fromEntries(['reserveAudio','finishAudio','cancelAudio','audioAccess'].map(n => [n, `speaking.${n}`])),
    assessmentQueue: Object.fromEntries(['enqueue','lease','complete','fail'].map(n => [n, `assessmentQueue.${n}`])),
  };
  function load(name) {
    if (modules[name]) return modules[name];
    const box = {exports:{}, TextEncoder, TextDecoder, Uint8Array, Request, Response, Blob,
      crypto:require('node:crypto').webcrypto, process:{env:{}},
      Date:class extends Date {static now() {return now;}},
      require(specifier) {
        if (specifier === 'convex/values') return {v};
        if (specifier === 'convex/server') return {paginationOptsValidator:{}};
        if (specifier === '@convex-dev/auth/server') return {getAuthUserId:async ctx => ctx.uid ?? null};
        if (specifier === './_generated/server') return Object.fromEntries(['query','mutation','internalQuery','internalMutation','action','httpAction'].map(n => [n, definition => definition]));
        if (specifier === './_generated/api') return {internal};
        if (specifier.startsWith('./')) return load(specifier.slice(2));
        throw Error(`Unexpected dependency ${specifier}`);
      },
    };
    const source = fs.readFileSync(path.join(__dirname, '../convex', `${name}.ts`), 'utf8');
    vm.runInNewContext(ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, box, {filename:name});
    return modules[name] = box.exports;
  }
  async function insert(table, value) {const id = `${table}:${++sequence}`; rows.set(id, {...value, _id:id, _creationTime:now, table}); return id;}
  const db = {
    get:async id => rows.get(id) ?? null,
    insert,
    patch:async (id, value) => {assert(rows.has(id)); Object.assign(rows.get(id), value);},
    system:{get:async id => storage.get(id) ?? null},
    query(table) {
      const conditions = []; let descending = false;
      const selected = () => {
        const matches = [...rows.values()].filter(r => r.table === table && conditions.every(test => test(r)));
        return descending ? matches.reverse() : matches;
      };
      const query = {
        withIndex(_index, fn) {
          const range = {eq(key, value) {conditions.push(r => r[key] === value); return range;}, lt(key, value) {conditions.push(r => r[key] < value); return range;}};
          fn(range); return query;
        },
        order(direction) {descending = direction === 'desc'; return query;},
        take:async count => selected().slice(0, count),
        first:async () => selected()[0] ?? null,
        unique:async () => {const found = selected(); assert(found.length <= 1, 'Unique index lookup returned duplicate records'); return found[0] ?? null;},
        paginate:async options => ({page:selected().slice(0, options.numItems), isDone:selected().length <= options.numItems, continueCursor:''}),
      };
      return query;
    },
  };
  const ctx = uid => ({uid, db});
  return {load,ctx,rows,storage,insert,advance:ms => {now += ms;},now:() => now,
    table:name => [...rows.values()].filter(r => r.table === name)};
}
function writingArgs(overrides={}) {return {kind:'writing',task:'ielts-writing-task2',prompt:'How should cities improve transport?',text:'Public transport should improve. Cities need frequent buses.',model:'tested-model-1',rubric:'ielts-public-2023',cacheKey:'digest-one',...overrides};}
function report(overrides={}) {return {summary:'An evidence-based draft.',nextSteps:['Develop a concrete example.'],criteria:['task','coherence','lexical','grammar'].map(name => ({name,band:6.5,comment:'Criterion-specific explanation.',evidence:[{quote:'Public transport',explanation:'Exact words from the submitted response.'}]})),...overrides};}
function reviewArgs(sessionId) {return {sessionId,listenedOriginal:true,overallComment:'Feedback on all three original recordings.',...Object.fromEntries(['fluency','lexical','grammar','pronunciation'].map(name => [name,{band:6.5,comment:`Specific ${name} feedback.`}])),evidence:['fluency','lexical','grammar','pronunciation'].map((criterion,index) => ({criterion,part:index%3+1,startSeconds:1,endSeconds:3,quote:'Original spoken words.',note:'What the reviewer heard.',criterion}))};}

async function speakingTests() {
  const h=harness(), s=h.load('speaking'), student=h.ctx('student-a'), teacher=h.ctx('teacher-a');
  await h.insert('profiles',{userId:'student-a',role:'student',displayName:'Student A',studentCode:'A001'});
  await h.insert('profiles',{userId:'teacher-a',role:'teacher'});
  await assert.rejects(s.createSession.handler(h.ctx(null),{}), /Authentication/);
  const sessionId=await s.createSession.handler(student,{setNumber:1});
  await assert.rejects(s.savePart.handler(h.ctx('student-b'),{sessionId,part:1,prompt:'Town',answerText:'Small town'}), /not found/);
  await assert.rejects(s.session.handler(h.ctx('student-b'),{sessionId}), /not found/);
  await assert.rejects(s.teacherQueue.handler(student,{paginationOpts:{numItems:10,cursor:null}}), /Teacher/);
  await assert.rejects(s.submitSession.handler(student,{sessionId}), /three parts/);
  for (const part of [1,2,3]) {
    await s.savePart.handler(student,{sessionId,part,prompt:`Part ${part} prompt`,answerText:'Original spoken words.'});
    const args={sessionId,part,bytes:100,mimeType:'audio/webm'};
    if(part===1) {
      const failed=await s.reserveAudio.handler(student,args);
      assert.equal(h.table('assessmentBudget')[0].bytes,100);
      await assert.rejects(s.reserveAudio.handler(student,args),/already has/);
      await s.cancelAudio.handler(student,{audioId:failed});
      assert.equal(h.table('assessmentBudget')[0].bytes,0,'Failed unstored upload must refund reserved bytes');
    }
    const audioId=await s.reserveAudio.handler(student,args);
    const storageId=`storage-${part}`;h.storage.set(storageId,{size:100});
    await s.finishAudio.handler(student,{audioId,storageId});
    assert.equal((await s.audioAccess.handler(student,{audioId})).storageId,storageId);
    assert.equal((await s.audioAccess.handler(teacher,{audioId})).storageId,storageId);
    await assert.rejects(s.audioAccess.handler(h.ctx('student-b'),{audioId}), /not found/);
  }
  assert.equal(h.table('assessmentBudget')[0].bytes,300);
  await s.submitSession.handler(student,{sessionId});
  await assert.rejects(s.savePart.handler(student,{sessionId,part:1,prompt:'Changed',answerText:'Changed'}), /already submitted/);
  const queue=await s.teacherQueue.handler(teacher,{paginationOpts:{numItems:10,cursor:null}});
  assert.equal(queue.page.length,1);assert.equal(queue.page[0].owner.studentCode,'A001');
  assert.equal((await s.session.handler(student,{sessionId})).owner,null);
  const review=reviewArgs(sessionId);
  await assert.rejects(s.review.handler(student,review), /Teacher/);
  await assert.rejects(s.review.handler(teacher,{...review,listenedOriginal:false}), /listened/);
  await assert.rejects(s.review.handler(teacher,{...review,evidence:review.evidence.map(e=>e.part===3?{...e,part:1}:e)}), /three parts/);
  await assert.rejects(s.review.handler(teacher,{...review,pronunciation:{band:6.5,comment:''}}), /comment/);
  await assert.rejects(s.review.handler(teacher,{...review,evidence:review.evidence.map(e=>({...e,criterion:'grammar'}))}), /every criterion/);
  await assert.rejects(s.review.handler(teacher,{...review,fluency:{band:6.3,comment:'Bad increment'}}), /band/);
  await assert.rejects(s.review.handler(teacher,{...review,evidence:review.evidence.map(e=>({...e,endSeconds:e.startSeconds}))}), /timestamp/);
  await s.review.handler(teacher,review);
  const reviewed=await s.session.handler(student,{sessionId});
  assert.equal(reviewed.status,'reviewed');assert.equal(reviewed.humanReview.band,6.5);assert.equal(reviewed.humanReview.reviewerId,'teacher-a');
  await assert.rejects(s.review.handler(teacher,review), /Submitted session/);
  h.advance(11000);const other=await s.createSession.handler(student,{});
  await s.savePart.handler(student,{sessionId:other,part:1,prompt:'Another prompt',answerText:''});
  await assert.rejects(s.reserveAudio.handler(student,{sessionId:other,part:1,bytes:8388609,mimeType:'audio/webm'}), /size limit/);
  h.table('assessmentBudget')[0].bytes=209715200-50;
  await assert.rejects(s.reserveAudio.handler(student,{sessionId:other,part:1,bytes:100,mimeType:'audio/webm'}), /budget reached/);
  assert.equal(h.table('assessmentBudget')[0].bytes,209715200-50,'Rejected reservation must not change storage budget');
}

async function queueTests() {
  const h=harness(), a=h.load('assessmentQueue'), user=h.ctx('student-a');
  await assert.rejects(a.enqueue.handler(h.ctx(null),writingArgs()), /Authentication/);
  const jobId=await a.enqueue.handler(user,writingArgs());
  assert.equal(await a.enqueue.handler(user,writingArgs()),jobId,'Same payload is cached per owner');
  await assert.rejects(a.enqueue.handler(user,writingArgs({cacheKey:'different'})), /30 seconds/);
  const otherJob=await a.enqueue.handler(h.ctx('student-b'),writingArgs());assert.notEqual(otherJob,jobId,'Cache must not cross student accounts');
  const lease=await a.lease.handler(user,{leaseToken:'lease-a'});
  assert.equal(lease.jobId,jobId);
  const second=await a.lease.handler(user,{leaseToken:'lease-b'});assert.equal(second.jobId,otherJob);
  assert.equal(await a.lease.handler(user,{leaseToken:'lease-c'}),null,'Leased work must not be delivered twice');
  await assert.rejects(a.complete.handler(user,{jobId,leaseToken:'wrong-token',report:report()}), /lease/);
  const fake=report();fake.criteria[0].evidence[0].quote='Invented quotation';
  await assert.rejects(a.complete.handler(user,{jobId,leaseToken:'lease-a',report:fake}), /quote submitted text/);
  await assert.rejects(a.complete.handler(user,{jobId,leaseToken:'lease-a',report:report({criteria:report().criteria.slice(0,3)})}), /criterion set/);
  h.advance(10*60000+1);
  await assert.rejects(a.complete.handler(user,{jobId,leaseToken:'lease-a',report:report()}), /expired lease/);
  const renewed=await a.lease.handler(user,{leaseToken:'renewed'});assert.equal(renewed.jobId,jobId);
  await assert.rejects(a.complete.handler(user,{jobId,leaseToken:'lease-a',report:report()}), /lease/);
  await a.complete.handler(user,{jobId,leaseToken:'renewed',report:report()});
  assert.equal(h.table('assessmentBudget')[0].pending,1);
  const safe=await a.job.handler(user,{jobId});assert.equal(safe.scorePermitted,false);assert(safe.report.criteria.every(c=>c.band===null));
  await assert.rejects(a.job.handler(h.ctx('student-b'),{jobId}), /not found/);
  const policy={model:'tested-model-1',rubric:'ielts-public-2023',task:'ielts-writing-task2',enabled:true,independent:true,sampleCount:20,mae:0.5,withinOne:0.95,evidenceUrl:'https://example.edu/independent-benchmark'};
  await assert.rejects(a.configureCalibration.handler(user,{...policy,sampleCount:19}), /thresholds/);
  await assert.rejects(a.configureCalibration.handler(user,{...policy,mae:0.51}), /thresholds/);
  await assert.rejects(a.configureCalibration.handler(user,{...policy,withinOne:0.94}), /thresholds/);
  await a.configureCalibration.handler(user,{...policy,model:'different-model'});
  assert.equal((await a.job.handler(user,{jobId})).scorePermitted,false,'Model must match exactly');
  await a.configureCalibration.handler(user,{...policy,rubric:'different-rubric'});
  assert.equal((await a.job.handler(user,{jobId})).scorePermitted,false,'Rubric must match exactly');
  await a.configureCalibration.handler(user,{...policy,task:'ielts-writing-task1'});
  assert.equal((await a.job.handler(user,{jobId})).scorePermitted,false,'Task must match exactly');
  await a.configureCalibration.handler(user,policy);
  assert.equal((await a.job.handler(user,{jobId})).report.criteria[0].band,6.5);
  const exact=h.table('assessmentCalibration').find(p=>p.model===policy.model&&p.rubric===policy.rubric&&p.task===policy.task);
  exact.independent=false;assert.equal((await a.job.handler(user,{jobId})).scorePermitted,false,'Independent benchmark flag is mandatory');exact.independent=true;
  exact.enabled=false;assert.equal((await a.job.handler(user,{jobId})).scorePermitted,false);exact.enabled=true;
  h.rows.get(jobId).kind='speaking-text';assert.equal((await a.job.handler(user,{jobId})).scorePermitted,false,'Transcript feedback can never expose full speaking score');
  const failing=await a.lease.handler(user,{leaseToken:'failure-lease'});assert.equal(failing.jobId,otherJob);
  await assert.rejects(a.fail.handler(user,{jobId:otherJob,leaseToken:'wrong-lease',error:'unsupported-model'}),/lease/);
  await a.fail.handler(user,{jobId:otherJob,leaseToken:'failure-lease',error:'insufficient-evidence'});
  assert.equal(h.rows.get(otherJob).status,'failed');assert.equal(h.rows.get(otherJob).error,'The local assessment did not provide verifiable evidence.');
  assert.equal(h.table('assessmentBudget')[0].pending,0,'Failed lease must free one pending slot');
  await assert.rejects(a.fail.handler(user,{jobId:otherJob,leaseToken:'failure-lease',error:'inference-unavailable'}),/lease/);
  h.table('assessmentBudget')[0].pending=100;
  await assert.rejects(a.enqueue.handler(h.ctx('new-user'),writingArgs({cacheKey:'queue-cap'})), /queue full/);
  assert.equal(h.table('assessmentBudget')[0].pending,100);
  const rate=h.table('assessmentRate').find(r=>r.userId==='student-a');rate.lastAt=h.now()-30001;rate.windowAt=h.now();rate.count=10;
  await assert.rejects(a.enqueue.handler(user,writingArgs({cacheKey:'hour-cap'})), /Hourly/);
}

async function bodyTests() {
  const h=harness(), http=h.load('assessmentHttp'), rules=h.load('assessmentRules');
  for(const route of ['pull','complete','fail']) assert.equal((await http[route]({},new Request('https://example.test/assessor',{method:'POST',body:'{}'}))).status,401,'Worker HTTP endpoints must fail closed without configured secret');
  assert.equal((await http.uploadAudio(h.ctx(null),new Request('https://example.test/speaking/audio',{method:'POST',body:'not audio'}))).status,401);
  assert.equal((await http.readAudio(h.ctx(null),new Request('https://example.test/speaking/audio?audioId=other'))).status,401);
  await assert.rejects(http.boundedBody(new Request('https://example.test',{method:'POST',body:'123456'}),5), /too large/);
  await assert.rejects(http.boundedBody(new Request('https://example.test',{method:'POST',body:''}),5), /Empty/);
  assert.equal((await http.boundedBody(new Request('https://example.test',{method:'POST',body:'12345'}),5)).length,5);
  assert(!rules.audioHeaderMatches(new TextEncoder().encode('not an audio recording'),'audio/webm'));
  assert(rules.audioHeaderMatches(Uint8Array.from([26,69,223,163,0,0,0,0,0,0,0,0]),'audio/webm'));
  assert(!rules.validBand(NaN));assert(!rules.validBand(9.5));assert(!rules.validBand(-0.5));
  for(const label of ['Band 6','band score:7.5','score of 8/9','7.5 bands','7/9']) {
    const hidden=rules.hideUnvalidatedScoreText(`Draft feedback: ${label}.`);
    assert(hidden.includes('[unvalidated score hidden]'));assert(!hidden.includes(label));
  }
  const ordinary='Use 2 examples in 4 paragraphs and write 250 words. Review lesson 19/9.';
  assert.equal(rules.hideUnvalidatedScoreText(ordinary),ordinary,'Ordinary quantities must remain intact');
  const leaking=report({summary:'Overall Band 6.',nextSteps:['Move beyond band score:7.5.']});
  leaking.criteria[0].comment='limiting lexical resource to Band 6.';
  leaking.criteria[0].evidence[0]={quote:'Public transport',explanation:'This suggests a score of 8/9.'};
  const hidden=rules.publicReport(leaking,false);
  assert(!hidden.summary.includes('Band 6'));assert(!hidden.nextSteps[0].includes('7.5'));
  assert(!hidden.criteria[0].comment.includes('Band 6'));assert(!hidden.criteria[0].evidence[0].explanation.includes('8/9'));
  assert.equal(hidden.criteria[0].evidence[0].quote,'Public transport','Evidence quotations must remain exact');
  const allowed=rules.publicReport(leaking,true);assert.equal(allowed.criteria[0].comment,'limiting lexical resource to Band 6.');assert.equal(allowed.summary,'Overall Band 6.');
}

async function teacherProvisioningTests() {
  const h=harness(), s=h.load('speaking'), operator=h.ctx(null);
  const userId=await h.insert('users',{email:'teacher@example.edu'});
  const profileId=await h.insert('profiles',{userId,studentCode:'LTU-ABC123',role:'student',displayName:'Existing teacher',membershipStatus:'trial'});
  const initialSize=h.rows.size;
  await assert.rejects(s.provisionTeacherAccount.handler(operator,{email:'teacher@example.edu',studentCode:'LTU-WRONG'}),/details do not match/);
  await assert.rejects(s.provisionTeacherAccount.handler(operator,{email:'wrong@example.edu',studentCode:'LTU-ABC123'}),/details do not match/);
  assert.equal(h.rows.get(profileId).role,'student','Mismatched account details must not grant a role');
  const result=await s.provisionTeacherAccount.handler(operator,{email:' Teacher@Example.EDU ',studentCode:' LTU-ABC123 '});
  assert.equal(result.role,'teacher');assert.equal(h.rows.get(profileId).role,'teacher');
  assert.equal(h.rows.get(profileId).displayName,'Existing teacher');assert.equal(h.rows.get(profileId).membershipStatus,'trial');
  assert.equal(h.rows.size,initialSize,'Provisioning must not create an identity or profile');
  assert.equal((await s.provisionTeacherAccount.handler(operator,{email:'teacher@example.edu',studentCode:'LTU-ABC123'})).role,'teacher','Teacher provisioning is idempotent');
  h.rows.get(profileId).role='admin';
  assert.equal((await s.provisionTeacherAccount.handler(operator,{email:'teacher@example.edu',studentCode:'LTU-ABC123'})).role,'admin');
  assert.equal(h.rows.get(profileId).role,'admin','Existing admin must never be downgraded');
  await h.insert('users',{email:'without-profile@example.edu'});
  await assert.rejects(s.provisionTeacherAccount.handler(operator,{email:'without-profile@example.edu',studentCode:'LTU-NOPROFILE'}),/details do not match/);
  const orphan=await h.insert('profiles',{userId:'missing-auth-user',studentCode:'LTU-ORPHAN',role:'student'});
  await assert.rejects(s.provisionTeacherAccount.handler(operator,{email:'teacher@example.edu',studentCode:'LTU-ORPHAN'}),/details do not match/);
  assert.equal(h.rows.get(orphan).role,'student');
}

(async()=>{await speakingTests();await queueTests();await bodyTests();await teacherProvisioningTests();console.log('PASS assessment backend handlers: account/teacher authorization, complete original-audio review, storage quota, cache/rates, leases/evidence, independent exact-policy gating, bounded uploads, and verified existing-account teacher provisioning.');})().catch(error=>{console.error(error);process.exitCode=1;});
