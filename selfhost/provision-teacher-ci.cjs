const {ConvexHttpClient}=require('convex/browser');
const {makeFunctionReference}=require('convex/server');
const {open}=require('./teacher-ticket.cjs');
(async()=>{let stage='ticket';try{
 const args=open(process.env.PROVISIONING_REQUEST,process.env.ASSESSOR_WORKER_TOKEN);
 stage='account';
 const client=new ConvexHttpClient('https://dashing-quail-760.convex.cloud',{logger:false});
 client.setAdminAuth(process.env.CONVEX_DEPLOY_KEY);
 const result=await client.function(makeFunctionReference('speaking:provisionTeacherAccount'),undefined,args);
 if(!['teacher','admin'].includes(result?.role))throw Error('Unexpected role result');
 console.log('Verified existing account has teacher access. Account identifiers were not logged.');
}catch(e){if(stage==='ticket'){const reason=e.message==='Invalid worker key'?'key-format':e.message==='Invalid or expired account request'?'request-expiry-or-format':'authentication-or-format';console.error('Teacher request diagnostic: '+reason);}else{console.error('Teacher operation diagnostic: '+(/Existing account details do not match/.test(e.message)?'account-mismatch':/permission|unauthorized|authentication/i.test(e.message)?'deployment-permission':'operation-failed'));}console.error('Teacher access could not be confirmed. Account identifiers and secret values were not logged.');process.exitCode=1;}})();
