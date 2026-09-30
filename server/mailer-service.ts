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
  senderEmail: 'Luiss.jimeness@gmail.com',
  senderName: 'PlazaDO Marketplace Dominicano',
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT) || 465,
  smtpUser: process.env.SMTP_USER || 'Luiss.jimeness@gmail.com',
  smtpPass: process.env.SMTP_PASS || '',
  useSsl: true,
};

/**
 * Normalizes app password by removing any accidental spaces
 */
export function cleanAppPassword(pass?: string): string {
  if (!pass) return '';
  return pass.replace(/\s+/g, '').trim();
}

/**
 * Creates a nodemailer transport based on configuration
 */
function createTransporter(config: MailConfig = DEFAULT_MAIL_CONFIG) {
  const host = config.smtpHost || 'smtp.gmail.com';
  const port = Number(config.smtpPort) || 465;
  const user = (config.smtpUser || config.senderEmail || 'Luiss.jimeness@gmail.com').trim();
  const rawPass = config.smtpPass || process.env.SMTP_PASS || '';
  const pass = cleanAppPassword(rawPass);

  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: pass ? {
      user,
      pass,
    } : undefined,
    connectionTimeout: 8000,
    greetingTimeout: 6000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Verifies if the SMTP credentials are valid
 */
export async function verifySmtpConnection(config: MailConfig = DEFAULT_MAIL_CONFIG): Promise<{ ok: boolean; message: string }> {
  const pass = cleanAppPassword(config.smtpPass || process.env.SMTP_PASS);
  if (!pass) {
    return {
      ok: false,
      message: 'Falta la Contraseña de Aplicación de 16 caracteres de Google (App Password). Genera una en tu cuenta de Google > Seguridad > Contraseñas de aplicaciones y guárdala aquí.'
    };
  }

  try {
    const transporter = createTransporter(config);
    await transporter.verify();
    return {
      ok: true,
      message: `Conexión SMTP exitosa con ${config.smtpHost || 'smtp.gmail.com'}:${config.smtpPort || 465} autenticado como ${config.smtpUser || config.senderEmail}.`
    };
  } catch (err: any) {
    let friendly = err?.message || 'Error de conexión SMTP desconocido';
    if (friendly.includes('530') || friendly.includes('Authentication Required')) {
      friendly = 'Error 530 de Google: Autenticación requerida. Debes ingresar la contraseña de aplicación de 16 caracteres de tu cuenta Google.';
    } else if (friendly.includes('535') || friendly.includes('BadCredentials') || friendly.includes('Username and Password not accepted')) {
      friendly = 'Error 535: Usuario o contraseña de aplicación no aceptada por Google. Verifica que la contraseña de 16 caracteres esté correcta.';
    }
    return {
      ok: false,
      message: friendly
    };
  }
}

/**
 * Dispatches an email with the 6-digit confirmation code from Luiss.jimeness@gmail.com
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
  const senderAddress = `"${config.senderName}" <${config.senderEmail}>`;
  const subject = `🔐 Tu Código de Confirmación de Registro PlazaDO: ${otpCode}`;

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
                ¡Hola, ${recipientName || 'Usuario'}! 👋
              </h2>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #44403c;">
                Has iniciado el proceso de creación de cuenta en <strong>Plazado.com</strong>. Para validar que este correo electrónico (<strong>${recipientEmail}</strong>) es verdaderamente tuyo, ingresa el siguiente código de confirmación en la pantalla de registro:
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
                Si tú no solicitaste este código o no estás creando una cuenta en PlazaDO, puedes ignorar este mensaje de forma segura. Nadie de nuestro equipo te pedirá este código por teléfono o WhatsApp.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafaf9; padding: 24px 32px; border-top: 1px solid #e7e5e4; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #78716c;">
                Correo disparado por el sistema central de autenticación de PlazaDO desde:<br />
                <strong style="color: #1c1917;">${config.senderEmail}</strong>
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
Correo enviado desde: ${config.senderEmail}

Si no has solicitado este registro, puedes ignorar este mensaje.
© 2026 Plazado.com República Dominicana.
  `;

  // Check if SMTP password is provided
  if (!pass) {
    console.warn(`[MailerService] ⚠️ SMTP Password (App Password) not configured in PlazaDO. Sender: ${config.senderEmail}`);
    console.log(`
===================================================================
📨 [PLAZADO RD - REGISTRO DE CORREO (MODO DIRECTO/FALLBACK)]
De: ${senderAddress}
Para: ${recipientEmail}
Asunto: ${subject}
Código generado: ${otpCode}
Aviso: Falta Contraseña de Aplicación de Google en Super Admin > Configuración.
===================================================================
    `);
    return {
      success: true,
      delivered: false,
      simulated: true,
      reason: 'MISSING_SMTP_PASS',
      warning: 'Para entrega real en bandeja de entrada Gmail, ingresa la Contraseña de Aplicación de 16 caracteres de Google en el Panel Super Admin > Configuración.',
      messageId: `otp-fallback-${Date.now()}`
    };
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

    console.log(`[MailerService] ✅ Email dispatched successfully to ${recipientEmail} from ${config.senderEmail}. MessageId: ${info.messageId}`);
    return { 
      success: true, 
      delivered: true, 
      simulated: false,
      messageId: info.messageId 
    };
  } catch (err: any) {
    const errMessage = err?.message || String(err);
    console.error(`[MailerService] ⚠️ SMTP transport error dispatching to ${recipientEmail}:`, errMessage);
    console.log(`
===================================================================
📨 [PLAZADO RD - REGISTRO DE CORREO RECHAZADO POR SERVIDOR SMTP]
De: ${senderAddress}
Para: ${recipientEmail}
Asunto: ${subject}
Código generado: ${otpCode}
Error devuelto por SMTP: ${errMessage}
===================================================================
    `);

    let warning = 'El servidor SMTP rechazó el envío.';
    if (errMessage.includes('530') || errMessage.includes('Authentication Required')) {
      warning = 'Google SMTP requiere Contraseña de Aplicación de 16 caracteres (2FA). Configúrala en Super Admin > Configuración.';
    } else if (errMessage.includes('535') || errMessage.includes('BadCredentials')) {
      warning = 'Contraseña de aplicación rechazada por Google. Verifica la contraseña de 16 caracteres en Super Admin.';
    }

    return { 
      success: true, 
      delivered: false, 
      simulated: true, 
      error: errMessage,
      warning,
      messageId: `otp-error-fallback-${Date.now()}` 
    };
  }
}
