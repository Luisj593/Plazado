# Preparación de producción — 9 de octubre de 2026

## Cambios de esta entrega

- Recuperación de contraseña mediante código de seis dígitos, HMAC, vencimiento de 15 minutos, cinco intentos y uso único. Un cambio confirmado revoca las sesiones anteriores. Modo automático por el proveedor configurado y modo manual con solicitudes visibles en Super Admin → Verificaciones → Recuperación de acceso. El mensaje se envía exclusivamente al correo registrado; copiarlo no lo envía.
- Cobro administrativo de comisiones contra entrega en Super Admin → Liquidaciones. Registrar únicamente dinero efectivamente recibido, con importe y referencia bancaria comprobados. Permite pagos parciales; excluye pedidos con reclamaciones o liquidaciones reservadas. La referencia se conserva y no puede reutilizarse para otro cobro. No genera una transferencia bancaria.
- Conciliación PayPal desde Liquidaciones: volver a consultar al proveedor cuando el navegador se cierre o falle la confirmación local. Reembolso completo de la compra agrupada, con razón documentada, referencia idempotente, bloqueo de entrega/liquidación y confirmación del proveedor. Los fondos ya liquidados requieren intervención bancaria. El reembolso financiero no repone inventario ni confirma una devolución física.
- Webhook PayPal en `/api/paypal/webhook`: verificar firma mediante PayPal antes de consultar y registrar un cobro. Configurar `PAYPAL_WEBHOOK_ID`. Eventos de reembolso iniciados por la plataforma se consultan al proveedor. Reembolsos externos, parciales y contracargos requieren conciliación administrativa; no se ajustan automáticamente con información no verificada.
- Imágenes públicas servidas por URLs de contenido y caché. Las publicaciones conservan los originales; al guardar un formulario se resuelven las URLs de presentación antes de persistir. Documentos de identidad e imágenes privadas no se incorporan al índice público.
- Sesión de navegador en cookie HttpOnly/SameSite, Secure en producción. Se migra el token antiguo al consultar la sesión. Las nuevas sesiones de administrador duran ocho horas; las de cliente/tienda, siete días. Comprobación durable del usuario y versión de autenticación en solicitudes autenticadas, protección de origen para escrituras y CSP compatible con PayPal. Cámara permitida solamente al propio sitio para el flujo KYC.
- Carga diferida de paneles, autenticación, checkout y diálogos. Sincronización de pestañas visibles cada 15 segundos y al recuperar foco. Retirado bloqueo de clic derecho/inspección.
- Pasarelas, categorías, especificaciones y configuración publicitaria se guardan en transacciones antes de mostrar éxito. Eliminación lógica conserva su historial. La pasarela con pedidos asociados se conserva. Se desactiva la importación bidireccional de Cloud SQL cuando Firebase Admin es la autoridad.
- Lectura consistente de datos durables cada cinco minutos (mínimo configurable mediante `FIRESTORE_REFRESH_INTERVAL_MS`), serializada con las operaciones locales. Versiones de caché distintas por proceso. Esta comprobación no sustituye una prueba de carga ni de concurrencia con dos instancias reales; revisar el coste de lecturas al aumentar el catálogo.

## Validación realizada

TypeScript, 21 scripts de pruebas aisladas y compilación. Ningún registro, pedido, movimiento, correo, cobro o reembolso real creado para probar. Sobre la respuesta pública capturada durante la auditoría, la proyección de imágenes reduce el JSON de 4,258,404 a 64,018 bytes; las imágenes se descargan por separado cuando se muestran. Esta medición local no es un resultado de rendimiento del despliegue.

## Puerta de salida: pendientes operativos reales

No declarar producción abierta mientras falte evidencia de estos puntos:

1. **Historial de GitHub:** hacer privado el repositorio desde Settings → General → Danger Zone → Change repository visibility. Revisar el historial y las credenciales afectadas por los respaldos antiguos; coordinar su saneamiento tras conservar una copia privada. La conexión actual no ofrece administración de visibilidad. No se reescribe el historial ni se elimina información de producción en esta entrega.
2. **Despliegue:** desplegar el commit aprobado en Railway. Mantener `NODE_ENV=production`, credenciales Firebase Admin, `SESSION_SECRET` y permisos IAM. Si hay credenciales PayPal cifradas, preservar su clave de cifrado al rotar la clave de sesiones; configurar `PAYMENT_CREDENTIALS_KEY` antes del cambio o reintroducir de forma segura las credenciales. No publicarlas en Git, capturas o conversaciones.
3. **Correo:** para apertura autoservicio configurar el proveedor automático y comprobar recepción real. `MAIL_PROVIDER=MANUAL` conserva el piloto asistido. Para Resend: dominio verificado, `RESEND_API_KEY` y remitente autorizado. La aceptación del proveedor no demuestra recepción en la bandeja.
4. **PayPal opcional:** validar la cuenta y credenciales Live desde Super Admin, definir la conversión DOP/USD y registrar el webhook `https://www.plazado.com/api/paypal/webhook` en la misma aplicación Live. Suscribir `PAYMENT.CAPTURE.COMPLETED` y `PAYMENT.CAPTURE.REFUNDED`; cargar su ID en Railway. Realizar cobro y reembolso autorizados en un entorno separado antes de habilitarlo. Las pruebas de esta entrega no movieron dinero. Contra entrega puede ser el único método del piloto.
5. **Respaldo externo:** preparar un bucket privado de Cloud Storage y permisos mínimos para exportación de la base indicada. Configurar `FIRESTORE_BACKUP_BUCKET=gs://<bucket>`; ejecutar `npm run backup:firestore -- export`. Conservar el nombre de operación, configurarlo en `FIRESTORE_BACKUP_OPERATION` y ejecutar `npm run backup:firestore -- status` hasta confirmar finalización sin error. Programar exportación o respaldo administrado y retención desde Google Cloud. No considerar una solicitud de exportación como respaldo terminado.
6. **Restauración aislada:** configurar un proyecto distinto cuyo nombre termine en `-restore-test`, credenciales autorizadas y `FIRESTORE_RESTORE_URI` con la URI del export terminado. Ejecutar `npm run backup:firestore -- restore-test`. La herramienta rechaza el proyecto de producción. Confirmar el trabajo y comparar usuarios, tiendas, pedidos, inventario y balances en el proyecto separado. La exportación puede requerir facturación habilitada; el código no la habilita ni crea buckets.
7. **Reglas efectivas:** verificar en Firebase las reglas restrictivas del repositorio y los permisos reales de la cuenta de servicio. La existencia de `firestore.rules` en Git no prueba su publicación.
8. **Validación del despliegue:** `APP_URL=https://www.plazado.com npm run smoke:production`. Solo GET: cabeceras, catálogo, aislamiento público, imagen y estado de servicios. Fallará contra una versión que aún no incluya esta entrega. No certifica compras ni disponibilidad bancaria.
9. **Ciclo operativo separado:** registro cliente/tienda → recepción de código → aprobación → publicación → compra → entrega con código → comisión → conciliación. Repetir con cancelación, reclamación, caída de red y reinicio. Probar móvil/escritorio, dos instancias, accesibilidad, cámara, descarga APK y políticas CSP con PayPal. No usar cuentas ficticias en producción.
10. **Operación comercial:** validar cobertura, costes de envío, responsable de soporte, procedimiento de devoluciones y políticas que correspondan a la actividad real. La comisión sigue en 30% (0.30), incluido el envío, y conserva la tasa histórica de cada pedido. No se generan RNC, empresa ni ubicaciones de almacén ficticias.

`/api/health/ready` sigue describiendo disponibilidad técnica del piloto, no una certificación de producción abierta. Railway está conectado por OAuth; expone nombres de variables, pero no sus secretos. No hay acceso administrativo a Firebase/Google Cloud, PayPal ni al bucket de respaldo.

## Referencias de integración

- https://developer.paypal.com/api/payments/v2
- https://developer.paypal.com/api/webhooks/v1
- https://firebase.google.com/docs/firestore/manage-data/export-import

## Continuación de infraestructura — 9 de octubre de 2026

- Railway: conexión verificada al servicio Plazado en production. Configurados NODE_ENV=production, healthcheck /api/health/ready (120 segundos), reinicio ON_FAILURE, servicio sin suspensión y solapamiento de despliegue de 20 segundos con drenaje de 30 segundos.
- El redespliegue e1c48973-9276-48a6-87de-89d626dc23db terminó SUCCESS, pero la comprobación funcional posterior FALLÓ: Firestore devolvió RESOURCE_EXHAUSTED por agotar las lecturas gratuitas del proyecto 614865830106. SUCCESS de Railway no certifica disponibilidad de datos.
- El catálogo conservado responde, pero las sesiones que requieren identidad durable y operaciones con Firestore pueden fallar. No declarar la plataforma operativa por mostrar productos cacheados.
- Corrección de consumo: lectura completa de 30 segundos a cinco minutos, con retroceso exponencial hasta una hora en fallos; protección interna de registros de cinco minutos a una hora, sin ejecuciones solapadas, omitida si no hay sincronización confirmada. Conserva copias existentes. No sustituye un respaldo externo ni garantiza que cualquier volumen de tráfico quepa en la cuota gratuita.
- Para restablecer lecturas hoy, el propietario debe habilitar facturación/plan Blaze en el proyecto Google Cloud de producción y revisar presupuesto y alertas. Alternativa: esperar al reinicio de cuota, sin prometer disponibilidad entretanto. Después, verificar /api/health/ready y npm run smoke:production; si la aplicación no se recupera, redeplegar tras confirmar la cuota disponible.
- El ajuste pasó TypeScript, los 21 scripts aislados y compilación. No se crearon cuentas, pedidos, cargos, correos ni transferencias reales para verificarlo.

## Despliegue explícito de indisponibilidad

La PR #37 bloquea en producción consultas y escrituras cuando Firestore no está conectado: devuelve 503 DATABASE_UNAVAILABLE sin presentar datos vacíos como una carga válida. No altera cuentas, roles, contactos ni publicaciones.

Para publicar esta respuesta de indisponibilidad aun durante el agotamiento de cuota, la comprobación de arranque Railway usa /api/health (proceso HTTP); /api/health/ready sigue devolviendo 503 hasta cargar Firestore. SUCCESS del despliegue demuestra solamente que se publicó el servidor de indisponibilidad, no que se recuperó la plataforma. El guard de API impide acceso y operaciones con la base desconectada.

Después de restablecer las lecturas: confirmar /api/health/ready y smoke:production; verificar la cuenta super admin y los registros persistidos. No recrear ni resembrar datos por ver una interfaz vacía.
