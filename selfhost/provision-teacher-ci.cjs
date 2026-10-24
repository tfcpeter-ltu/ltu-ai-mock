const {spawnSync}=require('node:child_process'),path=require('node:path');
const {open}=require('./teacher-ticket.cjs');
try{
 const args=open(process.env.PROVISIONING_REQUEST,process.env.ASSESSOR_WORKER_TOKEN);
 const result=spawnSync(process.execPath,[path.resolve('node_modules/convex/bin/main.js'),'run','--prod','speaking:provisionTeacherAccount',JSON.stringify(args)],{encoding:'utf8',stdio:'pipe',timeout:120000,windowsHide:true});
 if(result.status!==0)throw Error('Not completed');
 console.log('Verified existing account has teacher access. Account identifiers were not logged.');
}catch{console.error('Teacher access could not be confirmed. Check the supplied account identifiers, request expiry and deployment.');process.exitCode=1;}
