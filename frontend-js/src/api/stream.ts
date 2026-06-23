import type { StreamEvent, Message } from '../types'

function getCsrfToken(): string {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
  return meta?.content ?? ''
}

interface StreamCallbacks {
  onDelta: (text: string) => void
  onDone: (title?: string, id?: number) => void
  onError: (message: string) => void
}

export async function streamMessage(
  conversationId: number,
  message: string,
  image: string | undefined,
  callbacks: StreamCallbacks,
): Promise<void> {
  const res = await fetch(`/api/chat/${conversationId}/message`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'X-CSRF-TOKEN': getCsrfToken(),
    },
    body: JSON.stringify({ message, image }),
  })

  if (!res.ok) {
    callbacks.onError(`Server error ${res.status}`)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    callbacks.onError('No response body')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue

      let evt: StreamEvent
      try {
        evt = JSON.parse(line.slice(6))
      } catch {
        continue
      }

      if (evt.type === 'delta' && evt.content) {
        callbacks.onDelta(evt.content)
      } else if (evt.type === 'done') {
        callbacks.onDone(evt.title, evt.id)
      } else if (evt.type === 'error' && evt.message) {
        callbacks.onError(evt.message)
      }
    }
  }
}

export async function streamTemporaryMessage(
  message: string,
  image: string | undefined,
  history: Message[],
  provider: string,
  model: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  const res = await fetch(`/api/chat/temporary-message`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'X-CSRF-TOKEN': getCsrfToken(),
    },
    body: JSON.stringify({ message, image, history, provider, model }),
  })

  if (!res.ok) {
    callbacks.onError(`Server error ${res.status}`)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    callbacks.onError('No response body')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue

      let evt: StreamEvent
      try {
        evt = JSON.parse(line.slice(6))
      } catch {
        continue
      }

      if (evt.type === 'delta' && evt.content) {
        callbacks.onDelta(evt.content)
      } else if (evt.type === 'done') {
        callbacks.onDone(evt.title, evt.id)
      } else if (evt.type === 'error' && evt.message) {
        callbacks.onError(evt.message)
      }
    }
  }
}
