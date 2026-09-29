import type { Metadata } from 'next'
import { DM_Mono, Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const fontSans = Plus_Jakarta_Sans({ variable: '--font-sans', subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const fontDisplay = Fraunces({ variable: '--font-display', subsets: ['latin'], weight: ['500', '600', '700'] })
const fontMono = DM_Mono({ variable: '--font-mono', subsets: ['latin'], weight: '400' })

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'My Assistant'

export const metadata: Metadata = {
  title: appName,
  description: 'A personal AI assistant powered by the Gemini API.'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
