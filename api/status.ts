import type { IncomingMessage, ServerResponse } from 'node:http'

type Response = ServerResponse & { status(code: number): Response; json(value: unknown): void }

export default function handler(request: IncomingMessage, response: Response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0')
  if (request.method !== 'GET') { response.setHeader('Allow', 'GET'); return response.status(405).json({ error: 'Method not allowed.' }) }
  return response.status(200).json({
    configured: Boolean(process.env.AI_GATEWAY_API_KEY),
    model: 'Gemini 2.5 Flash',
    provider: 'Vercel AI Gateway',
  })
}
