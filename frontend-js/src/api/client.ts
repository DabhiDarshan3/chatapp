import type { Conversation, Message, AppConfig } from '../types'

function getCsrfToken(): string {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
  return meta?.content ?? ''
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const opts: RequestInit = {
    method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRF-TOKEN': getCsrfToken(),
    },
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(url, opts)
  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.message || `HTTP ${res.status}`)
  }
  return data as T
}

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch('/api/models', {
    headers: { 'Accept': 'application/json' },
    credentials: 'same-origin',
  })
  if (!res.ok) throw new Error('Failed to fetch config')
  return res.json()
}

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch('/api/conversations', {
    headers: { 'Accept': 'application/json' },
    credentials: 'same-origin',
  })
  if (!res.ok) throw new Error('Failed to fetch conversations')
  return res.json()
}

export async function fetchMessages(conversationId: number): Promise<Message[]> {
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    headers: { 'Accept': 'application/json' },
    credentials: 'same-origin',
  })
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}

export async function createConversation(provider: string, model: string) {
  return request<{ success: boolean; conversation: Conversation }>(
    'POST', '/api/chat', { provider, model }
  )
}

export async function deleteConversation(id: number) {
  return request<{ success: boolean }>('DELETE', `/api/chat/${id}`)
}

export async function clearConversation(id: number) {
  return request<{ success: boolean }>('POST', `/api/chat/${id}/clear`)
}

export async function renameConversation(id: number, title: string) {
  return request<{ success: boolean; title: string }>('PATCH', `/api/chat/${id}/rename`, { title })
}

export async function updateConversationModel(id: number, provider: string, model: string) {
  return request<{ success: boolean }>('PATCH', `/api/chat/${id}/model`, { provider, model })
}
