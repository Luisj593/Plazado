import assert from 'node:assert/strict';
import fs from 'node:fs';
import {transform} from 'esbuild';
const source=fs.readFileSync('server/mailer-service.ts','utf8');const code=await transform(source,{loader:'ts',format:'cjs'});const mod={exports:{}};
let mode='accepted',sent=0,mail,transport;
const nodemailer={createTransport:config=>{transport=config;return {sendMail:async options=>{sent++;mail=options;if(mode==='error')throw Object.assign(Error('isolated failure'),{code:'ETEST'});return {messageId:'isolated',accepted:mode==='accepted'?[options.to]:[]};},verify:async()=>true};}};
const logs=[];const env={};
new Function('module','exports','require','process','console',code.code)(mod,mod.exports,()=>nodemailer,{env},{log:(...v)=>logs.push(v.join(' ')),warn:(...v)=>logs.push(v.join(' ')),error:(...v)=>logs.push(v.join(' '))});
const send=mod.exports.sendRegistrationOtpEmail;
let result=await send('fixture@example.invalid','Isolated','123456');assert.equal(result.success,false);assert.equal(result.delivered,false);assert.equal(result.simulated,false);assert.equal(sent,0);
const config={smtpPass:'isolated-secret',smtpHost:'example.invalid',senderEmail:'fixture@example.invalid'};
result=await send('fixture@example.invalid','<script>fixture</script>','123456',config);assert.equal(result.delivered,true);assert.equal(transport.tls.rejectUnauthorized,true);assert.ok(mail.html.includes('&lt;script&gt;'));assert.ok(!mail.html.includes('<script>fixture'));
for(mode of ['rejected','error']) {result=await send('fixture@example.invalid','Isolated','123456',config);assert.equal(result.success,false);assert.equal(result.delivered,false);assert.equal(result.simulated,false);assert.equal(result.messageId,undefined);}
assert.ok(!logs.some(log=>log.includes('123456') || log.includes('isolated-secret')));
console.log('Mailer: missing SMTP/rejection/transport errors never claim delivery, TLS verified, profile HTML escaped, OTP/password absent from logs. No emails sent.');

env.MAIL_PROVIDER='RESEND';
result=await send('fixture@example.invalid','Isolated','123456',config);assert.equal(result.success,false);assert.equal(result.reason,'MISSING_RESEND_API_KEY');
env.RESEND_API_KEY='isolated-api-key';env.MAIL_SENDER_EMAIL='fixture@example.invalid';
const originalFetch=globalThis.fetch;let httpMode='success',requests=0;
globalThis.fetch=async(url,options)=>{requests++;assert.ok(url.startsWith('https://api.resend.com/'));assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer isolated-api-key');if(httpMode==='network')throw Error('isolated');return {ok:httpMode!=='rejected',json:async()=>url.endsWith('/domains')?{data:[{name:'example.invalid',status:httpMode==='unverified'?'pending':'verified'}]}:(httpMode==='malformed'?{}:{id:'isolated-provider-id'})};};
try {
 result=await send('fixture@example.invalid','Isolated','123456',config);assert.equal(result.success,true);assert.equal(result.deliveryConfirmed,false);assert.equal(result.messageId,'isolated-provider-id');
 for(httpMode of ['rejected','network','malformed']) {result=await send('fixture@example.invalid','Isolated','123456',config);assert.equal(result.success,false);assert.equal(result.delivered,false);}
 httpMode='success';assert.equal((await mod.exports.verifySmtpConnection(config)).ok,true);
 httpMode='unverified';assert.equal((await mod.exports.verifySmtpConnection(config)).ok,false);
 httpMode='rejected';assert.equal((await mod.exports.verifySmtpConnection(config)).ok,false);
 assert.ok(requests>0);
} finally {globalThis.fetch=originalFetch;}
console.log('HTTPS mail: isolated accepted/rejected/network/malformed responses, verified-domain readiness, no inbox-delivery claim. No real email sent.');
