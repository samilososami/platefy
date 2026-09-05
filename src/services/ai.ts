import { getAssistantInstructions, restaurantLocale } from './restaurant'
import { callGradio, ProviderError } from './gradio'

export { ProviderError } from './gradio'
export type { ProviderErrorCode } from './gradio'

export interface ChatMessage { role: 'user' | 'assistant'; content: string }

export const AI_PROVIDERS = {
  chat: { name: 'Qwen3 VL 4B Instruct', space: 'https://huggingface.co/spaces/akhaliq/Qwen3-VL-4B-Instruct', endpoint: 'https://akhaliq-qwen3-vl-4b-instruct.hf.space/gradio_api/call/chat_fn' },
  speech: { name: 'Kokoro · Dora', space: 'https://huggingface.co/spaces/leonelhs/kokoro-tts-spanish', endpoint: 'https://leonelhs-kokoro-tts-spanish.hf.space/gradio_api/call/predict' },
  speechEnglish: { name: 'Kokoro · Sky', space: 'https://huggingface.co/spaces/remsky/Kokoro-TTS-Zero', endpoint: 'https://remsky-kokoro-tts-zero.hf.space/gradio_api/call/generate_speech_from_ui' },
} as const

function readableText(value: unknown): string {
  if (typeof value !== 'string') throw new ProviderError('INVALID_RESPONSE', 'The assistant response is not text.')
  // Never show a model's reasoning block or provider markup as assistant prose.
  const text = value.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '').replace(/<think(?:ing)?>[\s\S]*$/gi, '').trim()
  if (!text || text.length > 12_000) throw new ProviderError('INVALID_RESPONSE', 'The assistant response was empty or too long.')
  // Some public Gradio apps encode an upstream failure in a successful HTTP response.
  if (/^(sorry,?\s*)?(i encountered an error|error[: ]|you have exceeded|quota exceeded|GPU quota)/i.test(text)) {
    throw new ProviderError(/quota|exceed|rate.?limit/i.test(text) ? 'RATE_LIMIT' : 'UNAVAILABLE', 'The shared model could not complete the request.')
  }
  return text
}

export async function generateReply(messages: ChatMessage[], locale: string, signal: AbortSignal, onProgress?: (text: string) => void): Promise<string> {
  if (!messages.length || messages[messages.length - 1].role !== 'user') throw new ProviderError('INVALID_RESPONSE', 'A user question is required.')
  const recent = messages.slice(-14).map(message => ({ role: message.role, content: message.content.trim().slice(0, 4000) }))
  const question = recent[recent.length - 1].content
  if (!question) throw new ProviderError('INVALID_RESPONSE', 'A user question is required.')
  // This Space accepts user/assistant history, not a system role. Supply the fixed
  // context explicitly with each latest question so bounded history cannot lose it.
  const prompt = `${getAssistantInstructions(locale)}\n\nLATEST CUSTOMER MESSAGE (conversation data):\n${JSON.stringify(question)}\n\nReply to the customer in the requested language, using only the restaurant facts above.`
  const result = await callGradio(AI_PROVIDERS.chat.endpoint, [{ text: prompt, files: [] }, recent.slice(0, -1)], { signal })
  if (!Array.isArray(result) || !Array.isArray(result[1])) throw new ProviderError('INVALID_RESPONSE', 'The provider returned an unexpected conversation.')
  const returned = result[1] as unknown[]
  const answer = returned[returned.length - 1] as { role?: unknown; content?: unknown } | undefined
  const echoedQuestion = returned[returned.length - 2] as { role?: unknown; content?: unknown } | undefined
  if (returned.length < recent.length + 1 || !answer || answer.role !== 'assistant' || echoedQuestion?.role !== 'user' || echoedQuestion.content !== prompt) {
    throw new ProviderError('INVALID_RESPONSE', 'The provider did not return a new answer to this question.')
  }
  const text = readableText(answer.content)
  if (signal.aborted) throw new ProviderError('ABORTED', 'Request cancelled.')
  // This model endpoint returns completed turns; this callback is not simulated token streaming.
  onProgress?.(text)
  return text
}

export async function synthesizeSpeech(text: string, locale: string, signal: AbortSignal): Promise<string> {
  const language = restaurantLocale(locale)
  if (language === 'ca') throw new ProviderError('UNSUPPORTED_LANGUAGE', 'A Catalan cloud voice is not available. The written conversation remains available in Catalan.')
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
    es: {
      ABORTED: 'Solicitud cancelada.', TIMEOUT: 'La IA está tardando un poco más. Inténtalo de nuevo dentro de un momento.',
      RATE_LIMIT: 'La IA gratuita ha alcanzado su límite temporal. Puedes consultar la carta y volver a intentarlo más tarde.',
      UNAVAILABLE: 'No he podido conectar con la IA. Puedes volver a intentarlo o consultar la carta.',
      INVALID_RESPONSE: 'No he podido completar esta respuesta. Inténtalo de nuevo.',
      UNSUPPORTED_LANGUAGE: 'La voz natural está disponible en español e inglés. Puedes seguir conversando por escrito en catalán.',
    },
    en: {
      ABORTED: 'Request cancelled.', TIMEOUT: 'The AI is taking a little longer. Please try again in a moment.',
      RATE_LIMIT: 'The free AI service has reached its temporary limit. You can browse the menu and try again later.',
      UNAVAILABLE: 'I could not connect to the AI. You can try again or browse the menu.',
      INVALID_RESPONSE: 'I could not complete this response. Please try again.',
      UNSUPPORTED_LANGUAGE: 'The natural voice is available in Spanish and English. You can keep chatting in writing in Catalan.',
    },
    ca: {
      ABORTED: 'Sol·licitud cancel·lada.', TIMEOUT: 'La IA està trigant una mica més. Torna-ho a provar d’aquí a un moment.',
      RATE_LIMIT: 'La IA gratuïta ha arribat al seu límit temporal. Pots consultar la carta i tornar-ho a provar més tard.',
      UNAVAILABLE: 'No he pogut connectar amb la IA. Pots tornar-ho a provar o consultar la carta.',
      INVALID_RESPONSE: 'No he pogut completar aquesta resposta. Torna-ho a provar.',
      UNSUPPORTED_LANGUAGE: 'La veu natural està disponible en castellà i anglès. Pots continuar conversant per escrit en català.',
    },
  }
  return copy[restaurantLocale(locale)][code]
}
