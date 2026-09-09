import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateReply, getModelStatus } from '../src/services/ai'

afterEach(() => { vi.unstubAllGlobals(); window.history.replaceState({}, '', '/') })

describe('restaurant chat stream', () => {
  it('sends the active restaurant and delivers only its verified image paths', async () => {
    window.history.replaceState({}, '', '/restaurantes/vita/platefy')
    const chunk = { choices: [{ delta: { content: 'Aquí tienes Tomate de temporada.' } }], platefy_images: [
      { id: 'tomate', nombre: 'Tomate', src: '/restaurantes/vita/images/tomate.webp', alt: 'Tomate fresco' },
      { id: 'external', nombre: 'Unsafe', src: 'https://example.com/photo.webp', alt: 'Unsafe' },
      { id: 'ko', nombre: 'Wrong restaurant', src: '/restaurantes/ko/images/nigiri.webp', alt: 'Wrong restaurant' },
    ] }
    const upstream = vi.fn().mockResolvedValue(new Response(`data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`, { headers: { 'Content-Type': 'text/event-stream' } }))
    vi.stubGlobal('fetch', upstream)
    const onImages = vi.fn()
    const answer = await generateReply([{ role: 'user', content: '¿Cómo se ve el tomate?' }], 'es', new AbortController().signal, undefined, true, onImages)
    expect(answer).toBe('Aquí tienes Tomate de temporada.')
    expect(JSON.parse(upstream.mock.calls[0][1].body)).toEqual({ restaurant: 'vita', locale: 'es', messages: [{ role: 'user', content: '¿Cómo se ve el tomate?' }] })
    expect(onImages).toHaveBeenCalledWith([{ id: 'tomate', nombre: 'Tomate', src: '/restaurantes/vita/images/tomate.webp', alt: 'Tomate fresco' }])
    expect(getModelStatus().text).toBe('Aquí para ayudarte')
  })
})

it('retains allergies declared by the user beyond the recent message window', async () => {
  window.history.replaceState({}, '', '/restaurantes/ko/platefy')
  const upstream = vi.fn().mockResolvedValue(new Response('data: {"choices":[{"delta":{"content":"Consulta con el equipo."}}]}\n\ndata: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } }))
  vi.stubGlobal('fetch', upstream)
  const history = [{ role: 'user' as const, content: 'Soy alérgico al pescado.' }, ...Array.from({ length: 8 }, (_, index) => ({ role: 'assistant' as const, content: `Turno ${index}. Soy alérgico a la soja.` })), { role: 'user' as const, content: '¿Cómo se ve el nigiri?' }]
  await generateReply(history, 'es', new AbortController().signal)
  const body = JSON.parse(upstream.mock.calls[0][1].body)
  expect(body.messages).toHaveLength(7)
  expect(body.allergies).toEqual(['pescado'])
  expect(body.restaurant).toBe('ko')
})
