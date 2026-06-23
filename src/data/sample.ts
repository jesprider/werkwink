import { localDateString } from '../lib/localDate'
import type { HillChartState, Snapshot } from '../schema/types'

/**
 * Demo chart (`demo: true`). The project lineup is evenly spread across the hill
 * (positions 0, 12, 18, 32, 50, 64, 76, 88, 99, 100) so the overview reads clearly
 * for demos. Dates are relative to the day the app is opened, so staleness
 * satellites and "days without movement" copy stay accurate over time.
 *
 * Staleness is shown on exactly three project dots so the mechanic is obvious
 * without cluttering the overview:
 * - Backlog (position 0): 2 days without movement → 1 satellite.
 * - Internal item (position 12): 3 days → 2 satellites.
 * - Blocked early (position 18): 5+ days → 4 satellites (max).
 * Every other dot moved today or yesterday (0 satellites); done dots at 100 never
 * show satellites.
 *
 * Cases covered:
 * - Positions: start (0), uphill, exactly at the peak (50), downhill, project
 *   clamped at 99 (open task), done (100).
 * - Peak rule: at the peak with active blockers (panel hint); crossed cleanly with
 *   no active blockers.
 * - Forces: named owner, unassigned owner, extra up boosters (↑ badge), active
 *   blockers with and without an owner (↓ badge), resolved past booster and past
 *   blocker with resolution reasons.
 * - Trails: long (7 ghosts), short, flat/stalled, none.
 * - Sources: jira, gitlab, github, linear, trello, asana, clickup, monday, an
 *   unknown tracker (generic link icon), and no source (internal only).
 * - Notes history (export-only) on one item.
 *
 * Kept in sync with `fixtures/hill-chart-import-demo.json` (same scenarios and
 * layout); that file uses static dates and its own ids for import testing.
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
      name: 'Uphill — boosters outweigh a blocker',
      color: 'terracotta',
      source: {
        system: 'jira',
        id: 'MOB-101',
        url: 'https://example.atlassian.net/browse/MOB-101',
      },
      position: 32,
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
        [6, 8],
        [5, 14],
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
          name: 'Task — executing, no blockers (26)',
          position: 26,
          lastMovedAt: isoDaysAgo(1),
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
            [3, 18],
            [2, 22],
            [1, 26],
          ]),
          dailyNoteDraft: '',
          notes: [],
        },
      ],
    },
    {
      id: 'proj_2',
      name: 'Almost done — clamped until a task completes',
      color: 'warm-pink',
      source: {
        system: 'gitlab',
        id: 'acme/api!318',
        url: 'https://gitlab.com/acme/api/-/merge_requests/318',
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
          lastMovedAt: isoDaysAgo(1),
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
            [3, 70],
            [2, 90],
            [1, 100],
          ]),
          dailyNoteDraft: '',
          notes: [],
        },
        {
          id: 'task_2b',
          name: 'Task — still open, blocks project done (55)',
          position: 55,
          lastMovedAt: isoDaysAgo(0),
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
            [2, 46],
            [1, 52],
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
      position: 76,
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
        [4, 62],
        [3, 68],
        [2, 72],
        [1, 76],
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
        [4, 40],
        [3, 46],
        [2, 49],
        [1, 50],
      ]),
      dailyNoteDraft: '',
      notes: [],
      tasks: [],
    },
    {
      id: 'proj_5',
      name: 'Done — all work complete (100)',
      color: 'sage',
      source: {
        system: 'trello',
        id: 'aBcD1234',
        url: 'https://trello.com/c/aBcD1234',
      },
      position: 100,
      lastMovedAt: isoDaysAgo(2),
      forces: [
        {
          id: 'f_5a',
          direction: 'up',
          label: 'Owner',
          owner: 'Casey',
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
          id: 'task_5a',
          name: 'Task — done (100)',
          position: 100,
          lastMovedAt: isoDaysAgo(4),
          forces: [
            {
              id: 'f_5a_owner',
              direction: 'up',
              label: 'Owner',
              owner: 'Casey',
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
          id: 'task_5b',
          name: 'Task — done (100)',
          position: 100,
          lastMovedAt: isoDaysAgo(3),
          forces: [
            {
              id: 'f_5b_owner',
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
      id: 'proj_6',
      name: 'Internal item — no tracker link, unassigned owner',
      color: 'plum',
      position: 12,
      lastMovedAt: isoDaysAgo(3),
      forces: [
        {
          id: 'f_6a',
          direction: 'up',
          label: 'Owner',
          owner: null,
          isPrimary: true,
          status: 'active',
          createdAt: isoDaysAgo(14),
          resolvedAt: null,
          resolutionReason: null,
        },
      ],
      snapshots: trail([
        [5, 6],
        [4, 9],
        [3, 12],
      ]),
      dailyNoteDraft: '',
      notes: [],
      tasks: [],
    },
    {
      id: 'proj_7',
      name: 'Backlog — not started (0)',
      color: 'mustard',
      source: {
        system: 'clickup',
        id: '86yq1abcd',
        url: 'https://app.clickup.com/t/86yq1abcd',
      },
      position: 0,
      lastMovedAt: isoDaysAgo(2),
      forces: [
        {
          id: 'f_7a',
          direction: 'up',
          label: 'Owner',
          owner: 'Omar',
          isPrimary: true,
          status: 'active',
          createdAt: isoDaysAgo(2),
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
      id: 'proj_8',
      name: 'Blocked early on the uphill',
      color: 'dusty-blue',
      source: {
        system: 'asana',
        id: '1207894',
        url: 'https://app.asana.com/0/1207894/list',
      },
      position: 18,
      lastMovedAt: isoDaysAgo(5),
      forces: [
        {
          id: 'f_8a',
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
          id: 'f_8b',
          direction: 'down',
          label: 'Vendor API is flaky',
          owner: null,
          isPrimary: false,
          status: 'active',
          createdAt: isoDaysAgo(14),
          resolvedAt: null,
          resolutionReason: null,
        },
      ],
      snapshots: trail([
        [8, 10],
        [7, 14],
        [6, 18],
        [5, 18],
      ]),
      dailyNoteDraft: '',
      notes: [],
      tasks: [],
    },
    {
      id: 'proj_9',
      name: 'Wrapping up — late downhill',
      color: 'terracotta',
      source: {
        system: 'monday',
        id: '4827193',
        url: 'https://acme.monday.com/boards/4827193',
      },
      position: 88,
      lastMovedAt: isoDaysAgo(0),
      forces: [
        {
          id: 'f_9a',
          direction: 'up',
          label: 'Owner',
          owner: 'Riley',
          isPrimary: true,
          status: 'active',
          createdAt: isoDaysAgo(50),
          resolvedAt: null,
          resolutionReason: null,
        },
      ],
      snapshots: trail([
        [5, 66],
        [4, 74],
        [3, 80],
        [2, 84],
        [1, 88],
      ]),
      dailyNoteDraft: '',
      notes: [],
      tasks: [],
    },
    {
      id: 'proj_10',
      name: 'Unknown tracker — generic link icon',
      color: 'olive',
      source: {
        url: 'https://tickets.acme.dev/ROAD-9',
      },
      position: 64,
      lastMovedAt: isoDaysAgo(1),
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
        [5, 40],
        [4, 48],
        [3, 54],
        [2, 58],
        [1, 64],
      ]),
      dailyNoteDraft: '',
      notes: [],
      tasks: [],
    },
  ],
}
