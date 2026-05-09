# CLAUDE.md

> Loaded automatically by Claude Code on every session. Lean by design. References `docs/01_AGENT_INSTRUCTIONS.md` for the full version.

---

## What you're working on

Petsona — a cross-platform iOS + Android app for dog and cat owners. Photo-based breed identification, OCR of vet medical cards, AI-generated weekly care plans.

**Read first, every session:**
- @docs/01_AGENT_INSTRUCTIONS.md — your full instructions
- @docs/03_ARCHITECTURE.md — stack, data model, AI gateway pattern
- @docs/04_BACKLOG.md — current release and milestone
- @docs/06_DECISIONS.md — locked architecture decisions

---

## Stack (do not change without an ADR)

- **Client:** Expo SDK 55, React Native, TypeScript strict, NativeWind, Expo Router, i18next, Zustand
- **Backend:** Supabase (Postgres + RLS + Auth + Storage + Edge Functions on Deno)
- **AI:** Claude API (Sonnet 4.6, Haiku 4.5) and Mistral OCR, called only from edge functions
- **Tooling:** pnpm, Jest with `jest-expo` preset, `@testing-library/react-native` (added at R1 for component tests), Deno test, ESLint, Prettier

---

## Three-phase workflow on every prompt

1. **Plan only.** Read prompt + referenced docs. Produce file list, public APIs, test cases, open questions, risks. Stop.
2. **Implement** (only after plan approved). Tests first, committed. Implementation that does not modify those tests. `pnpm typecheck && pnpm test && pnpm lint` green.
3. **Self-review.** Re-read your work against the checklist in `01_AGENT_INSTRUCTIONS.md`. Report with proof.

---

## Hard rules (non-negotiable)

1. No AI calls from the client. Every model call goes through a Supabase Edge Function.
2. No `service_role` key from the client.
3. Every table has RLS enabled, default-deny, scoped to `auth.uid()`.
4. Every AI call writes a row to `ai_jobs` (model, prompt version, tokens, cost, latency).
5. Every prompt has a version constant (`BREED_PROMPT_V = "2026-05-08-1"`).
6. No hardcoded user-facing strings. Every label/error/copy goes through `t('...')`.
7. No `any` types. No `// @ts-ignore` without comment.
8. No `console.log` in production code.
9. No commented-out code.
10. Async cleanup in every `useEffect` and edge function.

---

## Verification (run after every meaningful change)

```
pnpm typecheck
pnpm test
pnpm lint
```

For Expo work: `npx expo-doctor`.
For edge functions: `deno test --allow-net --allow-env --allow-read supabase/functions/`.

If any fails, fix before continuing.

---

## Repo layout

The Expo project lives at the **repo root**. There is no `/app/` wrapper directory; the `app/` you see at the root is the expo-router screens directory.

```
package.json              Expo project root
app.json
tsconfig.json
babel.config.js
metro.config.js
global.css
tailwind.config.js
i18n.ts
app/                      expo-router screens (file-based routing)
  _layout.tsx
  index.tsx
components/               shared UI components
features/                 feature folders (onboarding/, plan/, medcard/, …)
lib/
  supabase.ts             Supabase client (anon key)
  ai.ts                   Helper that calls edge functions
  logger.ts
  store.ts                Zustand
  env.ts
locales/
  en.json
  es.json
  ru.json
supabase/                 Sibling: Deno-based edge functions
  functions/
    _shared/
      ai/                 claude.ts, mistral.ts, types.ts
      logging.ts
      auth.ts
    breed-identify/
    medcard-ocr/
    plan-generate/
  migrations/
shared/                   Types shared client ↔ functions
docs/
CLAUDE.md
README.md
```

---

## When you're stuck

Try at least 3 different approaches before declaring blocked. Then report: what you tried, what you suspect, what you'd need to unblock. Do not invent workarounds that contradict the architecture.

If corrected on the same issue twice in one session: stop. Ask Anton to start a fresh session with a refined prompt.

---

## Out of scope for you

Product decisions → ask Anton. Architecture changes → ask Claude.ai via Anton. Visual design beyond what the prompt specifies → ask. Naming → Anton's call.
