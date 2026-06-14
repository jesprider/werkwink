import { describe, it, expect } from 'vitest'
import { MINIMAL_IMPORT_JSON } from '../schema/testFixtures'
import {
  parseStoredState,
  readStoredStateRaw,
  StorageLoadError,
  WERKWINK_STORAGE_KEY,
} from './loadState'

describe('parseStoredState', () => {
  it('accepts a valid minimal object', () => {
    const result = parseStoredState(JSON.stringify({ version: 1, projects: [] }))
    expect(result.version).toBe(1)
    expect(result.projects).toEqual([])
  })

  it('accepts fully valid import-shaped JSON', () => {
    const result = parseStoredState(MINIMAL_IMPORT_JSON)
    expect(result.projects).toHaveLength(1)
    expect(result.projects[0]?.name).toBe('Imported Project')
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

  it('throws when version is not 1', () => {
    expect(() => parseStoredState('{"version":2,"projects":[]}')).toThrow(/version/)
  })

  it('throws when projects is not an array', () => {
    expect(() => parseStoredState('{"version":1,"projects":{}}')).toThrow(/projects/)
  })

  it('throws when a project is missing required fields', () => {
    const raw = JSON.stringify({
      version: 1,
      projects: [{ id: 'p1', name: 'Test', position: 10 }],
    })
    expect(() => parseStoredState(raw)).toThrow(StorageLoadError)
  })
})

describe('readStoredStateRaw', () => {
  it('returns null when the key is absent', () => {
    const storage = {
      getItem: (key: string) => (key === WERKWINK_STORAGE_KEY ? null : null),
    } as Storage
    expect(readStoredStateRaw(storage)).toBeNull()
  })

  it('returns raw string when data is valid', () => {
    const raw = JSON.stringify({ version: 1, projects: [] })
    const storage = {
      getItem: (key: string) => (key === WERKWINK_STORAGE_KEY ? raw : null),
    } as Storage
    expect(readStoredStateRaw(storage)).toBe(raw)
  })

  it('throws when stored data is invalid', () => {
    const storage = {
      getItem: (key: string) => (key === WERKWINK_STORAGE_KEY ? '{bad' : null),
    } as Storage
    expect(() => readStoredStateRaw(storage)).toThrow(StorageLoadError)
  })
})
