# Delivery por correo

Proyecto: `pagina-web-grafiplot-oficial`. Firebase Auth Email/Password habilitado; administrador y registro `deliveryAdmins/{uid}` con `enabled: true` comprobados. Sesión de delivery separada del acceso anónimo de la tienda.

## Acceso

1. El dueño abre `delivery-admin.html` con su correo real y contraseña de Firebase Authentication.
2. Si el correo no está verificado, el panel ofrece enviar el enlace de verificación. El dueño abre el enlace en su buzón y pulsa «Ya confirmé mi correo». La aplicación recarga el usuario y renueva el token.
3. El panel crea accesos usando el **correo real del cliente** y una contraseña aleatoria. Guarda el perfil sin contraseña y solicita el envío de verificación a ese correo. Si el envío falla, la cuenta permanece creada y el cliente puede reenviarlo desde su pantalla de acceso.
4. El dueño entrega la contraseña inicial de forma privada. El cliente inicia sesión en `delivery.html`, confirma su correo y consulta solo sus pedidos.
5. «Olvidé mi contraseña» envía el enlace mediante Firebase. La interfaz no revela si el correo existe. Los enlaces usan el manejador predeterminado del dominio Firebase del proyecto.
6. Las contraseñas se pueden cambiar desde la cuenta; no se almacenan en Firestore ni en datos propios persistentes del sitio.

## Pedidos y permisos

- `deliveryCustomers/{uid}`: nombre, correo, teléfono, fecha de creación.
- `deliveryOrders/{id}`: cliente propietario, detalles, dirección, monto en soles, costo de delivery, estado, entrega aproximada, fechas de actualización, salida y entrega.
- Estados: recibido, en proceso, listo para salir, salió con el delivery, entregado.
- Hora estimada introducida por la tienda en horario de Perú. No hay seguimiento GPS.
- Clientes y administradores necesitan `email_verified: true` para consultar o modificar datos de delivery. El registro del propio rol de administrador puede leerse antes de verificar para mostrar la pantalla de verificación; nadie puede cambiar roles desde la aplicación.
- El ruleset `firestore.production.rules` conserva el comportamiento anterior fuera de las tres colecciones delivery. Las reglas previas permitían todo a usuarios autenticados, incluidos anónimos; este trabajo restringe delivery sin modificar esas otras rutas.
- `firestore.before-delivery.rules` es una copia histórica. No restaurarla cuando existan pedidos privados: los expondría a usuarios anónimos autenticados.
- Verificación de cliente/administrador con UID y reglas de backend; la clave 2024 de la configuración web no otorga permisos de delivery.

## Validación

14 pruebas de lógica/interfaz y 8 pruebas de permisos del ruleset completo en el emulador de Firestore. La consola confirma el despliegue del ruleset. No se han creado clientes ni pedidos reales; la primera prueba con correo y enlaces enviados requiere que el dueño ingrese y confirme el mensaje en su propio buzón. No se ha marcado un correo como verificado desde el código ni se ha cambiado ninguna contraseña del dueño.
