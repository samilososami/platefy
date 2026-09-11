# Platefy

Sitio web de Platefy y demostración del asistente de IA para restaurantes.

- Producción: https://platefy.samilososami.com/
- Chatbot: https://platefy.samilososami.com/chatbot/
- Configuración API: https://platefy.samilososami.com/api/
- La versión anterior permanece completa en [`backup/`](./backup/README.md).

## Desarrollo

Requiere Node.js 24 y npm. Para usar el modelo, Vercel necesita `AI_GATEWAY_API_KEY` como variable sensible. Nunca se debe incluir la clave en el repositorio ni usar un prefijo público.

```sh
./run.sh install
./run.sh dev
```

`./run.sh test` ejecuta las pruebas de transporte, cancelación y permisos de voz. `./run.sh check` comprueba TypeScript y crea la compilación de producción.

## Arquitectura

React 19, TypeScript y Vite. La compilación genera las entradas estáticas `/`, `/chatbot/` y `/settings/`; Vercel reescribe `/api/` a la pantalla de configuración y ejecuta `/api/chat` y `/api/status` como Functions. La interfaz está disponible en español, inglés y catalán, con diseño adaptable a móvil y escritorio.

El chat usa `google/gemini-2.5-flash` mediante Vercel AI Gateway. La Function `/api/chat` autentica cada petición en el servidor con `AI_GATEWAY_API_KEY`; la clave nunca llega al navegador. `/api/` muestra el estado y permite probar esta conexión.

Cada restaurante carga exclusivamente su `public/restaurantes/<slug>/menu.json` y la identidad compartida `public/platefy.md`. El agente se llama platefy. Solo se admiten `ko`, `vita` y `pica-pica`; el servidor selecciona la carta desde esa lista, nunca desde datos proporcionados por el navegador. La Function filtra alérgenos, dieta y categoría. Las consultas con comensales y presupuesto total se calculan de forma determinista: cantidades, subtotales, total y coste por persona proceden de los precios del JSON y las correcciones conservan las restricciones recientes. Las fotos se resuelven desde rutas verificadas del mismo menú y se adjuntan al chat, sin visión ni URLs inventadas por el modelo. La interfaz no expone ni permite configurar el razonamiento.

La voz española e inglesa se genera con Kokoro y la entrada hablada usa el reconocimiento del navegador. Las preguntas se procesan mediante Vercel AI Gateway; si el usuario activa la voz, el texto de la respuesta también se envía a Kokoro. La voz catalana no está disponible en los proveedores verificados.

La carta, los precios y los horarios de la demostración son ficticios. No se confirman reservas ni se ofrecen garantías sobre alérgenos. El historial permanece en memoria y desaparece al recargar; solo se conserva el idioma.

Si AI Gateway limita temporalmente las peticiones o no tiene créditos disponibles, el servidor mantiene una respuesta básica basada exclusivamente en el menú verificado. El límite local admite hasta 60 solicitudes por minuto e IP antes de mostrar una espera temporal.

## Despliegue

Vercel compila el proyecto con `npm run build`, publica `dist/` y despliega las Functions de `api/`. `vercel.json` redirige la antigua ruta `/app` a `/chatbot`, reescribe `/api/` a la pantalla de configuración y aplica cabeceras de seguridad y no-caché al proxy.

Los detalles de implementación, proveedores y validación están en [`docs/`](./docs/).


_*xavisami&co*_


## Cartas de muestra

- `/restaurantes/`: directorio.
- `/restaurantes/ko/` y `/restaurantes/vita/`: cartas digitales.
- `/restaurantes/<slug>/platefy/`: conversación del restaurante.
- `/restaurantes/<slug>/menu.json`: datos públicos e imágenes de esa carta.

`npm run dev` y `npm run build` generan las páginas HTML desde los JSON mediante `scripts/create-restaurant-pages.mjs`. Los platos se renderizan como HTML estático; el JS de carta solo gestiona búsqueda y detalles. Los JSON deben mantener IDs únicos y rutas de imagen dentro de su restaurante. Las cartas parten de Figma; ingredientes ampliados y alérgenos son recetas de muestra no verificadas. Las imágenes son ilustrativas generadas. Las propuestas visuales están en `docs/design/`. No hay reservas reales.
