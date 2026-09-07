# Platefy

Sitio web de Platefy y demostración del asistente de IA para restaurantes.

- Producción: https://platefy.samilososami.com/
- Chatbot: https://platefy.samilososami.com/chatbot/
- Configuración API: https://platefy.samilososami.com/api/
- La versión anterior permanece completa en [`backup/`](./backup/README.md).

## Desarrollo

Requiere Node.js 24 y npm. La interfaz necesita una clave de Cerebras configurada como `CEREBRAS_API_KEY` en Vercel o una clave temporal guardada desde `/api/`. Nunca se debe incluir la clave en el repositorio.

```sh
./run.sh install
./run.sh dev
```

`./run.sh test` ejecuta las pruebas de transporte, cancelación y permisos de voz. `./run.sh check` comprueba TypeScript y crea la compilación de producción.

## Arquitectura

React 19, TypeScript y Vite. La compilación genera las entradas estáticas `/`, `/chatbot/` y `/settings/`; Vercel reescribe `/api/` a la pantalla de configuración y ejecuta `/api/chat` y `/api/status` como Functions. La interfaz está disponible en español, inglés y catalán, con diseño adaptable a móvil y escritorio.

El chat usa `gpt-oss-120b` mediante la API de Cerebras. La clave compartida vive solo en la variable sensible `CEREBRAS_API_KEY` de Vercel; `/api/` permite usar una clave personal guardada en la sesión o, de forma opcional, en el almacenamiento local del navegador.

Las únicas fuentes de conocimiento del restaurante son [`public/menu/MENU.json`](./public/menu/MENU.json) y [`public/menu/PL8.md`](./public/menu/PL8.md). La Function filtra primero restricciones de alérgenos, dieta, categoría y presupuesto; GPT‑OSS recibe solo los candidatos verificados. La salida completa se valida antes de enviarla al navegador. El control de razonamiento alterna entre `low` y `medium`; GPT‑OSS 120B no permite desactivarlo por completo.

La voz española e inglesa se genera con Kokoro y la entrada hablada usa el reconocimiento del navegador. Las preguntas se procesan en Cerebras; si el usuario activa la voz, el texto de la respuesta también se envía a Kokoro. La voz catalana no está disponible en los proveedores verificados.

La carta, los precios y los horarios de la demostración son ficticios. No se confirman reservas ni se ofrecen garantías sobre alérgenos. El historial permanece en memoria y desaparece al recargar. Se conserva el idioma y, si el usuario lo elige expresamente en `/api/`, una clave personal en el almacenamiento local.

## Despliegue

Vercel compila el proyecto con `npm run build`, publica `dist/` y despliega las Functions de `api/`. `vercel.json` redirige la antigua ruta `/app` a `/chatbot`, reescribe `/api/` a la pantalla de configuración y aplica cabeceras de seguridad y no-caché al proxy.

Los detalles de implementación, proveedores y validación están en [`docs/`](./docs/).


_*xavisami&co*_
