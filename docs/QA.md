# Visual QA and fidelity ledger

The production implementation was compared at desktop and mobile sizes with the accepted visual concepts in `docs/design/`.

| Area | Reference intent | Production result |
| --- | --- | --- |
| Palette | Warm ivory, black product stage and lavender highlights | Matched through shared CSS tokens and restrained gradients |
| Typography | Editorial high-contrast serif with a neutral UI sans | Bodoni Moda and DM Sans are bundled locally |
| Hero composition | Split editorial copy and an immersive dark product scene | Preserved with a responsive two-column layout and a one-column mobile flow |
| Product imagery | Central phone, assistant UI and floating glass cards | Rebuilt with transparent, compressed artwork and native glass layers |
| Glass treatment | Soft translucent surfaces with bright borders and depth | Implemented with blur, saturation, inset light and low-contrast shadows |
| Motion | Elegant reveals and ambient movement without visual overload | Blur reveals, parallax, pointer spotlight and floating assets; all disabled by reduced-motion preferences |
| Responsive UX | Same story, simplified for touch and narrow screens | Single primary CTA, accessible drawer, two-column capability grid and touch-friendly controls |

Intentional difference: the production hero uses a tightly cropped, web-optimised device render so it remains stable across short desktop viewports and mobile screens.

## Verification

- Desktop visual review at 1440 × 900 and the live application viewport.
- Mobile visual review at 390 × 844, including the drawer and every major section.
- Keyboard-close behavior for the demo dialog.
- Spanish, English and Catalan content switching.
- Interactive conversation stages, menu preparation form and FAQ accordion.
- Horizontal overflow check at the mobile breakpoint.
- Automated lint, component tests and production build.
