const MODEL = '@cf/qwen/qwen3-30b-a3b-fp8'

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  })
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)
    if (request.headers.get('authorization') !== `Bearer ${env.ORIGIN_SECRET}`) return json({ error: 'Unauthorized.' }, 401)
    const length = Number(request.headers.get('content-length') || 0)
    if (length > 48_000) return json({ error: 'Request too large.' }, 413)

    let body
    try { body = await request.json() } catch { return json({ error: 'Invalid JSON.' }, 400) }
    if (!Array.isArray(body.messages) || body.messages.length < 2 || body.messages.length > 8) return json({ error: 'Invalid messages.' }, 400)

    const messages = body.messages.map(message => ({
      role: message.role === 'assistant' ? 'assistant' : message.role === 'user' ? 'user' : 'system',
      content: String(message.content || '').slice(0, 30_000),
    }))
    if (messages.some(message => !message.content)) return json({ error: 'Invalid messages.' }, 400)

    try {
      const result = await env.AI.run(MODEL, {
        messages,
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: body.thinking === true ? 520 : 240,
        chat_template_kwargs: { enable_thinking: body.thinking === true },
      })
      const choice = result.choices?.[0]?.message
      const content = choice?.content || result.response || choice?.reasoning || choice?.reasoning_content
      if (typeof content !== 'string' || !content.trim()) return json({ error: 'Empty model response.' }, 502)
      return json({ content: content.trim(), usage: result.usage || null, model: MODEL })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return json({ error: 'Workers AI could not complete the request.', detail: message.slice(0, 240) }, 502)
    }
  },
}
