import { callGradio, ProviderError, SseParser } from './gradio'
import { loadRestaurantKnowledge, restaurantLocale } from './restaurant'

export { ProviderError } from './gradio'
export type { ProviderErrorCode } from './gradio'

export interface ChatMessage { role: 'user' | 'assistant'; content: string }
export type ModelPhase = 'idle' | 'loading-menu' | 'menu-ready' | 'connecting' | 'ready' | 'generating' | 'error'
export interface ModelStatus { phase: ModelPhase; progress: number; text: string }
export interface InferenceMetrics {
  model: string
  provider: string
  responseMs: number
  firstTokenMs: number | null
  promptTokens: number | null
  completionTokens: number | null
  tokensPerSecond: number | null
  neurons: number | null
  reasoning: 'off' | 'on'
}

export const MODEL_INFO = {
  id: '@cf/qwen/qwen3-30b-a3b-fp8',
  name: 'Qwen3 30B-A3B · Cloudflare',
  page: 'https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/',
  thinking: true,
} as const

export const AI_PROVIDERS = {
  chat: { name: MODEL_INFO.name, space: MODEL_INFO.page },
  speech: { name: 'Kokoro · Dora', space: 'https://huggingface.co/spaces/leonelhs/kokoro-tts-spanish', endpoint: 'https://leonelhs-kokoro-tts-spanish.hf.space/gradio_api/call/predict' },
  speechEnglish: { name: 'Kokoro · Sky', space: 'https://huggingface.co/spaces/remsky/Kokoro-TTS-Zero', endpoint: 'https://remsky-kokoro-tts-zero.hf.space/gradio_api/call/generate_speech_from_ui' },
} as const

let status: ModelStatus = { phase: 'idle', progress: 0, text: 'Carta pendiente' }
let metrics: InferenceMetrics | null = null
const statusListeners = new Set<(next: ModelStatus) => void>()
const metricsListeners = new Set<(next: InferenceMetrics | null) => void>()

function publishStatus(next: ModelStatus) { status = next; statusListeners.forEach(listener => listener(next)) }
function publishMetrics(next: InferenceMetrics | null) { metrics = next; metricsListeners.forEach(listener => listener(next)) }
export function getModelStatus() { return status }
export function getInferenceMetrics() { return metrics }
export function subscribeModelStatus(listener: (next: ModelStatus) => void) { statusListeners.add(listener); return () => statusListeners.delete(listener) }
export function subscribeInferenceMetrics(listener: (next: InferenceMetrics | null) => void) { metricsListeners.add(listener); return () => metricsListeners.delete(listener) }

export async function prepareKnowledge() {
  publishStatus({ phase: 'loading-menu', progress: 0, text: 'Cargando MENU.json y PL8.md' })
  try {
    const knowledge = await loadRestaurantKnowledge()
    publishStatus({ phase: 'menu-ready', progress: 1, text: `${knowledge.menu.platos.length} referencias verificadas` })
    return knowledge
  } catch (error) {
    publishStatus({ phase: 'error', progress: 0, text: 'No se ha podido cargar la carta' })
    throw error
  }
}

function cleanText(value: string) {
  const text = value.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '').replace(/<think(?:ing)?>[\s\S]*$/gi, '')
    .replace(/^```(?:json)?|```$/gim, '').trim()
  if (!text || text.length > 12_000) throw new ProviderError('INVALID_RESPONSE', 'The assistant response was empty or too long.')
  return text
}
function cleanPartialText(value: string) {
  return value.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '').replace(/<think(?:ing)?>[\s\S]*$/gi, '').trim()
}

type CloudflareChunk = {
  choices?: Array<{ delta?: { content?: string; reasoning?: string } }>
  usage?: { prompt_tokens?: number; completion_tokens?: number }
  platefy_metrics?: { provider_first_token_ms?: number | null; neurons?: number | null }
}

async function responseError(response: Response): Promise<ProviderError> {
  let reason = ''
  try { reason = String((await response.clone().json() as { reason?: unknown }).reason || '') } catch { /* Non-JSON provider error. */ }
  if (response.status === 429) return new ProviderError(reason === 'quota_unavailable' ? 'QUOTA' : 'RATE_LIMIT', 'Cloudflare Workers AI quota reached.')
  if (response.status === 401 || response.status === 403) return new ProviderError('AUTH', 'Cloudflare authentication failed.')
  return new ProviderError('UNAVAILABLE', `Cloudflare Workers AI could not complete the request (${response.status}).`)
}

export async function generateReply(messages: ChatMessage[], locale: string, signal: AbortSignal, onProgress?: (text: string) => void, thinking = false): Promise<string> {
  if (!messages.length || messages[messages.length - 1].role !== 'user') throw new ProviderError('INVALID_RESPONSE', 'A user question is required.')
  const recent = messages.slice(-7).map(message => ({ role: message.role, content: message.content.trim().slice(0, 1600) }))
  if (!recent[recent.length - 1].content) throw new ProviderError('INVALID_RESPONSE', 'A user question is required.')

  publishStatus({ phase: 'connecting', progress: 1, text: thinking ? 'Qwen está razonando' : 'Consultando a Qwen' })
  const startedAt = performance.now()
  let firstTokenMs: number | null = null
  let answer = ''
  let usage: CloudflareChunk['usage']
  let neurons: number | null = null

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      credentials: 'same-origin', cache: 'no-store', signal,
      body: JSON.stringify({ messages: recent, locale: restaurantLocale(locale), thinking }),
    })
    if (!response.ok) throw await responseError(response)
    if (!response.body) throw new ProviderError('INVALID_RESPONSE', 'Cloudflare returned an empty stream.')

    publishStatus({ phase: 'generating', progress: 1, text: thinking ? 'Razonando sobre la carta' : 'Preparando tu recomendación' })
    const parser = new SseParser()
    const decoder = new TextDecoder()
    const reader = response.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      const events = parser.push(done ? decoder.decode() : decoder.decode(value, { stream: true }), done)
      for (const event of events) {
        if (event.data === '[DONE]') continue
        let chunk: CloudflareChunk
        try { chunk = JSON.parse(event.data) as CloudflareChunk } catch { throw new ProviderError('INVALID_RESPONSE', 'Cloudflare returned malformed streaming data.') }
        const token = chunk.choices?.[0]?.delta?.content ?? ''
        if (token && firstTokenMs === null) firstTokenMs = performance.now() - startedAt
        if (token) { answer += token; const partial = cleanPartialText(answer); if (partial) onProgress?.(partial) }
        if (chunk.usage) usage = chunk.usage
        if (typeof chunk.platefy_metrics?.provider_first_token_ms === 'number') firstTokenMs = chunk.platefy_metrics.provider_first_token_ms
        if (typeof chunk.platefy_metrics?.neurons === 'number') neurons = chunk.platefy_metrics.neurons
      }
      if (done) break
    }
    answer = cleanText(answer)
    const responseMs = performance.now() - startedAt
    const completionTokens = usage?.completion_tokens ?? null
    const generationSeconds = Math.max(responseMs / 1000, 0.001)
    publishMetrics({
      model: MODEL_INFO.id, provider: 'Cloudflare Workers AI', responseMs, firstTokenMs,
      promptTokens: usage?.prompt_tokens ?? null, completionTokens,
      tokensPerSecond: completionTokens === null || generationSeconds <= 0 ? null : completionTokens / generationSeconds,
      neurons,
      reasoning: thinking ? 'on' : 'off',
    })
    publishStatus({ phase: 'ready', progress: 1, text: 'Qwen listo' })
    return answer
  } catch (error) {
    if (signal.aborted) throw new ProviderError('ABORTED', 'Request cancelled.')
    publishStatus({ phase: 'error', progress: 0, text: 'Qwen no ha podido responder' })
    if (error instanceof ProviderError) throw error
    throw new ProviderError('UNAVAILABLE', error instanceof Error ? error.message : 'Cloudflare Workers AI failed.')
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
  if (url.protocol !== 'https:' || url.hostname !== new URL(provider.endpoint).hostname || !url.pathname.startsWith('/gradio_api/file=')) throw new ProviderError('INVALID_RESPONSE', 'The voice provider returned an unexpected audio URL.')
  return url.href
}

export function providerErrorMessage(error: unknown, locale = 'es'): string {
  const code = error instanceof ProviderError ? error.code : 'UNAVAILABLE'
  const copy = {
    es: { ABORTED: 'Solicitud cancelada.', TIMEOUT: 'La IA está tardando demasiado. Inténtalo de nuevo.', RATE_LIMIT: 'Cloudflare está limitando las peticiones. Espera un minuto y vuelve a intentarlo.', QUOTA: 'La cuota diaria de Workers AI se ha agotado. Vuelve a intentarlo cuando se renueve.', BILLING: 'La conexión de Cloudflare requiere atención.', AUTH: 'La conexión privada con Cloudflare no es válida.', UNAVAILABLE: 'Cloudflare Workers AI no está disponible ahora mismo. Inténtalo de nuevo.', INVALID_RESPONSE: 'La respuesta no superó la verificación de la carta. Inténtalo de nuevo.', UNSUPPORTED_LANGUAGE: 'La voz natural está disponible en español e inglés. Puedes seguir por escrito en catalán.', UNSUPPORTED_BROWSER: 'Este navegador no ofrece esta función.', KNOWLEDGE_UNAVAILABLE: 'No se han podido cargar MENU.json y PL8.md. Recarga la página.' },
    en: { ABORTED: 'Request cancelled.', TIMEOUT: 'The AI took too long. Please try again.', RATE_LIMIT: 'Cloudflare is rate limiting requests. Wait a minute and try again.', QUOTA: 'The daily Workers AI quota has been used. Try again after it resets.', BILLING: 'The Cloudflare connection requires attention.', AUTH: 'The private Cloudflare connection is invalid.', UNAVAILABLE: 'Cloudflare Workers AI is currently unavailable. Please try again.', INVALID_RESPONSE: 'The reply did not pass menu verification. Please try again.', UNSUPPORTED_LANGUAGE: 'Natural voice is available in Spanish and English. You can keep chatting in Catalan.', UNSUPPORTED_BROWSER: 'This browser does not offer this feature.', KNOWLEDGE_UNAVAILABLE: 'MENU.json and PL8.md could not be loaded. Reload the page.' },
    ca: { ABORTED: 'Sol·licitud cancel·lada.', TIMEOUT: 'La IA ha trigat massa. Torna-ho a provar.', RATE_LIMIT: 'Cloudflare està limitant les peticions. Espera un minut i torna-ho a provar.', QUOTA: 'La quota diària de Workers AI s’ha esgotat. Torna-ho a provar quan es renovi.', BILLING: 'La connexió de Cloudflare requereix atenció.', AUTH: 'La connexió privada amb Cloudflare no és vàlida.', UNAVAILABLE: 'Cloudflare Workers AI no està disponible ara mateix. Torna-ho a provar.', INVALID_RESPONSE: 'La resposta no ha superat la verificació de la carta. Torna-ho a provar.', UNSUPPORTED_LANGUAGE: 'La veu natural està disponible en castellà i anglès. Pots continuar per escrit en català.', UNSUPPORTED_BROWSER: 'Aquest navegador no ofereix aquesta funció.', KNOWLEDGE_UNAVAILABLE: 'No s’han pogut carregar MENU.json i PL8.md. Recarrega la pàgina.' },
  } as const
  return copy[restaurantLocale(locale)][code]
}
