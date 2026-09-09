# Proveedores y ejecución

## Texto: Cloudflare Workers AI

El asistente se llama **platefy**. Usa [`@cf/qwen/qwen3-30b-a3b-fp8`](https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/) mediante un Worker con binding de Workers AI. Vercel conserva `CLOUDFLARE_WORKER_URL` y `CLOUDFLARE_WORKER_SECRET`; el Worker valida el secreto con `ORIGIN_SECRET`. Ninguna credencial de Cloudflare llega al navegador.

`api/chat.ts` envía siempre `thinking: false`. No hay selector de razonamiento ni nombres de proveedores o modelos en la conversación. Las métricas técnicas del transporte no forman parte de la interfaz del comensal.

## Restaurantes y fuentes

`/restaurantes/` reúne Kō y Vita. Cada restaurante tiene una carta digital y su propia conversación:

| Restaurante | Carta | Chat | Datos |
| --- | --- | --- | --- |
| Kō | `/restaurantes/ko/` | `/restaurantes/ko/platefy/` | `/restaurantes/ko/menu.json` |
| Vita | `/restaurantes/vita/` | `/restaurantes/vita/platefy/` | `/restaurantes/vita/menu.json` |

Las únicas fuentes de conocimiento son `/platefy.md`, con la identidad y las reglas compartidas, y el `menu.json` del restaurante seleccionado. Cada JSON incluye platos, precios, descripciones, ingredientes, alérgenos, dietas, disponibilidad y rutas de imágenes. Las cartas son ejemplos; los datos de alérgenos no sustituyen una validación de cocina. `/chatbot/` y las antiguas rutas de carta genérica redirigen al directorio de restaurantes.

## Contexto, imágenes y límites

El cliente envía `restaurant: "ko" | "vita"`, el idioma y hasta siete mensajes. `api/chat.ts` valida el identificador contra una lista cerrada y carga los archivos del restaurante desde el servidor. No acepta un menú, un modelo ni un prompt de sistema proporcionados por el navegador.

El filtro determinista compartido en `src/services/restaurant.ts` selecciona candidatos por ingredientes, alérgenos, dieta, categoría y presupuesto antes de llamar al modelo. La salida completa se valida antes de entregarse. Si menciona por su nombre un plato conocido que el filtro ha excluido, se rechaza; esto no constituye una garantía general contra alucinaciones. En consultas de alergias se recuerda confirmar trazas y contaminación cruzada con el equipo.

Las peticiones de fotografías se resuelven con datos del menú sin invocar el modelo. Los adjuntos solo admiten imágenes declaradas en el JSON y ubicadas bajo las rutas del mismo restaurante. El cliente vuelve a validar esas rutas antes de mostrarlas. No se usan URLs inventadas por el modelo ni se envían imágenes a inferencia.

La Function limita tamaño, historial, duración, origen y solicitudes por instancia. Kō y Vita comparten actualmente la conexión y cuota de Workers AI. Para cuentas independientes por restaurante harían falta credenciales y límites persistentes separados; esta versión no los implementa.

## Voz

- Español: [Kokoro TTS Spanish](https://huggingface.co/spaces/leonelhs/kokoro-tts-spanish), voz `ef_dora`.
- Inglés: [Kokoro TTS Zero](https://huggingface.co/spaces/remsky/Kokoro-TTS-Zero), voz `af_sky`.
- Entrada: `SpeechRecognition` o `webkitSpeechRecognition` del navegador.

El sonido es opcional. Solo al solicitarlo se envía el texto de una respuesta al servicio de voz. La voz catalana no está verificada; el chat escrito sigue disponible. Los servicios externos de voz pueden imponer cuotas o estar temporalmente indisponibles.
