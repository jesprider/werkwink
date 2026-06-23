import { describe, it, expect } from 'vitest'
import { upsertDailyNote } from './dailyNotes'
import type { DailyNote } from '../schema/types'

describe('upsertDailyNote', () => {
  it('appends a new note sorted newest-first', () => {
    const result = upsertDailyNote([], '2026-06-06', 'Shipped auth')
    expect(result).toEqual([{ date: '2026-06-06', text: 'Shipped auth' }])
  })

  it('replaces text when date already exists', () => {
    const existing: DailyNote[] = [{ date: '2026-06-06', text: 'Old' }]
    const result = upsertDailyNote(existing, '2026-06-06', 'Updated')
    expect(result).toEqual([{ date: '2026-06-06', text: 'Updated' }])
  })

  it('sorts descending by date', () => {
    const existing: DailyNote[] = [{ date: '2026-06-05', text: 'Earlier' }]
    const result = upsertDailyNote(existing, '2026-06-06', 'Today')
    expect(result).toEqual([
      { date: '2026-06-06', text: 'Today' },
      { date: '2026-06-05', text: 'Earlier' },
    ])
  })
})
