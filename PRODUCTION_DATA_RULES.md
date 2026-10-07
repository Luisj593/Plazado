# INSTRUCCIONES DE PROTECCIÓN DE DATOS DE PRODUCCIÓN — PLAZADO.COM

## Regla obligatoria para cualquier modificación del repositorio

Toda actualización, corrección, mejora, refactorización o nueva funcionalidad debe realizarse **únicamente sobre el código fuente de la plataforma**.

### Datos de producción protegidos

Está terminantemente prohibido que una actualización de código:

- Cree, modifique, sustituya o elimine usuarios registrados.
- Cree, modifique, sustituya o elimine tiendas creadas por usuarios.
- Cree datos ficticios, tiendas de prueba, usuarios de prueba o registros demo automáticamente.
- Elimine o reinicialice productos, pedidos, balances, direcciones, credenciales, configuraciones de tiendas u otros registros existentes.
- Sobrescriba la base de datos durante un build, deploy, restart, seed o actualización.
- Ejecute seeds, resets, purgas o migraciones destructivas automáticamente.
- Reemplace información real con datos predeterminados del código.
- Modifique contraseñas, códigos, estados o relaciones de cuentas existentes salvo una acción explícita realizada por el propio usuario o Super Admin desde una función diseñada para ello.

### Persistencia

Los despliegues y actualizaciones deben preservar íntegramente los datos existentes. El código debe adaptarse al esquema y datos actuales sin reinicializar la base de datos.

Los datos de ejemplo solo pueden existir como constantes o fixtures de desarrollo que **no se ejecuten ni se inserten en producción**.

### Migraciones

Si una nueva funcionalidad requiere modificar el esquema de datos:

1. La migración debe ser no destructiva.
2. Debe conservar todos los registros existentes.
3. No debe ejecutarse una operación destructiva sin autorización explícita del propietario de Plazado.com.
4. Debe existir compatibilidad con registros creados antes de la actualización.

### Prioridad

**Código nuevo ≠ datos nuevos.**

Modificar la plataforma significa modificar su código y funcionalidades, no alterar los registros reales de clientes o comercios.

Esta regla debe tratarse como una restricción permanente de producción para cualquier desarrollador, agente de IA o proceso automatizado que trabaje con este repositorio.
