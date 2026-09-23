import { afterEach, describe, expect, it } from 'vitest'
import * as m from '../src/paraglide/messages.js'
import { getLocale, setLocale } from '../src/paraglide/runtime.js'
import en from '../messages/en.json'
import de from '../messages/de.json'
import fr from '../messages/fr.json'

afterEach(async () => {
  await setLocale('en', { reload: false })
  localStorage.removeItem('PARAGLIDE_LOCALE')
})

describe('Paraglide messages', () => {
  it('has every interface message in English, German, and French', () => {
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort())
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort())
  })

  it('uses English by default and applies locale-specific plural forms', () => {
    expect(m.hero_title_first()).toBe('What are you')
    expect(m.recipes_count({ count: 1 })).toBe('1 recipe')
    expect(m.recipes_count({ count: 2 }, { locale: 'de' })).toBe('2 Rezepte')
    expect(m.servings_count({ count: 1 }, { locale: 'fr' })).toBe('1 portion')
  })

  it('persists a supported locale through Paraglide', async () => {
    await setLocale('fr', { reload: false })
    expect(getLocale()).toBe('fr')
    expect(localStorage.getItem('PARAGLIDE_LOCALE')).toBe('fr')
    expect(m.saved_empty_title()).toBe('Aucune recette enregistrée.')
  })

  it('leaves recipe data intact inside translated accessibility text', () => {
    expect(m.recipe_image_alt({ name: 'Classic Margherita Pizza' }, { locale: 'de' })).toContain(
      'Classic Margherita Pizza',
    )
    expect(m.favorite_add({ name: 'Classic Margherita Pizza' }, { locale: 'fr' })).toBe(
      'Ajouter Classic Margherita Pizza aux favoris',
    )
  })
})
