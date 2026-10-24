const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {seal}=require('./teacher-ticket.cjs');
(async()=>{
 const [email,studentCode]=process.argv.slice(2);if(!email||email.length>254||!/^LTU-[A-Z0-9]{6}$/.test(studentCode||''))throw Error('Provide the designated email and independently confirmed login student code.');
 const token=fs.readFileSync(path.join(process.env.LOCALAPPDATA,'LTU','Assessor','worker-token.txt'),'utf8').trim(),request=seal({email:email.trim().toLowerCase(),studentCode,expiresAt:Date.now()+30*60000},token);
 const result=spawnSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',windowsHide:true}),fields=Object.fromEntries(result.stdout.trim().split(/\r?\n/).map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1)]}));if(!fields.password)throw Error('GitHub authentication unavailable');
 const response=await fetch('https://api.github.com/repos/tfcpeter-ltu/ltu-ai-mock/actions/workflows/teacher-provision.yml/dispatches',{method:'POST',headers:{Authorization:'Bearer '+fields.password,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify({ref:'main',inputs:{encrypted_request:request}})});if(!response.ok)throw Error('Encrypted request dispatch failed: '+response.status);
 console.log('Encrypted, expiring teacher-account request dispatched. No account identifiers or key values were logged.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
