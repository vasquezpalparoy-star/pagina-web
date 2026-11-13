# GRAFIPLOT PDF · Traducción de tres aplicaciones originales

**Estado:** Preparación. Ninguna de las tres copias originales está traducida al 100% ni publicada como aplicación propia de GRAFIPLOT.

## Alcance
- PDF Compressor Web — https://github.com/JGM-89/pdf-compressor-web (MIT).
- PDF Editor — https://github.com/vensas/pdf-editor (MIT).
- Paperless PDF — https://github.com/IACBI/paperless-pdf (MIT).

Se mantendrán tres aplicaciones completas y separadas. Solo se admitirán cambios de idioma/interfaz; **no se modificarán los motores PDF, algoritmos, exportaciones ni funciones**. Sus licencias y atribuciones originales deben mantenerse.

## Preparación
El flujo de GitHub Actions `preparar-pdf-originales.yml` descarga y construye copias originales en entornos aislados y ofrece tres artefactos. **No despliega al dominio** y no modifica ningún repositorio de terceros. Ejecutar el flujo manualmente en Actions, comprobar que pase las pruebas y revisar los artefactos.

## Traducción real todavía necesaria
1. Localizar todos los textos de la interfaz original de cada proyecto (incluidas notificaciones, cuadros modales y errores).
2. Crear traducciones españolas **dentro de una copia del código**, preservando identificadores de programación y lógica.
3. Construir las tres copias traducidas y ejecutar sus pruebas originales más pruebas manuales de: subir archivo, vista previa, editar, comprimir, OCR, exportar, reordenar y descargar.
4. Publicar solo cuando las pruebas estén completas. Los portales originales abiertos en iframes no permiten traducir su interfaz desde `pdf-aplicaciones.html` por las políticas de origen del navegador.

## Alojamiento
GitHub Pages puede servir aplicaciones web estáticas; no necesita un VPS de pago. La publicación actual de `pagina-web` es independiente de este trabajo de preparación.

Los repositorios externos pueden cambiar con futuras actualizaciones. Fijar versiones/commits específicos antes de una publicación de producción.
