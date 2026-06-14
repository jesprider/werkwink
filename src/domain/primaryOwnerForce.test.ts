import { describe, it, expect } from 'vitest'
import { createPrimaryOwnerForce } from './primaryOwnerForce'

describe('createPrimaryOwnerForce', () => {
  it('creates an active primary up Owner force', () => {
    const force = createPrimaryOwnerForce(null, '2026-06-01T12:00:00.000Z')
    expect(force).toMatchObject({
      direction: 'up',
      label: 'Owner',
      owner: null,
      isPrimary: true,
      status: 'active',
      createdAt: '2026-06-01T12:00:00.000Z',
      resolvedAt: null,
      resolutionReason: null,
    })
    expect(force.id).toMatch(/^f_/)
  })

  it('uses the provided owner', () => {
    const force = createPrimaryOwnerForce('Alex', '2026-06-01T12:00:00.000Z')
    expect(force.owner).toBe('Alex')
  })
})
