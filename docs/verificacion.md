# Verificación

## Flujo

`/chatbot/` carga `MENU.json` y `PL8.md` para mostrar la carta. Al enviar una pregunta, `/api/chat` vuelve a cargar esas dos fuentes en servidor, aplica filtros deterministas y llama a GPT‑OSS 120B en Cerebras. La salida se valida antes de entregarse al navegador. El panel Detalles muestra latencia, primer token del proveedor, tokens de entrada y salida, velocidad y nivel de razonamiento.

## Comprobaciones automatizadas

- Transporte y cancelación del proveedor de voz.
- Ciclo de micrófono, permisos y entrada vacía.
- Filtrado de carta en español, inglés y catalán: alergias, dieta, categoría, presupuesto, plato nominal y consulta amplia.
- Parser SSE, almacenamiento de clave y selección de razonamiento.
- TypeScript y build de producción sin mapas de fuentes.

El caso `sin gluten + sin frutos secos + carne + menos de 14 €` devuelve determinísticamente solo `pollo-limon` y `smash-bacon` antes de llamar al modelo. Las pruebas reales de producción registran HTTP, latencia, primer token, tokens y exactitud factual sin imprimir la clave.
