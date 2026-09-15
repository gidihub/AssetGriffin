# GriffinEye AI security notes

Internal reference for GriffinEye's defense-in-depth posture. Updated alongside the hardening pass for multi-tenant isolation, extraction fabrication, and cost control.

## Coverage map (existing vs added)

| Control | Already in place | Added / tightened |
|--------|------------------|-------------------|
| Org isolation (RLS) | Supabase RLS on `records`, `audit_log`, `groups`, etc. | Explicit `organization_id` filter on every records query via server `ToolContext` |
| Org id in tool args | Tools never exposed `organization_id` in OpenAI schemas | `sanitizeToolArguments()` strips scope keys if model injects them |
| Monthly usage caps | `reserve_griffineye_usage`, tier caps, purchased credits | Unchanged — still primary billing gate |
| Credit reservation | Reserve before LLM, release on failure | Unchanged |
| Review before save | Intake modal + API only writes on user Save | Trust banner when AI suggestions remain unedited |
| Agent loop bound | `MAX_TOOL_ROUNDS = 4` | **3 rounds**, **15 tool calls/query**, **8s tool timeout** |
| Prompt injection | Informal rules in system prompt | **Stable rules** vs **UNTRUSTED DATA** split; user question wrapped |
| Input validation | Ad-hoc string length checks | Strict parsers in `lib/griffineye-security/validate-input.ts` |
| Tool honesty envelope | Raw JSON payloads | `{ available: true, ... }` / `{ available: false, reason }` |
| Per-user rate limit | None | In-process RPM limiter (`GRIFFINEYE_RATE_LIMIT_RPM`, default 20) |
| Daily spend breaker | None | Atomic `reserve_griffineye_daily_spend` RPC (row lock + counter) |
| Vision fabrication guard | `uncertainFields`, no sparkle on guesses | `readableFields` manifest + post-process guard |
| Schema dump in chat UI | Fixed earlier | `get_schema_info` never renders as user table |
| Regression tests | Phase1 RLS, agent E2E | `scripts/verify-griffineye-security.mjs` |

## Fail-open vs fail-closed

| Mechanism | On failure / unavailable | Rationale |
|-----------|--------------------------|-----------|
| Per-user rate limiter (in-memory) | **Fail open** — request allowed | Avoid blocking paying users if the limiter throws; low blast radius vs spend |
| Daily spend breaker (DB count) | **Fail closed** — request blocked | Unbounded LLM cost is the greater risk |
| Monthly credit / tier cap | **Fail closed** (existing RPC) | Primary product entitlement |
| Supabase RLS | **Fail closed** (Postgres denies) | Data isolation |

Rate limiting is **per server instance** today — not shared across horizontal scale. See known gaps.

## Prompt injection

User questions, photo OCR text, spreadsheet cells, and record field values are passed only inside the **DYNAMIC CONTEXT — UNTRUSTED DATA** envelope. Stable policy lives above that banner and is not concatenated with raw client strings.

**Residual risk:** This is prompt-layer separation, not cryptographic isolation. A determined jailbreak may still influence model behavior; tools and RLS are the real enforcement layer.

## Org scoping (Groups / Fields / Records)

- `ToolContext.organizationId` comes from `requireUserProfile()` on every API route — never from the model.
- `assetRecordsQuery()` always applies `.eq('organization_id', ctx.organizationId)`.
- Model-supplied `organization_id` / `orgId` keys in tool args are stripped before execution.

**Residual risk:** New tools or routes must copy this pattern. Groups/Fields/Records migration is verified by phase scripts but not every code path has an automated org-injection regression in CI yet.

## Vision / text extraction

- Fields only sparkle in UI when listed in `suggestedFields` (not uncertain, not conflicted).
- Photo path requires `readableFields` from the model; post-processing strips identifiers not listed or below confidence floor.
- Save requires explicit user click — API does not auto-persist extraction output.

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `GRIFFINEYE_RATE_LIMIT_RPM` | `20` | Per-user requests/minute across GriffinEye endpoints |
| `GRIFFINEYE_DAILY_SPEND_CAP_USD` | `25` | Org-wide estimated daily spend backstop |
| `GRIFFINEYE_ESTIMATED_COST_USD` | `0.02` | Estimated USD per `ai_usage_log` action for breaker |

## Known gaps (honest)

1. **Prompt injection** — Structural untrusted-data labeling; not a sandboxed model runtime.
2. **Rate limiter** — In-process only; multi-instance deployments need Redis or edge rate limiting.
3. **Spend breaker** — Atomic reservation per allowed request; uses estimated cost, not actual OpenAI invoice data. Apply migration `20260914260000_griffineye_daily_spend_reservation.sql`.
4. **Vision guard** — Depends on model honestly listing `readableFields`; post-process catches common gaps, not all hallucinations.
5. **Tool argument sanitization** — Allowlist for filters; new tool parameters need explicit allowlisting.
6. **E2E injection test** — Verify script covers filter stripping and RLS; full live prompt-injection E2E against OpenAI is manual.
7. **Groups/Fields/Records** — Org scoping verified in phase1/phase2 scripts; action_types and onboarding RPCs should be reviewed when those surfaces ship to production.

## Audit trail

Quota checks log to `audit_log` (`category: ai`, `action: GriffinEye quota check`) with endpoint, allow/deny, and spend estimates. GriffinEye queries and extractions continue to log under existing AI actions.
