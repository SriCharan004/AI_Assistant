import { GoogleGenAI, type Content, type Part } from '@google/genai'
import { NextRequest } from 'next/server'
import { MODELS, DEFAULT_SYSTEM_PROMPT } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

interface IncomingAttachment { mimeType: string; data?: string; name: string }
interface IncomingMessage { role: 'user' | 'assistant'; content: string; attachments?: IncomingAttachment[] }

const toContents = (messages: IncomingMessage[]): Content[] =>
  messages
    .map((m): Content | null => {
      const parts: Part[] = []
      for (const a of m.attachments ?? []) {
        if (a.data) parts.push({ inlineData: { mimeType: a.mimeType, data: a.data } })
        else parts.push({ text: `[attachment no longer available: ${a.name}]` })
      }
      if (m.content) parts.push({ text: m.content })
      if (parts.length === 0) return null
      return { role: m.role === 'user' ? 'user' : 'model', parts }
    })
    .filter((c): c is Content => c !== null)

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return new Response('GEMINI_API_KEY is not set on the server.', { status: 500 })

  let body: { messages: IncomingMessage[]; model?: string; systemPrompt?: string }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON body.', { status: 400 })
  }

  const model = MODELS.some((m) => m.id === body.model) ? body.model! : MODELS[0].id
  const contents = toContents(body.messages ?? [])
  if (contents.length === 0) return new Response('No messages.', { status: 400 })

  const ai = new GoogleGenAI({ apiKey })
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const result = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction: body.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT,
            temperature: 0.7
          }
        })
        for await (const chunk of result) {
          const text = chunk.text
          if (text) controller.enqueue(encoder.encode(text))
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        controller.enqueue(encoder.encode(`\n\n**Error:** ${msg}`))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' }
  })
}
