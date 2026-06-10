import { describe, it, expect } from 'vitest'
import { localDateString, isSameLocalDay } from './localDate'

describe('localDate', () => {
  it('formats local calendar date as YYYY-MM-DD', () => {
    const d = new Date(2026, 5, 6, 15, 30)
    expect(localDateString(d)).toBe('2026-06-06')
  })

  it('zero-pads month and day', () => {
    const d = new Date(2026, 0, 5)
    expect(localDateString(d)).toBe('2026-01-05')
  })

  it('isSameLocalDay returns true for matching date string', () => {
    const d = new Date(2026, 5, 6, 23, 59)
    expect(isSameLocalDay('2026-06-06', d)).toBe(true)
  })

  it('isSameLocalDay returns false for different day', () => {
    const d = new Date(2026, 5, 6)
    expect(isSameLocalDay('2026-06-05', d)).toBe(false)
  })
})
