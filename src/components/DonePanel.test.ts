// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import type { ChartMarker } from '../domain/chartMarkers'
import DonePanel from './DonePanel.vue'

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

describe('DonePanel', () => {
  it('renders header and row names', () => {
    const wrapper = mount(DonePanel, {
      props: {
        doneMarkers: [marker('task_1', 'Alpha'), marker('task_2', 'Beta')],
      },
    })

    expect(wrapper.find('[data-testid="done-panel"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Done')
    expect(wrapper.text()).toContain('2 completed')
    expect(wrapper.text()).toContain('Alpha')
    expect(wrapper.text()).toContain('Beta')
    expect(wrapper.text()).not.toContain('↑')
    expect(wrapper.text()).not.toContain('↓')
  })

  it('emits click when a row is clicked', async () => {
    const wrapper = mount(DonePanel, {
      props: { doneMarkers: [marker('task_1', 'Alpha')] },
    })

    await wrapper.get('li').trigger('click')
    expect(wrapper.emitted('click')?.[0]).toEqual(['task_1'])
  })

  it('emits restore without click when restore control is used', async () => {
    const wrapper = mount(DonePanel, {
      props: { doneMarkers: [marker('task_1', 'Alpha')] },
    })

    await wrapper.get('[data-testid="restore"]').trigger('click')
    expect(wrapper.emitted('restore')?.[0]).toEqual(['task_1'])
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
