# Supabase migrations

## Auth setup (required for signup)

In the Supabase Dashboard → **Authentication**:

1. **URL configuration** — Site URL: `http://localhost:3000` (dev). Add redirect URLs:
   - `http://localhost:3000/auth/confirm`
   - your production `/auth/confirm` URL
2. **Email confirmations** — If **Confirm email** is enabled (default), new users must click the link in their email before signing in. For local dev, **disable Confirm email** under Providers → Email so signup skips email entirely and logs you in immediately.
3. **Email rate limits** — Supabase limits how many auth emails can be sent per hour. If signup shows “email rate limit exceeded”, wait ~1 hour or disable Confirm email (above). To create a user immediately without email: `node --env-file=.env.local scripts/create-dev-user.mjs you@gmail.com` (password is prompted; set `DEV_USER_PASSWORD` for non-interactive runs)
4. **Email template** (if confirmations are on) — Confirm signup link should point to your app, e.g. `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`

Apply migrations to your linked Supabase project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste the SQL from `supabase/migrations/` into the Supabase SQL editor.

On signup, a database trigger creates:

1. A new `organizations` row
2. A `profiles` row linking the auth user to that organization

All `assets` reads/writes are scoped by RLS to the authenticated user's organization.

`20260913100000_griffin_vision_usage.sql` adds:

- `organizations.subscription_tier` (`free`, `growth`, `scale`, `enterprise`)
- `ai_usage_log` for GriffinEye photo-extraction calls (monthly caps enforced in `/api/griffin-vision`)

`20260913120000_griffin_vision_credits.sql` adds:

- `organizations.griffin_vision_credits_balance` and `stripe_customer_id`
- `ai_credit_transactions` for purchases and consumption
- RPCs `grant_griffin_vision_credits` (webhook) and `record_griffin_vision_usage` (API)

`20260913130000_griffin_vision_usage_reservation.sql` adds atomic `reserve_griffin_vision_usage` and `release_griffin_vision_usage` for cap-safe photo extraction.

`20260914180000_groups_fields_records_phase1.sql` introduces the Groups → Fields → Records model:

- `groups`, `fields`, `records` tables with org-scoped RLS (same `current_user_organization_id()` pattern as assets)
- Field types: `text`, `number`, `date`, `select`, `status`, `checkbox`, `relation`, `json` (`json` reserved for structured sub-objects like `lifecycle_dates` and `it_details` only)
- Migrates every legacy `assets` row into `records` with `record.id = asset.id` and matching `records.data` keys
- Freezes `public.assets` (revokes INSERT/UPDATE/DELETE; drops the updated_at trigger) — read-only archive until a follow-up migration drops it after verification
- New signups seed a default **Assets** group with 15 field definitions via `seed_default_assets_group()`

**Deferred (future scope, not v1):** bidirectional/backlink fields, field-level formulas/rollups, cross-group polymorphic relations, real-time sync views.

Requires `20260913160000_griffineye_agent_foundation.sql` first (`assets.purchase_value` column).

`20260914200000_seed_default_workspace_groups.sql` seeds the remaining workspace groups (People, Locations, Maintenance, Audits, Inspections, Reports) with field definitions and updates signup to call `seed_default_workspace_groups()`.

`20260914210000_phase1_security_hardening.sql` revokes authenticated execute on seed SECURITY DEFINER functions and tightens `records` insert/update RLS to require `group_id` belong to the caller's org. Apply this if Phase 1 was run before these fixes were merged.

After applying Phase 1, verify migration parity:

```bash
node --env-file=.env.local scripts/verify-groups-fields-records-phase1.mjs
```

`20260913160000_griffineye_agent_foundation.sql` backs the GriffinEye assistant:

- `assets.purchase_value` (numeric) alongside the display-only `depreciation_value`, so rankings and rollups can sum money
- One shared monthly AI allowance: `ai_usage_log.usage_type` now also accepts `griffineye_query` and `griffineye_text_extract`, and `reserve_griffineye_usage(org, usage_type)` replaces the photo-only reservation RPC (the old name still works and delegates to it)
- `audit_log` — append-only activity timeline, categorized into `record`, `user`, `import`, and `ai` sub-logs, with a `source` column so "changed via import" and "changed manually" are distinguishable
- `griffineye_schema_info()` for real schema introspection (column metadata only, never row data)

After applying it, seed live data and verify:

```bash
node --env-file=.env.local scripts/seed-demo-assets.mjs
node --env-file=.env.local scripts/verify-griffineye-phase1.mjs
```

The seed script writes the demo asset directory (plus matching audit history) into your organization, so the workspace runs on real Supabase rows instead of the mock arrays in `lib/workspace-data.ts`. Pass `--reset` to replace existing rows.

`verify-griffineye-phase1.mjs` checks the data layer directly (RLS scoping, tool queries, usage RPCs). To exercise the whole assistant instead — OpenAI function calling, live queries, metering, and audit logging over real HTTP — start the app and run:

```bash
node --env-file=.env.local scripts/verify-griffineye-agent.mjs <email> <password> [baseUrl]
```

It signs in as that user, asks one question per tool, and prints each answer with the tool arguments the model chose, so a wrong tool call is visible rather than hidden behind plausible prose. Note that it consumes one AI credit per question.

`verify-griffineye-describe.mjs` does the same for text intake ("Describe it"), checking extraction quality, input validation, metering, AI audit logging, and that a reviewed draft saves. It takes the same arguments and deletes the asset it creates so it can be re-run safely:

```bash
node --env-file=.env.local scripts/verify-griffineye-describe.mjs <email> <password> [baseUrl]
```

`verify-griffineye-audit.mjs` performs one action per sub-log (an assistant question, a text extraction, a record creation, and a spreadsheet import) and confirms each lands in the right category, that the category filter doesn't leak across sub-logs, and that no other organization's events are ever returned:

```bash
node --env-file=.env.local scripts/verify-griffineye-audit.mjs <email> <password> [baseUrl]
```

`verify-griffineye-reports.mjs` asks the assistant for a CSV and a PDF export, then validates the returned files by parsing them — the CSV line and column counts must match the claimed shape, and the PDF must load with page and title metadata intact, so a confident answer carrying a corrupt attachment fails rather than passes. It also checks that an unfiltered "export everything" request points at the Assets page Export button instead of generating a file. Both files are written to the temp directory so they can be opened by hand:

```bash
node --env-file=.env.local scripts/verify-griffineye-reports.mjs <email> <password> [baseUrl]
```

`preview-report-format.mjs` renders a sample CSV and PDF from fixed rows, with no
login, network call or AI credit spent. Use it when changing report layout or cell
formatting:

```bash
npx tsx scripts/preview-report-format.mjs   # writes /tmp/report-preview.{csv,pdf}
```
