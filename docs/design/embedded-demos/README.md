# Demos integradas en la landing

## Alcance y dirección

Sustituir la presentación estática por una conversación real con un selector Kō / Vita / Pica Pica. Eliminar los botones de la landing que enviaban a las demos o al directorio. Conservar sin cambios el directorio y las dos webs de restaurantes existentes. Pica Pica solo existe como contexto de demostración, sin web ni ficha en el directorio.

Referencias: `desktop-concept.png` (1536×1024), `mobile-concept.png` (1024×1536). Interfaz nativa, ilustraciones independientes. La fotografía original de carta de Figma es `pica-pica-menu-reference.png` (nodo 4:50). El marco 3:26 está titulado Bruma, pero la fotografía y la petición del usuario identifican el restaurante como Pica Pica; su anotación copiada sobre sushi no es aplicable.

## Sistema de diseño

- Fondo landing marfil existente #f5f3ee, Instrument Serif para titulares/marcas y Manrope para controles exteriores; el chat conserva DM Sans.
- Sección abierta, título 62px en escritorio / 42px móvil; subtítulo 17px / 13px. Tres pestañas en una sola fila con selección subrayada. Sin nuevas insignias ni métricas.
- Escenario con radio 26px: panel ilustrado 32.6% y chat 67.4%, altura 700px escritorio. En móvil la ilustración forma una cabecera de 140px y el chat ocupa todo el ancho. Controles táctiles de al menos 44px.
- Kō: exterior carbón #444140, texto crema #f5efe6, chat terracota #e8bda0, acento rojo. Sin fondo verde.
- Vita: exterior bosque #1b512d, texto y chat hoja #def4c6, acento #1c7c54.
- Pica Pica: aguamarina #a8dadc, superficie #f1faee, tinta #1d3557, azul #457b9d y naranja #ff9900, de Figma.
- Assets exteriores sin tintes: jardín japonés, composición vegetal y sardinas/coral/conchas. Esferas con materiales lacados, vegetales y marinos respectivamente. La decoración nunca captura eventos ni invade el texto.
- Selector accesible con flechas, Inicio/Fin y navegación táctil horizontal. Una sola instancia de chat. Cada cambio destruye el contexto anterior, cancela audio y mantiene el aislamiento de cartas. Carga diferida al acercarse al viewport.

## Texto permitido

“Una voz. Tres personalidades.”, “Elige un restaurante y habla con platefy.”, nombres de los tres restaurantes y sus cocinas, una frase breve de identidad por restaurante. En el chat: “¿Qué te apetece hoy?”, “Pregunta por la carta, los ingredientes o los precios.”, “Recomiéndame algo”, “Ver la carta”, “Nuevo chat”, “Escribe tu pregunta…”. Se conservan el aviso de carta de muestra, los detalles de privacidad, idiomas y controles de voz del producto.

## Adaptaciones funcionales de los conceptos

Se mantienen los nombres completos de las cocinas del concepto de escritorio en móvil. El aviso de alérgenos conserva el texto prudente del producto en vez del texto alternativo introducido por la imagen móvil. Los controles móviles pueden ocupar dos filas para mantener objetivos táctiles y lectura. Las ilustraciones y el orbe se generaron como assets independientes, no se recorta la imagen de interfaz. No se inventa una reserva real ni se trata la receta inferida como certificada. El widget conserva un botón Detalles para el aviso de privacidad.

Assets de Pica Pica en `public/demos/pica-pica/chat-assets/`: `orb.webp` (800×800), `ornament.webp` (667×1000) y `coast.webp` (900×900). PNG originales generados con la herramienta integrada imagegen y convertidos a WebP conservando alfa. Prompts exactos en `prompts.md`.
