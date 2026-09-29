import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ACCEPTED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
export const ACCEPTED_FILE_TYPES = ACCEPTED_MIME.join(',')
export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const MAX_FILES = 5

export const validateFiles = (files: File[]): string | null => {
  if (files.length > MAX_FILES) return `You can attach up to ${MAX_FILES} files.`
  for (const f of files) {
    if (!ACCEPTED_MIME.includes(f.type)) return `${f.name}: only images and PDFs are supported.`
    if (f.size > MAX_FILE_BYTES) return `${f.name} is over 10 MB.`
  }
  return null
}

export const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
