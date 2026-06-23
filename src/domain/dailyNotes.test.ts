import { describe, it, expect } from 'vitest'
import { appendDailyNote } from './dailyNotes'
import type { DailyNote } from '../schema/types'

describe('appendDailyNote', () => {
  it('creates a new note when the date is absent', () => {
    const result = appendDailyNote([], '2026-06-06', 'Shipped auth')
    expect(result).toEqual([{ date: '2026-06-06', text: 'Shipped auth' }])
  })

  it('appends newline-joined when the date already exists', () => {
    const existing: DailyNote[] = [{ date: '2026-06-06', text: 'Morning update' }]
    const result = appendDailyNote(existing, '2026-06-06', 'Afternoon update')
    expect(result).toEqual([{ date: '2026-06-06', text: 'Morning update\nAfternoon update' }])
  })

  it('sorts descending by date', () => {
    const existing: DailyNote[] = [{ date: '2026-06-05', text: 'Earlier' }]
    const result = appendDailyNote(existing, '2026-06-06', 'Today')
    expect(result).toEqual([
      { date: '2026-06-06', text: 'Today' },
      { date: '2026-06-05', text: 'Earlier' },
    ])
  })
})
