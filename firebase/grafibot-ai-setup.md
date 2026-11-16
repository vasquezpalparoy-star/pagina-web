# Activar Gemini Flash y el respaldo local de Grafibot

La web está preparada para Gemini 3.8 Flash mediante Firebase AI Logic. La conexión real queda confirmada cuando la prueba del panel funciona. No debes colocar claves privadas de Gemini en GitHub ni en la página.

## 1. Preparar Firebase

1. Abre https://console.firebase.google.com/project/pagina-web-grafiplot-oficial/overview con la cuenta propietaria. Comprueba que el proyecto sea `pagina-web-grafiplot-oficial`.
2. Abre **AI Logic**, pulsa **Comenzar** si corresponde y elige **Gemini Developer API**.
3. Completa la habilitación de APIs que solicita Firebase. La web ya tiene el código de integración: no necesitas copiar ejemplos.
4. Revisa el plan, la disponibilidad del modelo y las cuotas del proyecto. No se presupone que las llamadas sean gratuitas. Revisa las condiciones antes de vincular facturación, si Google la solicita.

## 2. Configurar App Check

1. En Firebase abre **App Check** y selecciona la aplicación web existente de tu página.
2. Selecciona **reCAPTCHA Enterprise** como proveedor.
3. Si no tienes una clave, abre https://console.cloud.google.com/security/recaptcha?project=pagina-web-grafiplot-oficial y crea una clave para **sitio web**, basada en puntuación, sin desafío visible.
4. Registra `grafiplotvasquez.com` y `www.grafiplotvasquez.com`, sin https ni rutas. Añade otros dominios solo si realmente sirven esta web.
5. Copia la **clave pública de sitio / Site key / Key ID** y registra la app web con ella en App Check. No uses una API key de Gemini ni una clave secreta.
6. Comprueba en App Check que **Firebase AI Logic** tenga la protección exigida. Google requiere App Check para este servicio. No necesitas cambiar la protección de Firestore, Auth ni Storage.
7. Espera a que se propaguen los ajustes y revisa las métricas de solicitudes verificadas.

## 3. Activar en Grafiplot

1. Abre https://www.grafiplotvasquez.com/ y actualiza con **Ctrl + F5** tras publicarse el cambio.
2. Entra a **Configuración** con tu cuenta de propietario.
3. Abre **Grafibot · inteligencia artificial**.
4. Pega la clave pública de sitio reCAPTCHA Enterprise.
5. Pulsa **Probar conexión con Gemini**. Consume una solicitud real. Debe mostrar **Conexión comprobada**.
6. Marca **Activar Gemini para Grafibot** y pulsa **Guardar cambios**.
7. Recarga y abre el chat. Las preguntas reconocidas se atienden localmente; las que necesitan interpretación usan Gemini. El indicador diferencia ambos modos.

## 4. Completar la información del modo local

En Configuración completa los precios por menor y mayor, acabados y mínimos de hojas físicas por formato. Un mínimo vacío mantiene la tarifa por menor. Si alcanza mayor y falta su precio, se solicita confirmación.

En **Servicios del cotizador y precios por cantidad** completa escaneo A4, planos y servicios adicionales, con nombres, formatos y rangos. Se aplica el precio del rango a toda la cantidad, igual que el cotizador.

En **Preguntas frecuentes** registra respuestas confirmadas sobre pagos, entregas, materiales y condiciones. Mantén actualizados los horarios, ubicación y WhatsApp de la página. El bot no usa importes ni condiciones del antiguo catálogo fijo.

Gemini interpreta la consulta; el precio siempre lo calcula el cotizador. Pedir por mayor no permite saltarse el mínimo.

## 5. Pruebas que puedes hacer

- `ayuda`: instrucciones sin IA.
- `200 páginas A4 blanco y negro doble cara, 2 juegos, con anillado`: 200 hojas físicas, con importes según tu configuración.
- `sin anillado`, luego `100 páginas`: recalcula conservando los demás datos.
- `cancelar`: empieza otra cotización.
- `Escaneo A4 20 hojas`: usa el rango de escaneo, no impresión.
- `20 páginas A4 negro una cara; Escaneo A4 10 hojas`: suma dos trabajos si ambos tienen tarifas. Hasta 5 trabajos completos separados por punto y coma. No mezcla cantidades entre formatos para conceder mayor.
- Una consulta comercial en lenguaje libre que no coincida con las reglas: debe mostrar Gemini si se interpreta por IA.
- Desactiva Gemini y guarda. Repite las cotizaciones: deben funcionar localmente.

Para probar un fallo de red solo de IA, con la página abierta, bloquea la solicitud a Gemini mediante las herramientas del navegador. El chat mantiene la cotización, pasa al modo local y espera un minuto antes de volver a intentar IA para consultas desconocidas. Los cálculos locales siguen disponibles.

## 6. Alcance sin conexión a IA

Si la IA está apagada, falla, excede su cuota o tarda demasiado, el bot responde con reglas locales, solicita datos y calcula con las tarifas cargadas. No es otro modelo de lenguaje instalado: consultas desconocidas o precios ausentes se confirman con el local.

Con la página ya abierta y los datos cargados puede seguir calculando si se corta Internet. Esta actualización no garantiza abrir toda la página desde cero sin red. Tampoco actualiza precios mientras no haya conexión. WhatsApp necesita Internet. No se guardan conversaciones en un servidor como parte de esta integración.

## 7. Resolver errores

| Resultado | Revisión |
| --- | --- |
| 403 / permisos / App Check | Proyecto, app web, clave pública, dominios y protección de AI Logic. Comprueba bloqueadores de reCAPTCHA. |
| 429 / cuota | Cupo por minuto/día y capacidad del modelo. El modo local puede seguir funcionando. |
| 404 / modelo | Disponibilidad de Gemini 3.8 Flash para el proveedor y proyecto. |
| Red o espera | Conectividad y carga de SDK de Google/reCAPTCHA. |
| Precio por confirmar | Tarifas o rangos incompletos: se corrige en el cotizador. |

Configura los límites por usuario adecuados en Google Cloud/Firebase. El enfriamiento del navegador no sustituye los límites del servicio. La prueba con tu cuenta es necesaria para confirmar la activación; las pruebas del código simulan Gemini.

## Verificación del código

`npm ci`, `npm run test:grafibot`, `node --test tests/quote-ranges.test.mjs tests/settings-ui.test.mjs`.

Referencias oficiales:
- https://firebase.google.com/docs/ai-logic/get-started?platform=web
- https://firebase.google.com/docs/ai-logic/models
- https://firebase.google.com/docs/ai-logic/app-check
- https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider
- https://firebase.google.com/docs/ai-logic/quotas
