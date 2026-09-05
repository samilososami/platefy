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

## Mobile assistant fidelity ledger

| Area | Assistant concept | Implemented result |
| --- | --- | --- |
| Welcome hierarchy | Nearly empty cream canvas, living Orb, editorial wordmark, one sentence and one CTA | Preserved at the concept-native 390 × 844 ratio with safe-area padding |
| Orb material | Near-black liquid glass with ivory and bronze refractions | Layered CSS/DOM material with organic flow, breathing, rings and distinct state animations |
| Chat composition | Quiet glass header, persistent Orb, open message canvas and dark bottom composer | Implemented without dashboard chrome or unnecessary cards |
| Voice feedback | Listening, thinking and speaking must be unmistakable | Header status, Orb reaction, live waveform, cancel/accept controls and amplitude input share one state controller |
| Mobile ergonomics | Fixed composer, touch targets, safe areas and keyboard-aware viewport | 44–48 px controls, `100dvh`, `viewport-fit=cover`, bottom inset and auto-growing textarea |
| Dynamic product layer | Future branding and voice providers must not require a UI rewrite | Central brand/copy tokens and an interchangeable `VoiceProvider` contract |

Intentional difference: the production hero uses a tightly cropped, web-optimised device render so it remains stable across short desktop viewports and mobile screens.

## Verification

- Desktop visual review at 1440 × 900 and the live application viewport.
- Mobile visual review at 390 × 844, including the drawer and every major section.
- Keyboard-close behavior for the demo dialog.
- Spanish, English and Catalan content switching.
- Interactive conversation stages, menu preparation form and FAQ accordion.
- Horizontal overflow check at the mobile breakpoint.
- Assistant checks at 360, 375, 390 and 414 px with no horizontal overflow.
- Welcome → chat → message → thinking → response interaction path.
- Voice-provider speaking state and native-recognition fallback tests.
- Automated lint, component tests and production build.
