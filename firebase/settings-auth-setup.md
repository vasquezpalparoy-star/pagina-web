# Configuración de la web: correo verificado

Acceso exclusivo del propietario con la cuenta Firebase Authentication vasquezpalparoy@gmail.com, UID EUMQy18i2YTDZnuxIKda2DvPxU32. En la página principal, abre Configuración e ingresa el correo y contraseña. Si no está verificado, solicita el correo de verificación, abre el enlace recibido y pulsa Ya confirmé mi correo. Olvidé mi contraseña solicita el enlace sin requerir la contraseña actual. La clave 2024 deja de tener efecto.

La autenticación de la página principal usa persistencia de sesión y no crea usuarios anónimos. La lectura de la configuración publicada y preguntas frecuentes es pública; escribir exige el UID autorizado y email_verified true en Firestore. El acceso anónimo separado del catálogo de inventario permanece para lectura en su propio proyecto. El servicio de delivery conserva sus permisos.

No se usa SMS ni facturación Blaze. La confirmación de correo ocurre al verificar la cuenta, no en cada inicio de sesión. Nunca guardar contraseñas en Firestore.

Validación: npm run test:settings; npm run test:settings:rules. El último comando usa un proyecto demo aislado. En entornos restringidos configura TMPDIR a un directorio escribible y JAVA_HOME/LD_LIBRARY_PATH si la instalación de Java lo requiere.
