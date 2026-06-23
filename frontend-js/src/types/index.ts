export interface Conversation {
  id: number
  user_id: number | null
  title: string
  provider: string
  model: string
  system_prompt: string | null
  is_pinned: boolean
  created_at: string
  updated_at: string
  provider_label?: string
  model_label?: string
}

export interface Message {
  id: number
  conversation_id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
  formatted_time?: string
  attachments?: any[]
}

export interface ModelInfo {
  label: string
  badge: string
}

export interface ProviderGroup {
  label: string
  icon: string
  models: Record<string, ModelInfo>
}

export type ModelsData = Record<string, ProviderGroup>

export interface AppConfig {
  defaultProvider: string
  defaultModel: string
  models: ModelsData
}

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export interface StreamEvent {
  type: 'delta' | 'done' | 'error'
  content?: string
  title?: string
  id?: number
  message?: string
}
