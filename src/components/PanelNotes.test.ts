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

  it('renders the notes textarea', () => {
    const store = useHillChartStore()
    const project = store.projects[0]

    const wrapper = mount(PanelNotes, {
      props: { trackable: project, trackableId: project.id },
    })

    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.text()).toContain('Notes')
  })

  it('keeps the textarea available after a capture', () => {
    const store = useHillChartStore()
    store.capture()
    const project = store.projects[0]

    const wrapper = mount(PanelNotes, {
      props: { trackable: project, trackableId: project.id },
    })

    expect(wrapper.find('textarea').exists()).toBe(true)
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
