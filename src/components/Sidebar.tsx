'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown, PanelLeftClose, PanelLeftOpen, Plus, Settings2, Sparkles, Trash2, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { MODELS, DEFAULT_SYSTEM_PROMPT, type ModelId } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useIsMobile } from './useIsMobile'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'My Assistant'
const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE || 'Powered by Gemini'

export const BrandMark = ({ className }: { className?: string }) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-badgeFrom to-brand-badgeTo text-primary-foreground shadow-sm',
      className
    )}
    aria-hidden="true"
  >
    <Sparkles className="size-[55%]" strokeWidth={2.2} />
  </span>
)

const Header = () => (
  <div className="flex w-full min-w-0 items-center gap-3 pr-9">
    <BrandMark className="size-9" />
    <div className="flex min-w-0 flex-col leading-tight">
      <span className="truncate text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-foreground">{APP_NAME}</span>
      <span className="truncate text-[0.6rem] font-medium uppercase tracking-wider text-muted-foreground">{APP_TAGLINE}</span>
    </div>
  </div>
)

const NewChatButton = () => {
  const { newConversation, activeId, isStreaming } = useStore()
  return (
    <button
      type="button"
      onClick={newConversation}
      disabled={!activeId || isStreaming}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-sm transition-opacity hover:bg-primary/90 disabled:opacity-50"
    >
      <Plus className="size-3.5" aria-hidden="true" />
      New chat
    </button>
  )
}

const ConversationList = () => {
  const { conversations, activeId, selectConversation, deleteConversation, isStreaming, hydrated } = useStore()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <div className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">Conversations</div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {!hydrated ? null : conversations.length === 0 ? (
          <p className="pt-1 text-xs leading-relaxed text-muted-foreground/70">
            No conversations yet. Ask something below and it will appear here.
          </p>
        ) : (
          <div className="flex flex-col gap-y-1">
            {conversations.map((c) => {
              const selected = c.id === activeId
              const confirming = confirmId === c.id
              return (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => !isStreaming && selectConversation(c.id)}
                  onKeyDown={(e) => e.key === 'Enter' && !isStreaming && selectConversation(c.id)}
                  className={cn(
                    'group flex h-11 w-full min-w-0 items-center justify-between rounded-lg px-3 py-2 transition-colors duration-200',
                    selected ? 'cursor-default bg-primary/10' : 'cursor-pointer hover:bg-muted/80'
                  )}
                >
                  {confirming ? (
                    <div className="flex w-full items-center justify-between gap-2 text-xs">
                      <span className="truncate text-muted-foreground">Delete?</span>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteConversation(c.id)
                            setConfirmId(null)
                          }}
                          className="rounded-md bg-destructive px-2 py-1 font-medium text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmId(null)
                          }}
                          className="rounded-md px-2 py-1 font-medium text-muted-foreground hover:bg-muted"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className={cn('min-w-0 flex-1 truncate text-sm font-medium', selected && 'text-primary')} title={c.title}>
                        {c.title}
                      </h4>
                      <button
                        type="button"
                        aria-label={`Delete ${c.title}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmId(c.id)
                        }}
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const Settings = () => {
  const { model, setModel, systemPrompt, setSystemPrompt } = useStore()
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-auto w-full shrink-0 border-t border-border/60">
      {open && (
        <div className="flex flex-col gap-4 pb-2 pt-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="model" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value as ModelId)}
              className="h-9 w-full rounded-xl border border-border bg-secondary px-3 text-xs font-medium text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="text-[0.7rem] text-muted-foreground/80">{MODELS.find((m) => m.id === model)?.hint}</p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="system-prompt" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                System prompt
              </label>
              {systemPrompt !== DEFAULT_SYSTEM_PROMPT && (
                <button
                  type="button"
                  onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
                  className="text-[0.7rem] font-medium text-primary hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            <textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={7}
              spellCheck={false}
              className="w-full resize-y rounded-xl border border-border bg-secondary px-3 py-2 text-xs leading-relaxed text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-[0.7rem] text-muted-foreground/80">Applies to every new message. Saved in this browser.</p>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Settings2 className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">Settings</span>
        <span className="truncate text-[0.65rem] text-muted-foreground/70">{MODELS.find((m) => m.id === model)?.label}</span>
        <ChevronDown className={cn('size-3.5 shrink-0 transition-transform duration-200', !open && 'rotate-180')} aria-hidden="true" />
      </button>
    </div>
  )
}

const Body = () => (
  <>
    <div className="w-full shrink-0 space-y-5">
      <Header />
      <NewChatButton />
    </div>
    <ConversationList />
    <Settings />
  </>
)

const MobileSidebar = () => {
  const { isSidebarOpen, setSidebarOpen } = useStore()
  const reduce = useReducedMotion()
  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: reduce ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reduce ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <motion.aside
            key="drawer"
            className="fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-[320px] flex-col overflow-hidden border-r border-border/70 bg-card px-3 py-3 shadow-xl"
            initial={{ x: reduce ? 0 : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: reduce ? 0 : '-100%' }}
            transition={{ type: 'tween', duration: reduce ? 0 : 0.25, ease: [0.32, 0.72, 0, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Conversations and settings"
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close sidebar"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
            <div className="flex min-h-0 w-full flex-1 flex-col gap-5 overflow-y-auto pt-0.5">
              <Body />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

const DesktopSidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const reduce = useReducedMotion()
  return (
    <aside
      className="relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/80 px-3 py-3 shadow-sm backdrop-blur-md backdrop-saturate-150"
      style={{ width: collapsed ? 52 : 272, transition: reduce ? 'none' : 'width 0.22s cubic-bezier(0.4,0,0.2,1)' }}
      aria-label="Conversations and settings"
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
      >
        {collapsed ? <PanelLeftOpen className="size-4" aria-hidden="true" /> : <PanelLeftClose className="size-4" aria-hidden="true" />}
      </button>
      <motion.div
        className="flex min-h-0 w-full flex-1 flex-col gap-5 overflow-hidden pt-0.5"
        animate={{ opacity: collapsed ? 0 : 1, x: collapsed ? -16 : 0 }}
        transition={{ duration: reduce ? 0 : 0.25, ease: 'easeInOut' }}
        style={{ pointerEvents: collapsed ? 'none' : 'auto' }}
      >
        <Body />
      </motion.div>
    </aside>
  )
}

export default function Sidebar() {
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="hidden w-[272px] shrink-0 md:block" aria-hidden="true" />
  return isMobile ? <MobileSidebar /> : <DesktopSidebar />
}
