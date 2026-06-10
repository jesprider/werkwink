import { describe, it, expect } from 'vitest'
import { parseSourceUrl } from './parseSourceUrl'

describe('parseSourceUrl', () => {
  it('returns invalid for empty or malformed input', () => {
    expect(parseSourceUrl('')).toBe('invalid')
    expect(parseSourceUrl('   ')).toBe('invalid')
    expect(parseSourceUrl('not a url')).toBe('invalid')
    expect(parseSourceUrl('ftp://example.com/foo')).toBe('invalid')
  })

  it('infers system from hostname only', () => {
    expect(parseSourceUrl('https://acme.atlassian.net/browse/MOB-101')).toEqual({
      url: 'https://acme.atlassian.net/browse/MOB-101',
      system: 'jira',
    })
    expect(parseSourceUrl('https://linear.app/acme/issue/ENG-42')).toEqual({
      url: 'https://linear.app/acme/issue/ENG-42',
      system: 'linear',
    })
    expect(parseSourceUrl('https://github.com/org/repo/issues/12')).toEqual({
      url: 'https://github.com/org/repo/issues/12',
      system: 'github',
    })
    expect(parseSourceUrl('https://github.com/org/repo')).toEqual({
      url: 'https://github.com/org/repo',
      system: 'github',
    })
    expect(parseSourceUrl('https://gitlab.com/group/project/-/issues/7')).toEqual({
      url: 'https://gitlab.com/group/project/-/issues/7',
      system: 'gitlab',
    })
    expect(parseSourceUrl('https://gitlab.company.com/team/app')).toEqual({
      url: 'https://gitlab.company.com/team/app',
      system: 'gitlab',
    })
    expect(parseSourceUrl('https://app.asana.com/0/123/456')).toMatchObject({ system: 'asana' })
    expect(parseSourceUrl('https://app.clickup.com/t/abc')).toMatchObject({ system: 'clickup' })
    expect(parseSourceUrl('https://acme.monday.com/boards/1')).toMatchObject({ system: 'monday' })
    expect(parseSourceUrl('https://trello.com/c/Ab12CdEf')).toEqual({
      url: 'https://trello.com/c/Ab12CdEf',
      system: 'trello',
    })
  })

  it('returns url-only for unknown hosts', () => {
    expect(parseSourceUrl('https://example.com/work/99')).toEqual({
      url: 'https://example.com/work/99',
    })
    expect(parseSourceUrl('https://git.company.com/team/app')).toEqual({
      url: 'https://git.company.com/team/app',
    })
  })

  it('adds https when protocol is omitted', () => {
    expect(parseSourceUrl('github.com/org/repo')).toMatchObject({
      system: 'github',
      url: 'https://github.com/org/repo',
    })
  })
})
