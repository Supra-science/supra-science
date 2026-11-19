# Admin additions — Nov-8 2026 live build reconstruction: findings

Source: `/tmp/live-worker.js` (8 MB minified Cloudflare Workers bundle, live
deployment 2026-11-08 17:36 UTC), compared against the Nov-5 base at
`/tmp/z2/supra-science-platform-integration/`. Every file below was
reconstructed from an extracted bundle chunk; chunk paths and module ids are
given so any claim can be re-checked with
`python3 /tmp/extract.py <chunk-path-substring> <output-file>`.
Raw extracted chunks are kept in `/tmp/recon-admin/_raw/` (not part of the
reconstruction itself).

## Verified: all five "new" pages and all nine "new" APIs exist live

All five pages and all nine API routes named in the task were found in the
bundle. In addition, **every pre-existing admin page was rewritten** in Nov-8
to a new shared pattern (see "Shared pattern" below), and the admin layout
and dashboard were rewritten too — so the reconstruction covers the whole
live admin surface, not just the five new pages.

## Shared pattern (new in Nov-8)

Every admin page now follows the same shape:

1. `await requireAdminPage()` — redirect guard (module 44119, see
   `src/lib/admin-page.ts`): no session → redirect `/login`; signed in but
   not admin → redirect `/dashboard`.
2. `const lang = await getLang()` — cookie `ss-lang`, `"en"` only when the
   cookie is exactly `"en"`, otherwise Arabic (module 53410,
   `src/lib/lang-server.ts`).
3. `const supabase = getServiceSupabase()` — nullable service-role client
   (module 44119). When it is `null` (service key not configured) the page
   renders the heading plus the `dbNotConfigured` notice and no data — never
   demo data.
4. Explicit `.select(...)` column lists (Nov-5 used `select("*")`), a
   `limit(100)` (200 for users/profiles, 500 for user_roles), bilingual
   headings via `t(key, lang)`, dates via `formatDate` (short date, Arabic
   locale `ar-u-nu-latn`), status pills via `StatusBadge`, and status
   changes via the client `StatusChanger` / `AdminActionButton`
   (`src/components/admin-actions.tsx`).
5. `export const dynamic = "force-dynamic"` on every page and route.

Detail views are driven by `?id=…` (`searchParams`), not by separate routes:
drafts, projects, quotations, customers, whatsapp. When the id is not
found the page shows a "← Back to list" link plus the `noData` notice.

## Admin authorization (two mechanisms, both verified)

- **Pages** — redirect guard above. Admin = allowlisted email
  `Supra-science@proton.me` OR `user_roles.role === "admin"` for the
  signed-in user. The allowlist literal appears in two bundle modules
  (44119 and 67417).
- **APIs** — `requireAdmin()` (module 67417, `src/lib/admin-auth.ts`):
  no session → `401 { error: "Unauthorized" }`; signed in but not admin →
  `403 { error: "Forbidden" }`. Same allowlist + `user_roles` check.
- All data reads/writes in pages and APIs go through the **service-role**
  client (`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`), i.e. they bypass
  RLS. The live bundle hard-codes the project URL as the fallback when
  `SUPABASE_URL` is unset (`https://ityzbuncztwgtxudcobr.supabase.co` —
  a public project URL, not a secret); the key itself only ever comes from
  the env var.

## Audit logging (new in Nov-8)

`logAudit(supabase, actorId, action, entityType, entityId, details)`
(module 67417, export `C`) inserts into `audit_logs`
(`actor_id, action, entity_type, entity_id, details`) and **swallows all
errors**, so logging can never break the admin action. It is called by
every new PATCH route and by the generic handler, with actions
`update:<table>` — but **not** by the pre-existing invoices, payments,
services or whatsapp/send routes. The audit-logs page reads the table
(newest first, 100 rows) and resolves `actor_id` to `profiles.full_name`.

## New admin pages

| Page | Bundle chunk | Tables / columns | Behaviour |
|---|---|---|---|
| `admin/audit-logs/page.tsx` | `src_app_admin_audit-logs_page_tsx_1r94anfmv9mi0._.js` (module 95932) | `audit_logs`: id, actor_id, action, entity_type, entity_id, details, created_at; `profiles`: id, full_name | Read-only, newest first, limit 100. Actor shown as profile name or truncated id (8 chars); entity id truncated to 8 chars + "…"; details JSON truncated to 500 chars. |
| `admin/bookings/page.tsx` | `src_app_admin_bookings_page_tsx_0vwc5mekwy7h7._.js` (module 85913) | `consultation_bookings`: id, name, email, phone, topic, service_slug, scheduled_at, calendar_event_id, meet_link, status, email_sent, created_at | Ordered by `scheduled_at` ascending, limit 100. Scheduled time formatted with `Intl.DateTimeFormat` (`Asia/Aden`, weekday short, 2-digit hour/minute, hour12 false) + " (Aden)". Google Meet link, email-confirmation ✓/—, StatusChanger `booked / cancelled / completed`. |
| `admin/drafts/page.tsx` | `src_app_admin_drafts_page_tsx_1l80w7uj9689j._.js` (module 42992) | `architecture_drafts`: list id, user_id, title, status, project_id, created_at, `profiles(full_name)`; detail `*` + `profiles(full_name)` | List newest first, 100. Detail renders `brief` and `draft` JSON recursively (string → pre-wrap paragraph; number/boolean → text; array → list; object → labelled sections). StatusChanger `draft / reviewed / converted`; link to the project when `project_id` is set. |
| `admin/users/page.tsx` | `src_app_admin_users_page_tsx_085751vbr95_b._.js` (module 45545) | `profiles`: id, full_name, created_at (200, newest first); `user_roles`: user_id, role (500) | Role defaults to `customer` when no row exists. Own row marked "(you)" / "(أنت)" and has no buttons; every other row offers one button per other role (`Change role: <role>`) PATCHing `/api/admin/users`. |
| `admin/whatsapp/page.tsx` | `src_app_admin_whatsapp_page_tsx_1o354l2n6l6wo._.js` (module 16457) | `whatsapp_conversations`: list id, phone_e164, service_key, status, created_at, updated_at, `customers(full_name)`; detail `*` + `customers(full_name, email)`; `whatsapp_messages`: list conversation_id, body, direction, created_at; detail id, direction, message_type, body, template_name, status, created_at | List by `updated_at` desc, 100, with newest-message preview per conversation (one query, newest-first, 200 rows, first row per conversation wins). Detail: messages oldest-first, 200, bodies truncated to 1000 chars; StatusChanger `open / pending / closed`. |

## Rewritten pre-existing admin pages (Nov-8 pattern + new capabilities)

| Page | Bundle chunk | What changed vs Nov-5 |
|---|---|---|
| `admin/consultations/page.tsx` | `..._consultations_page_tsx_0gjtiawiu1_2t._.js` (12833) | Explicit columns + `customers(full_name, email)`, `projects(title)` joins; StatusChanger `pending / scheduled / completed / cancelled`. |
| `admin/customers/page.tsx` | `..._customers_page_tsx_1lm4x4xiglmpy._.js` (68270) | New detail view: customer header + projects / quotations / invoices / consultations sections, all cross-linked. |
| `admin/messages/page.tsx` | `..._messages_page_tsx_0rt_i0vic61d5._.js` (99059) | Explicit columns incl. phone / preferred_contact / email_sent; emailed/not-emailed marker; StatusChanger `new / read / replied / archived`. |
| `admin/notifications/page.tsx` | `..._notifications_page_tsx_11kbqmg64g_te._.js` (97421) | Explicit columns + `customers(full_name)`; Read/Unread pill; "Mark read" button on unread rows only. |
| `admin/payments/page.tsx` | `..._payments_page_tsx_0sdv82-5pl6yf._.js` (59358) | Explicit columns + `customers(full_name, email)`, `invoices(number)`; "Collected" total (sum of `succeeded` payments); `received_at` falls back to `created_at`. |
| `admin/projects/page.tsx` | `..._projects_page_tsx_1u46birrf6vd5._.js` (93722) | New detail view: header (domain/budget/timeline/description, StatusChanger over the 9-stage pipeline) + quotations / invoices / consultations sections. |
| `admin/quotations/page.tsx` | `..._quotations_page_tsx_1vnt-e6c_1p04._.js` (27873) | New detail view: amount as heading, customer/project links, valid-until, notes, StatusChanger `draft / sent / approved / rejected / expired`, payments for the quotation. |
| `admin/services/page.tsx` | module 65398 in `[root-of-the-server]__1g5svx0c8vj3n._.js` | Server part rewritten to the new pattern (`services` `select("*")` ordered by `sort_order`); editing UI still the Nov-5 `ServiceList` (`service-editor.tsx`). |
| `admin/invoices/page.tsx` | module 72154 in `[root-of-the-server]__1kqe3xbywdxp8._.js` | Server part rewritten; loads invoices + customers, enriches each invoice with `paid_cents` / `balance_cents` from succeeded payments; UI still the Nov-5 `InvoiceManager` (`invoice-manager.tsx`). |
| `admin/integrations/page.tsx` | `..._integrations_page_tsx_00ixf9bnsouol._.js` (27534) | Status computed server-side from env presence only (Supabase always Connected with project hostname; WhatsApp needs token + phone-number id; OpenAI needs key). Secrets never displayed. |
| `admin/layout.tsx` | `src_app_admin_layout_tsx_19cm4_uiv_jvz._.js` (36102) | Nov-5 was a pass-through; live adds brand bar, language toggle (`/api/lang?to=…&next=/admin`), "Back to site", sign-out server action, and a 16-item nav (all sections incl. the five new pages). Still `robots: { index: false, follow: false }`, RTL when Arabic. |
| `admin/page.tsx` (dashboard) | `src_app_admin_page_tsx_2179ca_6szw48._.js` (25657) | Seven stat cards (exact-count queries: customers, projects, pending consultations, quotations `sent`, messages `new`, WhatsApp `open`, collected succeeded payments), five most recent projects, DB-error banner, integration-status strip (env presence only). |

## New admin APIs (all PATCH, all `force-dynamic`)

Common shape: `requireAdmin()` first; body parsed with `.json().catch(() => ({}))`;
`400` for missing id / invalid status, `503` with the error message sliced
to 160 chars on failure, `{ ok: true, row }` on success, audit row written
before the response.

| Route | Bundle chunk / module | Table / statuses | Notes |
|---|---|---|---|
| `api/admin/bookings/route.ts` | `_1ze8aesdtms43._.js` / 16186 | `consultation_bookings`; `booked / cancelled / completed` | Custom handler (not the generic one): fetches the booking first (`404 "booking not found"`); on `cancelled` with a `calendar_event_id` it deletes the Google Calendar event first — if that fails, `503 "Could not cancel the calendar event. Please try again."` and the booking is untouched. Audit `update:consultation_bookings`, entity `booking`. |
| `api/admin/consultations/route.ts` | `_11-ls5uhexbk2._.js` / 80087 | `consultations`; `pending / scheduled / completed / cancelled`; extra field `scheduled_at` | Generic handler. Audit `update:consultations`, entity `consultation`. |
| `api/admin/drafts/route.ts` | `_1el3upt6b28ym._.js` / 75707 | `architecture_drafts`; `draft / reviewed / converted`; extra field `project_id` | Generic handler. Audit `update:architecture_drafts`, entity `architecture_draft`. |
| `api/admin/messages/route.ts` | `_0rtz2o7bivfc_._.js` / 14541 | `contact_messages`; `new / read / replied / archived` | Generic handler. Audit `update:contact_messages`, entity `contact_message`. |
| `api/admin/notifications/route.ts` | `_0unhy_vsxd8pl._.js` / 93107 | `notifications`; sets `is_read` = (`body.is_read === true`) | Custom handler, no status. Audit `update:notifications`, entity `notification`, details `{ is_read }`. |
| `api/admin/projects/route.ts` | `_1barcqx5cyvj9._.js` / 51867 | `projects`; 9 stages: `new_inquiry, consultation, requirements, quotation, awaiting_payment, in_progress, review, completed, cancelled` | Generic handler. Audit `update:projects`, entity `project`. |
| `api/admin/quotations/route.ts` | `_1ygd-jfcc1uu5._.js` / 92756 | `quotations`; `draft / sent / approved / rejected / expired` | Generic handler. Audit `update:quotations`, entity `quotation`. |
| `api/admin/users/route.ts` | `_1e8w9uuebtrcb._.js` / 9814 | `user_roles`; roles `admin / staff / customer` | Custom handler: `400` missing `user_id` / invalid role; `403 "You cannot change your own role"` for self; `403 "Cannot remove the last administrator"` when demoting the only admin (exact head-count query). Upsert on `user_id`. Audit `update:user_roles`, entity `user_role`, details `{ from, to }`. |
| `api/admin/whatsapp/route.ts` | `_1ckivlq7ld-jd._.js` / 51198 | `whatsapp_conversations`; `open / pending / closed` | Generic handler. Audit `update:whatsapp_conversations`, entity `whatsapp_conversation`. |

The six generic routes delegate to one shared helper (module 12328 in
`[root-of-the-server]__0-fc7x95fne0k._.js`, reconstructed as
`src/lib/admin-update.ts`): it validates `id`, validates the status against
`allowedStatuses`, copies any `extraFields` present in the body verbatim,
returns `400 "nothing to update"` when the patch would be empty, updates
with `.eq(idField ?? "id", id).select().single()`, then logs the audit row.

## Pre-existing admin APIs — live state

| Route | Live module | Verdict |
|---|---|---|
| `api/admin/invoices/route.ts` (GET/POST/PATCH) | 75450 in `_0em2z7ylw0z26._.js` | **Unchanged from Nov-5** (behaviour identical, incl. `INV-YYYY-NNNN` numbering, paid/balance derivation, and the refusal to set `paid`/`partially_paid` manually). No audit row. |
| `api/admin/payments/route.ts` (POST) | 95364 in `_17zhx_3g-k6lc._.js` | **Changed**: methods are now only `bank_transfer / cash / other` — Nov-5 also accepted `stripe_test`. Everything else unchanged (invoice lookup, cancelled guard, `succeeded` insert, invoice status recomputed from real totals). No audit row. |
| `api/admin/services/route.ts` (GET/POST/PATCH/DELETE) | 76369 in `_0tufgbovncig3._.js` | **Unchanged from Nov-5** (allowlisted fields, slugify, title_en/title_ar required on create). No audit row. |
| `api/admin/whatsapp/send/route.ts` (POST) | 82144 in `_1l6nvx39juxzz._.js` | **Behaviour unchanged** (dry-run by default, phone 8–15 digits, body 1–4000 chars, Graph API v21.0, 400 for validation/config errors, 500 otherwise). The send logic is inlined in the route module in the bundle; see gap below. |
| `api/admin/payments/create-link/route.ts` | — (absent) | **Removed in Nov-8**: zero occurrences of `create-link` in the bundle. Consistent with the Stripe removal. |

## New shared code

| File | Bundle evidence | Notes |
|---|---|---|
| `src/components/admin-actions.tsx` | module 86031 in `_0k4nqlv1dru4p._.js`; client references `AdminActionButton`, `StatusChanger` for `[project]/src/components/admin-actions.tsx` | Exact recovery, including the filename. `AdminActionButton` PATCHes an arbitrary payload (optional `window.confirm`); `StatusChanger` is a select + Apply button PATCHing `{ id, status }`. Both `router.refresh()` on success and show the error inline (sliced to 120 chars). |
| `src/components/status-badge.tsx` | module 17333 in `[root-of-the-server]__1t2p_2dwwe4f8._.js` | Renders `<span style={statusStyle(status)}>{statusLabel(status, lang)}</span>`. Filename not recoverable (see gaps). |
| `src/lib/admin-auth.ts` (updated) | module 67417 in `_0ysn1wsdelszn._.js` | Nov-5 `requireAdmin` + `serviceSupabase` plus the new `logAudit`. Live `serviceSupabase` falls back to the literal project URL instead of `NEXT_PUBLIC_SUPABASE_URL` (reproduced exactly). |
| `src/lib/admin-page.ts` (new) | module 44119 in `_1w91lpz-x_y1x._.js` | Page guard (`redirect` version) + nullable service client. Filename not recoverable (see gaps). |
| `src/lib/admin-styles.ts` (new) | module 56805 in `_1w91lpz-x_y1x._.js` | Exact style values: page `#0a0a0a`/`#fff`/32px, card `#1a1a1a`, heading 32px, gold `#d4af37`, muted `#888`; `formatMoney` (cents → `3,500.00 USD`); `statusStyle` green/amber/red sets (see source). Filename not recoverable (see gaps). |
| `src/lib/admin-update.ts` (new) | module 12328 in `[root-of-the-server]__0-fc7x95fne0k._.js` | Generic PATCH handler (above). Filename not recoverable (see gaps). |
| `src/lib/i18n.ts` + `src/lib/lang-server.ts` (new) | modules 5685 + 53410 in `src_lib_lang-server_ts_0ig9pzmnz7zez._.js` | `t(key, lang)`, `formatDate`, `roleLabel`, `statusLabel` (Arabic status dictionary: 19 entries, reproduced verbatim; English Title-Cases the raw status), `getLang` (cookie `ss-lang`, default Arabic). Only admin-used keys reconstructed (see gaps). |
| `src/lib/calendar.ts` (referenced, not reconstructed) | `src_lib_calendar_ts_0cdn022r46i-q._.js` | Only the cancel function used by the bookings route is described (DELETE Google Calendar event, `sendUpdates=all`, 404 treated as success, never throws). Full calendar lib belongs to the bookings reconstruction, not this admin part. |

## Gaps / uncertainties

1. **Original filenames for four shared modules are not recoverable.**
   Modules 44119 (page guard), 56805 (styles), 12328 (generic PATCH
   handler) and 17333 (status badge) live in Turbopack chunks that carry no
   `[project]/src/...` label, so their source filenames cannot be read from
   the bundle. The reconstruction uses `src/lib/admin-page.ts`,
   `src/lib/admin-styles.ts`, `src/lib/admin-update.ts` and
   `src/components/status-badge.tsx` as best-guess names; every such file
   carries a `TODO(RECONSTRUCTION-GAP)` comment. Exports and behaviour are
   exact; only the filenames (and the internal function names, which were
   minified to single letters) are guesses.
2. **i18n dictionary is partial.** The live dictionary (module 5685) is
   site-wide — public pages, client workspace, auth, etc. Only the keys
   actually used by admin pages/layout/dashboard, plus the status and role
   labels, were extracted verbatim. The remaining site-wide keys are out of
   scope for this admin part.
3. **Calendar helper export name.** The bookings route calls minified
   export `s` of `src_lib_calendar_ts`; reconstructed as
   `cancelCalendarEvent` from `@/lib/calendar`. The name is a guess; the
   DELETE-event behaviour (incl. 404 = success, never throws) is exact.
4. **whatsapp/send import shape.** Nov-5 imported `sendWhatsAppText` from
   `src/lib/whatsapp.ts`; the live bundle inlines the implementation in the
   route module. Whether the Nov-8 source still imports the lib (bundler
   inlining) or moved the code into the route cannot be told from the
   bundle. Behaviour is exact either way.
5. **ServiceList / InvoiceManager not reconstructed.** The services and
   invoices pages render the Nov-5 client components
   (`service-editor.tsx`, `invoice-manager.tsx`) unchanged; those files are
   in the Nov-5 base and are imported as-is, with a TODO note in each page.
6. **No verification beyond the bundle.** Nothing was deployed, pushed or
   run against live systems (read-only task). The reconstructions have not
   been type-checked or executed; they are clean rewrites of minified code,
   so a `tsc` pass against the real project is still needed before use.
7. **No secrets in this reconstruction.** Only env var names are
   referenced (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
   `WHATSAPP_VERIFY_TOKEN`, `OPENAI_API_KEY`). The literal Supabase project
   URL in `admin-auth.ts` / `admin-page.ts` / integrations is the public
   project URL as found in the bundle, not a credential.
