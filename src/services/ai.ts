import type { MLCEngineInterface } from '@mlc-ai/web-llm'
import { callGradio, ProviderError } from './gradio'
import { getGroundedContext, loadRestaurantKnowledge, restaurantLocale } from './restaurant'

export { ProviderError } from './gradio'
export type { ProviderErrorCode } from './gradio'

export interface ChatMessage { role: 'user' | 'assistant'; content: string }
export type ModelPhase = 'idle' | 'loading-menu' | 'menu-ready' | 'loading-model' | 'ready' | 'generating' | 'error'
export interface ModelStatus { phase: ModelPhase; progress: number; text: string }
export interface InferenceMetrics {
  model: string
  modelLoadMs: number | null
  responseMs: number
  firstTokenMs: number | null
  promptTokens: number | null
  completionTokens: number | null
  tokensPerSecond: number | null
  estimatedVramMB: number
  jsHeapDeltaMB: number | null
  runtime: string | null
}

export const MODEL_INFO = {
  id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
  name: 'Qwen2.5 1.5B Instruct · Q4',
  page: 'https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
  estimatedVramMB: 1629.75,
  contextWindow: 4096,
  thinking: false,
} as const

export const AI_PROVIDERS = {
  chat: { name: MODEL_INFO.name, space: MODEL_INFO.page },
  speech: { name: 'Kokoro · Dora', space: 'https://huggingface.co/spaces/leonelhs/kokoro-tts-spanish', endpoint: 'https://leonelhs-kokoro-tts-spanish.hf.space/gradio_api/call/predict' },
  speechEnglish: { name: 'Kokoro · Sky', space: 'https://huggingface.co/spaces/remsky/Kokoro-TTS-Zero', endpoint: 'https://remsky-kokoro-tts-zero.hf.space/gradio_api/call/generate_speech_from_ui' },
} as const

let enginePromise: Promise<MLCEngineInterface> | null = null
let engine: MLCEngineInterface | null = null
let worker: Worker | null = null
let modelLoadMs: number | null = null
let status: ModelStatus = { phase: 'idle', progress: 0, text: 'Carta pendiente' }
let metrics: InferenceMetrics | null = null
const statusListeners = new Set<(next: ModelStatus) => void>()
const metricsListeners = new Set<(next: InferenceMetrics | null) => void>()

function publishStatus(next: ModelStatus) {
  status = next
  statusListeners.forEach(listener => listener(next))
}
function publishMetrics(next: InferenceMetrics | null) {
  metrics = next
  metricsListeners.forEach(listener => listener(next))
}
export function getModelStatus() { return status }
export function getInferenceMetrics() { return metrics }
export function subscribeModelStatus(listener: (next: ModelStatus) => void) { statusListeners.add(listener); return () => statusListeners.delete(listener) }
export function subscribeInferenceMetrics(listener: (next: InferenceMetrics | null) => void) { metricsListeners.add(listener); return () => metricsListeners.delete(listener) }

export async function prepareKnowledge() {
  publishStatus({ phase: 'loading-menu', progress: 0, text: 'Cargando MENU.json y PL8.md' })
  try {
    const knowledge = await loadRestaurantKnowledge()
    publishStatus({ phase: engine ? 'ready' : 'menu-ready', progress: engine ? 1 : 0, text: `${knowledge.menu.platos.length} referencias de carta listas` })
    return knowledge
  } catch (error) {
    publishStatus({ phase: 'error', progress: 0, text: 'No se ha podido cargar la carta' })
    throw error
  }
}

async function getEngine(): Promise<MLCEngineInterface> {
  if (engine) return engine
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
  if (!gpu || !(await gpu.requestAdapter())) {
    publishStatus({ phase: 'error', progress: 0, text: 'No hay un adaptador WebGPU disponible' })
    throw new ProviderError('UNSUPPORTED_BROWSER', 'A WebGPU adapter is unavailable.')
  }
  if (enginePromise) return enginePromise
  const startedAt = performance.now()
  publishStatus({ phase: 'loading-model', progress: 0, text: 'Preparando Qwen en este dispositivo' })
  enginePromise = import('@mlc-ai/web-llm').then(async webllm => {
    worker = new Worker(new URL('./webllm.worker.ts', import.meta.url), { type: 'module', name: 'platefy-qwen' })
    const loaded = await webllm.CreateWebWorkerMLCEngine(worker, MODEL_INFO.id, {
      logLevel: 'WARN',
      initProgressCallback: report => publishStatus({
        phase: 'loading-model', progress: Math.max(0, Math.min(1, report.progress)),
        text: report.text || 'Descargando el modelo en el navegador',
      }),
    }, { context_window_size: MODEL_INFO.contextWindow })
    modelLoadMs = performance.now() - startedAt
    engine = loaded
    publishStatus({ phase: 'ready', progress: 1, text: 'Qwen listo en este dispositivo' })
    return loaded
  }).catch(error => {
    enginePromise = null; engine = null; worker?.terminate(); worker = null
    publishStatus({ phase: 'error', progress: 0, text: 'No se ha podido iniciar Qwen' })
    throw error
  })
  return enginePromise
}

type MemoryPerformance = Performance & { memory?: { usedJSHeapSize: number } }
function heapUsed() { return (performance as MemoryPerformance).memory?.usedJSHeapSize ?? null }
function cleanText(value: string) {
  const text = value.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '').replace(/<think(?:ing)?>[\s\S]*$/gi, '')
    .replace(/^```(?:json)?|```$/gim, '').trim()
  if (!text || text.length > 12_000) throw new ProviderError('INVALID_RESPONSE', 'The assistant response was empty or too long.')
  return text
}
function cleanPartialText(value: string) {
  return value.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '').replace(/<think(?:ing)?>[\s\S]*$/gi, '').trim()
}
function normalized(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() }

export async function generateReply(messages: ChatMessage[], locale: string, signal: AbortSignal, onProgress?: (text: string) => void, _thinking = false): Promise<string> {
  if (!messages.length || messages[messages.length - 1].role !== 'user') throw new ProviderError('INVALID_RESPONSE', 'A user question is required.')
  const recent = messages.slice(-5).map(message => ({ role: message.role, content: message.content.trim().slice(0, 1000) }))
  const question = recent[recent.length - 1].content
  if (!question) throw new ProviderError('INVALID_RESPONSE', 'A user question is required.')

  publishStatus({ phase: 'loading-menu', progress: 0, text: 'Comprobando la carta' })
  let knowledge
  try {
    knowledge = await loadRestaurantKnowledge()
    publishStatus({ phase: engine ? 'ready' : 'menu-ready', progress: engine ? 1 : 0, text: `${knowledge.menu.platos.length} referencias de carta listas` })
  } catch { throw new ProviderError('KNOWLEDGE_UNAVAILABLE', 'The menu could not be loaded.') }
  const grounded = getGroundedContext(knowledge, question)
  const runtime = await getEngine()
  if (signal.aborted) throw new ProviderError('ABORTED', 'Request cancelled.')

  const startedAt = performance.now()
  const heapBefore = heapUsed()
  let firstTokenMs: number | null = null
  let answer = ''
  let usage: { prompt_tokens?: number; completion_tokens?: number; extra?: { decode_tokens_per_s?: number } } | undefined
  const abort = () => runtime.interruptGenerate()
  signal.addEventListener('abort', abort, { once: true })
  publishStatus({ phase: 'generating', progress: 1, text: 'Generando en tu dispositivo' })
  try {
    const stream = await runtime.chat.completions.create({
      messages: [
        { role: 'system', content: grounded.system },
        ...recent.slice(0, -1),
        { role: 'user', content: question },
      ],
      temperature: 0.1, top_p: 0.85, repetition_penalty: 1.08, max_tokens: 220,
      stream: true, stream_options: { include_usage: true },
    })
    for await (const chunk of stream) {
      if (signal.aborted) throw new ProviderError('ABORTED', 'Request cancelled.')
      const token = chunk.choices[0]?.delta?.content ?? ''
      if (token && firstTokenMs === null) firstTokenMs = performance.now() - startedAt
      answer += token
      if (chunk.usage) usage = chunk.usage
      if (token) {
        const partial = cleanPartialText(answer)
        if (partial) onProgress?.(partial)
      }
    }
    if (signal.aborted) throw new ProviderError('ABORTED', 'Request cancelled.')
    answer = cleanText(answer)

    // Reject any known dish that deterministic filtering removed from the candidate set.
    if (grounded.filter.applied.length) {
      const allowed = new Set(grounded.filter.dishes.map(dish => dish.id))
      const output = normalized(answer)
      const disallowed = knowledge.menu.platos.find(dish => output.includes(normalized(dish.nombre)) && !allowed.has(dish.id))
      if (disallowed) throw new ProviderError('INVALID_RESPONSE', 'The model recommended a dish outside the verified filter.')
    }
    if (grounded.filter.isSafetyQuestion && !/traza|contamin|personal|equipo|restaurant|seguridad|confirm/i.test(answer)) {
      answer += restaurantLocale(locale) === 'en'
        ? '\n\nPlease confirm traces, cross-contamination and safety with the restaurant team.'
        : restaurantLocale(locale) === 'ca'
          ? '\n\nConfirma les traces, la contaminació creuada i la seguretat amb l’equip del restaurant.'
          : '\n\nConfirma las trazas, la contaminación cruzada y la seguridad con el equipo del restaurante.'
    }
    const responseMs = performance.now() - startedAt
    const heapAfter = heapUsed()
    let runtimeText: string | null = null
    try { runtimeText = await runtime.runtimeStatsText() } catch { /* Metrics are best effort. */ }
    publishMetrics({ model: MODEL_INFO.id, modelLoadMs, responseMs, firstTokenMs,
      promptTokens: usage?.prompt_tokens ?? null, completionTokens: usage?.completion_tokens ?? null,
      tokensPerSecond: usage?.extra?.decode_tokens_per_s ?? null, estimatedVramMB: MODEL_INFO.estimatedVramMB,
      jsHeapDeltaMB: heapBefore !== null && heapAfter !== null ? (heapAfter - heapBefore) / 1_048_576 : null, runtime: runtimeText })
    publishStatus({ phase: 'ready', progress: 1, text: 'Qwen listo en este dispositivo' })
    return answer
  } catch (error) {
    if (signal.aborted || (error instanceof ProviderError && error.code === 'ABORTED')) throw new ProviderError('ABORTED', 'Request cancelled.')
    publishStatus({ phase: 'error', progress: 0, text: 'Qwen no ha podido completar la respuesta' })
    if (error instanceof ProviderError) throw error
    throw new ProviderError('UNAVAILABLE', error instanceof Error ? error.message : 'WebLLM failed.')
  } finally {
    signal.removeEventListener('abort', abort)
  }
}

export async function synthesizeSpeech(text: string, locale: string, signal: AbortSignal): Promise<string> {
  const language = restaurantLocale(locale)
  if (language === 'ca') throw new ProviderError('UNSUPPORTED_LANGUAGE', 'A Catalan cloud voice is not available.')
  const spoken = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_#`]/g, '').trim()
  if (!spoken || spoken.length > 2000) throw new ProviderError('INVALID_RESPONSE', 'The response is too long for a single voice turn.')
  const provider = language === 'en' ? AI_PROVIDERS.speechEnglish : AI_PROVIDERS.speech
  const payload = language === 'en' ? [spoken, ['af_sky'], 1] : [spoken, 'ef_dora', 1]
  const result = await callGradio(provider.endpoint, payload, { signal })
  const audio = Array.isArray(result) ? result[0] : undefined
  const src = audio && typeof audio === 'object' && 'url' in audio ? audio.url : undefined
  if (typeof src !== 'string') throw new ProviderError('INVALID_RESPONSE', 'The voice provider did not return an audio file.')
  let url: URL
  try { url = new URL(src) } catch { throw new ProviderError('INVALID_RESPONSE', 'The voice provider returned an invalid audio URL.') }
  if (url.protocol !== 'https:' || url.hostname !== new URL(provider.endpoint).hostname || !url.pathname.startsWith('/gradio_api/file=')) {
    throw new ProviderError('INVALID_RESPONSE', 'The voice provider returned an unexpected audio URL.')
  }
  return url.href
}

export function providerErrorMessage(error: unknown, locale = 'es'): string {
  const code = error instanceof ProviderError ? error.code : 'UNAVAILABLE'
  const copy = {
    es: { ABORTED: 'Solicitud cancelada.', TIMEOUT: 'La IA está tardando demasiado. Inténtalo de nuevo.', RATE_LIMIT: 'El servicio de voz ha alcanzado su límite temporal.', UNAVAILABLE: 'No he podido ejecutar la IA en este dispositivo. Comprueba WebGPU, memoria disponible y vuelve a intentarlo.', INVALID_RESPONSE: 'La respuesta no superó la verificación de la carta. Inténtalo de nuevo.', UNSUPPORTED_LANGUAGE: 'La voz natural está disponible en español e inglés. Puedes seguir por escrito en catalán.', UNSUPPORTED_BROWSER: 'Este navegador no ofrece WebGPU. Prueba una versión reciente de Chrome, Edge o Safari.', KNOWLEDGE_UNAVAILABLE: 'No se han podido cargar MENU.json y PL8.md. Recarga la página e inténtalo de nuevo.' },
    en: { ABORTED: 'Request cancelled.', TIMEOUT: 'The AI took too long. Please try again.', RATE_LIMIT: 'The voice service has reached its temporary limit.', UNAVAILABLE: 'I could not run the AI on this device. Check WebGPU and available memory, then try again.', INVALID_RESPONSE: 'The reply did not pass menu verification. Please try again.', UNSUPPORTED_LANGUAGE: 'Natural voice is available in Spanish and English. You can keep chatting in Catalan.', UNSUPPORTED_BROWSER: 'This browser does not offer WebGPU. Try a recent Chrome, Edge or Safari version.', KNOWLEDGE_UNAVAILABLE: 'MENU.json and PL8.md could not be loaded. Reload the page and try again.' },
    ca: { ABORTED: 'Sol·licitud cancel·lada.', TIMEOUT: 'La IA ha trigat massa. Torna-ho a provar.', RATE_LIMIT: 'El servei de veu ha arribat al seu límit temporal.', UNAVAILABLE: 'No he pogut executar la IA en aquest dispositiu. Comprova WebGPU i la memòria disponible.', INVALID_RESPONSE: 'La resposta no ha superat la verificació de la carta. Torna-ho a provar.', UNSUPPORTED_LANGUAGE: 'La veu natural està disponible en castellà i anglès. Pots continuar per escrit en català.', UNSUPPORTED_BROWSER: 'Aquest navegador no ofereix WebGPU. Prova una versió recent de Chrome, Edge o Safari.', KNOWLEDGE_UNAVAILABLE: 'No s’han pogut carregar MENU.json i PL8.md. Recarrega la pàgina.' },
  } as const
  return copy[restaurantLocale(locale)][code]
}
