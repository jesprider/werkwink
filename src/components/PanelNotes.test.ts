// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useHillChartStore } from '../stores/hillChart'
import PanelNotes from './PanelNotes.vue'

describe('PanelNotes', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders textarea when daily is open', () => {
    const store = useHillChartStore()
    const project = store.projects[0]

    const wrapper = mount(PanelNotes, {
      props: { trackable: project, trackableId: project.id },
    })

    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.text()).toContain('Notes')
  })

  it('hides section when daily is closed', () => {
    const store = useHillChartStore()
    store.endDaily()
    const project = store.projects[0]

    const wrapper = mount(PanelNotes, {
      props: { trackable: project, trackableId: project.id },
    })

    expect(wrapper.find('textarea').exists()).toBe(false)
  })

  it('updates draft via store on input', async () => {
    const store = useHillChartStore()
    const project = store.projects[0]

    const wrapper = mount(PanelNotes, {
      props: { trackable: project, trackableId: project.id },
    })

    await wrapper.get('textarea').setValue('Blocked on vendor')

    expect(project.dailyNoteDraft).toBe('Blocked on vendor')
  })
})
