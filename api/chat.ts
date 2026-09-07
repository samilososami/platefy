import type { IncomingMessage, ServerResponse } from 'node:http'
import { readFileSync } from 'node:fs'
import path from 'node:path'

type Request = IncomingMessage & { body?: unknown }
type Response = ServerResponse & { status(code: number): Response; json(value: unknown): void }
type Message = { role: 'user' | 'assistant'; content: string }
type Dish = { id: string; nombre: string; categoria: string; precio: number; descripcion: string; ingredientes: string[]; alergenos: string[]; dietas: string[]; picante: number; disponible: boolean }
type Menu = { restaurante: { nombre: string; ficticio: boolean; tipo_cocina: string[]; moneda: string; horarios_cocina: unknown; direccion: string | null; telefono: string | null; reservas_en_tiempo_real: boolean; aviso_alergenos: string }; platos: Dish[] }
type FilterResult = { dishes: Dish[]; isSafetyQuestion: boolean; applied: string[] }
type CerebrasChunk = { choices?: Array<{ delta?: { content?: string; reasoning?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }; time_info?: Record<string, number> }

const MODEL = 'gpt-oss-120b'
const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions'
const keyPattern = /^csk-[A-Za-z0-9_-]{24,}$/
const windows = new Map<string, { started: number; count: number }>()
const allergenTerms: Record<string, string[]> = {
  gluten: ['gluten', 'celiac', 'trigo', 'wheat'],
  frutos_de_cascara: ['frutos secos', 'frutos de cascara', 'nueces', 'nuez', 'almendra', 'avellana', 'tree nuts', 'nuts', 'fruita seca'],
  cacahuetes: ['cacahuete', 'mani', 'peanut'], leche: ['leche', 'lactosa', 'lacteo', 'milk', 'lactose', 'llet'],
  huevo: ['huevo', 'egg', 'ou'], pescado: ['pescado', 'fish', 'peix'], crustaceos: ['marisco', 'crustaceo', 'gamba', 'langostino', 'shellfish'],
  moluscos: ['molusco', 'calamar', 'sepia', 'mollusc'], soja: ['soja', 'soy'], sesamo: ['sesamo', 'sesame'],
  mostaza: ['mostaza', 'mustard'], sulfitos: ['sulfito', 'sulphite'], apio: ['apio', 'celery'],
}

function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() }
function locale(value: unknown) { const code = typeof value === 'string' ? value.toLowerCase().split('-')[0] : 'es'; return code === 'en' || code === 'ca' ? code : 'es' }
function compact(dish: Dish) { return { id: dish.id, nombre: dish.nombre, categoria: dish.categoria, precio: dish.precio, descripcion: dish.descripcion, ingredientes: dish.ingredientes, alergenos: dish.alergenos, dietas: dish.dietas, picante: dish.picante } }
function lean(dish: Dish) { return { id: dish.id, nombre: dish.nombre, categoria: dish.categoria, precio: dish.precio, alergenos: dish.alergenos, dietas: dish.dietas } }

export function filterMenu(menu: Menu, rawQuestion: string): FilterResult {
  const question = normalize(rawQuestion)
  const applied: string[] = []
  const safety = /alerg|intoler|celiac|celiaq|traza|trace|contaminacion|cross.?contamination|gluten.?free|nut.?free|dairy.?free|(?:sin|without|sense)\s/.test(question)
  const excluded = Object.entries(allergenTerms).filter(([, terms]) => terms.some(term => question.includes(term)) && safety).map(([name]) => name)
  if (excluded.includes('frutos_de_cascara') && !excluded.includes('cacahuetes')) excluded.push('cacahuetes')
  if (excluded.length) applied.push(`excluir_alergenos:${excluded.join(',')}`)
  const vegan = /\bvegan[oa]?s?\b|\bvega\b/.test(question)
  const vegetarian = /\bvegetarian[oa]?s?\b|\bvegetaria\b/.test(question)
  const meat = /\b(con|tenga|quiero|apetece|lleve)\s+(algo\s+de\s+)?carne\b|\bcarnivor|\bwith meat\b|\bmeat dish\b|\bamb carn\b/.test(question)
  if (vegan) applied.push('dieta:vegano'); else if (vegetarian) applied.push('dieta:vegetariano')
  if (meat) applied.push('dieta:carne')
  const budgetMatch = question.match(/(?:menos de|menys de|under|less than|hasta|maximo|maximum|max|presupuesto(?: de)?|budget(?: of)?|<)\s*(\d+(?:[.,]\d+)?)/)
  const budget = budgetMatch ? Number(budgetMatch[1].replace(',', '.')) : null
  if (budget !== null && Number.isFinite(budget)) applied.push(`precio_maximo:${budget}`)
  const aliases: Record<string, string[]> = { entrante: ['entrante', 'starter', 'appetizer'], principal: ['principal', 'plato', 'main'], postre: ['postre', 'dessert'], bebida: ['bebida', 'drink'] }
  const category = Object.keys(aliases).find(value => aliases[value].some(term => question.includes(term)))
  if (category) applied.push(`categoria:${category}`)
  const named = menu.platos.filter(dish => { const name = normalize(dish.nombre); return name.length > 4 && (question.includes(name) || name.split(/\s+/).filter(word => word.length > 5).some(word => question.includes(word))) })
  let dishes = menu.platos.filter(dish => dish.disponible)
  if (excluded.length) dishes = dishes.filter(dish => !excluded.some(allergen => dish.alergenos.includes(allergen)))
  if (vegan) dishes = dishes.filter(dish => dish.dietas.includes('vegano')); else if (vegetarian) dishes = dishes.filter(dish => dish.dietas.includes('vegetariano'))
  if (meat) dishes = dishes.filter(dish => dish.dietas.includes('carne'))
  if (budget !== null && Number.isFinite(budget)) dishes = dishes.filter(dish => dish.precio < budget)
  if (category) dishes = dishes.filter(dish => dish.categoria === category)
  if (!applied.length && named.length) dishes = named
  if (!applied.length && !named.length) {
    const words = question.split(/[^a-z0-9]+/).filter(word => word.length >= 5)
    const relevant = dishes.filter(dish => { const text = normalize([dish.nombre, dish.descripcion, ...dish.ingredientes].join(' ')); return words.some(word => text.includes(word)) })
    if (relevant.length) dishes = relevant
  }
  return { dishes: dishes.slice(0, applied.length ? 14 : 34), isSafetyQuestion: safety, applied }
}

function groundedContext(identity: string, menu: Menu, question: string) {
  const filter = filterMenu(menu, question)
  const restaurant = menu.restaurante
  const candidates = filter.dishes.length > 14 ? filter.dishes.map(lean) : filter.dishes.map(compact)
  const system = [identity, 'DATOS_DEL_RESTAURANTE (fuente: MENU.json):', JSON.stringify({
    nombre: restaurant.nombre, ficticio: restaurant.ficticio, cocina: restaurant.tipo_cocina, moneda: restaurant.moneda,
    horarios_cocina: restaurant.horarios_cocina, direccion: restaurant.direccion, telefono: restaurant.telefono,
    reservas_en_tiempo_real: restaurant.reservas_en_tiempo_real, aviso_alergenos: restaurant.aviso_alergenos,
  }), `FILTRO_DETERMINISTA: ${JSON.stringify({ aplicado: filter.applied, consulta_sensible: filter.isSafetyQuestion, coincidencias: filter.dishes.length })}`,
  'CANDIDATOS_VERIFICADOS (fuente: MENU.json):', JSON.stringify(candidates),
  filter.applied.length ? 'La selección anterior ya aplica las restricciones detectadas. Recomienda únicamente esos candidatos; si está vacía, indica que no hay coincidencias.'
    : 'Responde solo con los datos anteriores. Si la pregunta no trata sobre la carta, usa únicamente DATOS_DEL_RESTAURANTE.'].join('\n\n')
  return { system, filter }
}

function clientIp(request: Request) { const value = request.headers['x-forwarded-for']; return (Array.isArray(value) ? value[0] : value?.split(',')[0])?.trim() || request.socket.remoteAddress || 'unknown' }
function withinLimit(request: Request) { const key = clientIp(request); const now = Date.now(); const current = windows.get(key); if (!current || now - current.started >= 60_000) { windows.set(key, { started: now, count: 1 }); return true } current.count += 1; return current.count <= 10 }
function originAllowed(request: Request) {
  const origin = request.headers.origin
  if (!origin) return true
  try { const url = new URL(origin); return (url.protocol === 'https:' && (url.hostname === 'platefy.samilososami.com' || url.hostname.endsWith('.vercel.app'))) || (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) } catch { return false }
}
function readBody(request: Request): Promise<unknown> {
  if (request.body !== undefined) return Promise.resolve(request.body)
  return new Promise((resolve, reject) => { let raw = ''; request.setEncoding('utf8'); request.on('data', chunk => { raw += chunk; if (raw.length > 32_000) reject(new Error('PAYLOAD_TOO_LARGE')) }); request.on('end', () => { try { resolve(JSON.parse(raw)) } catch { reject(new Error('INVALID_JSON')) } }); request.on('error', reject) })
}
function sanitize(value: unknown): { messages: Message[]; locale: string; thinking: boolean; apiKey?: string } {
  if (!value || typeof value !== 'object') throw new Error('INVALID_PAYLOAD')
  const body = value as { messages?: unknown; locale?: unknown; thinking?: unknown; apiKey?: unknown }
  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 7) throw new Error('INVALID_MESSAGES')
  const messages = body.messages.map(message => {
    if (!message || typeof message !== 'object') throw new Error('INVALID_MESSAGE')
    const candidate = message as { role?: unknown; content?: unknown }
    if ((candidate.role !== 'user' && candidate.role !== 'assistant') || typeof candidate.content !== 'string') throw new Error('INVALID_MESSAGE')
    const content = candidate.content.trim(); if (!content || content.length > 1600) throw new Error('INVALID_MESSAGE')
    return { role: candidate.role as Message['role'], content }
  })
  if (messages[messages.length - 1].role !== 'user') throw new Error('INVALID_MESSAGES')
  const apiKey = typeof body.apiKey === 'string' && keyPattern.test(body.apiKey.trim()) ? body.apiKey.trim() : undefined
  if (body.apiKey && !apiKey) throw new Error('INVALID_KEY')
  return { messages, locale: locale(body.locale), thinking: body.thinking === true, apiKey }
}
function sources() {
  const directory = path.join(process.cwd(), 'public/menu')
  return { identity: readFileSync(path.join(directory, 'PL8.md'), 'utf8').trim(), menu: JSON.parse(readFileSync(path.join(directory, 'MENU.json'), 'utf8')) as Menu }
}
function validateAnswer(answer: string, filter: FilterResult, menu: Menu, language: string) {
  const clean = answer.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '').replace(/<think(?:ing)?>[\s\S]*$/gi, '').trim()
  if (!clean || clean.length > 12_000) throw new Error('INVALID_MODEL_RESPONSE')
  if (filter.applied.length) {
    const allowed = new Set(filter.dishes.map(dish => dish.id)); const output = normalize(clean)
    if (menu.platos.some(dish => output.includes(normalize(dish.nombre)) && !allowed.has(dish.id))) throw new Error('UNGROUNDED_DISH')
  }
  if (!filter.isSafetyQuestion || /traza|contamin|personal|equipo|restaurant|seguridad|confirm|trace|staff|safety/i.test(clean)) return clean
  return clean + (language === 'en' ? '\n\nPlease confirm traces, cross-contamination and safety with the restaurant team.' : language === 'ca' ? '\n\nConfirma les traces, la contaminació creuada i la seguretat amb l’equip del restaurant.' : '\n\nConfirma las trazas, la contaminación cruzada y la seguridad con el equipo del restaurante.')
}
function upstreamError(status: number, detail = '') {
  if (status === 401 || status === 403) return { status: 401, message: 'Cerebras rejected the API key.', reason: 'authentication' }
  if (status === 402) return { status: 402, message: 'The Cerebras account requires billing activation.', reason: 'payment_required' }
  if (status === 429) {
    const unavailableCredits = /credit|billing|payment|trial|quota|limit.*exceed|insufficient/i.test(detail)
    return { status: 429, message: unavailableCredits ? 'The Cerebras account has no available quota.' : 'Cerebras is temporarily rate limited.', reason: unavailableCredits ? 'quota_unavailable' : 'rate_limit' }
  }
  return { status: 503, message: 'Cerebras is temporarily unavailable.', reason: 'provider' }
}
function parseSseFrames(buffer: string) {
  const normalized = buffer.replace(/\r\n/g, '\n')
  const frames = normalized.split('\n\n')
  return { rest: frames.pop() || '', data: frames.flatMap(frame => { const lines = frame.split('\n').filter(line => line.startsWith('data:')); return lines.length ? [lines.map(line => line.slice(5).trimStart()).join('\n')] : [] }) }
}

export default async function handler(request: Request, response: Response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0'); response.setHeader('X-Content-Type-Options', 'nosniff')
  if (request.method !== 'POST') { response.setHeader('Allow', 'POST'); return response.status(405).json({ error: 'Method not allowed.' }) }
  if (!originAllowed(request)) return response.status(403).json({ error: 'Origin not allowed.' })
  if (!withinLimit(request)) return response.status(429).json({ error: 'Too many requests. Please wait a minute.' })
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    const payload = sanitize(await readBody(request))
    const apiKey = payload.apiKey || process.env.CEREBRAS_API_KEY
    if (!apiKey || !keyPattern.test(apiKey)) return response.status(503).json({ error: 'Cerebras is not configured.' })
    const knowledge = sources()
    const question = payload.messages[payload.messages.length - 1].content
    const grounded = groundedContext(knowledge.identity, knowledge.menu, question)
    const controller = new AbortController(); timeout = setTimeout(() => controller.abort(), 25_000)
    request.once('close', () => { if (!request.complete) controller.abort() })
    const upstream = await fetch(CEREBRAS_URL, {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'text/event-stream', 'X-Cerebras-3rd-Party-Integration': 'platefy' },
      body: JSON.stringify({ model: MODEL, messages: [{ role: 'developer', content: grounded.system }, ...payload.messages.slice(0, -1), { role: 'user', content: question }], temperature: 0.1, top_p: 0.9, max_completion_tokens: 420, reasoning_effort: payload.thinking ? 'medium' : 'low', reasoning_format: 'hidden', stream: true }),
    })
    if (!upstream.ok) { const error = upstreamError(upstream.status, await upstream.text()); return response.status(error.status).json({ error: error.message, reason: error.reason }) }
    if (!upstream.body) return response.status(502).json({ error: 'Cerebras returned an empty response.' })
    const reader = upstream.body.getReader(); const decoder = new TextDecoder(); const startedAt = performance.now()
    let buffer = '', answer = '', usage: CerebrasChunk['usage'], timeInfo: CerebrasChunk['time_info'], firstTokenMs: number | null = null
    while (true) {
      const { done, value } = await reader.read(); buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      const parsed = parseSseFrames(buffer + (done ? '\n\n' : '')); buffer = parsed.rest
      for (const data of parsed.data) {
        if (data === '[DONE]') continue
        const chunk = JSON.parse(data) as CerebrasChunk; const token = chunk.choices?.[0]?.delta?.content ?? ''
        if (token && firstTokenMs === null) firstTokenMs = performance.now() - startedAt
        answer += token; if (chunk.usage) usage = chunk.usage; if (chunk.time_info) timeInfo = chunk.time_info
      }
      if (done) break
    }
    const verified = validateAnswer(answer, grounded.filter, knowledge.menu, payload.locale)
    response.statusCode = 200; response.setHeader('Content-Type', 'text/event-stream; charset=utf-8'); response.setHeader('X-Accel-Buffering', 'no')
    for (const content of verified.match(/[\s\S]{1,180}/g) || [verified]) response.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`)
    response.write(`data: ${JSON.stringify({ choices: [{ delta: {} }], usage, time_info: timeInfo, platefy_metrics: { provider_first_token_ms: firstTokenMs } })}\n\n`)
    return response.end('data: [DONE]\n\n')
  } catch (error) {
    if (response.headersSent) return response.end()
    const message = error instanceof Error ? error.message : ''
    if (message === 'PAYLOAD_TOO_LARGE') return response.status(413).json({ error: 'Request too large.' })
    if (/INVALID_(JSON|PAYLOAD|MESSAGES?|KEY)/.test(message)) return response.status(400).json({ error: 'Invalid request.' })
    if (message === 'UNGROUNDED_DISH' || message === 'INVALID_MODEL_RESPONSE') return response.status(422).json({ error: 'The answer did not pass menu verification.' })
    if (error instanceof DOMException && error.name === 'AbortError') return response.status(504).json({ error: 'Cerebras timed out.' })
    return response.status(500).json({ error: 'The request could not be completed.' })
  } finally { if (timeout) clearTimeout(timeout) }
}
