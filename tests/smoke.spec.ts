import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeView from '../src/views/HomeView.vue'

it('renders the design preview', () => {
  const wrapper = mount(HomeView)
  expect(wrapper.get('h1').text()).toBe('What are you hungry for?')
})
