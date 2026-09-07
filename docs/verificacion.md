# Verificación

## Flujo

`/chatbot/` carga `MENU.json` y `PL8.md`, entra en la conversación, aplica filtros deterministas a la pregunta, inicia Qwen2.5 con WebLLM cuando hace falta y muestra la respuesta en streaming. El panel Detalles expone latencia, primer token, tokens por segundo, VRAM estimada y cambio del heap de JavaScript cuando el navegador facilita ese dato.

## Comprobaciones automatizadas

- Transporte y cancelación del proveedor de voz: 6 pruebas.
- Ciclo de micrófono, permisos y entrada vacía: 4 pruebas.
- Filtrado de carta: 6 pruebas para restricciones combinadas, alergias, dieta, categoría, presupuesto, plato nominal y consulta amplia.
- TypeScript y build de producción sin mapas de fuentes.

El caso `sin gluten + sin frutos secos + carne + menos de 14 €` devuelve determinísticamente solo `pollo-limon` y `smash-bacon` antes de llamar al modelo.

## Navegador de desarrollo

Chrome 151 y el navegador integrado Chrome 152 cargaron correctamente la interfaz, `PL8.md` y `MENU.json`; las transferencias locales observadas fueron 1.484 y 16.557 bytes. Ambos navegadores publicaron `navigator.gpu`, pero `requestAdapter()` devolvió `null` en el entorno Linux automatizado. Por ello no se puede atribuir una medida real de generación a este equipo. La interfaz clasifica ese caso como navegador sin adaptador WebGPU, no deja el chat bloqueado y permite reintentar.

La cifra de 1.630 MB es la estimación oficial del registro de WebLLM para este modelo, no una medición de esta GPU. Las métricas reales se calculan tras cada respuesta en un dispositivo con adaptador WebGPU.
