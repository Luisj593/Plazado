import crypto from 'node:crypto';
import type { Express, Request } from 'express';
import { hashPassword } from '../src/utils/security';
import { mailProvider, sendPasswordRecoveryEmail } from './mailer-service';
export const recoveryDigest=(email:string,code:string)=>crypto.createHmac('sha256',process.env.SESSION_SECRET!).update(`recovery:${email}:${code}`).digest('hex');
export function registerRecovery(app:Express,db:any,admin:(req:Request)=>any) {
  const normalize=(email:unknown)=>typeof email==='string'?email.trim().toLowerCase():'';
  app.post('/api/auth/recovery/request',async(req,res)=>{
    const email=normalize(req.body.email);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({success:false,message:'Introduce un correo válido.'});
    try {
      const code=String(crypto.randomInt(100000,1000000));
      const created=await db.requestPasswordRecovery(email,recoveryDigest(email,code));
      if(created && mailProvider()!=='MANUAL') {
        const sent=await sendPasswordRecoveryEmail(email,code,db.getSystemSettings().mailConfig);
        if(!sent.success) console.error('[Recovery] Email provider did not accept recovery message');
      }
      return res.json({success:true,message:mailProvider()==='MANUAL'?'Si la cuenta existe, soporte debe enviar el código al correo registrado. Contacta a contacto@plazado.com.':'Si la cuenta existe, recibirás un código. Si no llega, contacta a contacto@plazado.com.'});
    } catch {return res.status(503).json({success:false,message:'No pudimos guardar la solicitud. Reintenta.'});}
  });
  app.post('/api/auth/recovery/complete',async(req,res)=>{
    const email=normalize(req.body.email),{code,password}=req.body;
    if(!email || typeof code!=='string' || !/^\d{6}$/.test(code) || typeof password!=='string' || password.length<10 || Buffer.byteLength(password,'utf8')>72) return res.status(400).json({success:false,message:'Introduce un código de 6 dígitos y una contraseña de 10 caracteres o más (máximo 72 bytes).'});
    try {
      const result=await db.completePasswordRecovery(email,recoveryDigest(email,code),await hashPassword(password));
      return res.status(result.success?200:400).json({success:result.success,message:result.success?'Contraseña actualizada. Inicia sesión de nuevo.':'Código incorrecto, vencido o ya utilizado.'});
    } catch {return res.status(503).json({success:false,message:'No se pudo confirmar el cambio. Reintenta.'});}
  });
  app.get('/api/admin/recovery', (req,res)=>{
    if(!admin(req)) return res.status(403).json({success:false});
    res.json({success:true,requests:db.getFullState().users.filter((u:any)=>u.passwordRecovery && u.passwordRecovery.expiresAt>Date.now()).map((u:any)=>({email:u.email,name:u.name,requestedAt:u.passwordRecovery.requestedAt}))});
  });
  app.post('/api/admin/recovery/prepare',async(req,res)=>{
    const actor=admin(req);if(!actor) return res.status(403).json({success:false});
    const email=normalize(req.body.email),user=db.getUserByEmail(email);
    if(mailProvider()!=='MANUAL' || !user?.passwordRecovery || user.passwordRecovery.expiresAt<Date.now()) return res.status(400).json({success:false,message:'No hay una solicitud manual vigente.'});
    try {
      const code=String(crypto.randomInt(100000,1000000));
      const updated=await db.requestPasswordRecovery(email,recoveryDigest(email,code));
      if(!updated) return res.status(429).json({success:false,message:'Espera un minuto antes de preparar otro código.'});
      res.json({success:true,email,message:`Envía únicamente al correo registrado ${email}: Tu código de recuperación de Plazado.com es ${code}. Vence en 15 minutos. Copiar este mensaje no lo envía.`});
    } catch {res.status(503).json({success:false,message:'No se guardó el código.'});}
  });
}
