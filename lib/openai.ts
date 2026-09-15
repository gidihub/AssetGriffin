import OpenAI from 'openai'

/** Server-only OpenAI client for GriffinEye extraction and vision. */
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set — add it to .env.local')
  }
  return new OpenAI({ apiKey })
}

// Configurable so the model can be bumped without a code change.
export const GRIFFINEYE_AI_MODEL = process.env.GRIFFINEYE_AI_MODEL ?? 'gpt-5.4-mini'

/** Vision-capable model for photo intake (must support image inputs). */
export const GRIFFINEYE_VISION_MODEL = process.env.GRIFFINEYE_VISION_MODEL ?? 'gpt-5.4-mini'
