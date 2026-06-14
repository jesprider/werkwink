// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import type { ChartMarker } from '../domain/chartMarkers'
import DoneStack from './DoneStack.vue'

function marker(id: string, name: string): ChartMarker {
  return {
    id,
    position: 100,
    color: '#C04A2D',
    radius: 11,
    name,
    up: 1,
    down: 0,
    stalenessSatellites: 0,
    ghosts: [],
  }
}

describe('DoneStack', () => {
  it('renders a single dot when count is 1', () => {
    const wrapper = mount(DoneStack, {
      props: {
        doneMarkers: [marker('task_1', 'Done task')],
        svgRef: null,
      },
    })

    expect(wrapper.find('[data-testid="done-stack"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('more')
  })

  it('expands the list and emits click on a done item', async () => {
    const markers = [marker('task_1', 'Alpha'), marker('task_2', 'Beta'), marker('task_3', 'Gamma')]
    const wrapper = mount(DoneStack, {
      props: { doneMarkers: markers, svgRef: null },
    })

    expect(wrapper.text()).toContain('+ 3 more')

    await wrapper.get('span').trigger('click')

    const items = wrapper.findAll('li')
    expect(items).toHaveLength(3)

    await items[1]!.trigger('click')
    expect(wrapper.emitted('click')?.[0]).toEqual(['task_2'])
  })
})
