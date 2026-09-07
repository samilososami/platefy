import { describe, expect, it } from 'vitest'
import menuData from '../public/menu/MENU.json'
import { filterMenu as filterBrowser, type RestaurantMenu } from '../src/services/restaurant'
import { filterMenu as filterServer } from '../api/chat'

const menu = menuData as RestaurantMenu
const questions = [
  'Quiero algo sin gluten, sin frutos secos, que tenga carne y cueste menos de 14 €',
  'Soy alérgica a la leche y al huevo, ¿qué puedo pedir?',
  '¿Qué postre vegano tenéis?',
  '¿Qué lleva la fideuá de marisco?',
  'I need a meat dish without gluten or nuts under 14 euros',
  'Quins postres vegans teniu?',
  '¿Qué bebidas tenéis por menos de 4,5 €?',
]

describe('server-side menu filter', () => {
  it.each(questions)('matches the browser filter for: %s', question => {
    const browser = filterBrowser(menu, question)
    const server = filterServer(menu, question)
    expect(server.applied).toEqual(browser.applied)
    expect(server.isSafetyQuestion).toBe(browser.isSafetyQuestion)
    expect(server.dishes.map(dish => dish.id)).toEqual(browser.dishes.map(dish => dish.id))
  })
})
