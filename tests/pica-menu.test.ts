import { describe, expect, it } from 'vitest'
import data from '../public/demos/pica-pica/menu.json'
import { filterMenu, restaurantAssetRoot, restaurantMenuPath, restaurantName, type RestaurantMenu } from '../src/services/restaurant'

describe('photographed Pica Pica menu', () => {
  it('retains all 37 photographed prices in source order across six sections', () => {
    expect(data.platos.map(dish => dish.precio)).toEqual([
      13.5, 19, 16.5, 15.5, 16.8, 15, 14.5, 14, 19.5, 13, 16.5, 18.8, 19.5, 22, 35,
      5.5, 6.5, 7, 8.5, 6, 13.5, 16, 18, 17.5, 18, 16.5, 12, 11.5, 5.5, 5.5, 4.5, 4,
      2, 3, 3.5, 4, 4.5,
    ])
    expect(new Set(data.platos.map(dish => dish.id)).size).toBe(37)
    expect(new Set(data.platos.map(dish => dish.seccion)).size).toBe(6)
    expect(data.platos.find(dish => dish.id === 'escamarlans-planxa')?.nombre).toBe('Escamarlans a la planxa')
    expect(data.platos.find(dish => dish.id === 'botifarra-mongetes')?.nombre).toBe('Botifarra amb mongetes')
  })

  it('preserves the original trace warning and limits photography to the three generated demo dishes', () => {
    expect(data.fuente.aviso_original).toBe('Tots els plats poden tindre traces de marisc.')
    expect(data.restaurante.aviso_alergenos).toContain(data.fuente.aviso_original)
    expect(data.platos.every(dish => dish.alergenos_verificados === false)).toBe(true)
    expect(data.platos.filter(dish => dish.imagen !== null).map(dish => dish.id)).toEqual([
      'musclos-planxa', 'sardines-planxa', 'patates-braves',
    ])
    expect(data.platos.filter(dish => dish.imagen === null)).toHaveLength(34)
    expect(data.restaurante.direccion).toBeNull()
    expect(data.restaurante.telefono).toBeNull()
    expect(data.restaurante.reservas_en_tiempo_real).toBe(false)
  })

  it('maps the demo to its dedicated data root and retains existing restaurant paths', () => {
    expect(restaurantName('pica-pica')).toBe('Pica Pica')
    expect(restaurantAssetRoot('pica-pica')).toBe('/demos/pica-pica')
    expect(restaurantMenuPath('pica-pica')).toBe('/demos/pica-pica/menu.json')
    expect(restaurantMenuPath('ko')).toBe('/restaurantes/ko/menu.json')
    expect(restaurantMenuPath('vita')).toBe('/restaurantes/vita/menu.json')
    expect(() => restaurantMenuPath('../ko' as never)).toThrow('INVALID_RESTAURANT')
  })

  it('treats the photographed Tapas section as a deterministic menu filter', () => {
    expect(filterMenu(data as RestaurantMenu, 'Recomiéndame tres tapas variadas').dishes.map(dish => dish.id)).toEqual([
      'patates-braves', 'croquetes-casolanes', 'pebrots-padro', 'tires-pollastre', 'alberginia-mel',
    ])
  })
})
