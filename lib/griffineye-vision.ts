import { getOpenAIClient, GRIFFINEYE_VISION_MODEL } from '@/lib/openai'
import {
  EXTRACTION_JSON_CONTRACT,
  normalizeExtraction,
  parseExtractionJson,
} from '@/lib/griffineye-extraction'
import { ASSET_CATEGORIES, type GriffinEyeVisionResult } from '@/lib/griffineye-intake'
import { applyVisionFabricationGuard } from '@/lib/griffineye-security/vision-guard'

export type VisionImageInput = {
  buffer: Buffer
  mimeType: string
  filename: string
}

const SYSTEM_PROMPT = `You extract asset/device information from photos for an asset management app.

${EXTRACTION_JSON_CONTRACT}

Rules:
- You may receive up to 4 photos of the SAME physical device from different angles (full device, label close-up, barcode/QR sticker, rating plate, etc.). Combine all visible information into ONE single asset record — never treat each photo as a separate asset.
- When the same field is legible in one photo but missing in another, use the clear reading.
- When two photos show different values for the same field (e.g. two serial strings), leave that field empty, add it to uncertainFields, and record the disagreement in fieldConflicts with every distinct reading you saw.
- summary: short description of what you see (e.g. "Looks like a Dell Latitude laptop").
- Extract at minimum when visible: manufacturer (make), model, sku (product/SKU/model identifier from labels), serialNumber, manufactureDate (manufacturing or DOM date if printed), and safetyNotes (hazard or safety label text worth keeping, e.g. coin-cell battery warnings).
- Only fill fields you can read clearly. Use empty strings when unsure — never guess serial numbers, SKUs, or asset tags.
- category must be one of: ${ASSET_CATEGORIES.join(', ')}
- assignedTo and location: leave empty unless a label in the photo states them outright. Never infer ownership or location from context alone.
- conditionNotes: visible damage, wear, missing parts, or cosmetic issues only if clearly visible.
- safetyNotes: verbatim or faithful paraphrase of warning/safety label text when present; empty otherwise.
- confidence: 0-100 for overall extraction quality across all photos.
- uncertainFields: field names you could not read confidently from any photo.
- fieldConflicts: only when photos disagree on the same field; include every distinct value seen.
- readableFields: array of field names you could actually read from the photo pixels (not inferred from device appearance alone). Do not list serialNumber or sku unless the characters are visible.
- Never infer likely serial numbers, SKUs, or models from general knowledge of similar devices — only transcribe visible text.
- notes: brief user-facing message if key fields are missing or conflicted. Empty if everything important was read clearly.`

export async function extractAssetFromPhotos(images: VisionImageInput[]): Promise<GriffinEyeVisionResult> {
  if (!images.length) {
    throw new Error('At least one photo is required.')
  }

  const client = getOpenAIClient()

  const imageParts = images.map((image) => ({
    type: 'image_url' as const,
    image_url: {
      url: `data:${image.mimeType};base64,${image.buffer.toString('base64')}`,
      detail: 'high' as const,
    },
  }))

  const response = await client.chat.completions.create({
    model: GRIFFINEYE_VISION_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `These ${images.length} photo(s) show the same single device from different angles. Merge all readable details into one record. Filenames: ${images.map((i) => i.filename).join(', ')}`,
          },
          ...imageParts,
        ],
      },
    ],
    max_completion_tokens: 1200,
  })

  const parsed = parseExtractionJson(response.choices[0]?.message?.content)
  const normalized = normalizeExtraction(parsed, {
    fallbackSummary: 'Device photos processed — review the suggested fields.',
    missingSerialNote: "GriffinEye couldn't read the serial clearly — please confirm.",
  })
  return applyVisionFabricationGuard(normalized, parsed)
}
