# Platefy static AI provider validation

Checked 5 September 2026. All tests below used anonymous, documented public Gradio APIs without tokens, cookies, local model execution or a backend.

## Selected integration

- Text: [akhaliq/Qwen3-VL-4B-Instruct](https://huggingface.co/spaces/akhaliq/Qwen3-VL-4B-Instruct), hosted model `Qwen/Qwen3-VL-4B-Instruct`. Public `/chat_fn` accepts `[{text, files: []}, history]`. Result index 1 is the updated history; the final assistant message is the answer. The Space does not accept a system role, so the adapter supplies fixed sample restaurant instructions with each current question. Real completed answers, no simulated answer fallback or token streaming.
- Spanish speech: [leonelhs/kokoro-tts-spanish](https://huggingface.co/spaces/leonelhs/kokoro-tts-spanish), cloud Kokoro voice `ef_dora`, `/predict`, `[text, 'ef_dora', 1]`. Result index 0 contains the generated audio URL.
- English speech: [remsky/Kokoro-TTS-Zero](https://huggingface.co/spaces/remsky/Kokoro-TTS-Zero), voice `af_sky`, `/generate_speech_from_ui`, `[text, ['af_sky'], 1]`. Result index 0 contains audio. Other output (a waveform plot) is ignored.
- Catalan text is supported through the model. No verified native Catalan cloud voice was found in these providers; the adapter returns `UNSUPPORTED_LANGUAGE`, preserves the written answer and gives an honest localized notice. It does not silently mispronounce Catalan with a Spanish voice.

The [Hugging Face public API documentation](https://huggingface.co/docs/hub/en/spaces-api-endpoints) explicitly documents direct JavaScript/HTTP integration and no-token use of public Spaces. It lists anonymous ZeroGPU access as a shared pool with an included daily quota of 2 minutes; account tiers differ. This is a shared demo service with queues, sleep, rate limits and no uptime commitment. The Spanish CPU Space is not a ZeroGPU model, but is still subject to hosting and queue availability. An exhausted allowance is reported to the user, never bypassed.

## Measured live results

| Check | Observed result |
|---|---|
| Text generation | HTTP 200 POST + SSE complete in 4.50 s. Spanish prompt asking for a Mediterranean vegetarian dish generated a natural Spanish gazpacho recommendation. |
| Spanish voice generation | HTTP 200 POST + SSE complete in 3.87 s. “Hola, soy Platefy. ¿Qué te apetece comer hoy?” produced WAV audio. |
| Spanish audio download | HTTP 200, 124,972 bytes; valid WAV, mono, 24 kHz, duration 2.603 s. |
| English voice generation | HTTP 200 POST + SSE complete in 3.99 s. “Hello, I am Platefy. What would you like to eat today?” produced a hosted WAV URL. |
| Browser preflight | Both selected text and Spanish speech POST endpoints accepted OPTIONS with Origin `https://example.com`, method POST, header content-type; response 200 with corresponding access-control-allow headers. |
| Browser cross-origin responses | Text and both speech POST/SSE responses reflected `Access-Control-Allow-Origin: https://example.com`. Spanish audio file GET also reflected Origin. |
| Full app adapter with menu context | A request for vegan dishes below €15 generated a Spanish reply in 5.42 s with the fixture's tartare (€8.50) and soup (€6.00). The next request hit shared GPU quota, correctly classified as `RATE_LIMIT` by the adapter. No fake answer was substituted. |

These results verify remote generation and CORS, not subjective voice quality on every device. Actual browser playback/microphone permissions, mobile autoplay and UI need separate verification. Set `audio.crossOrigin = 'anonymous'` before assigning its URL if attaching a Web Audio analyser.

The anonymous quota was reached during these bounded tests on the development network. It can therefore prevent immediate further live checks until the provider grants availability again; do not repeatedly retry or rotate identities to evade it. Model grounding is a prompt constraint, not a guarantee: the 4B model can still make mistakes, and actual bookings or allergy guarantees are deliberately outside the application.

## Other providers checked

- [Puter security documentation](https://docs.puter.com/security/) requires website users to authorize/sign in with Puter before cloud services. It has no developer API key. [User-pays documentation](https://docs.puter.com/user-pays-model/) says users receive a monthly free allowance and are offered an upgrade when it runs out. Thus it is not a frictionless anonymous free restaurant chatbot. [TTS docs](https://docs.puter.com/AI/txt2speech/) include high-quality cloud speech providers, but the same user allowance applies. Not used.
- [Pollinations current documentation](https://pollinations.ai/docs) explicitly requires an API key for every generation. Old `text.pollinations.ai` keyless tutorials do not describe the current supported API. Not used.
- Qwen's official 235B demo Space was running but its public generation endpoint returned `event: error, data: null` in a harmless test. No attempt was made to work around this. The smaller independently tested Qwen3 Instruct endpoint was selected.

## App handling

`src/services/gradio.ts` implements streaming SSE parsing, a 60-second timeout, network abort, bounded event sizes, and typed quota/provider errors. Cancelling aborts the browser fetch; an already queued remote GPU job may continue at the provider. No automatic retries consume additional quota.

`src/services/restaurant.ts` is the canonical fictional dataset shared by UI and model context. The four names and kitchen hours come from the existing Platefy demo; the prices and detailed recipes are newly created sample data. No real restaurant address or availability is implied. Allergies and cross-contamination are never certified, and no booking can be confirmed or sent.

Run networking parser/cancellation checks with `node --test tests/gradio.test.mjs` (Node 24, native TypeScript stripping). These checks mock transport intentionally and do not consume cloud quota.
