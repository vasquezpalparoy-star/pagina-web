# Activación de delivery

Preparado para el proyecto existente `pagina-web-grafiplot-oficial`. El código usa `USER_FIREBASE_CONFIG` y una instancia de Auth separada del acceso anónimo de la tienda. La bandera `DELIVERY_ENABLED` permanece en `false` hasta verificar la protección real de Firebase.

1. En Firebase Console → Authentication → Sign-in method, activar **Email/Password**. Mantener el acceso anónimo existente de la tienda.
2. Crear o seleccionar una cuenta de correo/contraseña para la administración de delivery. El dueño define la contraseña en Firebase; nunca ponerla en código, Firestore o GitHub. Copiar el UID de Authentication.
3. En Firestore, crear `deliveryAdmins/{UID_DEL_ADMIN}` con `enabled: true` (booleano). Este documento solo se crea desde la consola/entorno privilegiado. La clave 2024 de la web no concede permisos de delivery.
4. Leer las reglas actuales antes de modificarlas. Integrar las funciones y los tres bloques `delivery*` de `firestore.delivery.rules` dentro de `match /databases/{database}/documents`. Este archivo es una fixture para pruebas, **no** un reemplazo de las reglas de la tienda.
5. Verificar que ninguna regla global de acceso público o de acceso a cualquier usuario autenticado incluya las colecciones `delivery*`. En Firestore, una regla permisiva coincidente permite el acceso aunque otra lo deniegue. Mantener intactos los permisos necesarios para configuración, galería e inventario, limitándolos a sus rutas existentes.
6. Ejecutar `npm ci && npm run test:delivery:rules` para validar la fixture aislada. Probar además el ruleset completo integrado antes de desplegarlo; la fixture no descubre permisos de otros bloques de producción.
7. Publicar las reglas y probar dos clientes, un usuario anónimo y un administrador con el ruleset desplegado. Un cliente no debe leer el pedido del otro ni cambiar montos, estados o roles. Un usuario anónimo no debe poder leer ninguna de las colecciones de delivery.
8. Cambiar `DELIVERY_ENABLED` a `true` en `assets/v1/delivery-config.js` solo después de completar la prueba anterior. Publicar la rama.
9. Entrar a `delivery-admin.html`. Crear un cliente y entregar su usuario y contraseña de forma privada. Registrar su pedido con detalles, dirección, importe, costo de delivery y fecha/hora estimada de Perú. El cliente entra por `delivery.html` y puede cambiar su contraseña.

## Datos y comportamiento

- Usuarios asignados: por ejemplo `cliente.maria`. Internamente se usa el alias de Auth `cliente.maria@clientes.grafiplotvasquez.com`; no se envía correo a este alias.
- Contraseñas aleatorias: 144 bits de entropía, manejadas por Firebase Authentication; el panel solo muestra la contraseña inicial inmediatamente después de crear la cuenta. No se guardan en Firestore ni en almacenamiento propio del sitio.
- `deliveryCustomers/{uid}`: nombre, usuario, teléfono y fecha de creación. Sin contraseñas.
- `deliveryOrders/{id}`: propietario, nombre, detalles, dirección, importe en soles, costo de delivery, estado, hora estimada y fechas de creación, actualización, salida y entrega. El administrador actualiza; el cliente solo consulta.
- Estados: recibido → en proceso → listo para salir → salió con el delivery → entregado. El administrador puede corregir un estado; volver a un estado anterior a la salida borra la fecha de salida/entrega.
- La hora estimada es un dato de la tienda, no un cálculo de GPS. No hay rastreo del repartidor.
- Sesiones de delivery separadas de la sesión anónima de la tienda y limitadas a la sesión del navegador. Pedidos escuchados con `onSnapshot`, sin copias persistentes propias.
- Si el cliente pierde su contraseña, el dueño gestiona la recuperación de la cuenta en Firebase Console; los alias asignados no tienen buzón para restablecimiento por correo.
- El alta de cuentas se hace en una instancia secundaria con persistencia en memoria, sin sustituir la sesión del administrador. Si falla guardar el perfil se intenta retirar únicamente la cuenta recién creada. Si esa limpieza falla, el panel pide revisar Authentication antes de reintentar.

## Estado de esta entrega

Interfaz y código preparados. Validación local: 11 pruebas de lógica/interfaz y 6 pruebas de reglas en el emulador de Firestore aprobadas; también pasó la regresión de tienda, carrito y configuración. No se ha iniciado sesión en Firebase Console, activado Email/Password, creado un administrador ni cambiado las reglas de producción. No se han creado cuentas reales ni pedidos de clientes. No activar la bandera solo porque los tests de lógica pasen.
