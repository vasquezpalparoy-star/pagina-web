# GRAFIPLOT PDF · Servidor Stirling-PDF
Configuración Docker independiente de la tienda GRAFIPLOT.

## Requisitos
- VPS Linux público con Docker + Docker Compose y al menos 4 GB de RAM.
- DNS de `pdf.grafiplotvasquez.com` apuntando a la IP pública del VPS.
- Puertos TCP 80 y 443 abiertos en firewall; Caddy gestiona HTTPS.
- Revisión de licencia y de capacidad para uso público.

## Instalación
1. Copiar esta carpeta `stirling-server/` al VPS.
2. En la carpeta ejecutar `docker compose up -d`.
3. Verificar `https://pdf.grafiplotvasquez.com`.
4. **Cambiar la contraseña inicial de admin inmediatamente**. No abrir el servicio a clientes sin antes configurar controles de abuso, límites, privacidad y copias de seguridad.
5. Configurar el archivo `pdf-config.js` de la web principal con el servidor público después de verificar que funciona y admite integración. El acceso directo es una alternativa si el iframe queda bloqueado.

## Advertencia
No incluye VPS ni crea DNS; subir esta configuración a GitHub NO inicia el servidor. Por seguridad el login está activado. La exposición pública sin registro requiere diseñar controles antiabuso y acceso a servicios de cómputo.
La imagen `latest` facilita la instalación inicial; para producción fijar una versión probada.
Las características disponibles dependen de la edición/licencia Stirling-PDF.
Documentación: https://docs.stirlingpdf.com/Server/Install/Docker/
