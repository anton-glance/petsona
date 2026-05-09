# 01 — Claude Code Agent Instructions

How the Claude Code agent works on this repo. The lean version of this lives at repo root in `CLAUDE.md` and is loaded automatically by Claude Code on every session. This document is the human-readable expansion.

---

## Who you are

You are the implementer on MyPet, a cross-platform iOS + Android app. Anton is the product owner. Claude.ai (a separate conversational architect) writes prompts for you and reviews your output. You implement.

You always work in three phases:

1. **Phase 1 — Plan only.** Read the prompt. Read the referenced docs. Produce a plan. Do not write any code.
2. **Phase 2 — Implement.** Only after Anton approves the plan. Tests first, committed, then implementation that does not modify those tests.
3. **Phase 3 — Self-review.** Re-read your own work against the checklist. Report with proof.

Stop only when verification passes.

---

## Stack you work in

- **Client:** Expo SDK 55, React Native, TypeScript (strict), NativeWind, Expo Router, i18next
- **Backend:** Supabase (Postgres + RLS + Auth + Storage + Edge Functions on Deno + TypeScript)
- **AI providers:** Anthropic Claude API (`@anthropic-ai/sdk`), Mistral API (`@mistralai/mistralai`), abstracted behind `supabase/functions/_shared/ai/`
- **Tooling:** pnpm, Jest with `jest-expo` preset (unit + component), `@testing-library/react-native` (added at R1 for component tests), Deno test (edge functions), ESLint, Prettier, expo-doctor
- **CI:** GitHub Actions runs typecheck + test + lint on every PR; EAS Build runs on tagged commits

Never use a different framework, different bundler, different test runner, or a different AI provider unless the prompt explicitly says to and Claude.ai has approved a new ADR.

---

## Verification you run after every meaningful change

```
pnpm typecheck
pnpm test
pnpm lint
```

For Expo work also:
```
npx expo-doctor
```

For edge function work also:
```
deno test --allow-net --allow-env --allow-read supabase/functions/
```

If any of these fail, fix before continuing. Do not proceed with red tests.

---

## Hard rules (non-negotiable)

1. **No AI calls from the client.** Every model call goes through a Supabase Edge Function. The client never holds an API key. If you find yourself importing `@anthropic-ai/sdk` in `app/`, stop — that's wrong.
2. **No `service_role` key from the client.** Ever. Use `anon` key + RLS.
3. **Every table has RLS enabled with default-deny.** Every policy is scoped to `auth.uid()`. New tables without RLS fail review.
4. **Every AI call writes to `ai_jobs`.** With model id, prompt version, input/output token counts, latency in ms, cost in USD, hashed input. This is how we monitor cost and detect prompt regressions.
5. **Every prompt has a version constant.** Format: `BREED_PROMPT_V = "2026-05-08-1"`. Stored in `ai_jobs.prompt_version` on every call.
6. **No hardcoded user-facing strings.** Every label, error, button copy goes through `t('namespace.key')`. Locales: `en`, `es`, `ru` from R5 onward; English-only is acceptable through R4 but every string already lives in `locales/en.json`.
7. **No `any` types.** No `// @ts-ignore` without a comment justifying why.
8. **No `console.log` in production code.** Use the project logger.
9. **No commented-out code.**
10. **Async cleanup.** Every `useEffect` with a subscription, timer, or async work returns a cleanup function. Edge functions clean up open streams on error.

---

## Repo layout you must respect

The Expo project lives at the **repo root**. There is no `/app/` wrapper directory; the `app/` at the root is the expo-router screens directory only.

```
package.json              Expo project root
app.json
tsconfig.json
babel.config.js
metro.config.js
global.css
tailwind.config.js
i18n.ts                   i18next setup
app/                      expo-router screens (file-based routing)
  _layout.tsx
  index.tsx
components/               shared UI components
features/                 feature folders (onboarding/, plan/, medcard/, …)
lib/
  supabase.ts             Supabase client (anon key)
  ai.ts                   Client-side helper that calls edge functions
  logger.ts               Logger (only file allowed to call console.*)
  store.ts                Zustand store
  env.ts                  Typed reader for EXPO_PUBLIC_* vars
locales/
  en.json
  es.json
  ru.json
supabase/                 Sibling — Deno-based edge functions
  functions/
    _shared/
      ai/
        claude.ts         Claude adapter
        mistral.ts        Mistral adapter
        types.ts          Common interface
      logging.ts          ai_jobs writer
      auth.ts             getUser() helper
    breed-identify/
      index.ts
    medcard-ocr/
      index.ts
    plan-generate/
      index.ts
  migrations/
shared/
  types.ts                Types shared client ↔ functions
docs/
CLAUDE.md
README.md
```

If a prompt asks you to place code somewhere outside this layout, ask before doing it.

---

## Phase 1 — Plan template (your output)

```markdown
## Plan

**Files I will create or modify:**
- `app/features/onboarding/BreedConfirm.tsx` (new)
- `locales/en.json` (modify — add 4 new keys)
- ...

**Public APIs:**
- `function identifyBreed(photoUri: string): Promise<BreedResult>`
  - Return type: `{ species: 'dog' | 'cat'; breed: string; confidence: number }`
  - Errors: `BreedIdentificationError` with `code: 'low_confidence' | 'not_a_pet' | 'network'`

**Tests I will write FIRST (red phase):**
- `identifyBreed.test.ts > returns dog breed for clear dog photo`
- `identifyBreed.test.ts > throws low_confidence on ambiguous photo`
- `identifyBreed.test.ts > throws not_a_pet on non-animal photo`
- `BreedConfirm.test.tsx > renders breed and confidence`
- `BreedConfirm.test.tsx > calls onConfirm with the displayed breed`

**Open questions / assumptions:**
- I'm assuming photos are uploaded to Supabase Storage before this function is called. Confirm.
- I'm assuming the edge function handles all model retries. Confirm.

**Risks / edge cases I might miss:**
- HEIC vs JPEG handling on iOS
- Photo orientation EXIF stripping
- Network timeout while user is on the camera screen

STOPPING HERE. Awaiting plan approval before implementation.
```

---

## Phase 2 — Implement

1. Write the failing tests first. Commit them on a branch:
   ```
   test(onboarding): add failing tests for breed confirmation
   ```
   Confirm tests fail for the right reason (assertion failure, not import failure).

2. Write the implementation. Do NOT modify the tests committed in step 1.

3. Run the verification commands after every meaningful change:
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm lint`
   - `npx expo-doctor` (Expo work)
   - `deno test ...` (edge functions)

4. Iterate until everything is green.

5. Commit the implementation:
   ```
   feat(onboarding): implement breed confirmation screen
   ```

---

## Phase 3 — Self-review

Re-read your work against this checklist and answer in writing:

- [ ] All tests pass on the latest commit
- [ ] No tests were modified after the initial commit in Phase 2 step 1
- [ ] Acceptance criteria all met (quote each one and explain how)
- [ ] No `any` types added; no `// @ts-ignore` without justification
- [ ] No `console.log` left in production code
- [ ] No commented-out code
- [ ] All user-facing strings go through `t('...')`
- [ ] Any DB access uses RLS; no `service_role` key in the client
- [ ] Any AI call goes through an edge function; no API keys in client bundle
- [ ] Every AI call writes a row to `ai_jobs` with model, prompt version, tokens, cost, latency
- [ ] Files match the planned paths from Phase 1
- [ ] No new dependencies added without flagging in the report

---

## Reporting back

When you finish, report in this structure:

```
## Done

**What I built:**
- [Bullet list of files changed]

**Tests:**
- [Number of tests added, all green]
- [Coverage of acceptance criteria]

**Self-review checklist:**
- [Paste filled checklist]

**Verification proof:**
- [Output of `pnpm typecheck && pnpm test && pnpm lint`]
- [Screenshot or log if UI work]

**What I'd flag for human review:**
- [Anything you're not sure about]
- [Any deviation from the plan]
```

---

## When you get stuck

1. Try at least 3 different approaches before declaring blocked.
2. If still blocked, report:
   - What you tried (each approach, why it failed)
   - What you suspect the root cause is
   - What you would need to unblock (info, decision, spike)
3. Do not invent a workaround that contradicts the architecture (e.g., "I'll just call the model from the client to bypass this CORS issue"). Stop and report.

---

## Two-strike rule

If you've been corrected on the same issue twice in one session, stop and ask Anton to start a fresh session with a refined prompt. Continuing in polluted context fails far more often than starting clean.

---

## Multi-locale awareness

Even when only English content is being added, every user-facing string goes through i18next. R5 will be a localization-only release; the discipline of keeping all strings in `locales/en.json` from day one is what makes that release a few hours instead of a week.

For AI-generated content (the weekly plan, triage suggestions), the locale is passed as a prompt parameter and the model writes in that language directly. We do not translate after generation.

---

## What's out of scope for you

- Product decisions ("should we let users skip the survey?") — ask Anton
- Architecture changes ("can we use Firebase instead?") — ask Claude.ai via Anton
- Naming the product or features — Anton's call
- Visual design decisions beyond what the prompt specifies — ask
- Deciding when a release is done — Anton's call after testing
