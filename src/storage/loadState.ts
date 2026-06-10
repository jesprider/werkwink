import type { HillChartState } from '../schema/types'

export const HILL_CHART_STORAGE_KEY = 'hill-chart-state'

export class StorageLoadError extends Error {
  override name = 'StorageLoadError'

  constructor(message: string) {
    super(message)
  }
}

export function parseStoredState(raw: string): HillChartState {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new StorageLoadError(`Invalid JSON: ${msg}`)
  }

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new StorageLoadError('Stored state must be a JSON object')
  }

  const obj = data as Record<string, unknown>

  if (!('version' in obj) || typeof obj.version !== 'number') {
    throw new StorageLoadError('Missing or invalid field: version (expected number)')
  }

  if (!('projects' in obj) || !Array.isArray(obj.projects)) {
    throw new StorageLoadError('Missing or invalid field: projects (expected array)')
  }

  return data as HillChartState
}

export function readStoredStateRaw(storage: Storage = localStorage): string | null {
  const raw = storage.getItem(HILL_CHART_STORAGE_KEY)
  if (raw === null) return null
  parseStoredState(raw)
  return raw
}
