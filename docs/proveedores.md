# Proveedores y ejecución

## Texto: GPT‑OSS 120B + Cerebras

El chat usa [`gpt-oss-120b`](https://inference-docs.cerebras.ai/api-reference/models/public-models) a través del endpoint OpenAI compatible de Cerebras. La clave compartida se lee exclusivamente desde `CEREBRAS_API_KEY` en Vercel. Una clave personal introducida en `/api/` se conserva en `sessionStorage` por defecto o, con consentimiento expreso, en `localStorage`; viaja a la Function en cada petición y no se registra.

GPT‑OSS 120B admite `reasoning_effort` `low`, `medium` y `high`, pero no `none`. Platefy usa `low` en modo rápido y `medium` cuando se activa “Razonar más”. `reasoning_format: hidden` impide devolver la traza de razonamiento.

## Contexto y seguridad de carta

Las únicas fuentes del restaurante son:

- `/menu/MENU.json`: 34 referencias ficticias con categoría, precio, descripción, ingredientes, alérgenos, dietas y disponibilidad.
- `/menu/PL8.md`: identidad, tono y reglas de PL8.

`api/chat.ts` no acepta modelo, menú ni prompt de sistema desde el cliente. Valida roles y tamaños, limita el historial a siete mensajes, vuelve a ejecutar el filtro determinista de `src/services/restaurant.ts` y envía a Cerebras solo los candidatos pertinentes. La salida se almacena hasta completarse y se rechaza si menciona un plato conocido que el filtro había excluido. En preguntas sensibles añade siempre la indicación de confirmar trazas y contaminación cruzada.

El proxy limita el tamaño de entrada, la salida, el origen y las solicitudes por instancia. Es una protección básica para una demostración; una versión multi-restaurante necesitará autenticación y límites persistentes por cliente.

## Voz

- Español: [Kokoro TTS Spanish](https://huggingface.co/spaces/leonelhs/kokoro-tts-spanish), voz `ef_dora`.
- Inglés: [Kokoro TTS Zero](https://huggingface.co/spaces/remsky/Kokoro-TTS-Zero), voz `af_sky`.
- Entrada: `SpeechRecognition` o `webkitSpeechRecognition` del navegador.

El audio es opcional. Solo al activarlo se envía el texto de una respuesta al Space de voz. No hay voz catalana verificada; el chat escrito sigue disponible.
