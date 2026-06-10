import { describe, it, expect } from 'vitest'
import {
  parseStoredState,
  readStoredStateRaw,
  StorageLoadError,
  HILL_CHART_STORAGE_KEY,
} from './loadState'

describe('parseStoredState', () => {
  it('accepts a valid minimal object', () => {
    const result = parseStoredState(JSON.stringify({ version: 1, projects: [] }))
    expect(result.version).toBe(1)
    expect(result.projects).toEqual([])
  })

  it('accepts sample-shaped JSON with nested projects', () => {
    const raw = JSON.stringify({
      version: 1,
      exportedAt: null,
      projects: [{ id: 'p1', name: 'Test', position: 10 }],
    })
    const result = parseStoredState(raw)
    expect(result.projects).toHaveLength(1)
  })

  it('throws StorageLoadError on malformed JSON', () => {
    expect(() => parseStoredState('{broken')).toThrow(StorageLoadError)
    try {
      parseStoredState('{broken')
    } catch (e) {
      expect(e).toBeInstanceOf(StorageLoadError)
      expect((e as Error).message).toMatch(/Invalid JSON/)
    }
  })

  it('throws when root is not an object', () => {
    expect(() => parseStoredState('null')).toThrow(/JSON object/)
    expect(() => parseStoredState('[]')).toThrow(/JSON object/)
  })

  it('throws when version is missing', () => {
    expect(() => parseStoredState('{"projects":[]}')).toThrow(/version/)
  })

  it('throws when version is not a number', () => {
    expect(() => parseStoredState('{"version":"1","projects":[]}')).toThrow(/version/)
  })

  it('throws when projects is missing', () => {
    expect(() => parseStoredState('{"version":1}')).toThrow(/projects/)
  })

  it('throws when projects is not an array', () => {
    expect(() => parseStoredState('{"version":1,"projects":{}}')).toThrow(/projects/)
  })
})

describe('readStoredStateRaw', () => {
  it('returns null when the key is absent', () => {
    const storage = {
      getItem: (key: string) => (key === HILL_CHART_STORAGE_KEY ? null : null),
    } as Storage
    expect(readStoredStateRaw(storage)).toBeNull()
  })

  it('returns raw string when data is valid', () => {
    const raw = JSON.stringify({ version: 1, projects: [] })
    const storage = {
      getItem: (key: string) => (key === HILL_CHART_STORAGE_KEY ? raw : null),
    } as Storage
    expect(readStoredStateRaw(storage)).toBe(raw)
  })

  it('throws when stored data is invalid', () => {
    const storage = {
      getItem: (key: string) => (key === HILL_CHART_STORAGE_KEY ? '{bad' : null),
    } as Storage
    expect(() => readStoredStateRaw(storage)).toThrow(StorageLoadError)
  })
})
