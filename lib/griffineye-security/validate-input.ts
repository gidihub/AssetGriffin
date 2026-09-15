import { MAX_DESCRIPTION_LENGTH, MAX_INTAKE_PHOTOS, MIN_DESCRIPTION_LENGTH } from '@/lib/griffineye-intake'

export const MAX_QUESTION_LENGTH = 500

export type ParsedQueryBody = { question: string }
export type ParsedDescribeBody = { description: string }

export class GriffinEyeValidationError extends Error {
  status = 400
}

function reject(message: string): never {
  throw new GriffinEyeValidationError(message)
}

/** Strict body parse — only expected fields, strip everything else. */
export function parseGriffinEyeQueryBody(body: unknown): ParsedQueryBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    reject('Ask GriffinEye a question to get started.')
  }

  const record = body as Record<string, unknown>
  const question = typeof record.question === 'string' ? record.question.trim() : ''

  if (!question) reject('Ask GriffinEye a question to get started.')
  if (question.length > MAX_QUESTION_LENGTH) {
    reject(`Keep your question under ${MAX_QUESTION_LENGTH} characters.`)
  }

  return { question }
}

export function parseGriffinEyeDescribeBody(body: unknown): ParsedDescribeBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    reject('Describe the asset in a few words to get started.')
  }

  const record = body as Record<string, unknown>
  const description = typeof record.description === 'string' ? record.description.trim() : ''

  if (description.length < MIN_DESCRIPTION_LENGTH) {
    reject('Describe the asset in a few words to get started.')
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    reject(`Keep your description under ${MAX_DESCRIPTION_LENGTH} characters.`)
  }

  return { description }
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

const HEIC_EXTENSIONS = new Set(['.heic', '.heif'])
const HEIC_MIME_TYPES = new Set(['image/heic', 'image/heif'])
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024

export type ParsedVisionUpload = {
  buffer: Buffer
  mimeType: string
  filename: string
}

function fileExtension(filename: string): string {
  const lower = filename.toLowerCase()
  const dot = lower.lastIndexOf('.')
  return dot >= 0 ? lower.slice(dot) : ''
}

function isHeicUpload(file: File): boolean {
  const ext = fileExtension(file.name)
  const mime = file.type?.toLowerCase().trim() ?? ''
  return HEIC_EXTENSIONS.has(ext) || HEIC_MIME_TYPES.has(mime)
}

function isAllowedImage(file: File): boolean {
  const mime = file.type?.toLowerCase().trim() ?? ''
  if (!mime.startsWith('image/') || !ALLOWED_IMAGE_TYPES.has(mime)) return false

  const ext = fileExtension(file.name)
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) return false

  return true
}

/** Parse multipart photo uploads — max MAX_INTAKE_PHOTOS, validate types/size. */
export async function parseGriffinVisionFormData(formData: FormData): Promise<ParsedVisionUpload[]> {
  const files = [
    ...formData.getAll('photos'),
    ...formData.getAll('photo'),
    formData.get('device'),
    formData.get('label'),
  ].filter((entry): entry is File => entry instanceof File)

  if (!files.length) reject('Upload at least one device or label photo.')

  if (files.length > MAX_INTAKE_PHOTOS) {
    reject(`Upload up to ${MAX_INTAKE_PHOTOS} photos per asset. Remove extras and try again.`)
  }

  const images: ParsedVisionUpload[] = []

  for (const file of files) {
    if (file.size === 0) reject('One of the uploaded photos is empty.')
    if (file.size > MAX_PHOTO_BYTES) reject('Each photo must be 10 MB or smaller.')
    if (isHeicUpload(file)) {
      reject(
        'HEIC photos are not supported for extraction yet — convert to JPG or PNG, or take a new photo in a compatible format.',
      )
    }
    if (!isAllowedImage(file)) reject('Upload JPG, PNG, or WebP photos.')

    const mimeType = file.type.toLowerCase().trim()

    const buffer = Buffer.from(await file.arrayBuffer())
    images.push({ buffer, mimeType, filename: file.name.slice(0, 255) })
  }

  return images
}
