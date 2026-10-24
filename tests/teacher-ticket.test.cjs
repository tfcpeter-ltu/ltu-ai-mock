const assert=require('node:assert/strict'),{seal,open}=require('../selfhost/teacher-ticket.cjs');
const key='ab'.repeat(32),now=Date.now(),value={email:'synthetic@example.invalid',studentCode:'LTU-ABC123',expiresAt:now+60000},ticket=seal(value,key);
assert.deepEqual(open(ticket,key,now),{email:value.email,studentCode:value.studentCode});assert.ok(!ticket.includes(value.email));assert.notEqual(ticket,seal(value,key));
assert.throws(()=>open(ticket,'cd'.repeat(32),now));assert.throws(()=>open(ticket,key,now+60001));assert.throws(()=>open(seal({...value,expiresAt:now+32*60000},key),key,now));
const changed=JSON.parse(Buffer.from(ticket,'base64'));changed.data=Buffer.from('tampered').toString('base64');assert.throws(()=>open(Buffer.from(JSON.stringify(changed)).toString('base64'),key,now));
console.log('PASS teacher ticket: authenticated encryption, unique nonces, expiry, tamper/wrong-key rejection, no plaintext account data.');
