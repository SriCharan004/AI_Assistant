'use client'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import type { Attachment, Message } from '@/lib/types'
import { uid } from '@/lib/utils'

/**
 * The core loop: append the user turn, open a streaming request with the full
 * history, and append chunks to a placeholder assistant message as they arrive.
 */
export const useChat = () => {
  const send = useCallback(async (text: string, attachments: Attachment[] = []) => {
    const s = useStore.getState()
    if (s.isStreaming) return
    if (!text.trim() && attachments.length === 0) return

    const userMsg: Message = { id: uid(), role: 'user', content: text.trim(), attachments, createdAt: Date.now() }
    const convId = s.appendMessage(userMsg)

    const assistantMsg: Message = { id: uid(), role: 'assistant', content: '', createdAt: Date.now() }
    useStore.getState().appendMessage(assistantMsg)
    useStore.getState().setStreaming(true)

    const history = useStore
      .getState()
      .conversations.find((c) => c.id === convId)!
      .messages.filter((m) => m.id !== assistantMsg.id)
      .map((m) => ({ role: m.role, content: m.content, attachments: m.attachments }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, model: s.model, systemPrompt: s.systemPrompt })
      })
      if (!res.ok || !res.body) {
        const err = await res.text()
        throw new Error(err || `Request failed (${res.status})`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        useStore.getState().updateMessage(convId, assistantMsg.id, { content: acc })
      }
      if (!acc.trim()) {
        useStore.getState().updateMessage(convId, assistantMsg.id, { error: 'The model returned an empty reply.' })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      useStore.getState().updateMessage(convId, assistantMsg.id, { error: msg })
      toast.error(msg)
    } finally {
      useStore.getState().setStreaming(false)
    }
  }, [])

  return { send }
}
