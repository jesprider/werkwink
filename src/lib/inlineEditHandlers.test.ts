// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest'
import { onInlineEditFocusOut, onInlineEditKeydown } from './inlineEditHandlers'

describe('onInlineEditKeydown', () => {
  it('calls save on Enter', () => {
    const save = vi.fn()
    const cancel = vi.fn()
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })

    onInlineEditKeydown(event, { save, cancel })

    expect(save).toHaveBeenCalledOnce()
    expect(cancel).not.toHaveBeenCalled()
  })

  it('calls cancel on Escape', () => {
    const save = vi.fn()
    const cancel = vi.fn()
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })

    onInlineEditKeydown(event, { save, cancel })

    expect(cancel).toHaveBeenCalledOnce()
    expect(save).not.toHaveBeenCalled()
  })

  it('does nothing when active is false', () => {
    const save = vi.fn()
    const cancel = vi.fn()
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })

    onInlineEditKeydown(event, { save, cancel, active: () => false })

    expect(save).not.toHaveBeenCalled()
    expect(cancel).not.toHaveBeenCalled()
  })
})

describe('onInlineEditFocusOut', () => {
  it('calls cancel when focus leaves the container', () => {
    const cancel = vi.fn()
    const container = document.createElement('div')
    const input = document.createElement('input')
    container.appendChild(input)
    document.body.appendChild(container)

    const event = new FocusEvent('focusout', { relatedTarget: null })
    Object.defineProperty(event, 'currentTarget', { value: container })

    onInlineEditFocusOut(event, { cancel })

    expect(cancel).toHaveBeenCalledOnce()
    container.remove()
  })

  it('does not cancel when focus moves within the container', () => {
    const cancel = vi.fn()
    const container = document.createElement('div')
    const first = document.createElement('input')
    const second = document.createElement('input')
    container.append(first, second)
    document.body.appendChild(container)

    const event = new FocusEvent('focusout', { relatedTarget: second })
    Object.defineProperty(event, 'currentTarget', { value: container })

    onInlineEditFocusOut(event, { cancel })

    expect(cancel).not.toHaveBeenCalled()
    container.remove()
  })
})
