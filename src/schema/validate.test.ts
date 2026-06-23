import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { MINIMAL_IMPORT_JSON } from './testFixtures'
import { validateHillChartJson } from './validate'

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../..')
const IMPORT_DEMO_PATH = join(repoRoot, 'fixtures/hill-chart-import-demo.json')

describe('validateHillChartJson', () => {
  it('accepts minimal skill-shaped JSON', () => {
    const r = validateHillChartJson(MINIMAL_IMPORT_JSON)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.state.projects).toHaveLength(1)
    expect(r.state.demo).toBe(false)
    expect(r.state.projects[0].name).toBe('Imported Project')
  })

  it('rejects malformed JSON', () => {
    const r = validateHillChartJson('{')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors[0]).toMatch(/JSON/i)
  })

  it('rejects invalid color', () => {
    const bad = JSON.parse(MINIMAL_IMPORT_JSON) as Record<string, unknown>
    ;(bad.projects as Record<string, unknown>[])[0].color = 'neon'
    const r = validateHillChartJson(JSON.stringify(bad))
    expect(r.ok).toBe(false)
  })

  it('rejects missing primary up force', () => {
    const bad = JSON.parse(MINIMAL_IMPORT_JSON) as Record<string, unknown>
    const p = (bad.projects as Record<string, unknown>[])[0]
    p.forces = []
    const r = validateHillChartJson(JSON.stringify(bad))
    expect(r.ok).toBe(false)
  })

  it('rejects duplicate ids across project and task', () => {
    const bad = JSON.parse(MINIMAL_IMPORT_JSON) as Record<string, unknown>
    const p = (bad.projects as Record<string, unknown>[])[0] as Record<string, unknown>
    p.tasks = [
      {
        id: 'proj_import_1',
        name: 'Dup',
        position: 0,
        lastMovedAt: '2026-06-01T12:00:00.000Z',
        forces: [
          {
            id: 'f2',
            direction: 'up',
            label: 'Owner',
            owner: null,
            isPrimary: true,
            status: 'active',
            createdAt: '2026-06-01T12:00:00.000Z',
            resolvedAt: null,
            resolutionReason: null,
          },
        ],
        snapshots: [],
      },
    ]
    const r = validateHillChartJson(JSON.stringify(bad))
    expect(r.ok).toBe(false)
  })

  it('rejects version 2', () => {
    const bad = JSON.parse(MINIMAL_IMPORT_JSON) as Record<string, unknown>
    bad.version = 2
    const r = validateHillChartJson(JSON.stringify(bad))
    expect(r.ok).toBe(false)
  })

  it('accepts fixtures/hill-chart-import-demo.json', () => {
    const raw = readFileSync(IMPORT_DEMO_PATH, 'utf8')
    const r = validateHillChartJson(raw)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.state.projects).toHaveLength(3)
    expect(r.state.projects[0].name).toBe('Platform API migration')
    expect(r.state.projects[0].position).toBe(50)
    expect(r.state.projects[2].position).toBe(100)
  })

  it('defaults missing dailyNoteDraft and notes on import', () => {
    const r = validateHillChartJson(MINIMAL_IMPORT_JSON)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const project = r.state.projects[0]
    expect(project.dailyNoteDraft).toBe('')
    expect(project.notes).toEqual([])
  })

  it('accepts notes history on a project', () => {
    const data = JSON.parse(MINIMAL_IMPORT_JSON) as Record<string, unknown>
    const p = (data.projects as Record<string, unknown>[])[0]
    p.dailyNoteDraft = 'In progress'
    p.notes = [{ date: '2026-06-05', text: 'Blocked on API' }]
    const r = validateHillChartJson(JSON.stringify(data))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.state.projects[0].notes).toEqual([{ date: '2026-06-05', text: 'Blocked on API' }])
  })

  it('rejects note text over 500 characters', () => {
    const data = JSON.parse(MINIMAL_IMPORT_JSON) as Record<string, unknown>
    const p = (data.projects as Record<string, unknown>[])[0]
    p.notes = [{ date: '2026-06-05', text: 'x'.repeat(501) }]
    const r = validateHillChartJson(JSON.stringify(data))
    expect(r.ok).toBe(false)
  })

  it('rejects empty note text in history', () => {
    const data = JSON.parse(MINIMAL_IMPORT_JSON) as Record<string, unknown>
    const p = (data.projects as Record<string, unknown>[])[0]
    p.notes = [{ date: '2026-06-05', text: '   ' }]
    const r = validateHillChartJson(JSON.stringify(data))
    expect(r.ok).toBe(false)
  })
})
