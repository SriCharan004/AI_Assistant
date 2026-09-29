'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Conversation, Message, ModelId } from './types'
import { DEFAULT_SYSTEM_PROMPT } from './types'
import { uid } from './utils'

interface State {
  conversations: Conversation[]
  activeId: string | null
  model: ModelId
  systemPrompt: string
  isStreaming: boolean
  isSidebarOpen: boolean
  hydrated: boolean

  setModel: (m: ModelId) => void
  setSystemPrompt: (p: string) => void
  setStreaming: (v: boolean) => void
  setSidebarOpen: (v: boolean) => void
  setHydrated: () => void
  newConversation: () => void
  selectConversation: (id: string) => void
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  appendMessage: (msg: Message) => string
  updateMessage: (convId: string, msgId: string, patch: Partial<Message>) => void
  activeConversation: () => Conversation | undefined
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,
      model: 'gemini-2.5-flash',
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      isStreaming: false,
      isSidebarOpen: false,
      hydrated: false,

      setModel: (model) => set({ model }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
      setStreaming: (isStreaming) => set({ isStreaming }),
      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      setHydrated: () => set({ hydrated: true }),

      newConversation: () => set({ activeId: null, isSidebarOpen: false }),
      selectConversation: (id) => set({ activeId: id, isSidebarOpen: false }),
      deleteConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          activeId: s.activeId === id ? null : s.activeId
        })),
      renameConversation: (id, title) =>
        set((s) => ({ conversations: s.conversations.map((c) => (c.id === id ? { ...c, title } : c)) })),

      /** Appends to the active conversation, creating one if needed. Returns the conversation id. */
      appendMessage: (msg) => {
        const s = get()
        let id = s.activeId
        const now = Date.now()
        if (!id || !s.conversations.some((c) => c.id === id)) {
          id = uid()
          const title = (msg.content || msg.attachments?.[0]?.name || 'New chat').slice(0, 60)
          set({
            conversations: [{ id, title, messages: [msg], createdAt: now, updatedAt: now }, ...s.conversations],
            activeId: id
          })
          return id
        }
        set({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, messages: [...c.messages, msg], updatedAt: now } : c
          )
        })
        return id
      },

      updateMessage: (convId, msgId, patch) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id !== convId
              ? c
              : { ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)) }
          )
        })),

      activeConversation: () => {
        const s = get()
        return s.conversations.find((c) => c.id === s.activeId)
      }
    }),
    {
      name: 'gemini-chat-v1',
      storage: createJSONStorage(() => localStorage),
      // Persist conversations, model and prompt. Strip attachment payloads: base64 files
      // would blow past localStorage's ~5 MB budget. Names stay so the history still reads right.
      partialize: (s) => ({
        activeId: s.activeId,
        model: s.model,
        systemPrompt: s.systemPrompt,
        conversations: s.conversations.map((c) => ({
          ...c,
          messages: c.messages.map((m) => ({
            ...m,
            attachments: m.attachments?.map(({ data: _d, ...rest }) => rest)
          }))
        }))
      }),
      onRehydrateStorage: () => (state) => {
        state?.setStreaming(false)
        state?.setHydrated()
      }
    }
  )
)
