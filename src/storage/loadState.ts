import type { HillChartState } from '../schema/types'
import { validateHillChartJson } from '../schema/validate'

export const WERKWINK_STORAGE_KEY = 'werkwink-state'

export class StorageLoadError extends Error {
  override name = 'StorageLoadError'

  constructor(message: string) {
    super(message)
  }
}

export function parseStoredState(raw: string): HillChartState {
  const result = validateHillChartJson(raw)
  if (!result.ok) {
    throw new StorageLoadError(result.errors.join('\n'))
  }
  return result.state
}

export function readStoredStateRaw(storage: Storage = localStorage): string | null {
  const raw = storage.getItem(WERKWINK_STORAGE_KEY)
  if (raw === null) return null
  parseStoredState(raw)
  return raw
}
