// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useHillChartStore } from '../stores/hillChart'
import PanelHeader from './PanelHeader.vue'

const routerPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}))

describe('PanelHeader', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    routerPush.mockReset()
  })

  it('exits edit mode on Escape without saving', async () => {
    const store = useHillChartStore()
    const projectId = store.addProject()
    const project = store.projects.find((p) => p.id === projectId)!
    store.updateTrackable(projectId, { name: 'Original name', source: null })

    const wrapper = mount(PanelHeader, {
      props: { trackable: project, kind: 'project', projectId },
    })

    await wrapper.get('button[title="Click to edit name and link"]').trigger('click')
    await nextTick()
    await wrapper.get('input[aria-label="Name"]').setValue('Changed name')
    await wrapper.get('input[aria-label="Name"]').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('input[aria-label="Name"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Original name')
    expect(project.name).toBe('Original name')
  })

  it('saves on Enter and exits edit mode', async () => {
    const store = useHillChartStore()
    const projectId = store.addProject()
    const project = store.projects.find((p) => p.id === projectId)!
    store.updateTrackable(projectId, { name: 'Original name', source: null })

    const wrapper = mount(PanelHeader, {
      props: { trackable: project, kind: 'project', projectId },
    })

    await wrapper.get('button[title="Click to edit name and link"]').trigger('click')
    await nextTick()
    await wrapper.get('input[aria-label="Name"]').setValue('Saved name')
    await wrapper.get('input[aria-label="Name"]').trigger('keydown', { key: 'Enter' })

    expect(wrapper.find('input[aria-label="Name"]').exists()).toBe(false)
    expect(project.name).toBe('Saved name')
  })
})
