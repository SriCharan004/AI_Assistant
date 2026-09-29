# My Assistant — a Claude-style chat on the Gemini API

A polished personal AI assistant built with Next.js 15, Tailwind and Google's Gemini API, ready to deploy on Vercel.

**Features**

- Streaming replies with full Markdown, code blocks and tables
- Conversation sidebar (new chat, switch, delete), saved in the browser
- Model switcher: Gemini 2.5 Flash, Pro and Flash-Lite
- Editable system prompt (persona), saved in the browser
- Image and PDF attachments (up to 5 files, 10 MB each)
- Responsive: collapsible sidebar on desktop, drawer on mobile
- API key stays server-side; the browser never sees it

## How it works

Every AI assistant is the same loop. Keep a list of messages, send the whole list plus the new one to the model, append the reply, repeat. Here:

- `src/components/useChat.ts` is that loop on the client. It appends the user turn, POSTs the history to `/api/chat`, and streams chunks into a placeholder assistant message.
- `src/app/api/chat/route.ts` runs on the server. It converts the history into Gemini's format (attachments become `inlineData` parts), calls `generateContentStream`, and streams plain text back.
- `src/lib/store.ts` holds conversations, the chosen model and the system prompt, persisted to `localStorage`.

## Run locally

```bash
npm install
cp .env.example .env.local     # then paste your key in
npm run dev
```

Get a free Gemini API key at https://aistudio.google.com/apikey

## Deploy on Vercel

1. Push this folder to a GitHub repo (`.env.local` is git-ignored, so the key never leaves your machine).
2. Go to https://vercel.com/new, import the repo. Framework preset: Next.js (auto-detected). Leave build settings as they are.
3. Under **Environment Variables** add:
   - `GEMINI_API_KEY` = your key
   - `NEXT_PUBLIC_APP_NAME` = whatever you want to call it (optional)
   - `NEXT_PUBLIC_APP_TAGLINE` = a short subtitle (optional)
4. Click **Deploy**. Every later `git push` redeploys automatically.

## Customise

- **Branding**: `NEXT_PUBLIC_APP_NAME` and `NEXT_PUBLIC_APP_TAGLINE` in Vercel's env vars, no code changes needed. The icon is `BrandMark` in `src/components/Sidebar.tsx`.
- **Colours**: the HSL tokens at the top of `src/app/globals.css`. `--primary` is the purple.
- **Fonts**: `src/app/layout.tsx` (Plus Jakarta Sans body, Fraunces headings, DM Mono code).
- **Models**: the `MODELS` list in `src/lib/types.ts`.
- **Default persona**: `DEFAULT_SYSTEM_PROMPT` in `src/lib/types.ts`.
- **Suggestion chips** on the welcome screen: `SUGGESTIONS` in `src/components/ChatArea.tsx`.

## Things to know

- Conversations live in the visitor's browser only. Clearing site data removes them. Attachment contents are kept for the session but not persisted, so after a reload the model can no longer see an earlier file (it is told the attachment is unavailable).
- Whoever opens the site uses **your** API key. Gemini's free tier is generous, but if you share the link widely, set a spending limit in Google AI Studio or add a password.
- Serverless responses are capped at 60 s (`maxDuration` in the route). Long Pro answers stream well within that.

## Next steps if you want to grow it

Tools via Gemini function calling (web search, code execution), accounts with per-user history (Supabase or Convex), or a share-conversation link.
