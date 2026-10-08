import assert from 'node:assert/strict';
import fs from 'node:fs';
import {transform} from 'esbuild';
const source=fs.readFileSync('server/mailer-service.ts','utf8');const code=await transform(source,{loader:'ts',format:'cjs'});const mod={exports:{}};
let mode='accepted',sent=0,mail,transport;
const nodemailer={createTransport:config=>{transport=config;return {sendMail:async options=>{sent++;mail=options;if(mode==='error')throw Object.assign(Error('isolated failure'),{code:'ETEST'});return {messageId:'isolated',accepted:mode==='accepted'?[options.to]:[]};},verify:async()=>true};}};
const logs=[];
new Function('module','exports','require','process','console',code.code)(mod,mod.exports,()=>nodemailer,{env:{}},{log:(...v)=>logs.push(v.join(' ')),warn:(...v)=>logs.push(v.join(' ')),error:(...v)=>logs.push(v.join(' '))});
const send=mod.exports.sendRegistrationOtpEmail;
let result=await send('fixture@example.invalid','Isolated','123456');assert.equal(result.success,false);assert.equal(result.delivered,false);assert.equal(result.simulated,false);assert.equal(sent,0);
const config={smtpPass:'isolated-secret',smtpHost:'example.invalid',senderEmail:'fixture@example.invalid'};
result=await send('fixture@example.invalid','<script>fixture</script>','123456',config);assert.equal(result.delivered,true);assert.equal(transport.tls.rejectUnauthorized,true);assert.ok(mail.html.includes('&lt;script&gt;'));assert.ok(!mail.html.includes('<script>fixture'));
for(mode of ['rejected','error']) {result=await send('fixture@example.invalid','Isolated','123456',config);assert.equal(result.success,false);assert.equal(result.delivered,false);assert.equal(result.simulated,false);assert.equal(result.messageId,undefined);}
assert.ok(!logs.some(log=>log.includes('123456') || log.includes('isolated-secret')));
console.log('Mailer: missing SMTP/rejection/transport errors never claim delivery, TLS verified, profile HTML escaped, OTP/password absent from logs. No emails sent.');
