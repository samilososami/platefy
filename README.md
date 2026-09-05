# Platefy

Sitio web de Platefy y demostración del asistente de IA para restaurantes.

- Producción: https://platefy.samilososami.com/
- Chatbot: https://platefy.samilososami.com/chatbot/
- La versión anterior permanece completa en [`backup/`](./backup/README.md).

## Desarrollo

Requiere Node.js 24 y npm. El proyecto no necesita claves de API ni modelos locales.

```sh
./run.sh install
./run.sh dev
```

`./run.sh test` ejecuta las pruebas de transporte, cancelación y permisos de voz. `./run.sh check` comprueba TypeScript y crea la compilación de producción.

## Arquitectura

React 19, TypeScript y Vite. La compilación genera dos entradas estáticas: `/` y `/chatbot/`. La interfaz está disponible en español, inglés y catalán, con diseño adaptable a móvil y escritorio.

El chat usa un modelo Qwen alojado en un Space público de Hugging Face. La voz española e inglesa se genera con Kokoro y la entrada hablada usa el reconocimiento del navegador. Los proveedores gratuitos tienen cuotas y disponibilidad compartidas; la interfaz muestra sus errores sin sustituirlos por respuestas simuladas. La voz catalana no está disponible en los proveedores verificados.

La carta, los precios y los horarios de la demostración son ficticios. No se confirman reservas ni se ofrecen garantías sobre alérgenos. El historial permanece en memoria y desaparece al recargar; únicamente se conserva el idioma en el navegador.

## Despliegue

Vercel compila el proyecto con `npm run build` y publica `dist/`. `vercel.json` redirige la antigua ruta `/app` a `/chatbot` y configura cabeceras básicas de seguridad.

Los detalles de implementación, proveedores y validación están en [`docs/`](./docs/).


xavisami&co
