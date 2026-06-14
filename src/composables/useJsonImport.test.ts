import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { MINIMAL_IMPORT_JSON } from '../schema/testFixtures'
import { useHillChartStore } from '../stores/hillChart'
import { useJsonImport } from './useJsonImport'

describe('useJsonImport', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('sets validation errors when JSON is invalid', async () => {
    const store = useHillChartStore()
    const { importErrors, handleImportFile } = useJsonImport(store)
    const file = new File(['{bad'], 'bad.json', { type: 'application/json' })

    await handleImportFile(file)

    expect(importErrors.value.length).toBeGreaterThan(0)
    expect(store.projects.length).toBeGreaterThan(0)
  })

  it('imports valid JSON and calls onImported', async () => {
    const store = useHillChartStore()
    store.demo = false
    store.projects = []
    const onImported = vi.fn()
    const { importErrors, handleImportFile } = useJsonImport(store, { onImported })
    const file = new File([MINIMAL_IMPORT_JSON], 'import.json', { type: 'application/json' })

    await handleImportFile(file)

    expect(importErrors.value).toEqual([])
    expect(store.projects).toHaveLength(1)
    expect(store.projects[0]?.name).toBe('Imported Project')
    expect(onImported).toHaveBeenCalledOnce()
  })

  it('requires confirm before replacing demo data', async () => {
    const store = useHillChartStore()
    expect(store.demo).toBe(true)
    const confirmSpy = vi.fn(() => false)
    vi.stubGlobal('confirm', confirmSpy)
    const { handleImportFile } = useJsonImport(store)
    const file = new File([MINIMAL_IMPORT_JSON], 'import.json', { type: 'application/json' })

    await handleImportFile(file)

    expect(confirmSpy).toHaveBeenCalledOnce()
    expect(store.demo).toBe(true)
    expect(store.projects[0]?.id).toBe('proj_1')
    vi.unstubAllGlobals()
  })

  it('rejects non-json drops', async () => {
    const store = useHillChartStore()
    const { importErrors, onDrop } = useJsonImport(store)
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' })
    const preventDefault = vi.fn()
    const dataTransfer = { files: [file] } as unknown as DataTransfer

    await onDrop({ preventDefault, dataTransfer } as unknown as DragEvent)

    expect(preventDefault).toHaveBeenCalled()
    expect(importErrors.value).toEqual(['Please drop a .json file.'])
  })

  it('sets isDraggingFile on dragover when import is enabled', () => {
    const store = useHillChartStore()
    const { isDraggingFile, onDragOver, onDragLeave } = useJsonImport(store)
    const preventDefault = vi.fn()

    onDragOver({ preventDefault } as unknown as DragEvent)
    expect(isDraggingFile.value).toBe(true)
    expect(preventDefault).toHaveBeenCalled()

    onDragLeave()
    expect(isDraggingFile.value).toBe(false)
  })

  it('does not drag when import is disabled', () => {
    const store = useHillChartStore()
    store.demo = false
    const { isDraggingFile, onDragOver } = useJsonImport(store)
    const preventDefault = vi.fn()

    onDragOver({ preventDefault } as unknown as DragEvent)

    expect(isDraggingFile.value).toBe(false)
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('opens the hidden file picker via importButtonRef', () => {
    const store = useHillChartStore()
    const { importButtonRef, onImportClick } = useJsonImport(store)
    const openPicker = vi.fn()
    importButtonRef.value = { openPicker } as never

    onImportClick()

    expect(openPicker).toHaveBeenCalledOnce()
  })
})
