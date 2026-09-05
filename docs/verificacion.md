# Platefy — entrega y verificación

Fecha: 5 de septiembre de 2026.

- Web de producción: https://platefy.samilososami.com/
- Chatbot: https://platefy.samilososami.com/chatbot/
- Repositorio: https://github.com/samilososami/platefy
- La versión anterior del repositorio, correspondiente a `c01e523`, se conserva sin cambios bajo `backup/`.

## Qué incluye

Web editorial en crema, tinta y cobre; Instrument Serif y DM Sans; imágenes creadas con GPT Images y optimizadas a WebP; mascota reutilizable con animaciones y estados; entrada con bienvenida; chat ancho en escritorio y pantalla completa en móvil; carta, horarios y detalles; interfaces en español, inglés y catalán.

Qwen3 VL 4B genera respuestas remotas reales sobre una carta ficticia. Kokoro genera voz española e inglesa. No se necesitan claves, cuentas ni modelos instalados en el equipo. La voz catalana no está disponible en los proveedores verificados. Las reservas no son reales.

## Resultados comprobados

- TypeScript y compilación de producción: correctos.
- 10 tests automáticos: 6 de transporte SSE/cuotas/timeout/cancelación y 4 del ciclo de permisos/transcripción/cancelación del micrófono e input vacío.
- AppDeploy se utilizó como entorno de prepublicación y no devolvió errores de frontend ni de red en sus capturas QA. La herramienta no devolvió resultados de la suite E2E escrita; no se cuentan como tests ejecutados.
- Browser/IAB público: web → bienvenida → chat, apertura/cierre de carta y horarios, reinicio, navegación móvil, cambio de idioma, FAQ y persistencia del idioma al recargar.
- Acceso directo tanto a `/chatbot` como a `/chatbot/`, incluidos recursos y vuelta a portada.
- Pantallas móviles revisadas desde 360 px y escritorio. En las comprobaciones de desbordamiento no aparecieron imágenes rotas ni overflow horizontal de la página.
- Petición real de texto desde la web publicada: el proveedor respondió con cuota temporal agotada. Se mostró un aviso recuperable y el input volvió a estar disponible, sin fabricar una respuesta.
- Pruebas iniciales directas del proveedor: respuesta contextual de texto en aproximadamente 5,4 s; Kokoro español produjo WAV válido en aproximadamente 3,9 s. Son mediciones puntuales, no garantías de latencia.
- Voz desde la interfaz: botón de preescucha, preparación/reproducción y retorno a reposo. En la prueba local se verificó la descarga WAV y el inicio de reproducción. También se recorrió la preescucha en la publicación sin aviso de error.

## Límites de validación

El micrófono depende del reconocimiento de voz del navegador. La automatización del navegador integrado no permitió completar su superficie nativa de permisos. La lógica de permiso pendiente, inicio real, denegación, transcripción y cancelación se cubre mediante un reconocimiento simulado solo en tests. Falta una prueba de voz física en el dispositivo del usuario; la aplicación nunca inserta transcripciones simuladas.

Los servicios anónimos de Hugging Face tienen cuotas y disponibilidad compartidas. Pueden fallar o quedarse en cola. Se mantiene el aviso honesto y no hay reintentos automáticos para eludir límites. La carta y la navegación funcionan sin esperar a la IA. Cancelar corta la petición del navegador, aunque un trabajo remoto ya encolado podría terminar en el proveedor.

El código usa dependencias y rutas normales del sistema, permisos de grupo y `umask 0002`; no necesita un entorno privado de root. Ejecutado como kali. El entorno no permitió verificar una ejecución con uid 0.

## Revisión visual

Conceptos GPT Images creados antes de implementar, con referencias separadas de portada, producto, cierre, chat de escritorio y chat móvil. Conceptos internos: `exec-849563a5-f935-4372-96d0-c173458a0254.png` (portada), `exec-5df7a0c1-64a3-4079-ba87-ee5b8c5b2965.png` (producto), `exec-693b6a18-5bba-4f80-bdf7-499f6b51a923.png` (cierre), `exec-4d9b5cf2-db93-4311-8690-d97ba6e46d73.png` (chat) y `exec-444389d2-df94-4bec-8e01-851f4e4e866c.png` (móvil). Están en la carpeta de imágenes generadas de esta tarea.

Se inspeccionaron con `view_image` el concepto de portada y la captura más reciente de la implementación publicada; además se revisaron las pantallas reales mediante Browser/IAB y sus capturas. Referencia nativa 1536×1024; la captura QA pública de escritorio es 1280×720. Browser/IAB permitió revisar distintas medidas, pero su captura a 1536 px se recortaba al tamaño de la ventana física; se usó también 1280×800 para inspección completa. No se usó un navegador alternativo.

| Punto | Referencia / comprobación | Resultado |
| --- | --- | --- |
| Texto y navegación | Título en tres líneas, CTA de prueba, producto/proceso/FAQ | Sin copy añadido sobre el título; traducciones intencionadas y enlaces funcionales. |
| Tipografía | Serif editorial + sans legible en contenido y controles | Se sustituyó Bodoni inicial por Instrument Serif para ajustar peso óptico y espaciado. |
| Paleta | Crema, tinta, acento cálido | Tokens coherentes. Texto secundario y botones oscuros ajustados para contraste. |
| Mascota | Esfera cálida con dos bocadillos en portada y presencia central en chat | Versión de producción más cobriza y oscura, intencionada para una identidad común entre web y chat. |
| Producto y cierre | Foto mediterránea, columnas abiertas, pasos, FAQ y cierre oscuro | Se conserva el orden y la jerarquía. La foto es un comedor interior en vez de una terraza. |
| Espacio y contenedores | Página editorial abierta, rail lateral y compositor ancho | Sin marco de teléfono en escritorio; menús se convierten en diálogo en móvil. |
| Responsive | Móvil vertical y escritorio | Ajustes de controles, encabezado, altura visual, safe areas y bienvenida en pantallas bajas. |
| Movimiento | Entrada suave y estados de la esfera | Transformaciones y opacidad; pausa fuera de pantalla y respeto a movimiento reducido. |

Variaciones intencionadas adicionales: marca oscura consistente con la portada; sonido desactivado inicialmente por consentimiento de reproducción; información real de cuota, privacidad y carta ficticia que no existía en el concepto raster. No quedan problemas visuales materiales detectados en las superficies revisadas. Los cambios de contenido o estructura proceden de la libertad creativa solicitada y de los límites reales de la integración.

## Código y compilación

La raíz del repositorio contiene el código vigente, el lockfile, las imágenes optimizadas, los tests y las instrucciones. Requiere Node 24 y npm; ejecutar `./run.sh install` y `./run.sh dev`.

`npm run build` genera el contenido estático de `dist/`, incluida la entrada `chatbot/index.html`. La versión anterior es ejecutable de manera independiente desde `backup/`.
