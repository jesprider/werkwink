import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import type ImportButton from '../components/ImportButton.vue'
import { validateHillChartJson } from '../schema/validate'
import type { useHillChartStore } from '../stores/hillChart'

type HillChartStore = ReturnType<typeof useHillChartStore>

export function useJsonImport(store: HillChartStore, options?: { onImported?: () => void }) {
  const { canImport: importEnabled, demo } = storeToRefs(store)
  const importErrors = ref<string[]>([])
  const isDraggingFile = ref(false)
  const importButtonRef = ref<InstanceType<typeof ImportButton> | null>(null)

  function clearErrors() {
    importErrors.value = []
  }

  function onImportClick() {
    importButtonRef.value?.openPicker()
  }

  async function handleImportFile(file: File) {
    importErrors.value = []
    if (!importEnabled.value) return

    let text: string
    try {
      text = await file.text()
    } catch {
      importErrors.value = ['Could not read the selected file.']
      return
    }

    const result = validateHillChartJson(text)
    if (!result.ok) {
      importErrors.value = result.errors
      return
    }

    if (demo.value) {
      const ok = globalThis.confirm('Replace demo data with your imported projects?')
      if (!ok) return
    }

    store.importState(result.state)
    options?.onImported?.()
  }

  function onDragOver(ev: DragEvent) {
    if (!importEnabled.value) return
    ev.preventDefault()
    isDraggingFile.value = true
  }

  function onDragLeave() {
    isDraggingFile.value = false
  }

  async function onDrop(ev: DragEvent) {
    isDraggingFile.value = false
    if (!importEnabled.value) return
    ev.preventDefault()
    const file = ev.dataTransfer?.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      importErrors.value = ['Please drop a .json file.']
      return
    }
    await handleImportFile(file)
  }

  return {
    importEnabled,
    importErrors,
    isDraggingFile,
    importButtonRef,
    clearErrors,
    onImportClick,
    handleImportFile,
    onDragOver,
    onDragLeave,
    onDrop,
  }
}
