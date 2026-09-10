# Verificación

## Flujo actual

La portada enlaza a `/restaurantes/`. Kō y Vita tienen una carta digital, un `menu.json` y un chat en `/restaurantes/<slug>/platefy/`. El acceso genérico `/chatbot/` redirige al directorio.

Al abrir cada conversación se cargan `/platefy.md` y el menú de ese restaurante; la caché de conocimiento distingue ambos identificadores. Al enviar una pregunta, `/api/chat` valida `restaurant`, vuelve a leer las fuentes del servidor, filtra los datos pertinentes y llama a Gemini 2.5 Flash mediante Vercel AI Gateway. La respuesta se valida antes de mostrarse. Las solicitudes de fotografías se resuelven directamente con los adjuntos del menú.

El asistente se presenta como platefy. La interfaz no expone el nombre del modelo, recuentos de referencias, controles de razonamiento ni un panel de métricas técnicas.

## Comprobaciones automatizadas

`npm test` cubre:

- Transporte, cancelación y errores del proveedor de voz.
- Ciclo del micrófono, permisos, cancelación y rechazo de mensajes vacíos.
- Filtrado de cartas en español, inglés y catalán.
- Aislamiento de Kō y Vita, cachés separadas y rechazo de un menú cuyo identificador no coincide.
- Validación del restaurante, rechazo de contexto arbitrario del navegador y razonamiento siempre desactivado.
- Fotografías declaradas en el menú, referencias a la recomendación anterior y rechazo de imágenes de otro restaurante.
- Lectura del transporte SSE y representación de adjuntos en la conversación.

`npm run check` comprueba TypeScript y genera la compilación de producción. El resultado final debe inspeccionarse para confirmar que no contiene archivos `.map` ni assets ausentes; no basta con revisar únicamente la configuración de Vite.

## Comprobaciones de navegador y producción

El procedimiento manual está en `tests/tests.txt`. Debe aplicarse a ambas cartas y ambos chats, en móvil y escritorio, incluyendo navegación, fotografías, alergias, errores recuperables y voz opcional. Confirmar HTTP, rutas del dominio y ausencia de errores de consola tras el despliegue.

Los tests de filtrado usan además fixtures controladas; sus platos y resultados esperados no describen necesariamente las cartas públicas actuales. Para consultas reales, contrastar nombres, ingredientes y precios contra el `menu.json` del restaurante correspondiente. Registrar latencia y consumo sin imprimir secretos y sin confundir una prueba local con una verificación de producción.
