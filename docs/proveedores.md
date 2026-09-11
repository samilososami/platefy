# Proveedores y ejecución

## Texto: Vercel AI Gateway

El asistente se llama **platefy**. Usa [`google/gemini-2.5-flash`](https://vercel.com/ai-gateway/models/gemini-2.5-flash) mediante la API compatible con OpenAI de Vercel AI Gateway. Vercel conserva `AI_GATEWAY_API_KEY` como variable sensible de producción. La clave solo se lee dentro de `api/chat.ts` y nunca llega al navegador.

`api/chat.ts` fija el modelo en el servidor y no acepta modelos ni configuración proporcionados por el navegador. No hay selector de razonamiento ni nombres de proveedores o modelos en la conversación. Las métricas técnicas del transporte no forman parte de la interfaz del comensal.

## Restaurantes y fuentes

`/restaurantes/` reúne Kō y Vita. Cada restaurante tiene una carta digital y su propia conversación:

| Restaurante | Carta | Chat | Datos |
| --- | --- | --- | --- |
| Kō | `/restaurantes/ko/` | `/restaurantes/ko/platefy/` | `/restaurantes/ko/menu.json` |
| Vita | `/restaurantes/vita/` | `/restaurantes/vita/platefy/` | `/restaurantes/vita/menu.json` |

Las únicas fuentes de conocimiento son `/platefy.md`, con la identidad y las reglas compartidas, y el `menu.json` del restaurante seleccionado. Cada JSON incluye platos, precios, descripciones, ingredientes, alérgenos, dietas, disponibilidad y rutas de imágenes. Las cartas son ejemplos; los datos de alérgenos no sustituyen una validación de cocina. `/chatbot/` y las antiguas rutas de carta genérica redirigen al directorio de restaurantes.

## Contexto, imágenes y límites

El cliente envía `restaurant: "ko" | "vita"`, el idioma y hasta siete mensajes. `api/chat.ts` valida el identificador contra una lista cerrada y carga los archivos del restaurante desde el servidor. No acepta un menú, un modelo ni un prompt de sistema proporcionados por el navegador.

El filtro determinista compartido en `src/services/restaurant.ts` selecciona candidatos por ingredientes, alérgenos, dieta, categoría y presupuesto antes de llamar al modelo. Cuando la consulta incluye número de personas y presupuesto total, el mismo módulo construye el pedido y calcula cantidades, subtotales, total y coste por persona. El plan intenta acercarse al 97 % del presupuesto sin superarlo y reutiliza las restricciones de los últimos mensajes en peticiones de reajuste. La salida completa se valida antes de entregarse. Si menciona por su nombre un plato conocido que el filtro ha excluido, se rechaza; esto no constituye una garantía general contra alucinaciones. En consultas de alergias se recuerda confirmar trazas y contaminación cruzada con el equipo.

Las peticiones de fotografías se resuelven con datos del menú sin invocar el modelo. Los adjuntos solo admiten imágenes declaradas en el JSON y ubicadas bajo las rutas del mismo restaurante. El cliente vuelve a validar esas rutas antes de mostrarlas. No se usan URLs inventadas por el modelo ni se envían imágenes a inferencia.

La Function limita tamaño, historial, duración, origen y solicitudes por instancia. Admite 60 solicitudes por minuto e IP. Si AI Gateway devuelve un límite temporal (`429`) o falta de créditos (`402`), responde con una selección determinista del menú en vez de anunciar una cuota diaria inexistente. Los tres restaurantes de muestra comparten actualmente la conexión y los créditos de Vercel AI Gateway. Para cuentas independientes por restaurante harían falta credenciales y límites persistentes separados; esta versión no los implementa.

## Voz

- Español: [Kokoro TTS Spanish](https://huggingface.co/spaces/leonelhs/kokoro-tts-spanish), voz `ef_dora`.
- Inglés: [Kokoro TTS Zero](https://huggingface.co/spaces/remsky/Kokoro-TTS-Zero), voz `af_sky`.
- Entrada: `SpeechRecognition` o `webkitSpeechRecognition` del navegador.

El sonido es opcional. Solo al solicitarlo se envía el texto de una respuesta al servicio de voz. La voz catalana no está verificada; el chat escrito sigue disponible. Los servicios externos de voz pueden imponer cuotas o estar temporalmente indisponibles.
