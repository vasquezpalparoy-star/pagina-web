# Delivery: acceso sencillo del cliente

El administrador ingresa con su correo real, contraseña y correo verificado. El cliente no se registra: la tienda asigna un usuario único (por ejemplo maria123) y una contraseña de al menos 6 caracteres desde delivery-admin.html. Entrega las credenciales de forma privada. El cliente ingresa en delivery.html y solamente consulta sus propios pedidos.

Firebase Authentication maneja la contraseña; el usuario se traduce internamente a una dirección técnica @delivery.grafiplotvasquez.com que no es una bandeja de correo. No se envían verificaciones ni recuperación por correo al cliente. Si pierde su acceso, debe contactar a la tienda; el administrador puede restablecerlo desde Firebase Authentication. Las contraseñas no se guardan en Firestore.

La cuenta administradora requiere el documento deliveryAdmins/UID con enabled:true y correo verificado. Los perfiles y pedidos únicamente pueden crearse por administradores autorizados. El cliente no puede editar pedidos, precios, estados ni roles. Las reglas preservan el comportamiento del sitio existente fuera de delivery.
