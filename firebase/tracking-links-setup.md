# Enlaces privados para seguimiento de delivery

Preparado para activar tras confirmar el cambio de permisos de acceso. Publicar primero firestore.production.rules y luego desplegar la rama. No combinar reglas antiguas permisivas: deliveryOrderLinks queda fuera del permiso general.

Al registrar un pedido se crean, en una transacción, el pedido privado y una proyección accesible únicamente por su token aleatorio de 256 bits. El administrador puede copiar el enlace o generar otro; generar otro invalida el anterior. Los pedidos existentes tienen el botón Generar enlace privado. El token va en el fragmento del URL (#), no en parámetros enviados al servidor o al Referer. No imprime tokens ni enlaces reales en registros.

Cualquiera que posea el enlace puede consultar detalles del trabajo, importe y estado sin iniciar sesión. No se incluyen nombre del cliente, correo, dirección, teléfono ni UID. Las reglas prohíben listar los enlaces y modificar información sin administrador. Al entregar el pedido, la misma transacción actualiza el estado y vence el enlace. Las reglas también revisan el estado privado para bloquear el acceso incluso si la proyección estuviera desactualizada. El cliente borra la información al revocarse o vencer el enlace.

Los enlaces vencen como máximo en 30 días. Los pedidos entregados desaparecen de la vista Activos y se conservan en Historial; no se borran permanentemente. Reabrir un pedido no reactiva el enlace vencido: debe generarse uno nuevo. El acceso anterior por usuario y contraseña se conserva para quienes no usan enlace.

Pruebas: npm test (20); npm run test:tracking:rules (16). El emulador usa el proyecto demo-grafiplot-delivery; nunca datos de producción.
