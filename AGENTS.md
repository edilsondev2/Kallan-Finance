<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

# Kallan Finance — project rules

## Structure
- Feature logic lives in `src/modules/<area>/` (queries.ts = data access via React Query + Supabase client, calculations.ts = pure deterministic rules, *.functions.ts = server functions). Route files in `src/routes/` only compose UI. Why: keeps UI, business rules and data access separate and testable.
- Shared visual primitives live in `src/components/kallan/` (Page, PageHeader, SectionTitle, Money, EmptyState, ErrorState, LoadingCards, DemoBadge, SourceBadge, ProgressBar, UserAvatar, CategoryIcon). Reuse them instead of re-styling per page. Why: one consistent design system.
- Signed-in pages live under `src/routes/_authenticated/_app/` (AppShell with bottom nav / sidebar + onboarding gate). Full-screen signed-in flows (onboarding) live directly under `_authenticated/`. Why: one guard, one shell.
- Financial values are computed only by deterministic functions (`src/modules/finance/calculations.ts`, `src/modules/business/calculations.ts`). AI receives computed metrics and only interprets them. Why: the AI must never invent numbers.
- Demo data (`src/modules/demo/`) is never persisted and never merged with real rows; any screen rendering it shows `<DemoBadge />`. Why: real and illustrative data must never mix.
- Rows from Open Finance (`source = 'open_finance'`) are written only by server code with the service role; users can only create `manual` rows (enforced by RLS + triggers). Connection status `completed` is set only after provider confirmation. Why: no fake integrations.
- Open Finance providers implement `OpenFinanceProvider` (`src/modules/open-finance/provider.ts`); screens never call a vendor API directly. Why: the vendor must be swappable.
- Uploaded images go to the private `media` bucket under `<userId>/<folder>/`; store the path and render via `useSignedImage`. Why: workspace blocks public buckets.

## Styling
- Design system v3 is documented in `DESIGN.md` (from the approved prototype). Light, dark and automatic themes; monochrome with violet only in tiny details. Use semantic tokens from `src/styles.css` (bg-background, bg-surface, bg-surface-2, text-muted-foreground, text-positive, border-border-strong, ring-brand) and the utilities (surface-card, glass, lift, press, animate-rise, tabular, skeleton). The home, shell and Kallan Intelligence chat use the `k-*` classes in `src/kallan.css`. Never hardcode colors; errors use `text-destructive`.
- Monetary values always render through `<Money />` so the global "hide values" preference applies.

## TypeScript
- tsconfig uses exactOptionalPropertyTypes / noUncheckedIndexedAccess / noPropertyAccessFromIndexSignature: optional props that may receive undefined must be typed `?: T | undefined`; guard indexed reads.

## Data loading and editing
- Private initial reads use authenticated server functions, user-scoped Query options, route cache priming and suspense subscriptions; this keeps private reads behind server auth and totals consistent.
- Financial forms validate shared discriminated schemas and use authenticated server mutations with explicit owner/source filtering; this prevents demo and imported rows from entering manual write paths.
- Financial history is paginated until exhausted before computing aggregates; this avoids silently truncated totals.
- Shared labeled inputs and selectors live in `src/components/kallan/field.tsx`; this preserves accessible, consistent forms.
- RLS must validate the ownership and scope of referenced private records on insert and update; checking only the row's user ID does not protect relationships.
- Permission regression tests execute actual migrations in in-memory PostgreSQL with test-only auth/storage stubs; this covers direct data-access bypasses without creating application accounts or persisting fixtures.

- Malvo credentials and REST stay in the server-only provider adapter; authenticated functions validate real coverage and item ownership before writes. Why: sandbox connections must never become real financial data.
