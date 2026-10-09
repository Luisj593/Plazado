import nodemailer from 'nodemailer';

export interface MailConfig {
  senderEmail: string;
  senderName: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  useSsl?: boolean;
}

export const DEFAULT_MAIL_CONFIG: MailConfig = {
  senderEmail: process.env.MAIL_SENDER_EMAIL || 'contacto@plazado.com',
  senderName: process.env.MAIL_SENDER_NAME || 'PlazaDO.com - Marketplace Dominicano',
  smtpHost: process.env.SMTP_HOST || 'smtp.ionos.com',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || process.env.MAIL_SENDER_EMAIL || 'contacto@plazado.com',
  smtpPass: process.env.SMTP_PASS || '',
  useSsl: false,
};

/**
 * Normalizes app password by removing any accidental spaces
 */
export function cleanAppPassword(pass?: string): string {
  if (!pass) return '';
  return pass.trim();
}

export function mailProvider(): 'MANUAL'|'RESEND'|'SMTP' {
  const provider=process.env.MAIL_PROVIDER?.toUpperCase();
  return provider==='RESEND' || provider==='SMTP' ? provider : 'MANUAL';
}
export function isMailConfigured(config?:Partial<MailConfig>) {
  if(mailProvider()==='MANUAL') return false;
  return mailProvider()==='RESEND' ? !!process.env.RESEND_API_KEY : !!(config?.smtpPass || process.env.SMTP_PASS);
}
async function sendHttpsMail(options:{from:string;to:string;subject:string;text:string;html?:string}) {
  if(!process.env.RESEND_API_KEY) return {success:false,delivered:false,simulated:false,reason:'MISSING_RESEND_API_KEY',error:'Falta configurar el proveedor de correo HTTPS.'};
  try {
    const response=await fetch('https://api.resend.com/emails',{method:'POST',redirect:'error',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({...options,to:[options.to]}),signal:AbortSignal.timeout(10000)});
    const result=await response.json();
    if(!response.ok || !result.id) return {success:false,delivered:false,simulated:false,reason:'MAIL_API_REJECTED',error:'El proveedor rechazó el envío. Revisa la clave y el dominio verificado.'};
    // Legacy delivered means accepted by the transport, not inbox delivery.
    return {success:true,delivered:true,accepted:true,deliveryConfirmed:false,simulated:false,messageId:String(result.id)};
  } catch {return {success:false,delivered:false,simulated:false,reason:'MAIL_API_CONNECTION',error:'No se pudo conectar al proveedor de correo.'};}
}

/**
 * Creates a nodemailer transport based on configuration
 */
function createTransporter(config: MailConfig = DEFAULT_MAIL_CONFIG) {
  const host = config.smtpHost || 'smtp.ionos.com';
  const port = Number(config.smtpPort) || 587;
  const user = (config.smtpUser || config.senderEmail || 'contacto@plazado.com').trim();
  const rawPass = config.smtpPass || process.env.SMTP_PASS || '';
  const pass = cleanAppPassword(rawPass);

  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    requireTLS: port === 587,
    auth: pass ? {
      user,
      pass,
    } : undefined,
    connectionTimeout: 8000,
    greetingTimeout: 6000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: true
    }
  });
}

/**
 * Verifies if the SMTP credentials are valid
 */
export async function verifySmtpConnection(config: MailConfig = DEFAULT_MAIL_CONFIG): Promise<{ ok: boolean; message: string; reason?:string }> {
  if(mailProvider()==='MANUAL') return {ok:false,reason:'MANUAL_DELIVERY_REQUIRED',message:'Entrega manual del código por el Super Admin habilitada. Correo automático desactivado.'};
  if(mailProvider()==='RESEND') {
    if(!process.env.RESEND_API_KEY) return {ok:false,reason:'MISSING_RESEND_API_KEY',message:'Configura RESEND_API_KEY en Railway.'};
    const sender=process.env.MAIL_SENDER_EMAIL || config.senderEmail;
    const domain=sender?.split('@')[1]?.toLowerCase();
    if(!domain) return {ok:false,reason:'INVALID_MAIL_SENDER',message:'Configura MAIL_SENDER_EMAIL con el dominio verificado.'};
    try {
      const response=await fetch('https://api.resend.com/domains',{redirect:'error',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`},signal:AbortSignal.timeout(10000)});
      const result=await response.json();
      if(!response.ok) return {ok:false,reason:'MAIL_API_AUTH',message:'No se pudo verificar el proveedor. La clave debe permitir consultar dominios.'};
      const verified=result.data?.some((entry:any)=>entry.name?.toLowerCase()===domain && entry.status==='verified' && entry.capabilities?.sending!=='disabled');
      return verified ? {ok:true,message:'Proveedor HTTPS accesible y dominio del remitente verificado. La recepción final se valida con un registro real.'} : {ok:false,reason:'MAIL_DOMAIN_UNVERIFIED',message:'Verifica el dominio del remitente en Resend antes de activar registros.'};
    } catch {return {ok:false,reason:'MAIL_API_CONNECTION',message:'No se pudo conectar al proveedor HTTPS.'};}
  }
  const pass = cleanAppPassword(config.smtpPass || process.env.SMTP_PASS);
  if (!pass) {
    return {
      ok: false,
      reason: 'MISSING_SMTP_PASS',
      message: 'Falta la contraseña de la cuenta de correo SMTP. Configúrala desde el panel seguro.'
    };
  }

  try {
    const transporter = createTransporter(config);
    await transporter.verify();
    return {
      ok: true,
      message: `Conexión SMTP exitosa con ${config.smtpHost || 'smtp.ionos.com'}:${config.smtpPort || 465} autenticado como ${config.smtpUser || config.senderEmail}.`
    };
  } catch (err: any) {
    let friendly = err?.message || 'Error de conexión SMTP desconocido';
    if (friendly.includes('530') || friendly.includes('Authentication Required')) {
      friendly = 'Error 530 de IONOS: Autenticación requerida. Verifica el usuario completo y la contraseña del buzón de correo.';
    } else if (friendly.includes('535') || friendly.includes('BadCredentials') || friendly.includes('Username and Password not accepted')) {
      friendly = 'Error 535: Credenciales SMTP no aceptadas. Verifica la cuenta y contraseña configuradas.';
    }
    return {
      ok: false,
      reason: ['EAUTH','ETIMEDOUT','ECONNECTION','ESOCKET','ETLS','ECONNREFUSED','EDNS'].includes(err?.code) ? err.code : 'SMTP_ERROR',
      message: friendly
    };
  }
}

/**
 * Dispatches an email with the 6-digit confirmation code from contacto@plazado.com
 */
export async function sendRegistrationOtpEmail(
  recipientEmail: string,
  recipientName: string,
  otpCode: string,
  customConfig?: Partial<MailConfig>
): Promise<{ 
  success: boolean; 
  delivered: boolean; 
  messageId?: string; 
  error?: string; 
  simulated?: boolean;
  warning?: string;
  reason?: string;
}> {
  const config: MailConfig = {
    ...DEFAULT_MAIL_CONFIG,
    ...(customConfig || {}),
  };

  const pass = cleanAppPassword(config.smtpPass || process.env.SMTP_PASS);
  const senderAddress = `"${config.senderName.replace(/["\r\n]/g, '')}" <${process.env.MAIL_SENDER_EMAIL || config.senderEmail}>`;
  const subject = `🔐 Tu Código de Confirmación de Registro PlazaDO: ${otpCode}`;

  const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Confirmación PlazaDO</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f4; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="580" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e7e5e4;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #1c1917 100%); padding: 32px 28px; text-align: center;">
              <div style="font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                PLAZADO<span style="color: #facc15;">.COM</span>
              </div>
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #fecaca; margin-top: 6px; font-weight: 700;">
                Marketplace Dominicano • Verificación de Seguridad
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #1c1917;">
                ¡Hola, ${escapeHtml(recipientName || 'Usuario')}! 👋
              </h2>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #44403c;">
                Has iniciado el proceso de creación de cuenta en <strong>Plazado.com</strong>. Para validar que este correo electrónico (<strong>${escapeHtml(recipientEmail)}</strong>) es verdaderamente tuyo, ingresa el siguiente código de confirmación en la pantalla de registro:
              </p>

              <!-- OTP Code Display Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="background: #fafaf9; border: 2px dashed #dc2626; border-radius: 16px; padding: 24px 20px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #78716c; margin-bottom: 8px;">
                      Código de Verificación de 6 Dígitos
                    </div>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #dc2626; text-shadow: 0 2px 4px rgba(220, 38, 38, 0.15);">
                      ${otpCode}
                    </div>
                    <div style="font-size: 12px; color: #78716c; margin-top: 10px; font-weight: 600;">
                      ⏱️ Válido por 15 minutos • De un solo uso
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Instructions -->
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #991b1b;">
                  <strong>Instrucciones:</strong> Copia o escribe este código de 6 dígitos en la ventana de PlazaDO donde estás creando tu cuenta para validar tu correo y activar tu acceso de inmediato.
                </p>
              </div>

              <p style="margin: 0 0 12px 0; font-size: 12px; line-height: 1.5; color: #78716c;">
                Si tú no solicitaste este código o no estás creando una cuenta en PlazaDO, puedes ignorar este mensaje de forma segura. Si tienes alguna duda o necesitas asistencia, escríbenos a <strong style="color: #dc2626;">contacto@plazado.com</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafaf9; padding: 24px 32px; border-top: 1px solid #e7e5e4; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #78716c;">
                Correo oficial de autenticación y seguridad enviado desde:<br />
                <strong style="color: #1c1917;">contacto@plazado.com</strong>
              </p>
              <p style="margin: 0; font-size: 10px; color: #a8a29e;">
                © 2026 Plazado.com • Santo Domingo, República Dominicana • Todos los derechos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `
PLAZADO.COM - CÓDIGO DE CONFIRMACIÓN DE REGISTRO
=====================================================

¡Hola ${recipientName || 'Usuario'}!

Para validar que tu correo (${recipientEmail}) es verdadero y completar la creación de tu cuenta en PlazaDO, introduce este código de seguridad de 6 dígitos:

▶▶▶   ${otpCode}   ◀◀◀

Este código es de un solo uso y vence en 15 minutos.
Correo oficial de seguridad enviado desde: contacto@plazado.com

¿No recibiste tu código a tiempo? Comunícate con nuestro equipo de soporte en: contacto@plazado.com

© 2026 Plazado.com República Dominicana.
  `;

  if(mailProvider()==='MANUAL') return {success:false,delivered:false,simulated:false,reason:'MANUAL_DELIVERY_REQUIRED',error:'Solicita el código al Super Admin mediante contacto@plazado.com.'};
  if(mailProvider()==='RESEND') return sendHttpsMail({from:senderAddress,to:recipientEmail,subject,text:textContent,html:htmlContent});

  if (!pass) {
    console.warn('[MailerService] SMTP credentials are not configured. No email sent.');
    return {success:false,delivered:false,simulated:false,reason:'MISSING_SMTP_PASS',error:'El envío de correo no está configurado. Contacta a soporte.'};
  }

  try {
    const transporter = createTransporter(config);
    const info = await transporter.sendMail({
      from: senderAddress,
      to: recipientEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    if (!(info.accepted || []).some((address:any)=>String(address).toLowerCase()===recipientEmail.toLowerCase())) {
      return {success:false,delivered:false,simulated:false,reason:'SMTP_REJECTED',error:'El servidor de correo no aceptó el destinatario.'};
    }
    return {success:true,delivered:true,simulated:false,messageId:info.messageId};
  } catch (err: any) {
    const errMessage = err?.message || String(err);
    console.error('[MailerService] SMTP dispatch failed:',err?.code || 'SMTP_ERROR');
    return {success:false,delivered:false,simulated:false,reason:'SMTP_ERROR',error:'No se pudo enviar el correo. Reintenta o contacta a soporte.'};
  }
}

export async function sendPasswordRecoveryEmail(email:string,code:string,customConfig?:Partial<MailConfig>) {
  const config={...DEFAULT_MAIL_CONFIG,...customConfig};
  const message={from:`Plazado <${process.env.MAIL_SENDER_EMAIL || config.senderEmail}>`,to:email,subject:'Recuperación de acceso a Plazado.com',text:`Tu código para cambiar la contraseña es ${code}. Vence en 15 minutos y solo sirve una vez. Si no solicitaste este cambio, ignora este correo. Nunca compartas el código con otra persona.`};
  if(mailProvider()==='MANUAL') return {success:false,delivered:false};
  if(mailProvider()==='RESEND') return sendHttpsMail(message);
  if(!(config.smtpPass || process.env.SMTP_PASS)) return {success:false,delivered:false};
  try {const info=await createTransporter(config).sendMail(message);const accepted=(info.accepted || []).some((a:any)=>String(a).toLowerCase()===email.toLowerCase());return {success:accepted,delivered:accepted};}
  catch {return {success:false,delivered:false};}
}

export async function sendAccountApprovalEmail(recipientEmail:string,recipientName:string,customConfig?:Partial<MailConfig>) {
  const config={...DEFAULT_MAIL_CONFIG,...customConfig};
  if(mailProvider()==='MANUAL') return {success:false,delivered:false};
  if(mailProvider()==='RESEND') return sendHttpsMail({from:`Plazado <${process.env.MAIL_SENDER_EMAIL || config.senderEmail}>`,to:recipientEmail,subject:'Tu cuenta de Plazado.com fue aprobada',text:`Hola ${recipientName}. Tu cuenta fue revisada y aprobada. Ya puedes iniciar sesión con tu contraseña en Plazado.com. Este aviso no contiene un código de verificación.`});
  if(!(config.smtpPass || process.env.SMTP_PASS)) return {success:false,delivered:false};
  try {
    const info=await createTransporter(config).sendMail({from:`"${config.senderName}" <${config.senderEmail}>`,to:recipientEmail,subject:'Tu cuenta de Plazado.com fue aprobada',text:`Hola ${recipientName}. Tu cuenta fue revisada y aprobada. Ya puedes iniciar sesión con tu contraseña en Plazado.com. Este aviso no contiene un código de verificación.`});
    const accepted=(info.accepted || []).some((address:any)=>String(address).toLowerCase()===recipientEmail.toLowerCase());
    return {success:accepted,delivered:accepted};
  } catch {return {success:false,delivered:false};}
}
