export type ForceDirection = 'up' | 'down'
export type ForceStatus = 'active' | 'resolved'
export type ProjectColor =
  | 'terracotta'
  | 'mustard'
  | 'olive'
  | 'rust'
  | 'plum'
  | 'sage'
  | 'dusty-blue'
  | 'warm-pink'

export interface Source {
  system?: string
  id?: string
  url?: string
}

export interface Force {
  id: string
  direction: ForceDirection
  label: string
  owner: string | null
  isPrimary: boolean
  status: ForceStatus
  createdAt: string
  resolvedAt: string | null
  resolutionReason: string | null
}

export interface Snapshot {
  date: string
  position: number
}

export interface DailyNote {
  date: string
  text: string
}

/** Shared by Project and Task — anything positioned on the hill with forces and history. */
export interface HillTrackable {
  id: string
  name: string
  source?: Source
  position: number
  lastMovedAt: string
  forces: Force[]
  snapshots: Snapshot[]
  dailyNoteDraft: string
  notes: DailyNote[]
}

export type Task = HillTrackable

export interface Project extends HillTrackable {
  color: ProjectColor
  tasks: Task[]
}

export interface HillChartState {
  version: number
  exportedAt: string | null
  demo: boolean
  lastDailyDate: string | null
  projects: Project[]
}
