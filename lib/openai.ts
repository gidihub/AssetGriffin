import OpenAI from 'openai'

/**
 * Server-only OpenAI client for "Compass AI" — the photo/label extraction
 * and natural-language asset intake feature that is currently a UI-only
 * mock (see the IntakeModal in app/app/page.tsx and the "Ask Compass"
 * buttons throughout the workspace demo).
 *
 * Scaffolding only — nothing calls this yet. To wire up real extraction:
 *   1. Add an app/api/compass/route.ts (or Server Action) that accepts an
 *      uploaded image, sends it to the Chat Completions / Responses API
 *      with COMPASS_AI_MODEL, and returns structured asset fields.
 *   2. Replace the mock `setStage('review')` flow in IntakeModal with a
 *      real upload + call to that endpoint.
 */
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set — add it to .env.local')
  }
  return new OpenAI({ apiKey })
}

// Configurable so the model can be bumped without a code change.
export const COMPASS_AI_MODEL = process.env.COMPASS_AI_MODEL ?? 'gpt-5.4-mini'
