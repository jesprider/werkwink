import type { Force } from '../schema/types'

export function createPrimaryOwnerForce(owner: string | null = null, now?: string): Force {
  const createdAt = now ?? new Date().toISOString()
  return {
    id: `f_${crypto.randomUUID()}`,
    direction: 'up',
    label: 'Owner',
    owner,
    isPrimary: true,
    status: 'active',
    createdAt,
    resolvedAt: null,
    resolutionReason: null,
  }
}
