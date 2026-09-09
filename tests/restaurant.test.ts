import { afterEach, describe, expect, it, vi } from 'vitest'
import menuData from './fixtures/menu.json'
import { filterMenu, getRestaurantSlug, loadRestaurantKnowledge, safeDishImage, type RestaurantMenu } from '../src/services/restaurant'

const menu = menuData as RestaurantMenu
afterEach(() => vi.unstubAllGlobals())

describe('deterministic menu grounding', () => {
  it('crosses allergens, meat and a strict budget before calling the model', () => {
    const result = filterMenu(menu, 'Quiero algo sin gluten, sin frutos secos, que tenga carne y cueste menos de 14 €')
    expect(result.applied).toEqual(expect.arrayContaining([
      expect.stringContaining('gluten'), expect.stringContaining('frutos_de_cascara'),
      'dieta:carne', 'precio_maximo:14',
    ]))
    expect(result.dishes.map(dish => dish.id)).toEqual(['pollo-limon', 'smash-bacon'])
    expect(result.dishes.every(dish => dish.precio < 14 && dish.dietas.includes('carne'))).toBe(true)
  })

  it('never returns a declared excluded allergen', () => {
    const result = filterMenu(menu, 'Soy alérgica a la leche y al huevo, ¿qué puedo pedir?')
    expect(result.isSafetyQuestion).toBe(true)
    expect(result.dishes.every(dish => !dish.alergenos.includes('leche') && !dish.alergenos.includes('huevo'))).toBe(true)
  })

  it('combines vegan and category constraints', () => {
    const result = filterMenu(menu, '¿Qué postre vegano tenéis?')
    expect(result.dishes.map(dish => dish.id)).toEqual(['panna-cotta-coco', 'sorbete-limon'])
  })

  it('finds a named dish without broadening the context', () => {
    const result = filterMenu(menu, '¿Qué lleva la fideuá de marisco?')
    expect(result.dishes.map(dish => dish.id)).toEqual(['fideua-marisco'])
  })

  it('honours a decimal maximum price', () => {
    const result = filterMenu(menu, 'Busco un entrante por menos de 8,8 euros')
    expect(result.dishes.every(dish => dish.categoria === 'entrante' && dish.precio < 8.8)).toBe(true)
  })

  it('keeps all available menu items for a broad menu question', () => {
    const result = filterMenu(menu, '¿Qué tenéis en la carta?')
    expect(result.dishes).toHaveLength(34)
  })

  it('applies English dietary constraints', () => {
    const result = filterMenu(menu, 'I need a meat dish without gluten or nuts under 14 euros')
    expect(result.dishes.map(dish => dish.id)).toEqual(['pollo-limon', 'smash-bacon'])
  })

  it('applies Catalan diet and category constraints', () => {
    const result = filterMenu(menu, 'Quins postres vegans teniu?')
    expect(result.dishes.map(dish => dish.id)).toEqual(['panna-cotta-coco', 'sorbete-limon'])
  })
})

describe('restaurant knowledge and photographs', () => {
  it('only accepts known restaurant slugs in the URL', () => {
    expect(getRestaurantSlug('/restaurantes/vita/platefy')).toBe('vita')
    expect(getRestaurantSlug('/restaurantes/ko/platefy/')).toBe('ko')
    expect(getRestaurantSlug('/restaurantes/vital/platefy')).toBe('ko')
  })

  it.each([
    'https://example.com/photo.webp', '//example.com/photo.webp',
    '/restaurantes/vita/images/dish.webp', '/restaurantes/ko/../vita/images/dish.webp',
    '/restaurantes/ko/images/%2e%2e/vita.webp', '/restaurantes/ko/images/dish.svg',
    '/restaurantes/ko/images/dish.webp?redirect=https://example.com',
  ])('rejects an untrusted photo path: %s', imagen => {
    expect(safeDishImage({ id: 'dish', nombre: 'Dish', imagen }, 'ko')).toBeNull()
  })

  it('keeps each restaurant cached separately and refreshes it on a new opening', async () => {
    const fetchMock = vi.fn(async (input: string, _init?: RequestInit) => input === '/platefy.md'
      ? new Response('Soy platefy.')
      : new Response(JSON.stringify({ ...menu, restaurante: { ...menu.restaurante, slug: input.includes('/vita/') ? 'vita' : 'ko' } })))
    vi.stubGlobal('fetch', fetchMock)
    const firstKo = await loadRestaurantKnowledge(true, 'ko')
    const firstVita = await loadRestaurantKnowledge(true, 'vita')
    expect(firstKo.menu.restaurante.slug).toBe('ko')
    expect(firstVita.menu.restaurante.slug).toBe('vita')
    expect(await loadRestaurantKnowledge(false, 'ko')).toBe(firstKo)
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(await loadRestaurantKnowledge(true, 'ko')).not.toBe(firstKo)
    expect(fetchMock).toHaveBeenCalledTimes(6)
    expect(fetchMock.mock.calls.every(call => (call[1] as RequestInit)?.cache === 'no-cache')).toBe(true)
  })

  it('rejects a mismatched menu response', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string, _init?: RequestInit) => input === '/platefy.md'
      ? new Response('Soy platefy.')
      : new Response(JSON.stringify({ ...menu, restaurante: { ...menu.restaurante, slug: 'ko' } }))))
    await expect(loadRestaurantKnowledge(true, 'vita')).rejects.toThrow('KNOWLEDGE_INVALID')
  })
})

describe('embedded demo tenant isolation', () => {
  it('accepts only an unambiguous allowlisted restaurant on the exact demo route', () => {
    expect(getRestaurantSlug('/demo/chat/?restaurant=pica-pica')).toBe('pica-pica')
    expect(getRestaurantSlug('/demo/chat', '?restaurant=vita')).toBe('vita')
    expect(getRestaurantSlug('/demo/chat/?restaurant=ko')).toBe('ko')
    expect(getRestaurantSlug('/demo/chat/?restaurant=../../vita')).toBe('ko')
    expect(getRestaurantSlug('/demo/chat/?restaurant=vita&restaurant=pica-pica')).toBe('ko')
    expect(getRestaurantSlug('/other/?restaurant=vita')).toBe('ko')
    expect(getRestaurantSlug('/restaurantes/vita/platefy?restaurant=pica-pica')).toBe('vita')
    expect(getRestaurantSlug('/restaurantes/pica-pica/platefy')).toBe('ko')
  })

  it('loads the Pica Pica demo knowledge independently of both restaurant sites', async () => {
    const fetchMock = vi.fn(async (input: string) => input === '/platefy.md'
      ? new Response('Soy platefy.')
      : new Response(JSON.stringify({ ...menu, restaurante: { ...menu.restaurante, slug: 'pica-pica' } })))
    vi.stubGlobal('fetch', fetchMock)
    const knowledge = await loadRestaurantKnowledge(true, 'pica-pica')
    expect(knowledge.menu.restaurante.slug).toBe('pica-pica')
    expect(fetchMock.mock.calls.map(call => call[0])).toEqual(['/platefy.md', '/demos/pica-pica/menu.json'])
    expect(await loadRestaurantKnowledge(false, 'pica-pica')).toBe(knowledge)
  })

  it('allows only Pica Pica demo photos for its tenant', () => {
    const dish = { id: 'braves', nombre: 'Patates braves', imagen: '/demos/pica-pica/images/braves.webp' }
    expect(safeDishImage(dish, 'pica-pica')?.src).toBe(dish.imagen)
    expect(safeDishImage(dish, 'ko')).toBeNull()
    expect(safeDishImage(dish, 'vita')).toBeNull()
    for (const imagen of ['/restaurantes/ko/images/braves.webp', '/restaurantes/pica-pica/images/braves.webp', '/assets/restaurantes/pica-pica/braves.webp', '/demos/pica-pica/../ko/braves.webp']) {
      expect(safeDishImage({ ...dish, imagen }, 'pica-pica')).toBeNull()
    }
  })
})
