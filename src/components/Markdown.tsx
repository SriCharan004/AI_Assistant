'use client'
import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const Markdown = memo(({ children }: { children: string }) => (
  <div className="prose-chat min-w-0 break-words">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        )
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
))
Markdown.displayName = 'Markdown'
export default Markdown
