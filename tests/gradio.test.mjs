import test from 'node:test'
import assert from 'node:assert/strict'
import { SseParser, callGradio, ProviderError } from '../src/services/gradio.ts'

test('SSE handles every chunk boundary, CRLF, comments, multiline JSON and missing trailing newline', () => {
  const input = '\uFEFF: waiting\r\nevent: heartbeat\r\ndata: null\r\n\r\nevent: complete\r\ndata: [\r\ndata: "¡Hola!"\r\ndata: ]'
  const expected = [{ event: 'heartbeat', data: 'null' }, { event: 'complete', data: '[\n"¡Hola!"\n]' }]
  for (let boundary = 0; boundary < input.length; boundary += 1) {
    const parser = new SseParser()
    assert.deepEqual([...parser.push(input.slice(0, boundary)), ...parser.push(input.slice(boundary), true)], expected)
  }
})

test('Gradio reads split UTF-8 streams and returns only completed results', async () => {
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    if (init.method === 'POST') return Response.json({ event_id: 'abc_123' })
    const bytes = new TextEncoder().encode('event: generating\ndata: ["partial"]\n\nevent: complete\ndata: ["¡Bon profit! 🍽"]\n\n')
    return new Response(new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(new Uint8Array([byte])); controller.close() } }))
  }
  try {
    assert.deepEqual(await callGradio('https://example.com/call/chat', ['hello'], { signal: new AbortController().signal }), ['¡Bon profit! 🍽'])
    assert.equal(calls.length, 2)
    assert.equal(calls[1].url, 'https://example.com/call/chat/abc_123')
    assert.equal(calls[0].init.credentials, 'omit')
  } finally { globalThis.fetch = originalFetch }
})

test('Gradio rejects incomplete and malformed results instead of displaying partial content', async () => {
  const originalFetch = globalThis.fetch
  try {
    for (const stream of ['event: generating\ndata: ["partial"]\n\n', 'event: complete\ndata: invalid\n\n']) {
      globalThis.fetch = async (_url, init) => init.method === 'POST' ? Response.json({ event_id: 'abc' }) : new Response(stream)
      await assert.rejects(callGradio('https://example.com/call/chat', [], { signal: new AbortController().signal }), error => error instanceof ProviderError && error.code === 'INVALID_RESPONSE')
    }
  } finally { globalThis.fetch = originalFetch }
})

test('Gradio classifies shared quota failures, including HTTP 200 error events', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response('', { status: 429 })
    await assert.rejects(callGradio('https://example.com/call/chat', [], { signal: new AbortController().signal }), { code: 'RATE_LIMIT' })
    globalThis.fetch = async (_url, init) => init.method === 'POST' ? Response.json({ event_id: 'abc' }) : new Response('event: error\ndata: "You have exceeded your GPU quota"\n\n')
    await assert.rejects(callGradio('https://example.com/call/chat', [], { signal: new AbortController().signal }), { code: 'RATE_LIMIT' })
  } finally { globalThis.fetch = originalFetch }
})

test('Already cancelled requests never contact the provider', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('The network must not be called') }
  try {
    const controller = new AbortController(); controller.abort()
    await assert.rejects(callGradio('https://example.com/call/chat', [], { signal: controller.signal }), { code: 'ABORTED', name: 'AbortError' })
  } finally { globalThis.fetch = originalFetch }
})

test('In-flight cancellation and timeout abort network work and remain distinct', async () => {
  const originalFetch = globalThis.fetch
  let networkAborts = 0
  globalThis.fetch = async (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => { networkAborts += 1; reject(new DOMException('Aborted', 'AbortError')) }, { once: true })
  })
  try {
    const controller = new AbortController()
    const pending = callGradio('https://example.com/call/chat', [], { signal: controller.signal })
    controller.abort()
    await assert.rejects(pending, { code: 'ABORTED' })
    await assert.rejects(callGradio('https://example.com/call/chat', [], { signal: new AbortController().signal, timeoutMs: 15 }), { code: 'TIMEOUT' })
    assert.equal(networkAborts, 2)
  } finally { globalThis.fetch = originalFetch }
})
