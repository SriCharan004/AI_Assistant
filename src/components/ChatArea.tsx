'use client'
import { useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowDown, ArrowUp, FileText, ImageIcon, Menu, Paperclip, X } from 'lucide-react'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import type { Attachment, Message } from '@/lib/types'
import { ACCEPTED_FILE_TYPES, cn, fileToBase64, formatFileSize, validateFiles } from '@/lib/utils'
import { useChat } from './useChat'
import Markdown from './Markdown'
import { BrandMark } from './Sidebar'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'My Assistant'

const SUGGESTIONS = [
  'Explain the chain-ladder method in simple terms',
  'Draft a polite follow-up email to a client',
  'Write a Python function to compute IBNR from a run-off triangle',
  'Summarise the attached PDF in five bullet points'
]

/* ---------- top bar (mobile) ---------- */

const MobileTopBar = () => {
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-2 py-2 md:hidden">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{APP_NAME}</span>
    </div>
  )
}

/* ---------- blank state ---------- */

const BlankState = ({ onPick }: { onPick: (s: string) => void }) => {
  const reduce = useReducedMotion()
  const fade = (delay: number) => ({
    initial: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0 : 0.45, delay: reduce ? 0 : delay }
  })
  return (
    <section className="flex w-full flex-col items-center px-2" aria-label="Welcome">
      <div className="flex w-full max-w-xl flex-col items-center gap-y-4 text-center">
        <motion.div {...fade(0.1)} className="flex items-center gap-3">
          <BrandMark className="size-10" />
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-badgeFrom to-brand-badgeTo px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-sm">
            {APP_NAME}
          </span>
        </motion.div>
        <motion.h1
          {...fade(0.2)}
          className="text-balance font-display text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl"
        >
          What can I help you with today?
        </motion.h1>
        <motion.p {...fade(0.3)} className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Ask a question, paste some text, or attach an image or PDF. Conversations stay in this browser.
        </motion.p>
        <motion.div {...fade(0.4)} className="mt-2 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              className="rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted/60 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ---------- messages ---------- */

const ThinkingDots = () => (
  <div className="flex items-center gap-2 py-0.5 text-muted-foreground/70" role="status" aria-label="Assistant is working">
    <span className="flex items-center gap-1" aria-hidden="true">
      <span className="size-1.5 rounded-full bg-primary/50 [animation-delay:-0.3s] [animation-duration:0.7s] motion-safe:animate-bounce" />
      <span className="size-1.5 rounded-full bg-primary/50 [animation-delay:-0.15s] [animation-duration:0.7s] motion-safe:animate-bounce" />
      <span className="size-1.5 rounded-full bg-primary/50 [animation-duration:0.7s] motion-safe:animate-bounce" />
    </span>
    <span className="text-xs motion-safe:animate-pulse">Thinking…</span>
  </div>
)

const AttachmentChip = ({ a }: { a: Attachment }) => {
  const isImage = a.mimeType.startsWith('image/')
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-2.5 py-1 text-xs text-muted-foreground">
      {isImage ? <ImageIcon className="size-3" aria-hidden="true" /> : <FileText className="size-3" aria-hidden="true" />}
      <span className="truncate">{a.name}</span>
    </span>
  )
}

const UserMessage = ({ m }: { m: Message }) => (
  <div className="flex justify-end">
    <div className="min-w-0 max-w-[88%] rounded-3xl rounded-br-lg bg-secondary px-4 py-2.5 text-sm leading-relaxed text-foreground md:max-w-[75%]">
      <span className="sr-only">You</span>
      {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
      {m.attachments && m.attachments.length > 0 && (
        <div className={cn('flex flex-wrap justify-end gap-2', m.content && 'mt-2')}>
          {m.attachments.map((a, i) => (
            <AttachmentChip key={`${a.name}-${i}`} a={a} />
          ))}
        </div>
      )}
    </div>
  </div>
)

const AssistantMessage = ({ m }: { m: Message }) => (
  <div className="min-w-0">
    <span className="sr-only">Assistant</span>
    {m.error && !m.content ? (
      <p className="text-sm text-destructive">Something went wrong: {m.error}</p>
    ) : m.content ? (
      <Markdown>{m.content}</Markdown>
    ) : (
      <ThinkingDots />
    )}
  </div>
)

const ScrollToBottom = () => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()
  const reduce = useReducedMotion()
  return (
    <AnimatePresence>
      {!isAtBottom && (
        <motion.div
          initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 20 }}
          transition={{ duration: reduce ? 0 : 0.3 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2"
        >
          <button
            type="button"
            onClick={() => scrollToBottom()}
            aria-label="Scroll to latest"
            className="flex size-9 items-center justify-center rounded-full border border-border/80 bg-card/95 text-foreground shadow-md transition-colors hover:bg-muted"
          >
            <ArrowDown className="size-4" aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const MessageList = ({ onPick }: { onPick: (s: string) => void }) => {
  const activeId = useStore((s) => s.activeId)
  const conversations = useStore((s) => s.conversations)
  const hydrated = useStore((s) => s.hydrated)
  const messages = conversations.find((c) => c.id === activeId)?.messages ?? []

  return (
    <StickToBottom className="relative mb-4 flex min-h-0 flex-1 flex-col" resize="smooth" initial="smooth">
      <StickToBottom.Content className="flex min-h-full flex-col justify-center">
        <div className="mx-auto w-full max-w-3xl space-y-7 px-4 pb-4 pt-6">
          {!hydrated ? null : messages.length === 0 ? (
            <BlankState onPick={onPick} />
          ) : (
            messages.map((m) => (m.role === 'user' ? <UserMessage key={m.id} m={m} /> : <AssistantMessage key={m.id} m={m} />))
          )}
        </div>
      </StickToBottom.Content>
      <ScrollToBottom />
    </StickToBottom>
  )
}

/* ---------- input ---------- */

const ChatInput = ({ value, setValue }: { value: string; setValue: (v: string) => void }) => {
  const { send } = useChat()
  const isStreaming = useStore((s) => s.isStreaming)
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const hasContent = value.trim().length > 0 || files.length > 0

  const pickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (picked.length === 0) return
    const combined = [...files, ...picked]
    const err = validateFiles(combined)
    if (err) return void toast.error(err)
    setFiles(combined)
  }

  const submit = async () => {
    if (!hasContent || isStreaming) return
    const text = value
    const current = files
    setValue('')
    setFiles([])
    if (textRef.current) textRef.current.style.height = 'auto'
    const attachments: Attachment[] = await Promise.all(
      current.map(async (f) => ({ name: f.name, mimeType: f.type, size: f.size, data: await fileToBase64(f) }))
    )
    await send(text, attachments)
  }

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  return (
    <div className="relative mx-auto mb-1 flex w-full max-w-3xl flex-col gap-2">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3 py-1.5 text-xs shadow-sm">
              <span className="truncate font-medium text-foreground">{f.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatFileSize(f.size)}</span>
              <button
                type="button"
                onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Remove ${f.name}`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex min-h-[3.25rem] w-full items-end gap-1 rounded-[1.75rem] border border-border/90 bg-card/90 py-1.5 pl-2 pr-2 shadow-sm backdrop-blur-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring/20">
        <input ref={fileRef} type="file" multiple accept={ACCEPTED_FILE_TYPES} className="hidden" onChange={pickFiles} disabled={isStreaming} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isStreaming}
          aria-label="Attach image or PDF"
          className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:opacity-50"
        >
          <Paperclip className="size-4" aria-hidden="true" />
        </button>
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-input"
          ref={textRef}
          rows={1}
          value={value}
          placeholder="Ask anything…"
          autoComplete="off"
          onChange={(e) => {
            setValue(e.target.value)
            autoGrow(e.target)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              void submit()
            }
          }}
          className="max-h-40 min-h-0 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!hasContent || isStreaming}
          aria-label="Send message"
          className="mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-opacity hover:bg-primary/90 disabled:opacity-40"
        >
          <ArrowUp className="size-4" strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
      <p className="px-2 text-center text-[0.65rem] text-muted-foreground/60">
        Enter to send · Shift+Enter for a new line · Replies can be wrong, so check anything important.
      </p>
    </div>
  )
}

/* ---------- shell ---------- */

export default function ChatArea() {
  const [draft, setDraft] = useState('')
  return (
    <main
      id="main-content"
      className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card/80 shadow-sm backdrop-blur-md backdrop-saturate-150 md:rounded-2xl md:border md:border-border/70"
      tabIndex={-1}
    >
      <MobileTopBar />
      <MessageList onPick={setDraft} />
      <div className="sticky bottom-0 shrink-0 px-2 pb-2 pt-1 md:px-4 md:pb-3">
        <ChatInput value={draft} setValue={setDraft} />
      </div>
    </main>
  )
}
