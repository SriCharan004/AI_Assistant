export type Role = 'user' | 'assistant'

export interface Attachment {
  name: string
  mimeType: string
  size: number
  /** base64 payload. Kept in memory for the session; stripped before persisting to localStorage. */
  data?: string
}

export interface Message {
  id: string
  role: Role
  content: string
  attachments?: Attachment[]
  createdAt: number
  error?: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export const MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', hint: 'Fast, great default' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', hint: 'Deeper reasoning, slower' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', hint: 'Cheapest, quick answers' }
] as const

export type ModelId = (typeof MODELS)[number]['id']

export const DEFAULT_SYSTEM_PROMPT = `You are a helpful, direct assistant.

- Answer the question first, then add context only if it is useful.
- Prefer plain prose. Use lists only when the content is a real list.
- No filler phrases. Do not restate the question.
- If the user is wrong or a better approach exists, say so and explain why.
- If you are not sure, say so rather than guessing.
- When asked for code, give complete, runnable code.`
