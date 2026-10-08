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
