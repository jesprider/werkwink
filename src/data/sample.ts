import { localDateString } from '../lib/localDate'
import type { HillChartState, Snapshot } from '../schema/types'

/**
 * Demo chart (`demo: true`). Every project and task is named after the exact case
 * it demonstrates so the showcase is self-documenting. Dates are relative to the
 * day the app is opened, so staleness satellites and "days without movement" copy
 * stay accurate over time.
 *
 * Cases covered:
 * - Positions: start (0), uphill, exactly at the peak (50), downhill, project
 *   clamped at 99 (open task), done (100).
 * - Peak rule: at the peak with active blockers (panel hint); crossed cleanly with
 *   no active blockers.
 * - Staleness satellites: moved today (0), 1-day grace (0 + copy), 2 days (1),
 *   3 days (2), 4 days (3, on a task), 5+ days (4 = max), done suppresses satellites.
 * - Forces: named owner, unassigned owner, extra up boosters (↑ badge), active
 *   blockers with and without an owner (↓ badge), resolved past booster and past
 *   blocker with resolution reasons.
 * - Trails: long (7 ghosts), short, flat/stalled, none.
 * - Sources: jira, linear, github, gitlab, asana, clickup, monday, trello, an
 *   unknown tracker (generic link icon), and no source (internal only).
 * - Notes history (export-only) on one item.
 * - Done panel with more than one completed project.
 */

/** ISO timestamp for N local calendar days before today. */
function isoDaysAgo(days: number, hour = 10): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

/** YYYY-MM-DD for N local calendar days before today. */
function dateDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return localDateString(d)
}

/** Build a snapshot trail from [daysAgo, position] points, sorted newest-first. */
function trail(points: Array<[number, number]>): Snapshot[] {
  return points
    .map(([daysAgo, position]) => ({ date: dateDaysAgo(daysAgo), position }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export const sampleState: HillChartState = {
  version: 1,
  exportedAt: null,
  demo: true,
  projects: [
    {
      id: 'proj_1',
      name: 'Uphill — boosters vs a blocker',
      color: 'terracotta',
      source: {
        system: 'jira',
        id: 'MOB-101',
        url: 'https://example.atlassian.net/browse/MOB-101',
      },
      position: 34,
      lastMovedAt: isoDaysAgo(0),
      forces: [
        {
          id: 'f_1a',
          direction: 'up',
          label: 'Owner',
          owner: 'Alex',
          isPrimary: true,
          status: 'active',
          createdAt: isoDaysAgo(30),
          resolvedAt: null,
          resolutionReason: null,
        },
        {
          id: 'f_1b',
          direction: 'up',
          label: 'Spiking the auth library',
          owner: 'Priya',
          isPrimary: false,
          status: 'active',
          createdAt: isoDaysAgo(12),
          resolvedAt: null,
          resolutionReason: null,
        },
        {
          id: 'f_1c',
          direction: 'down',
          label: 'Security review pending',
          owner: null,
          isPrimary: false,
          status: 'active',
          createdAt: isoDaysAgo(5),
          resolvedAt: null,
          resolutionReason: null,
        },
        {
          id: 'f_1d',
          direction: 'down',
          label: 'Q2 budget approval (past blocker)',
          owner: null,
          isPrimary: false,
          status: 'resolved',
          createdAt: isoDaysAgo(20),
          resolvedAt: isoDaysAgo(8),
          resolutionReason: 'Approved in finance sync',
        },
        {
          id: 'f_1e',
          direction: 'up',
          label: 'Design spike (past booster)',
          owner: 'Priya',
          isPrimary: false,
          status: 'resolved',
          createdAt: isoDaysAgo(18),
          resolvedAt: isoDaysAgo(6),
          resolutionReason: 'Approach validated, no longer a risk',
        },
      ],
      snapshots: trail([
        [7, 8],
        [6, 12],
        [5, 16],
        [4, 20],
        [3, 24],
        [2, 28],
        [1, 31],
      ]),
      dailyNoteDraft: '',
      notes: [],
      tasks: [
        {
          id: 'task_1a',
          name: 'Task — at the peak with a blocker (50)',
          position: 50,
          lastMovedAt: isoDaysAgo(0),
          forces: [
            {
              id: 'f_1a_owner',
              direction: 'up',
              label: 'Owner',
              owner: 'Priya',
              isPrimary: true,
              status: 'active',
              createdAt: isoDaysAgo(25),
              resolvedAt: null,
              resolutionReason: null,
            },
            {
              id: 'f_1a_block',
              direction: 'down',
              label: 'Backend endpoint not ready',
              owner: 'Sam',
              isPrimary: false,
              status: 'active',
              createdAt: isoDaysAgo(4),
              resolvedAt: null,
              resolutionReason: null,
            },
          ],
          snapshots: trail([
            [4, 38],
            [3, 44],
            [2, 48],
            [1, 50],
          ]),
          dailyNoteDraft: '',
          notes: [],
        },
        {
          id: 'task_1b',
          name: 'Task — no movement for 4 days (3 satellites)',
          position: 26,
          lastMovedAt: isoDaysAgo(4),
          forces: [
            {
              id: 'f_1b_owner',
              direction: 'up',
              label: 'Owner',
              owner: 'Sam',
              isPrimary: true,
              status: 'active',
              createdAt: isoDaysAgo(22),
              resolvedAt: null,
              resolutionReason: null,
            },
          ],
          snapshots: trail([
            [6, 26],
            [5, 26],
            [4, 26],
          ]),
          dailyNoteDraft: '',
          notes: [],
        },
      ],
    },
    {
      id: 'proj_2',
      name: 'Almost done — clamped at 99 until tasks finish',
      color: 'warm-pink',
      source: {
        system: 'monday',
        id: '4827193',
        url: 'https://acme.monday.com/boards/4827193',
      },
      position: 99,
      lastMovedAt: isoDaysAgo(0),
      forces: [
        {
          id: 'f_2a',
          direction: 'up',
          label: 'Owner',
          owner: 'Riley',
          isPrimary: true,
          status: 'active',
          createdAt: isoDaysAgo(40),
          resolvedAt: null,
          resolutionReason: null,
        },
      ],
      snapshots: trail([
        [5, 80],
        [4, 88],
        [3, 93],
        [2, 96],
        [1, 98],
      ]),
      dailyNoteDraft: '',
      notes: [],
      tasks: [
        {
          id: 'task_2a',
          name: 'Task — done (100)',
          position: 100,
          lastMovedAt: isoDaysAgo(2),
          forces: [
            {
              id: 'f_2a_owner',
              direction: 'up',
              label: 'Owner',
              owner: 'Riley',
              isPrimary: true,
              status: 'active',
              createdAt: isoDaysAgo(35),
              resolvedAt: null,
              resolutionReason: null,
            },
          ],
          snapshots: trail([
            [4, 70],
            [3, 84],
            [2, 100],
          ]),
          dailyNoteDraft: '',
          notes: [],
        },
        {
          id: 'task_2b',
          name: 'Task — still open, blocks project done (60)',
          position: 60,
          lastMovedAt: isoDaysAgo(1),
          forces: [
            {
              id: 'f_2b_owner',
              direction: 'up',
              label: 'Owner',
              owner: 'Lena',
              isPrimary: true,
              status: 'active',
              createdAt: isoDaysAgo(28),
              resolvedAt: null,
              resolutionReason: null,
            },
          ],
          snapshots: trail([
            [3, 50],
            [2, 56],
            [1, 60],
          ]),
          dailyNoteDraft: '',
          notes: [],
        },
      ],
    },
    {
      id: 'proj_3',
      name: 'Downhill — executing, no blockers',
      color: 'rust',
      source: {
        system: 'github',
        id: 'acme/platform#512',
        url: 'https://github.com/acme/platform/issues/512',
      },
      position: 78,
      lastMovedAt: isoDaysAgo(1),
      forces: [
        {
          id: 'f_3a',
          direction: 'up',
          label: 'Owner',
          owner: 'Casey',
          isPrimary: true,
          status: 'active',
          createdAt: isoDaysAgo(35),
          resolvedAt: null,
          resolutionReason: null,
        },
        {
          id: 'f_3b',
          direction: 'down',
          label: 'Staging environment unstable (past blocker)',
          owner: null,
          isPrimary: false,
          status: 'resolved',
          createdAt: isoDaysAgo(15),
          resolvedAt: isoDaysAgo(5),
          resolutionReason: 'Cleared the peak once infra stabilised',
        },
      ],
      snapshots: trail([
        [7, 40],
        [6, 48],
        [5, 55],
        [4, 64],
        [3, 70],
        [2, 74],
        [1, 78],
      ]),
      dailyNoteDraft: '',
      notes: [
        { date: dateDaysAgo(2), text: 'Cleared staging blocker, moving into execution.' },
        { date: dateDaysAgo(1), text: 'Rollout to 50% of traffic, monitoring error rates.' },
      ],
      tasks: [],
    },
    {
      id: 'proj_4',
      name: 'At the peak — resolve blockers to continue',
      color: 'olive',
      source: {
        system: 'linear',
        id: 'ENG-42',
        url: 'https://linear.app/example/issue/ENG-42',
      },
      position: 50,
      lastMovedAt: isoDaysAgo(0),
      forces: [
        {
          id: 'f_4a',
          direction: 'up',
          label: 'Owner',
          owner: 'Jordan',
          isPrimary: true,
          status: 'active',
          createdAt: isoDaysAgo(45),
          resolvedAt: null,
          resolutionReason: null,
        },
        {
          id: 'f_4b',
          direction: 'down',
          label: 'IdP certificate rotation',
          owner: 'Morgan',
          isPrimary: false,
          status: 'active',
          createdAt: isoDaysAgo(6),
          resolvedAt: null,
          resolutionReason: null,
        },
        {
          id: 'f_4c',
          direction: 'down',
          label: 'No evaluation dataset yet',
          owner: null,
          isPrimary: false,
          status: 'active',
          createdAt: isoDaysAgo(9),
          resolvedAt: null,
          resolutionReason: null,
        },
      ],
      snapshots: trail([
        [5, 40],
        [4, 45],
        [3, 48],
        [2, 50],
        [1, 50],
      ]),
      dailyNoteDraft: '',
      notes: [],
      tasks: [],
    },
    {
      id: 'proj_5',
      name: 'No movement for 2 days (1 satellite)',
      color: 'dusty-blue',
      source: {
        system: 'gitlab',
        id: 'acme/api!318',
        url: 'https://gitlab.com/acme/api/-/merge_requests/318',
      },
      position: 40,
      lastMovedAt: isoDaysAgo(2),
      forces: [
        {
          id: 'f_5a',
          direction: 'up',
          label: 'Owner',
          owner: 'Morgan',
          isPrimary: true,
          status: 'active',
          createdAt: isoDaysAgo(20),
          resolvedAt: null,
          resolutionReason: null,
        },
        {
          id: 'f_5b',
          direction: 'down',
          label: 'Waiting on data contract',
          owner: null,
          isPrimary: false,
          status: 'active',
          createdAt: isoDaysAgo(4),
          resolvedAt: null,
          resolutionReason: null,
        },
      ],
      snapshots: trail([
        [4, 36],
        [3, 39],
        [2, 40],
      ]),
      dailyNoteDraft: '',
      notes: [],
      tasks: [],
    },
    {
      id: 'proj_6',
      name: 'No movement for 3 days (2 satellites)',
      color: 'sage',
      source: {
        system: 'asana',
        id: '1207894',
        url: 'https://app.asana.com/0/1207894/list',
      },
      position: 46,
      lastMovedAt: isoDaysAgo(3),
      forces: [
        {
          id: 'f_6a',
          direction: 'up',
          label: 'Owner',
          owner: 'Dana',
          isPrimary: true,
          status: 'active',
          createdAt: isoDaysAgo(24),
          resolvedAt: null,
          resolutionReason: null,
        },
        {
          id: 'f_6b',
          direction: 'down',
          label: 'Vendor API is flaky',
          owner: null,
          isPrimary: false,
          status: 'active',
          createdAt: isoDaysAgo(7),
          resolvedAt: null,
          resolutionReason: null,
        },
      ],
      snapshots: trail([
        [5, 44],
        [4, 45],
        [3, 46],
      ]),
      dailyNoteDraft: '',
      notes: [],
      tasks: [],
    },
    {
      id: 'proj_7',
      name: 'No movement for 5 days (max satellites)',
      color: 'plum',
      source: {
        system: 'clickup',
        id: '86yq1abcd',
        url: 'https://app.clickup.com/t/86yq1abcd',
      },
      position: 28,
      lastMovedAt: isoDaysAgo(5),
      forces: [
        {
          id: 'f_7a',
          direction: 'up',
          label: 'Owner',
          owner: 'Omar',
          isPrimary: true,
          status: 'active',
          createdAt: isoDaysAgo(50),
          resolvedAt: null,
          resolutionReason: null,
        },
        {
          id: 'f_7b',
          direction: 'down',
          label: 'Blocked on legal sign-off',
          owner: null,
          isPrimary: false,
          status: 'active',
          createdAt: isoDaysAgo(14),
          resolvedAt: null,
          resolutionReason: null,
        },
      ],
      snapshots: trail([
        [8, 28],
        [7, 28],
        [6, 28],
        [5, 28],
      ]),
      dailyNoteDraft: '',
      notes: [],
      tasks: [],
    },
    {
      id: 'proj_8',
      name: 'Just started — position 0, unassigned, no tracker',
      color: 'mustard',
      position: 0,
      lastMovedAt: isoDaysAgo(0),
      forces: [
        {
          id: 'f_8a',
          direction: 'up',
          label: 'Owner',
          owner: null,
          isPrimary: true,
          status: 'active',
          createdAt: isoDaysAgo(0),
          resolvedAt: null,
          resolutionReason: null,
        },
      ],
      snapshots: [],
      dailyNoteDraft: '',
      notes: [],
      tasks: [],
    },
    {
      id: 'proj_9',
      name: 'Done — all tasks complete (100)',
      color: 'terracotta',
      source: {
        system: 'trello',
        id: 'aBcD1234',
        url: 'https://trello.com/c/aBcD1234',
      },
      position: 100,
      lastMovedAt: isoDaysAgo(2),
      forces: [
        {
          id: 'f_9a',
          direction: 'up',
          label: 'Owner',
          owner: 'Lena',
          isPrimary: true,
          status: 'active',
          createdAt: isoDaysAgo(30),
          resolvedAt: null,
          resolutionReason: null,
        },
      ],
      snapshots: trail([
        [5, 70],
        [4, 82],
        [3, 90],
        [2, 100],
      ]),
      dailyNoteDraft: '',
      notes: [],
      tasks: [
        {
          id: 'task_9a',
          name: 'Task — done (100)',
          position: 100,
          lastMovedAt: isoDaysAgo(5),
          forces: [
            {
              id: 'f_9a_owner',
              direction: 'up',
              label: 'Owner',
              owner: 'Lena',
              isPrimary: true,
              status: 'active',
              createdAt: isoDaysAgo(15),
              resolvedAt: null,
              resolutionReason: null,
            },
          ],
          snapshots: trail([
            [4, 72],
            [3, 90],
            [2, 100],
          ]),
          dailyNoteDraft: '',
          notes: [],
        },
        {
          id: 'task_9b',
          name: 'Task — done (100)',
          position: 100,
          lastMovedAt: isoDaysAgo(3),
          forces: [
            {
              id: 'f_9b_owner',
              direction: 'up',
              label: 'Owner',
              owner: 'Dana',
              isPrimary: true,
              status: 'active',
              createdAt: isoDaysAgo(12),
              resolvedAt: null,
              resolutionReason: null,
            },
          ],
          snapshots: trail([
            [3, 80],
            [2, 92],
            [1, 100],
          ]),
          dailyNoteDraft: '',
          notes: [],
        },
      ],
    },
    {
      id: 'proj_10',
      name: 'Done — shipped, unknown tracker (generic link)',
      color: 'olive',
      source: {
        url: 'https://tickets.acme.dev/ROAD-9',
      },
      position: 100,
      lastMovedAt: isoDaysAgo(8),
      forces: [
        {
          id: 'f_10a',
          direction: 'up',
          label: 'Owner',
          owner: 'Omar',
          isPrimary: true,
          status: 'active',
          createdAt: isoDaysAgo(60),
          resolvedAt: null,
          resolutionReason: null,
        },
      ],
      snapshots: trail([
        [11, 75],
        [10, 85],
        [9, 95],
        [8, 100],
      ]),
      dailyNoteDraft: '',
      notes: [],
      tasks: [],
    },
  ],
}
