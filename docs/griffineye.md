# GriffinEye

GriffinEye is the AI layer inside AssetGriffin. It reads the signed-in user's own
records through Supabase RLS — every query is scoped to their organization, and
no OpenAI key or service-role credential is ever exposed to the browser.

## What it does

**Org-wide question answering.** `POST /api/griffineye-query` runs a
function-calling loop (`lib/griffineye-agent/agent.ts`). The model picks from
tools in `lib/griffineye-agent/definitions.ts`, each backed by a real query in
`lib/griffineye-agent/tools.ts`: counting, searching, ranking, recency, data
gaps, schema introspection, and change history. Answers come with the result
table, so the assistant summarizes rather than re-listing rows. The panel
(`components/griffineye/griffineye-assistant.tsx`) is reachable from anywhere.

**Record creation from a photo or a sentence.** The intake modal offers two
routes to the same review screen. Photos go to `POST /api/griffin-vision` using
the vision model; a plain-language description goes to
`POST /api/griffineye-describe` using the text model. Both normalize through
`lib/griffineye-extraction.ts`, so the two paths cannot drift apart in shape or
in how a suggestion is distinguished from a guess. Nothing is written until the
user confirms the draft.

**Report generation.** When asked for a file, the model runs a query and then
calls `generate_report`, which packages the rows that query returned into a CSV
or a branded PDF (`lib/griffineye-agent/reports.ts`). Files are returned inline
as base64 and saved by the browser, so nothing is stored server-side. An
unfiltered "export everything" request is pointed at the Assets page Export
button instead.

**Proactive observations.** `GET /api/griffineye-insights` computes dashboard
observations and the data-health breakdown from live data without an LLM call, so
the dashboard never spends the org's AI allowance.

## Usage and cost

Every action that calls OpenAI — photo scans, questions, and text extraction —
bills against one monthly allowance per organization, sized by subscription tier
(`lib/griffin-scan-allowances.ts`, enforced in `lib/griffin-vision-usage.ts`).
Usage is reserved before the model call and released if the call fails, so a
failed action never costs an allowance slot. Free tier hard-blocks at 50 scans/month.
Paid tiers continue at $0.02/scan overage (queued on the next Stripe invoice) up
to a tier abuse ceiling.

## Audit trail

`public.audit_log` splits activity into four sub-logs surfaced as tabs on the
Audit log page:

| Category | Written by |
| --- | --- |
| `ai` | `griffineye-query`, `griffineye-describe` |
| `record` | `POST /api/assets` |
| `import` | `POST /api/assets/import` |
| `user` | Sign-in, sign-up, and sign-out in `app/login/actions.ts` |

Each row records how the change was made (`source`), which is what lets "what
changed via import last week?" be answered. AI events also store the tool
arguments the model chose — without them, a "found nothing" answer can't be told
apart from an over-narrow filter after the fact.

Log writes never throw. A failed audit insert is reported to the server console
rather than failing the user's action.

## Verification

Each capability has a script under `scripts/` that exercises the real HTTP
routes as a signed-in user; see `supabase/README.md` for how to run them. They
consume GriffinEye scans from the monthly allowance.

## Deferred — not built, tracked here as backlog

These were scoped out deliberately, not overlooked:

- **Conversational form and automation building** — creating or managing
  workflows by describing them to the assistant.
- **Persistent cross-session memory** — the assistant currently treats each
  question independently and keeps no memory between sessions.
- **Knowledge-base and live-web lookup** — answers are limited to the
  organization's own records, audit log, and schema.

One smaller follow-up:

- **User activity coverage is partial.** Auth events are logged, but profile and
  settings changes are not, because those settings pages are still mock UI with
  no write path.
## Report formatting

The on-screen table and the PDF share one formatter (`lib/griffineye-format.ts`),
so a saved report reads exactly like the answer it came from: money as `$2,980`
and right-aligned, dates as `Mar 15, 2024`, blanks as an em dash.

CSV deliberately does not use it. That file keeps raw numbers and ISO dates so it
stays summable and sortable in a spreadsheet — `$1,250,000` would arrive as text.
