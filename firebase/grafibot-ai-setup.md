# Activar Gemini en Grafibot

La web incluye integración con Firebase AI Logic y Gemini 2.5 Flash-Lite. La IA está apagada por defecto hasta completar la configuración y probar la conexión. No hay llamadas a Gemini al cargar la página; las preguntas básicas y las cotizaciones completas reconocibles se resuelven localmente.

## 1. Preparar el proyecto existente

1. Abrir https://console.firebase.google.com/project/pagina-web-grafiplot-oficial/overview con la cuenta propietaria.
2. En **AI Services / AI Logic**, pulsar **Comenzar** y elegir **Gemini Developer API**. Completar la habilitación de APIs que solicita Google.
3. Para probar sin facturación, comprobar que el proyecto usa **Spark** y que el modelo elegido dispone de cuota gratuita. No cambiar a Blaze ni vincular facturación para seguir estas instrucciones. Si el proyecto ya está en Blaze, no asumir que las llamadas son gratuitas: revisar sus tarifas y cuotas primero.

## 2. Configurar App Check

1. Crear una clave de sitio web de **reCAPTCHA Enterprise**, basada en puntuación y sin casilla visible, en el mismo proyecto de Google Cloud.
2. Registrar `www.grafiplotvasquez.com` y `grafiplotvasquez.com`; añadir cualquier otro dominio de producción solo si realmente sirve esta web. No registrar localhost en una clave de producción.
3. En Firebase **Security / App Check**, registrar la aplicación web existente con reCAPTCHA Enterprise y esa clave pública de sitio.
4. Exigir App Check para **Firebase AI Logic**. No cambiar la aplicación de App Check de Firestore, Auth ni Storage como parte de este trabajo: las otras funciones siguen utilizando su SDK actual.
5. Revisar las cuotas y reducir el límite por usuario a un valor apropiado (por ejemplo 5 solicitudes por minuto). El enfriamiento del navegador es solo una ayuda de interfaz, no un límite seguro ni un cupo diario. Los límites efectivos se configuran en Google Cloud/Firebase. También revisar la cuota gratuita de reCAPTCHA.

## 3. Activar desde GRAFIPLOT

1. Abrir la web y entrar a **Configuración** con el propietario.
2. Abrir **Grafibot · inteligencia artificial**.
3. Pegar únicamente la **clave pública de sitio reCAPTCHA Enterprise**. Nunca una clave privada de Gemini, token de acceso ni contraseña.
4. Pulsar **Probar conexión con Gemini**. Una prueba exitosa confirma App Check y el acceso al modelo y consume una solicitud.
5. Activar la casilla de Gemini y **Guardar cambios**. Si hay errores, no se considera activa la conexión.
6. Cargar las tarifas reales en **Cotización automática · tarifas y acabados**, y mantener las preguntas frecuentes y los horarios de la página actualizados. Grafibot ya no usa los importes del catálogo antiguo del chat.

## Verificar

- Preguntar «horario»: debe usar el horario de la página, sin IA.
- Preguntar «20 ojas A4 sin color una cara»: debe usar blanco y negro y la tarifa del cotizador.
- Solicitar un trabajo con lenguaje libre: debe activar la interpretación de Gemini.
- Pedir impresión más anillado: debe incluir ambas líneas si existen tarifas.
- Si falta una tarifa, debe pedir confirmación por WhatsApp, sin inventar un importe.
- Para una consulta de escaneo u otro servicio especial, debe derivar al asesor.
- Desactivar Gemini y guardar: deben seguir disponibles la atención básica y WhatsApp.

La integración no crea pedidos ni cambia existencias, reglas, usuarios o datos de delivery. Las respuestas de IA se validan como datos estructurados; no se inserta HTML del modelo. La IA clasifica la consulta y extrae datos, las FAQ y los importes mostrados provienen de la web. Las cotizaciones son referencias y requieren confirmación.

No se persisten conversaciones ni se cargan archivos. Una consulta que necesita IA se envía a Google junto con preguntas frecuentes públicas y los datos de la cotización en curso. En el nivel gratuito Google puede utilizar contenido para mejorar sus productos: no enviar datos personales o sensibles. La interfaz muestra este aviso.

Pruebas locales: `npm ci`, `npm test`, `npm run test:settings`. Las pruebas automatizadas simulan Gemini; no acreditan una conexión real con una cuenta sin activar. El botón del panel es la comprobación final.

Referencias oficiales:
- https://firebase.google.com/docs/ai-logic/get-started
- https://firebase.google.com/docs/ai-logic/app-check
- https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider
- https://firebase.google.com/docs/ai-logic/quotas
- https://ai.google.dev/gemini-api/docs/pricing
