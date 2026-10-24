const {spawnSync}=require('node:child_process'),path=require('node:path');
const {open}=require('./teacher-ticket.cjs');
let stage='ticket';
try{
 const args=open(process.env.PROVISIONING_REQUEST,process.env.ASSESSOR_WORKER_TOKEN);
 stage='command';
 const result=spawnSync(process.execPath,[path.resolve('node_modules/convex/bin/main.js'),'run','--prod','speaking:provisionTeacherAccount',JSON.stringify(args)],{encoding:'utf8',stdio:'pipe',timeout:120000,windowsHide:true});
 if(result.status!==0){const output=String(result.stderr||'')+String(result.stdout||'');const reason=/Existing account details do not match/.test(output)?'account-mismatch':/Could not find|not found|not a function/i.test(output)?'function-unavailable':/authenticat|not authorized|deploy key/i.test(output)?'deployment-auth':/unknown option|too many arguments|missing required/i.test(output)?'cli-arguments':result.error?.code||'command-failed';console.error('Teacher operation diagnostic: '+reason+'; exit='+result.status);throw Error('Not completed');}
 console.log('Verified existing account has teacher access. Account identifiers were not logged.');
}catch(e){if(stage==='ticket'){const reason=e.message==='Invalid worker key'?'key-format':e.message==='Invalid or expired account request'?'request-expiry-or-format':'authentication-or-format';console.error('Teacher request diagnostic: '+reason);}console.error('Teacher access could not be confirmed. Account identifiers and secret values were not logged.');process.exitCode=1;}
