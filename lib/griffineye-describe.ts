import { getOpenAIClient, GRIFFINEYE_AI_MODEL } from '@/lib/openai'
import {
  EXTRACTION_JSON_CONTRACT,
  normalizeExtraction,
  parseExtractionJson,
} from '@/lib/griffineye-extraction'
import {
  ASSET_CATEGORIES,
  MIN_DESCRIPTION_LENGTH,
  type GriffinEyeVisionResult,
} from '@/lib/griffineye-intake'

const SYSTEM_PROMPT = `You turn a person's plain-language description of one piece of equipment into structured asset fields for an asset management app.

${EXTRACTION_JSON_CONTRACT}

Rules:
- summary: short restatement of the item (e.g. "Dell Latitude 5440 laptop").
- Only use what the description says. Resolving a well-known product name to its maker is expected ("MacBook Pro" implies Apple, "Latitude" implies Dell), but never invent a serial number, asset tag, or model number that was not given.
- serialNumber and assetTag: fill only when the description states an identifier explicitly. Leave empty otherwise.
- category must be one of: ${ASSET_CATEGORIES.join(', ')}. Choose the closest fit; use "Other" when the item is not clearly one of these.
- assignedTo: the person or team the item is for, when named (e.g. "for Maya" gives "Maya", "the field ops team" gives "Field ops"). Leave empty if the description says it is unassigned or says nothing.
- location: the site, building, or room named (e.g. "in New York HQ" gives "New York HQ", "warehouse a" gives "Warehouse A"). Leave empty if none is given.
- conditionNotes: only damage or wear the description mentions (e.g. "cracked screen corner").
- confidence: 0-100 for how completely the description maps onto these fields.
- uncertainFields: array of field names the description does not state (e.g. "serialNumber", "assetTag").
- notes: brief user-facing message naming what is still missing (e.g. "Add the serial number if you have it"). Empty if the description covered everything important.
- The description may be a single fragment like "dell laptop for maya". Extract what you can and mark the rest uncertain rather than refusing.`

/** Turn a free-text description of one asset into reviewable draft fields. */
export async function extractAssetFromDescription(description: string): Promise<GriffinEyeVisionResult> {
  const trimmed = description.trim()
  if (trimmed.length < MIN_DESCRIPTION_LENGTH) {
    throw new Error('Describe the asset in a few more words.')
  }

  const client = getOpenAIClient()

  const response = await client.chat.completions.create({
    model: GRIFFINEYE_AI_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Extract asset fields from this description:\n\n${trimmed}` },
    ],
    max_completion_tokens: 900,
  })

  return normalizeExtraction(parseExtractionJson(response.choices[0]?.message?.content), {
    fallbackSummary: 'Description processed — review the suggested fields.',
    missingSerialNote: "GriffinEye didn't find a serial number in your description — add it if you have one.",
  })
}
