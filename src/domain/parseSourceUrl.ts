import type { Source } from '../schema/types'

export type ParseSourceUrlResult = Source | 'invalid'

function tryParseUrl(raw: string): URL | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    if (hasScheme && !/^https?:\/\//i.test(trimmed)) return null
    const withProtocol = hasScheme ? trimmed : `https://${trimmed}`
    const url = new URL(withProtocol)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url
  } catch {
    return null
  }
}

function detectSystem(hostname: string): string | undefined {
  const host = hostname.toLowerCase()
  if (host.endsWith('.atlassian.net')) return 'jira'
  if (host === 'linear.app' || host.endsWith('.linear.app')) return 'linear'
  if (host === 'github.com') return 'github'
  if (host === 'gitlab.com' || host.includes('gitlab')) return 'gitlab'
  if (host === 'app.asana.com') return 'asana'
  if (host === 'app.clickup.com') return 'clickup'
  if (host.endsWith('.monday.com')) return 'monday'
  if (host === 'trello.com') return 'trello'
  return undefined
}

/**
 * Parse a user-entered URL: validate http(s), normalize href, infer tracker
 * system from hostname for the side-panel icon. Does not validate path shape.
 */
export function parseSourceUrl(raw: string): ParseSourceUrlResult {
  const url = tryParseUrl(raw)
  if (!url) return 'invalid'

  const href = url.href
  const system = detectSystem(url.hostname)
  return system ? { url: href, system } : { url: href }
}

export function sourceOpenLabel(system?: string): string {
  switch (system) {
    case 'jira':
      return 'Open in Jira'
    case 'linear':
      return 'Open in Linear'
    case 'github':
      return 'Open in GitHub'
    case 'gitlab':
      return 'Open in GitLab'
    case 'asana':
      return 'Open in Asana'
    case 'clickup':
      return 'Open in ClickUp'
    case 'monday':
      return 'Open in Monday'
    case 'trello':
      return 'Open in Trello'
    default:
      return 'Open external link'
  }
}
