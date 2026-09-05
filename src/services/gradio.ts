export type ProviderErrorCode = 'ABORTED' | 'TIMEOUT' | 'RATE_LIMIT' | 'UNAVAILABLE' | 'INVALID_RESPONSE' | 'UNSUPPORTED_LANGUAGE'

export class ProviderError extends Error {
  readonly code: ProviderErrorCode
  constructor(code: ProviderErrorCode, message: string) {
    super(message)
    this.name = code === 'ABORTED' ? 'AbortError' : 'ProviderError'
    this.code = code
  }
}

export interface ServerEvent { event: string; data: string }

/** Incremental SSE parser: network chunks may split JSON, UTF-8 text or CRLF boundaries. */
export class SseParser {
  private line = ''
  private eventName = 'message'
  private dataLines: string[] = []
  private swallowLf = false
  private started = false
  private eventSize = 0

  push(chunk: string, flush = false): ServerEvent[] {
    const events: ServerEvent[] = []
    const finishLine = () => {
      const line = this.line
      this.line = ''
      if (!line) {
        if (this.dataLines.length) events.push({ event: this.eventName, data: this.dataLines.join('\n') })
        this.eventName = 'message'
        this.dataLines = []
        this.eventSize = 0
      } else if (!line.startsWith(':')) {
        const colon = line.indexOf(':')
        const field = colon < 0 ? line : line.slice(0, colon)
        let value = colon < 0 ? '' : line.slice(colon + 1)
        if (value.startsWith(' ')) value = value.slice(1)
        if (field === 'event') this.eventName = value
        if (field === 'data') this.dataLines.push(value)
      }
    }
    for (const character of chunk) {
      if (!this.started) {
        this.started = true
        if (character === '\uFEFF') continue
      }
      if (this.swallowLf) {
        this.swallowLf = false
        if (character === '\n') continue
      }
      if (character === '\r' || character === '\n') {
        finishLine()
        this.swallowLf = character === '\r'
      } else {
        this.line += character
        this.eventSize += 1
        if (this.eventSize > 2_000_000) throw new ProviderError('INVALID_RESPONSE', 'Provider event is too large.')
      }
    }
    if (flush) {
      if (this.line) finishLine()
      if (this.dataLines.length) finishLine()
    }
    return events
  }
}

function responseError(status: number): ProviderError {
  return status === 429 || status === 402
    ? new ProviderError('RATE_LIMIT', 'The shared provider has reached its available quota.')
    : new ProviderError('UNAVAILABLE', `The provider could not complete the request (${status}).`)
}

function eventResult(event: ServerEvent): { complete: true; value: unknown } | undefined {
  if (event.event === 'error') {
    const quota = /quota|rate.?limit|too many|exceed|GPU.*limit/i.test(event.data)
    throw new ProviderError(quota ? 'RATE_LIMIT' : 'UNAVAILABLE', 'The shared provider could not generate a result.')
  }
  if (event.event !== 'complete') return undefined
  try {
    return { complete: true, value: JSON.parse(event.data) as unknown }
  } catch {
    throw new ProviderError('INVALID_RESPONSE', 'The provider returned an unreadable result.')
  }
}

export interface GradioOptions { signal: AbortSignal; timeoutMs?: number }

/** Public documented Gradio queue API. No credentials, API keys, proxy or local inference. */
export async function callGradio(endpoint: string, data: unknown[], options: GradioOptions): Promise<unknown> {
  if (options.signal.aborted) throw new ProviderError('ABORTED', 'Request cancelled.')
  const controller = new AbortController()
  const abort = () => controller.abort()
  options.signal.addEventListener('abort', abort, { once: true })
  let timedOut = false
  const timeout = setTimeout(() => { timedOut = true; controller.abort() }, options.timeoutMs ?? 60_000)
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
  try {
    const init = { signal: controller.signal, credentials: 'omit' as const, mode: 'cors' as const, cache: 'no-store' as const }
    const queued = await fetch(endpoint, { ...init, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) })
    if (!queued.ok) throw responseError(queued.status)
    const task: unknown = await queued.json()
    const eventId = task && typeof task === 'object' && 'event_id' in task ? task.event_id : undefined
    if (typeof eventId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(eventId)) {
      throw new ProviderError('INVALID_RESPONSE', 'The provider did not return a valid task identifier.')
    }
    const stream = await fetch(`${endpoint}/${encodeURIComponent(eventId)}`, init)
    if (!stream.ok) throw responseError(stream.status)
    if (!stream.body) throw new ProviderError('INVALID_RESPONSE', 'The provider response is empty.')
    reader = stream.body.getReader()
    const parser = new SseParser()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (controller.signal.aborted) throw new ProviderError('ABORTED', 'Request cancelled.')
      const events = parser.push(done ? decoder.decode() : decoder.decode(value, { stream: true }), done)
      for (const event of events) {
        const result = eventResult(event)
        if (result) return result.value
      }
      if (done) break
    }
    throw new ProviderError('INVALID_RESPONSE', 'The provider connection ended before the result was complete.')
  } catch (error) {
    if (options.signal.aborted) throw new ProviderError('ABORTED', 'Request cancelled.')
    if (timedOut) throw new ProviderError('TIMEOUT', 'The shared provider took too long to respond.')
    if (error instanceof ProviderError) throw error
    throw new ProviderError('UNAVAILABLE', 'The shared provider is temporarily unavailable.')
  } finally {
    clearTimeout(timeout)
    options.signal.removeEventListener('abort', abort)
    if (reader) await reader.cancel().catch(() => undefined)
  }
}
