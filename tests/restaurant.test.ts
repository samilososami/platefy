import { describe, expect, it } from 'vitest'
import menuData from '../public/menu/MENU.json'
import { filterMenu, type RestaurantMenu } from '../src/services/restaurant'

const menu = menuData as RestaurantMenu

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
