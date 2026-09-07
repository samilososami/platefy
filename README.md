# Platefy

Sitio web de Platefy y demostración del asistente de IA para restaurantes.

- Producción: https://platefy.samilososami.com/
- Chatbot: https://platefy.samilososami.com/chatbot/
- La versión anterior permanece completa en [`backup/`](./backup/README.md).

## Desarrollo

Requiere Node.js 24 y npm. El proyecto no necesita claves de API ni un servidor de inferencia.

```sh
./run.sh install
./run.sh dev
```

`./run.sh test` ejecuta las pruebas de transporte, cancelación y permisos de voz. `./run.sh check` comprueba TypeScript y crea la compilación de producción.

## Arquitectura

React 19, TypeScript y Vite. La compilación genera dos entradas estáticas: `/` y `/chatbot/`. La interfaz está disponible en español, inglés y catalán, con diseño adaptable a móvil y escritorio.

El chat ejecuta `Qwen2.5-1.5B-Instruct-q4f16_1-MLC` dentro del navegador mediante WebLLM y un Web Worker. El modelo requiere WebGPU, usa aproximadamente 1.630 MB de VRAM y se conserva en la caché del navegador después de la primera descarga. La interfaz principal se carga sin incluir el motor: el paquete de WebLLM y sus pesos se solicitan al hacer la primera pregunta.

Las únicas fuentes de conocimiento son [`public/menu/MENU.json`](./public/menu/MENU.json) y [`public/menu/PL8.md`](./public/menu/PL8.md). JavaScript filtra primero restricciones de alérgenos, dieta, categoría y presupuesto; Qwen redacta usando solo los candidatos verificados. Qwen2.5 no expone un modo de pensamiento nativo, por lo que el control aparece desactivado y queda preparado para modelos futuros que sí lo admitan.

La voz española e inglesa se genera con Kokoro y la entrada hablada usa el reconocimiento del navegador. El texto solo sale del dispositivo si el usuario activa la voz. La voz catalana no está disponible en los proveedores verificados.

La carta, los precios y los horarios de la demostración son ficticios. No se confirman reservas ni se ofrecen garantías sobre alérgenos. El historial permanece en memoria y desaparece al recargar; únicamente se conserva el idioma y la caché del modelo en el navegador.

## Despliegue

Vercel compila el proyecto con `npm run build` y publica `dist/`. `vercel.json` redirige la antigua ruta `/app` a `/chatbot` y configura cabeceras básicas de seguridad.

Los detalles de implementación, proveedores y validación están en [`docs/`](./docs/).


_*xavisami&co*_
