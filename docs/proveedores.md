# Proveedores y ejecución

## Texto: Qwen2.5 + WebLLM

El chat usa [`Qwen2.5-1.5B-Instruct-q4f16_1-MLC`](https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC) con `@mlc-ai/web-llm` 0.2.84. La inferencia ocurre en un Web Worker del navegador y no requiere API, cuenta ni servidor. El modelo necesita WebGPU, una ventana de 4.096 tokens y aproximadamente 1.629,75 MB de VRAM según la configuración oficial de WebLLM.

El paquete pesado se importa de forma diferida al hacer la primera consulta. Los pesos se descargan desde el repositorio MLC oficial y WebLLM los mantiene en la caché del navegador. La interfaz informa del progreso y conserva la posibilidad de cancelar la generación.

Qwen2.5 Instruct no ofrece el interruptor nativo de pensamiento que tienen modelos posteriores. El control de la interfaz se muestra desactivado con esa explicación y la arquitectura ya acepta el parámetro para un futuro modelo compatible. No se simula ni se muestra razonamiento interno.

## Contexto y seguridad de carta

Las únicas fuentes son:

- `/menu/MENU.json`: 34 referencias ficticias con categoría, precio, descripción, ingredientes, alérgenos, dietas y disponibilidad.
- `/menu/PL8.md`: identidad, tono y reglas de PL8.

Antes de invocar Qwen, `src/services/restaurant.ts` filtra datos estructurados por alérgenos, dieta, presupuesto y categoría. Para una consulta sensible, el modelo solo recibe los candidatos que superan ese filtro. La salida se rechaza si menciona un plato conocido que el filtro había excluido y siempre incorpora la indicación de confirmar trazas y contaminación cruzada. Esto reduce el riesgo, pero no convierte una demostración en certificación médica.

## Voz

- Español: [Kokoro TTS Spanish](https://huggingface.co/spaces/leonelhs/kokoro-tts-spanish), voz `ef_dora`.
- Inglés: [Kokoro TTS Zero](https://huggingface.co/spaces/remsky/Kokoro-TTS-Zero), voz `af_sky`.
- Entrada: `SpeechRecognition` o `webkitSpeechRecognition` del navegador.

El audio es opcional. Solo al activarlo se envía el texto de una respuesta al Space de voz. No hay voz catalana verificada; el chat escrito sigue disponible.
