import type { Force, ForceDirection, ForceStatus, HillTrackable, Project } from '../schema/types'

export type TrackableKind = 'project' | 'task'

export interface InProjectLookup {
  kind: TrackableKind
  trackable: HillTrackable
}

export function findTrackableInProjects(
  projects: Project[],
  id: string,
): HillTrackable | undefined {
  for (const project of projects) {
    if (project.id === id) return project
    for (const task of project.tasks) {
      if (task.id === id) return task
    }
  }
  return undefined
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
      if (direction === 'up' && status === 'active') {
        if (a.isPrimary !== b.isPrimary) {
          return a.isPrimary ? -1 : 1
        }
      }
      const aDate = status === 'resolved' ? (a.resolvedAt ?? a.createdAt) : a.createdAt
      const bDate = status === 'resolved' ? (b.resolvedAt ?? b.createdAt) : b.createdAt
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
}
