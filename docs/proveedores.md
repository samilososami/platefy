# Proveedores y ejecución

## Texto: Qwen3 30B-A3B + Cloudflare Workers AI

El chat usa [`@cf/qwen/qwen3-30b-a3b-fp8`](https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/) mediante un Worker con binding de Workers AI. Vercel solo conserva la URL del Worker y un secreto compartido; ninguna credencial de Cloudflare llega al navegador.

Platefy usa `chat_template_kwargs.enable_thinking` para activar el pensamiento ampliado cuando el usuario selecciona “Razonar más”. La respuesta visible se normaliza en el Worker y la traza interna no se entrega al cliente.

## Contexto y seguridad de carta

Las únicas fuentes del restaurante son:

- `/menu/MENU.json`: 34 referencias ficticias con categoría, precio, descripción, ingredientes, alérgenos, dietas y disponibilidad.
- `/menu/PL8.md`: identidad, tono y reglas de PL8.

`api/chat.ts` no acepta modelo, menú ni prompt de sistema desde el cliente. Valida roles y tamaños, limita el historial a siete mensajes, vuelve a ejecutar el filtro determinista de `src/services/restaurant.ts` y envía a Cloudflare Workers AI solo los candidatos pertinentes. La salida se almacena hasta completarse y se rechaza si menciona un plato conocido que el filtro había excluido. En preguntas sensibles añade siempre la indicación de confirmar trazas y contaminación cruzada.

La Function limita el tamaño de entrada, la salida, el origen y las solicitudes por instancia. El Worker exige un secreto de servidor y fija el modelo; una versión multi-restaurante necesitará credenciales y límites persistentes por restaurante.

## Voz

- Español: [Kokoro TTS Spanish](https://huggingface.co/spaces/leonelhs/kokoro-tts-spanish), voz `ef_dora`.
- Inglés: [Kokoro TTS Zero](https://huggingface.co/spaces/remsky/Kokoro-TTS-Zero), voz `af_sky`.
- Entrada: `SpeechRecognition` o `webkitSpeechRecognition` del navegador.

El audio es opcional. Solo al activarlo se envía el texto de una respuesta al Space de voz. No hay voz catalana verificada; el chat escrito sigue disponible.
