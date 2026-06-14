// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { PROJECT_DONE_BLOCKED_MESSAGE } from '../domain/doneRules'
import { PEAK_CROSSING_BLOCKED_MESSAGE, PEAK_POSITION } from '../domain/forceRules'
import { useHillChartStore } from '../stores/hillChart'
import PanelPosition from './PanelPosition.vue'

describe('PanelPosition', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  async function slideTo(wrapper: ReturnType<typeof mount>, value: number) {
    const slider = wrapper.get('input[type="range"]')
    await slider.setValue(value)
  }

  it('shows peak hint and clamps when crossing with active blockers', async () => {
    const store = useHillChartStore()
    const projectId = store.addProject()
    const project = store.projects.find((p) => p.id === projectId)!
    store.setPosition(projectId, 45)
    store.addForce(projectId, 'down', 'Blocker')

    const wrapper = mount(PanelPosition, {
      props: { trackable: project, kind: 'project', project },
    })

    await slideTo(wrapper, 55)

    expect(wrapper.text()).toContain(PEAK_CROSSING_BLOCKED_MESSAGE)
    expect(project.position).toBe(PEAK_POSITION)
  })

  it('shows project-done hint and clamps when tasks remain open', async () => {
    const store = useHillChartStore()
    const projectId = store.addProject()
    const project = store.projects.find((p) => p.id === projectId)!
    store.setPosition(projectId, 80)
    store.addTask(projectId)

    const wrapper = mount(PanelPosition, {
      props: { trackable: project, kind: 'project', project },
    })

    await slideTo(wrapper, 100)

    expect(wrapper.text()).toContain(PROJECT_DONE_BLOCKED_MESSAGE)
    expect(project.position).toBe(99)
  })
})
