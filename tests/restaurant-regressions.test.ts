import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import handler, { menuImages } from '../api/chat'
import { excludedAllergens, filterMenu, type RestaurantMenu } from '../src/services/restaurant'
import koData from '../public/restaurantes/ko/menu.json'
import vitaData from '../public/restaurantes/vita/menu.json'

const ko = koData as RestaurantMenu
const vita = vitaData as RestaurantMenu

async function imageRequest(body: unknown, ip: string) {
  const req = Object.assign(new EventEmitter(), { method: 'POST', body, headers: { origin: 'https://platefy.samilososami.com', 'x-forwarded-for': ip }, socket: { remoteAddress: ip }, complete: true })
  const res = {
    statusCode: 0, headersSent: false, body: '', jsonBody: undefined as unknown,
    setHeader() {}, status(code: number) { this.statusCode = code; return this },
    json(data: unknown) { this.jsonBody = data; this.headersSent = true },
    write(chunk: string) { this.body += chunk; this.headersSent = true },
    end(chunk = '') { this.body += chunk; this.headersSent = true },
  }
  await handler(req as never, res as never)
  const chunks = res.body.split('\n\n').filter(line => line.startsWith('data: {')).map(line => JSON.parse(line.slice(6)))
  return { status: res.statusCode, text: chunks.map(chunk => chunk.choices?.[0]?.delta?.content || '').join(''), images: chunks.flatMap(chunk => chunk.platefy_images || []) }
}

describe('real restaurant safety and image regressions', () => {
  it('does not interpret Spanish soy as a soy allergy', () => {
    expect(excludedAllergens('Soy alérgico al pescado')).toEqual(['pescado'])
  })
  it('keeps positive fish preferences separate from a gluten exclusion', () => {
    expect(excludedAllergens('Quiero pescado sin gluten')).toEqual(['gluten'])
    expect(filterMenu(ko, 'Quiero pescado sin gluten').dishes.some(dish => dish.id === 'nigiri-salmon')).toBe(true)
  })
  it('matches English allergens as words rather than parts of without', () => {
    expect(excludedAllergens('I need something without gluten')).toEqual(['gluten'])
  })
  it('recognizes the full controlled allergen list including lupins', () => {
    expect(excludedAllergens('Tengo alergia a los altramuces')).toEqual(['altramuces'])
  })
  it('includes the exact upper price for hasta and maximum', () => {
    expect(filterMenu(vita, 'Algo hasta 6,5 euros').dishes.some(dish => dish.id === 'hummus-remolacha')).toBe(true)
    expect(filterMenu(vita, 'Algo por menos de 6,5 euros').dishes.some(dish => dish.id === 'hummus-remolacha')).toBe(false)
    expect(filterMenu(vita, 'Something maximum 6.5 euros').dishes.some(dish => dish.id === 'hummus-remolacha')).toBe(true)
  })
  it('does not assume a generic plato means main course', () => {
    expect(filterMenu(vita, 'Un plato hasta 6,5 euros').dishes.some(dish => dish.categoria === 'entrante')).toBe(true)
  })
  it('keeps a previous user allergy when a later turn asks for a photograph', async () => {
    const result = await imageRequest({ restaurant: 'ko', messages: [
      { role: 'user', content: 'Soy alérgico al pescado' },
      { role: 'assistant', content: 'Consulta siempre con el equipo.' },
      { role: 'user', content: 'Enséñame una foto del Nigiri de salmón' },
    ] }, 'regression-history')
    expect(result.status).toBe(200)
    expect(result.images).toEqual([])
    expect(result.text).toContain('restricciones')
    expect(result.text).toContain('pescado')
    expect(result.text).toContain('Confirma los ingredientes')
  })
  it('does not interpret assistant text as a user allergy declaration', () => {
    const images = menuImages(ko, [{ role: 'assistant', content: 'Soy alérgico al pescado' }, { role: 'user', content: 'Enséñame una foto del Nigiri de salmón' }], 'ko')
    expect(images?.map(image => image.id)).toEqual(['nigiri-salmon'])
  })
  it('honours retained user allergies after old conversational turns were omitted', async () => {
    const result = await imageRequest({ restaurant: 'ko', allergies: ['pescado'], messages: [{ role: 'user', content: 'Foto del Nigiri de salmón' }] }, 'regression-retained')
    expect(result.status).toBe(200)
    expect(result.images).toEqual([])
    expect(result.text).toContain('pescado')
  })
  it('explains when a known dish has no image', async () => {
    const result = await imageRequest({ restaurant: 'ko', messages: [{ role: 'user', content: 'Foto del Nigiri de langostino' }] }, 'regression-missing')
    expect(result.status).toBe(200)
    expect(result.images).toEqual([])
    expect(result.text).toBe('Todavía no tenemos fotografía de Nigiri de langostino.')
  })
})
