# REGLA CRÍTICA DE PRODUCCIÓN — PROTECCIÓN ABSOLUTA DE DATOS (PLAZADO.COM)

Plazado.com ha entrado oficialmente en **FASE DE PRODUCCIÓN**. A partir de este momento, queda estrictamente prohibido modificar, eliminar, reemplazar, sobrescribir, reiniciar o generar datos de prueba sobre información real existente en la plataforma.

## 1. INFORMACIÓN QUE DEBE PERMANECER INTACTA
Toda información creada por usuarios, tiendas o por el Super Admin debe considerarse **DATA REAL DE PRODUCCIÓN** y debe conservarse permanentemente.

Esto incluye, sin limitarse a:
* Usuarios registrados y cuentas de clientes.
* Tiendas registradas y perfiles de tiendas.
* Productos publicados, inventarios, descripciones, precios e imágenes.
* Categorías asignadas.
* Pedidos, ventas e historiales de transacciones.
* Configuraciones realizadas por cada tienda y por el Super Admin.
* Métodos de pago configurados y credenciales/datos bancarios.
* Precios y configuraciones de envío.
* Estados de pedidos e información administrativa.
* Cualquier otro registro generado mediante el uso normal de la plataforma.

## 2. PROHIBIDO CREAR PUBLICACIONES O REGISTROS DE PRUEBA
No crear automáticamente productos, tiendas, clientes, pedidos, publicaciones, categorías, imágenes, ventas ni ningún otro registro ficticio para comprobar una modificación.
No publicar datos ficticios o demostrativos en la base de datos de producción.
Las pruebas técnicas deben ser aisladas en memoria sin persistir basura en los registros reales.

## 3. LAS MODIFICACIONES SOLICITADAS SON EXCLUSIVAMENTE DE CÓDIGO, NO DE DATOS
Cuando se solicite una modificación, se interpreta exclusivamente:
**Código + lógica + interfaz + infraestructura + integraciones + funcionalidades.**
NO significa autorización para modificar, truncar o reescribir los datos almacenados.
Si se pide mejorar o corregir visualizaciones o flujos, se modifica únicamente el código de presentación o la lógica de consulta. Jamás se eliminan o recrean registros de usuarios o tiendas existentes.

## 4. SEPARACIÓN OBLIGATORIA ENTRE CÓDIGO Y DATOS
* **Capa de Aplicación**: Código, componentes, interfaces, APIs, servicios, lógica, integraciones.
* **Capa de Datos**: Usuarios, tiendas, productos, pedidos, ventas, balances, configuraciones.
Una actualización de la capa de aplicación **NO DEBE ALTERAR AUTOMÁTICAMENTE LA CAPA DE DATOS.**

## 5. PROTECCIÓN DE PUBLICACIONES DE LAS TIENDAS
Una publicación creada por una tienda pertenece a esa tienda. Ninguna actualización técnica puede alterarla, eliminarla, reemplazarla, duplicarla o convertirla en prueba. Solamente la tienda propietaria o una acción autorizada explícitamente desde el Super Admin puede modificarla.

## 6. PROTECCIÓN DEL SUPER ADMIN
Todas las configuraciones realizadas desde el Super Admin deben conservarse intactas. Ninguna actualización del sistema debe restablecerlas a valores iniciales por defecto.

## 7. PROHIBIDO REINICIALIZAR LA BASE DE DATOS
Queda prohibido ejecutar procesos destructivos como DROP, DELETE masivo, TRUNCATE, RESET, RESEED, CLEAR DATABASE. Las migraciones deben ser 100% no destructivas.

## 8. SEED DATA DESACTIVADO EN PRODUCCIÓN
En producción: `SEED DATA = DESACTIVADO`. Si ya existen registros reales, cualquier rutina de generación inicial de datos debe ignorarse.

## 9. CONSERVACIÓN DE DATOS ENTRE VERSIONES
Una nueva versión de Plazado.com debe trabajar y persistir SOBRE los datos existentes, nunca reconstruirlos ni sobreescribirlos.

## 10. MÁXIMA PRIORIDAD
**INTEGRIDAD DE DATOS > NUEVAS FUNCIONES**
Antes de cualquier cambio: *"Estoy trabajando sobre una plataforma EN PRODUCCIÓN que contiene información real de clientes y comercios. Debo modificar únicamente lo solicitado y preservar el 100 % de los datos existentes."*
