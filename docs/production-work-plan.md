# Plan de preparación de Plazado para producción

Fecha: 2026-10-08. Fuente: auditoría del código de main. Pruebas exclusivamente aisladas; no modificar registros reales.

| Orden | Trabajo | Criterio de aceptación | Dependencia |
|---|---|---|---|
| 1 | Exposición y autorización | Ninguna respuesta devuelve hashes, OTP, bancos ajenos, mensajes o inventario ajeno. Campos protegidos rechazados. | Desplegar API y reglas Firebase Admin |
| 2 | Checkout | Totales recalculados en servidor, cantidades enteras positivas, pagos sin simulación, carrito conservado ante fallo. | Confirmación de pasarela real |
| 3 | Persistencia | Pedidos, inventario y balances guardados de forma atómica; reinicio y reintentos sin pérdidas o duplicados. | Credenciales Firebase Admin |
| 4 | Construcción y CI | Dependencias reproducibles, TypeScript y pruebas pasan en GitHub. | Ninguna |
| 5 | Operación | SMTP real, cobro y reembolso confirmados, liquidación conciliada, copias externas restaurables. | Cuentas SMTP/pasarela/banco/Railway |
| 6 | Piloto | Flujo completo desde registro hasta entrega probado en entorno separado, móvil y escritorio. | Etapas 1–5 |

## Incidente de datos en Git
Los respaldos versionados contienen datos sensibles. No publicar nuevos respaldos. Conservar la única copia durable antes de retirar archivos versionados. La eliminación del historial compartido y el restablecimiento de contraseñas requieren una intervención coordinada; borrar archivos de la rama no elimina copias históricas. No se autoriza un borrado de datos de producción.

## Requisitos externos pendientes
- Verificar despliegue Railway del commit aprobado y variables Firebase Admin, SESSION_SECRET, SMTP y pasarela.
- Publicar reglas de Firestore después de confirmar Firebase Admin en servidor.
- Elegir y configurar integración real de tarjetas; nunca considerar pagada una compra por datos del navegador.
- Identificar operador legal, RNC y dirección reales; validar políticas con los procesos efectivamente disponibles.
- Definir ejecución de transferencias y conciliación de liquidaciones; programación no equivale a pago bancario.
- Restaurar copias externas en entorno aislado y realizar pruebas de carga antes del lanzamiento.

## Avance de la primera entrega
- Proyección explícita de respuestas por rol; hashes y OTP nunca salen en bootstrap/sync. Cuenta bancaria ajena y códigos de entrega ajenos excluidos.
- Endpoints públicos de catálogo y pasarela no devuelven secretos; edición con campos permitidos.
- Checkout contra entrega valida precios, cantidades, inventario, cobertura y envío en servidor. Tarjetas/transferencias indisponibles hasta integración real.
- Guardado atómico del checkout en Firebase Admin: pedido, stock, balances, auditoría y reservas. Fallos conservan carrito y memoria; reintentos locales no duplican.
- Correcciones TypeScript, lockfile y pruebas aisladas incorporadas a CI.
- Las reglas del repositorio deniegan accesos directos del navegador. Deben publicarse solamente después de confirmar Firebase Admin en Railway; no se han desplegado desde esta sesión.

## Trabajo pendiente, en orden
1. Contener exposición histórica de respaldos Git después de verificar una copia durable externa. No se borraron respaldos ni historial en esta entrega.
2. Hacer transaccionales entrega, cancelación y liquidación; confirmar devoluciones con proveedor real. El checkout nuevo ya es transaccional, el resto del ciclo aún requiere correcciones.
3. Esperar confirmación durable en todos los cambios de tienda, usuario, banner y credenciales; completar pruebas de recuperación y coherencia entre instancias.
4. Validar SMTP real y quitar éxito ambiguo del envío; preparar recuperación de contraseña y revocación de sesiones.
5. Integrar cobro, reembolso, transferencias y conciliación bancaria; eliminar el checkout SQL alternativo o adaptarlo a la única autoridad.
6. Verificar Railway, IAM, reglas Firestore efectivas, variables y copia externa. Pruebas móviles, concurrencia e integración en un ambiente separado.
7. Validar identificación legal y políticas antes del piloto.

La plataforma sigue sin aprobación para producción abierta. Los resultados de pruebas aisladas no certifican el entorno desplegado ni las cuentas externas.

## Segunda entrega: ciclo financiero durable
- Entrega y cancelación se guardan en una transacción junto con balances, inventario y auditoría; no cambian la memoria ni la pantalla si el guardado falla.
- Ventas nuevas contra entrega reconocen venta/comisión al validar el código, no al crear el pedido. Cancelar antes del envío repone la reserva una sola vez.
- Las solicitudes/ciclos de liquidación reservan fondos; no fabrican referencias ni marcan transferencias como realizadas. La confirmación administrativa requiere referencia bancaria real. Rechazar libera la reserva.
- Pedidos con reclamaciones abiertas quedan fuera de liquidación; liquidaciones anteriores requieren conciliación antes de procesarse, para evitar duplicar saldos.
- Eliminación de pedidos/liquidaciones bloqueada para preservar historial; no se cambiaron registros existentes.
- Checkout de tarjeta/transferencia y webhook genérico permanecen indisponibles hasta integrar/verificar el proveedor real. La preparación de ciclos es administrativa, no un pago automático los viernes.
- Reparación de conexión: conservar listener del puerto Railway y compatibilidad con el destino histórico 3000. No retirar esa compatibilidad sin verificar la configuración del dominio.
- Pruebas aisladas: fallos de transacción, reintentos concurrentes, comisión diferida, cancelación, reserva/rechazo/confirmación, referencias y errores de interfaz.

## Alcance de hoy confirmado por el operador
Piloto con pago contra entrega antes de las 17:00 America/Santo_Domingo. Tarjetas, reembolsos bancarios y transferencias automáticas quedan fuera del piloto.

## Tercera entrega: cuentas y publicación
- Registro de propietario/tienda, edición de cuenta/contraseña, verificación OTP, aprobación administrativa y banners usan guardado durable antes de responder.
- Los códigos y sus intentos sobreviven al reinicio; se invalidan al verificar. Cuenta/tienda pendiente no se publica automáticamente.
- Correo no configurado/rechazado nunca se declara entregado; TLS se verifica y los OTP no se registran en logs. La autenticación SMTP se comprueba en segundo plano sin enviar mensajes.
- Subir una imagen no equivale a verificar identidad: documentos quedan pendientes de revisión y no se inventan puntuaciones biométricas.
- Cambiar la contraseña invalida sesiones anteriores; las cuentas existentes conservan sus datos.
- `/api/health/ready` expone únicamente estados de Firebase Admin, carga durable y SMTP configurado/autenticado; no reemplaza la validación de un flujo real por el operador ni la comprobación de copias externas.
- El incidente de respaldos en Git, identificación legal y credenciales/roles del entorno siguen requiriendo comprobación operativa. No se ha certificado producción abierta.

## Cuarta entrega: publicación y seguridad del repositorio
- Conservar una copia privada verificable de los once JSON versionados antes de retirarlos del árbol actual. El archivo ZIP incluye los SHA de Git y fue comprobado byte a byte. No es una copia reciente de Firestore ni sustituye un respaldo externo del entorno operativo.
- Retirar los JSON sensibles del código y excluir snapshots/cachés de Git. Conservar la base real en Firestore; no ejecutar borrados ni restauraciones sobre producción.
- Retirar cuentas, contraseñas, pasarelas y publicidad de ejemplo de los valores iniciales. Arranque sin registros de ejemplo; un fallo de lectura durable no equivale a colección vacía.
- El operador confirmó que aún no hay empresa registrada ni RNC: publicación de razón social/RNC es opcional y configurable más adelante. No mostrar los valores previos de ejemplo.
- La web describe el piloto contra entrega y muestra la comisión configurada. El panel no confirma un desembolso cuando el servidor lo rechaza.
- Verificación operativa tras tercera entrega: Firebase Admin=true, Firestore cargado=true, SMTP configurado=true, autenticación SMTP=false. El piloto sigue bloqueado por correo hasta resolver la causa.
- Pendiente obligatorio: hacer privado el repositorio o sanear su historial y revisar credenciales expuestas. Retirar archivos del árbol actual NO elimina sus versiones anteriores; la conexión GitHub actual no ofrece administración de visibilidad.


## Activación del correo HTTPS — 8 octubre 2026

El operador confirmó Railway Free/Trial/Hobby y eligió correo por HTTPS. SMTP no está habilitado en esos planes. El adaptador Resend está implementado; necesita configuración externa antes de admitir nuevos registros.

1. En Resend, agregar el dominio `plazado.com` y publicar en IONOS los registros DNS que Resend indique para verificar el envío. Conservar los registros MX del buzón IONOS. No inventar valores DNS.
2. Crear una clave con permisos para envío y consulta de dominios (el diagnóstico consulta `GET /domains` sin enviar correos). Guardarla únicamente como variable secreta de Railway.
3. Configurar en el servicio Railway `MAIL_PROVIDER=RESEND`, `RESEND_API_KEY=<clave secreta>` y `MAIL_SENDER_EMAIL=contacto@plazado.com`. No pegar la clave en conversaciones, Git ni documentos. Volver a desplegar.
4. Verificar `/api/health/ready`: proveedor RESEND, Firestore cargado, administrador Firebase y proveedor de correo verificado. La API acepta el correo para envío; esto no confirma recepción en la bandeja. Validar la recepción mediante el registro de un usuario real autorizado.
5. Antes del piloto, hacer privado el repositorio y revisar los secretos y datos históricos expuestos. Los once archivos fueron preservados y retirados del árbol actual; continúan en el historial Git. La conexión instalada no tiene permisos de administración para cambiar la visibilidad.

Las reclamaciones ahora se guardan de forma atómica junto con el bloqueo del pedido. Abrir un caso rechaza una liquidación pendiente que incluya el pedido y libera la reserva; el administrador debe revisar los casos antes de volver a solicitarla. El cierre requiere una resolución documentada y no afirma haber realizado un reembolso. El historial de reclamaciones no se elimina.

No se ejecutaron compras, registros, reembolsos ni correos de prueba sobre datos reales. La activación externa, la recepción real del código y una comprobación de restauración del respaldo de Firestore siguen pendientes; el archivo preservado del repositorio no sustituye ese respaldo.


## Entrega manual temporal — decisión del operador

El operador pospuso el correo automático hasta poder pagar Railway Pro. El modo predeterminado pasa a `MANUAL` (también seleccionable con `MAIL_PROVIDER=MANUAL`). No requiere Resend ni intenta conexiones SMTP. Los adaptadores automáticos quedan disponibles para más adelante mediante `MAIL_PROVIDER=SMTP` (Pro) o `MAIL_PROVIDER=RESEND` (HTTPS), con credenciales configuradas de forma segura.

Procedimiento: Super Admin → Verificaciones → usuario o tienda pendiente → Preparar envío manual. El servidor consulta el código vigente o guarda uno nuevo si expiró; el panel copia un mensaje con destinatario y vencimiento. Abrir Webmail IONOS, usar contacto@plazado.com y enviar al correo registrado. La plataforma no afirma que copiar el mensaje equivalga a enviarlo. El destinatario introduce el código en el registro; caduca en 15 minutos y se consume una vez. Aprobar documentos no sustituye la verificación OTP. Las cuentas existentes verificadas no se desverifican al solicitar otro código.

`/api/health/ready` muestra explícitamente `registrationDelivery=SUPER_ADMIN_MANUAL` y `automaticEmailReady=false`. La disponibilidad técnica con asistencia manual no certifica producción abierta, respaldo restaurable ni el flujo real completo. Sigue pendiente la revisión operativa de logística/almacén, recuperación de acceso, privacidad del historial Git y restauración externa de Firestore.


## Conversaciones de pedidos

Mensajes y estados de lectura se guardan en una transacción de Firestore antes de confirmarse. Los remitentes y el acceso se determinan por la sesión y el pedido. El texto escrito se conserva cuando falla el envío; el cliente no crea mensajes ficticios locales ni marca lectura si el servidor falla. Identificadores aleatorios y límite de 5000 caracteres por mensaje. Pruebas aisladas de reinicio, rechazo de escritura y fallos de interfaz.


## Almacén — cierre de la entrega actual

- Mutaciones de recepción, inventario, preparación, entrega, incidencias, devoluciones, retiros y configuración se guardan en una transacción de Firestore antes de confirmarse. Se cargan los registros durables al reiniciar; conflictos concurrentes rechazan la escritura.
- Entregar requiere el código del cliente y un pedido despachado. Usa el mismo ciclo financiero contra entrega, con comisión reconocida al validar la entrega. Rechazar el pedido revierte la reserva y evita simular reembolsos.
- Recepción/clasificación/entrega no pueden duplicar movimientos. Cantidades inválidas y falta de inventario se rechazan; el personal administrativo procede desde una sesión verificada y las tiendas no operan sobre otra tienda.
- Se retiran del código las ubicaciones/personas de almacén de ejemplo. No se modifica una configuración real existente. Sin configuración, el servicio empieza desactivado y el Super Admin debe registrar almacenes reales y activarlo expresamente.
- Comprobaciones aisladas de recepción/entrega, fallos de persistencia, reinicio, intentos duplicados, código incorrecto, comisiones y acceso entre comercios. No se ejecutaron movimientos reales para probarlo.

A solicitud del operador, se cierra aquí esta fase. Quedan pendientes la privacidad del historial Git, recuperación de acceso y comprobación operativa completa con respaldo externo restaurable. No se certifica producción abierta por aprobar pruebas aisladas o por mostrar disponibilidad técnica del piloto con códigos manuales.
