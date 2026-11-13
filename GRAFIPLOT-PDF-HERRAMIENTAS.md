# Herramientas gratuitas GRAFIPLOT PDF

La página `/pdf.html` funciona mediante librerías JavaScript en el navegador, sin servidor de pago.

## Funcionalidades actuales
- Unir, dividir, rotar, reordenar, quitar, extraer y copiar páginas; imágenes a PDF.
- Vista previa PDF.js en cada herramienta, navegación y zoom, y visualización del resultado antes de descargar.
- Compresión por rasterización con 3 niveles (el texto deja de ser seleccionable).
- Optimización de estructura y metadatos con pdf-lib: conserva texto, pero no garantiza una reducción.
- Exportación PDF a PNG (ZIP con JSZip).
- Reconocimiento de texto OCR (Tesseract.js; exporta TXT, no añade capa de texto al PDF).
- Texto añadido y firma tipográfica; no son firma digital criptográfica ni edición del texto original.

## Proyectos de referencia
Estas funciones toman como referencia las ideas y características de tres proyectos MIT. **No son una copia ni una integración de las aplicaciones completas.** La integración de sus interfaces completas requeriría adaptar los sistemas de compilación y dependencias.

1. [PDF Compressor Web](https://github.com/JGM-89/pdf-compressor-web) — MIT.
2. [vensas/pdf-editor](https://github.com/vensas/pdf-editor) — MIT © vensas GmbH.
3. [paperless-pdf](https://github.com/IACBI/paperless-pdf) — MIT.

Bibliotecas usadas en el código: pdf-lib (MIT), PDF.js (Apache 2.0), JSZip (MIT/GPLv3), Tesseract.js (Apache 2.0).

## Observaciones
El código se publica estáticamente desde el repositorio. Las dependencias dinámicas se cargan desde un CDN y requieren conexión a Internet. Archivos escaneados grandes pueden exigir mucha memoria.
No se ha contratado Railway ni se ha iniciado ningún alojamiento de pago.
Se deben hacer pruebas manuales en el navegador antes de considerar todo el flujo verificado en producción.
