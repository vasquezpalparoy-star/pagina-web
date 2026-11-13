# Traducción española de las tres aplicaciones PDF originales

## Estado real
La rama `grafiplot-pdf-es-originales` incluye una **capa inicial de traducción de interfaz** de las tres aplicaciones. La traducción cubre nombres de herramientas, botones, controles y numerosos mensajes comunes; **no puede considerarse total** sin revisar cada pantalla, diálogos y mensajes de error.

No está desplegada en el dominio. No sustituye las tres aplicaciones originales actualmente enlazadas en `pdf-aplicaciones.html`.

## Aplicaciones y autoría
- [PDF Compressor Web](https://github.com/JGM-89/pdf-compressor-web) — J.G.Moore, MIT.
- [PDF Editor](https://github.com/vensas/pdf-editor) — vensas GmbH, MIT.
- [Paperless PDF](https://github.com/IACBI/paperless-pdf) — IACBI, MIT.

## Cómo está implementada
- `es-visible.js` traduce exclusivamente textos de interfaz y ciertos atributos accesibles, sin tocar algoritmos PDF ni archivos originales.
- `inyectar-es.py` añade esa traducción a copias *compiladas*; no modifica la fuente de las aplicaciones.
- `.github/workflows/preparar-pdf-originales.yml` descarga cada aplicación, instala dependencias, ejecuta las pruebas originales donde están disponibles, construye tres artefactos y agrega la capa de idioma.
- Los contenidos de los PDF, los elementos editables y las capas de texto conocidas del visor se excluyen intencionadamente de la traducción.

## Antes de publicar
1. Ejecutar el flujo GitHub Actions y verificar que las tres compilaciones terminen correctamente.
2. Probar visualmente y funcionalmente todas las pantallas; comprobar que no queden textos visibles en inglés.
3. Completar el diccionario de traducción con los textos encontrados.
4. Comprobar apertura, vista previa, edición, firma, compresión, OCR, descargar, exportar, y compatibilidad con móviles.
5. Publicar las tres copias como directorios estáticos separados y cambiar los enlaces solo después de las verificaciones.

**Nota importante:** traducir DOM en tiempo de ejecución no es exactamente lo mismo que implementar i18n nativa; podría haber re-renderizados que sobrescriban un texto o errores que no se traduzcan. No afirmar equivalencia funcional ni 100% español sin pruebas reales.
