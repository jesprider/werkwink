// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HillChart from './HillChart.vue'
import type { ChartMarker } from '../domain/chartMarkers'

function marker(id: string, position: number): ChartMarker {
  return {
    id,
    position,
    color: '#000',
    radius: 16,
    name: id,
    up: 0,
    down: 0,
    stalenessSatellites: 0,
    ghosts: [],
  }
}

/** The MarkerChart root carries the pointerdown handler; find it by its label. */
function markerNode(wrapper: ReturnType<typeof mount>, name: string) {
  const node = wrapper.findAll('g.cursor-grab').find((g) => g.text().includes(name))
  if (!node) throw new Error(`marker "${name}" not found`)
  return node
}

async function press(node: ReturnType<typeof markerNode>) {
  await node.trigger('pointerdown', { clientX: 50 })
  window.dispatchEvent(new Event('pointerup'))
}

describe('HillChart double-click', () => {
  it('emits open on a quick double-click without relying on native dblclick', async () => {
    const markers = [marker('a', 10), marker('b', 50), marker('c', 90)]
    const wrapper = mount(HillChart, { props: { markers, clickable: true } })

    // 'b' is a middle marker, so selecting it reorders the SVG nodes (paint
    // order moves it last) between the two clicks — the case that broke the
    // native dblclick.
    await press(markerNode(wrapper, 'b'))
    await press(markerNode(wrapper, 'b'))

    expect(wrapper.emitted('open')).toEqual([['b']])
    expect(wrapper.emitted('click')).toEqual([['b']])
  })

  it('emits only click for a single click', async () => {
    const markers = [marker('a', 10), marker('b', 50)]
    const wrapper = mount(HillChart, { props: { markers, clickable: true } })

    await press(markerNode(wrapper, 'a'))

    expect(wrapper.emitted('click')).toEqual([['a']])
    expect(wrapper.emitted('open')).toBeUndefined()
  })
})
