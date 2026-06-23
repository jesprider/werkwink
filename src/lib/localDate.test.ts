import { describe, it, expect } from 'vitest'
import { localDateString } from './localDate'

describe('localDate', () => {
  it('formats local calendar date as YYYY-MM-DD', () => {
    const d = new Date(2026, 5, 6, 15, 30)
    expect(localDateString(d)).toBe('2026-06-06')
  })

  it('zero-pads month and day', () => {
    const d = new Date(2026, 0, 5)
    expect(localDateString(d)).toBe('2026-01-05')
  })
})
