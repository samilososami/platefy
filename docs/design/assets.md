# Fotografías de las cartas KO y VITA

Creación: 2026-09-09. Todas las fotografías son ilustraciones generadas mediante la herramienta integrada `image_gen`; no son fotos de productos reales ni assets extraídos de otro restaurante. La herramienta no ofrece un selector explícito de versión de modelo.

Los nombres, secciones y precios proceden de la carta aportada en Figma. Las descripciones e ingredientes se han ampliado como recetas ficticias. Los alérgenos están marcados `alergenos_verificados: false` y nunca garantizan seguridad alimentaria.

Se generaron primero las propuestas visuales de las páginas y posteriormente fotografías individuales para sus platos. Solo los productos con una imagen propia tienen `imagen` en el JSON; el resto conserva `null`. Los dos heroes corresponden también a productos reales del menú de muestra: nigiri de salmón y Buddha Bowl.

Procesado para web: conversión a WebP, metadatos eliminados, calidad 82; lado máximo 1600 px en heroes y 800 px en fotografías de producto. No se recompuso ni alteró el contenido con código. Los PNG originales permanecen en el directorio de imágenes generadas de Codex, fuera del bundle público.

Cada imagen final se inspeccionó visualmente: sujeto, plato, correspondencia con receta, ausencia de texto. La variante final de croquetas muestra seis unidades completas, como indica la carta.

## Archivos y prompts finales

### ko / nigiri-salmon

- Archivo web: `public/restaurantes/ko/images/nigiri-salmon.webp`.
- Original seleccionado: `exec-008088fc-fd0b-46f7-b560-94bec401a8cd.png`.
- Uso: cabecera y fotografía de producto.

Use case: photorealistic-natural. Asset type: premium Japanese restaurant menu hero photograph. Create one exquisite close-up editorial food photograph of exactly two salmon nigiri: glossy thick slices of raw orange salmon on separate carefully shaped white sushi rice, on a dark charcoal handmade ceramic rectangular plate, subtle cream washi paper backdrop and soft natural window shadow. Calm Japanese craftsmanship, genuinely appetizing, tactile ceramic and individual rice grains. Landscape 3:2 composition, plate fully visible enough to crop responsively, generous cream negative space at edges. No text, no logo, no chopsticks, no other dish. No green sauce, no garnish that could suggest additional ingredients. Main salmon nigiri is the center of attention.

### ko / edamame

- Archivo web: `public/restaurantes/ko/images/edamame.webp`.
- Original seleccionado: `exec-229dd33d-ef9f-4605-819f-03de6f52709d.png`.
- Uso: fotografía de producto.

Use case: photorealistic-natural. Asset type: restaurant dish photograph. Premium editorial food photography of Japanese edamame: a modest dark charcoal handmade ceramic bowl full of steamed green soy bean pods lightly sprinkled with sea salt, on warm ivory washi surface. Natural window light, rich lifelike textures, understated Japanese restaurant atmosphere. Square composition, entire bowl visible, 3/4 top view, no typography, no logos, no other dish, no sesame seeds.

### ko / tataki-atun

- Archivo web: `public/restaurantes/ko/images/tataki-atun.webp`.
- Original seleccionado: `exec-e6ef6e76-0f78-4b52-9e88-e317a9b7e928.png`.
- Uso: fotografía de producto.

Use case: photorealistic-natural. Asset type: restaurant dish photograph. Premium Japanese food photo of thinly sliced tuna tataki, lightly seared edges and ruby-red interior, arranged neatly on a dark handmade ceramic small plate, a small amount of ponzu sauce beneath. Warm ivory washi background, soft window daylight, real food textures, elegant restraint. Square framing, plate fully visible, no text, no logo, no extra side dish, no sesame.

### ko / gyozas-langostino

- Archivo web: `public/restaurantes/ko/images/gyozas-langostino.webp`.
- Original seleccionado: `exec-26349ae3-328a-4d98-b2bd-bf5304c659c9.png`.
- Uso: fotografía de producto.

Use case: photorealistic-natural. Asset type: restaurant dish photograph. Four Japanese shrimp gyozas, crisp golden pan-fried bottoms and delicate pleated wrappers, arranged on a small charcoal handmade ceramic plate with a tiny pool of glossy teriyaki sauce beside them. Restrained Japanese premium menu photography, warm cream washi surface, soft natural daylight, true appetizing food texture. Square, plate fully visible. Exactly four gyozas. No typography, no logos, no other dish.

### vita / buddha-bowl

- Archivo web: `public/restaurantes/vita/images/buddha-bowl.webp`.
- Original seleccionado: `exec-a0160062-6ad8-469c-b0c2-32dfdb411076.png`.
- Uso: cabecera y fotografía de producto.

Use case: photorealistic-natural. Asset type: premium plant-based restaurant menu hero photograph. One elegant overhead editorial food photograph of a hearty Buddha Bowl in an earthy brown handmade ceramic bowl. Visually separated ingredients: brown rice, golden chickpeas, sliced fresh avocado, grated orange carrot, a creamy hummus swirl sprinkled with sesame, a small portion purple cabbage and green leaves. On natural cream linen, a modest leafy branch at the edge. Fresh, warm daylight, deeply appetizing realistic food texture, refined Mediterranean plant-based atmosphere. Landscape 3:2, bowl occupies center with linen negative space around it, fully visible dish for responsive cropping. No text, no logos, no extra plates, no egg, no cheese, no fish, entirely vegan.

### vita / hummus-remolacha

- Archivo web: `public/restaurantes/vita/images/hummus-remolacha.webp`.
- Original seleccionado: `exec-636c0c97-cb43-4dc7-a915-31e6b6a717f9.png`.
- Uso: fotografía de producto.

Use case: photorealistic-natural. Asset type: premium plant-based restaurant product photograph. A handmade earthy ceramic bowl of vivid magenta beetroot hummus, elegant swirl with a little olive oil, white sesame seeds on top, accompanied by rustic pita bread wedges. Cream linen table, fresh natural side light, minimal tasteful arrangement. Premium realistic food photography, close but whole bowl visible, square composition. No typography, no logo, no other food dish, entirely vegan.

### vita / patatas-bravas

- Archivo web: `public/restaurantes/vita/images/patatas-bravas.webp`.
- Original seleccionado: `exec-a01bc2ff-1eb8-4e0e-8d4c-e50d6240f2ce.png`.
- Uso: fotografía de producto.

Use case: photorealistic-natural. Asset type: premium plant-based restaurant product photograph. A small warm ceramic bowl filled with golden crisp Spanish patatas bravas, irregular cubed potatoes topped with rich red brava tomato sauce and ivory white vegan garlic aioli. Cream linen surface, soft warm daylight, appetizing authentic textures, restrained premium Mediterranean restaurant photograph. Square composition, entire bowl visible. No text, no logo, no cheese, no egg, no other dishes.

### vita / guacamole

- Archivo web: `public/restaurantes/vita/images/guacamole.webp`.
- Original seleccionado: `exec-0b8f7cab-9116-475e-b850-69af2de24e80.png`.
- Uso: fotografía de producto.

Use case: photorealistic-natural. Asset type: premium plant-based restaurant product photograph. Close overhead photograph of fresh chunky green guacamole in an earthy brown ceramic bowl, visible tomato dice and tiny red onion, cilantro leaves, accompanied by golden crisp corn tortilla triangles. Avocado and lime freshness, cream linen tabletop, elegant rustic Mediterranean styling, soft warm natural daylight, realistic food textures. Square composition, whole bowl visible. No text, no logo, no other dish, no cheese, entirely vegan.

### vita / croquetas-setas

- Archivo web: `public/restaurantes/vita/images/croquetas-setas.webp`.
- Original seleccionado: `exec-0fefa643-657c-47a2-b127-f00a0f10a8c6.png`.
- Uso: fotografía de producto.

Use case: photorealistic-natural. Asset type: premium plant-based restaurant product photograph. Six whole mushroom croquettes arranged in two neat rows of three croquettes each on a large off-white handmade ceramic platter. All SIX croquettes must be intact and fully visible, without any cut, opening or halves. Gently oval shapes, warm golden breadcrumb crust. Natural cream linen surface, soft natural window daylight, refined Mediterranean plant-based restaurant styling, authentic appetizing food photography, a touch of parsley. Square composition, whole plate visible. No text, no logos, no sauces, no other dishes. Please count carefully: three croquettes in the back row, three croquettes in the front row.

### ko / ensalada-algas

- Archivo web: `public/restaurantes/ko/images/ensalada-algas.webp`.
- Original seleccionado: `exec-f54b70f6-3a93-491a-b51d-d348ada9638b.png`.
- Uso: fotografía de producto.

Use case: photorealistic-natural. Asset type: premium Japanese restaurant product photograph. A modest dark charcoal handmade ceramic bowl filled with emerald green Japanese wakame seaweed salad in delicate glossy ribbons, dressed with a sesame vinaigrette and lightly sprinkled with sesame seeds. Warm ivory washi tabletop, soft natural window daylight, calm refined Japanese craftsmanship and authentic food texture. Square composition, whole bowl visible in three-quarter overhead view, small relaxed negative space around the dish. No text, no logo, no additional dish, no cutlery.

