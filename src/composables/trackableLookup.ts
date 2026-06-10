import type { Force, ForceDirection, ForceStatus, HillTrackable, Project } from '../schema/types'

export type TrackableKind = 'project' | 'task'

export interface InProjectLookup {
  kind: TrackableKind
  trackable: HillTrackable
}

export function lookupInProject(project: Project, id: string): InProjectLookup | null {
  if (project.id === id) return { kind: 'project', trackable: project }
  const task = project.tasks.find((t) => t.id === id)
  if (task) return { kind: 'task', trackable: task }
  return null
}

export function forcesByStatus(
  forces: Force[],
  direction: ForceDirection,
  status: ForceStatus,
): Force[] {
  return forces
    .filter((f) => f.direction === direction && f.status === status)
    .sort((a, b) => {
      const aDate = status === 'resolved' ? (a.resolvedAt ?? a.createdAt) : a.createdAt
      const bDate = status === 'resolved' ? (b.resolvedAt ?? b.createdAt) : b.createdAt
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
}
