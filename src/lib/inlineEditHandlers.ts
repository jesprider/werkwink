export function onInlineEditKeydown(
  event: KeyboardEvent,
  options: { save: () => void; cancel: () => void; active?: () => boolean },
) {
  if (options.active && !options.active()) return
  if (event.key === 'Enter') {
    event.preventDefault()
    options.save()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    options.cancel()
  }
}

export function onInlineEditFocusOut(
  event: FocusEvent,
  options: { cancel: () => void; active?: () => boolean },
) {
  if (options.active && !options.active()) return
  const container = event.currentTarget as HTMLElement
  const next = event.relatedTarget as Node | null
  if (next && container.contains(next)) return
  options.cancel()
}
