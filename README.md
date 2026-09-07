# Platefy

Sitio web de Platefy y demostración del asistente de IA para restaurantes.

- Producción: https://platefy.samilososami.com/
- Chatbot: https://platefy.samilososami.com/chatbot/
- Configuración API: https://platefy.samilososami.com/api/
- La versión anterior permanece completa en [`backup/`](./backup/README.md).

## Desarrollo

Requiere Node.js 24 y npm. Para usar el modelo, Vercel necesita `CLOUDFLARE_WORKER_URL` y el secreto `CLOUDFLARE_WORKER_SECRET`. Nunca se debe incluir el secreto en el repositorio.

```sh
./run.sh install
./run.sh dev
```

`./run.sh test` ejecuta las pruebas de transporte, cancelación y permisos de voz. `./run.sh check` comprueba TypeScript y crea la compilación de producción.

## Arquitectura

React 19, TypeScript y Vite. La compilación genera las entradas estáticas `/`, `/chatbot/` y `/settings/`; Vercel reescribe `/api/` a la pantalla de configuración y ejecuta `/api/chat` y `/api/status` como Functions. La interfaz está disponible en español, inglés y catalán, con diseño adaptable a móvil y escritorio.

El chat usa `@cf/qwen/qwen3-30b-a3b-fp8` mediante Cloudflare Workers AI. La Function de Vercel se comunica con el Worker `platefy-ai-proxy` usando un secreto compartido que nunca llega al navegador. `/api/` muestra el estado y permite probar esta conexión.

Las únicas fuentes de conocimiento del restaurante son [`public/menu/MENU.json`](./public/menu/MENU.json) y [`public/menu/PL8.md`](./public/menu/PL8.md). La Function filtra primero restricciones de alérgenos, dieta, categoría y presupuesto; Qwen3 recibe solo los candidatos verificados. La salida completa se valida antes de enviarla al navegador. El control “Razonar más” activa o desactiva el modo de pensamiento ampliado de Qwen3.

La voz española e inglesa se genera con Kokoro y la entrada hablada usa el reconocimiento del navegador. Las preguntas se procesan en Cloudflare Workers AI; si el usuario activa la voz, el texto de la respuesta también se envía a Kokoro. La voz catalana no está disponible en los proveedores verificados.

La carta, los precios y los horarios de la demostración son ficticios. No se confirman reservas ni se ofrecen garantías sobre alérgenos. El historial permanece en memoria y desaparece al recargar; solo se conserva el idioma.

## Despliegue

Vercel compila el proyecto con `npm run build`, publica `dist/` y despliega las Functions de `api/`. `vercel.json` redirige la antigua ruta `/app` a `/chatbot`, reescribe `/api/` a la pantalla de configuración y aplica cabeceras de seguridad y no-caché al proxy.

Los detalles de implementación, proveedores y validación están en [`docs/`](./docs/).


_*xavisami&co*_
