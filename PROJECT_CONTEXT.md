# PROJECT_CONTEXT.md — BuildResumeNow

Internal engineering context for [buildresumenow.in](https://buildresumenow.in/).
Verified against the repo at commit `2cf6606` ("Removed the Sign in") and against the live
production site on 2026-08-29. Where existing docs in `docs/` disagree with this file,
**the code is the source of truth** — divergences are called out below.

---

## 1. Product

BuildResumeNow is a **free, no-account, client-side resume and cover-letter builder** with
AI-assisted text enhancement and an ATS (Applicant Tracking System) scoring engine.

- **Audience:** job seekers — students and working professionals.
- **Value proposition:** produce an ATS-friendly, professionally typeset PDF in minutes.
- **Monetisation / limits:** none today. There is no pricing, no quota, no login wall.
  A global hook `window.checkUserLimit()` exists as the seam where a quota would live;
  it currently always returns `true` (`contexts/AuthContext.tsx`).
- **Persistence:** none. All resume state lives in React memory and is lost on refresh.
  The only "save" is **Export JSON** (Custom mode → Layout tab).

### Feature surface
| Feature | Where |
| --- | --- |
| Resume builder — Simple mode (2 panels, locked to "Professional" template) | `/build-resume` |
| Resume builder — Custom mode (3 panels, templates/colors/typography/layout) | `/build-custom-resume` |
| Cover letter builder (3 panels, 7 selectable templates) | `/cover-letter-builder/build` |
| AI "Enhance with AI" on Summary + each Experience entry | `components/editor/*` |
| AI cover-letter body drafting from resume data | `components/coverLetter/CoverLetterEditor.tsx` |
| ATS score against a pasted job description | Header → Download PDF ▾ → Resume Score |
| PDF preview / download (client-side, html2pdf) | Header dropdown |
| JSON import / export of resume data | Custom mode → Layout tab |
| Legal + contact pages | `/privacy-policy`, `/terms-and-conditions`, `/contact` |

---

## 2. Architecture

```
Browser (React 19 SPA, Vite bundle)
  │
  ├─ All resume/cover-letter state in App.tsx useState (no store, no persistence)
  ├─ PDF generation: 100% client-side via html2pdf.js (CDN <script>)
  │
  └─ fetch() ──► Vercel /api/*  (vercel.json rewrites ALL /api/* → /api/index.js)
                   │
                   └─ api/index.ts — a single Express 5 app, one serverless function
                        ├─ POST /api/ai         → OpenRouter, falls back to Gemini
                        ├─ POST /api/ats-score  → services/atsService.ts (pure, in-process)
                        └─ GET  /api/health
```

Key architectural facts:

- **No database.** No user records, no saved resumes, no server-side session.
- **Single API function.** `api/ai.ts`, `api/ats-score.ts` and `api/health.ts` exist as
  standalone `@vercel/node` handlers but are **unreachable in production** — the
  `vercel.json` rewrite `"/api/(.*)" → "/api/index.js"` sends every API path to the
  Express app. They are duplicated, drifting dead code. (Verified: `/api/health` on prod
  returns the Express version's payload.)
- **Routing is hand-rolled.** No react-router. `App.tsx` reads `window.location.pathname`,
  listens for `popstate`, and installs a **document-level click listener** that intercepts
  every same-origin `<a>` and calls `pushState`. The SPA fallback rewrite in `vercel.json`
  makes deep links work.
- **Auth is present but disabled.** `AuthProvider` still wraps the app and still
  initialises Google Identity Services / One Tap, but every `<AuthButton />` render site is
  commented out (`Header.tsx`, `LandingPage.tsx`, `CoverLetterBuilder.tsx`). Sign-in state
  is not used by any feature.

---

## 3. Technology stack

| Layer | Technology | Notes |
| --- | --- | --- |
| UI | React 19.2 + TypeScript 5.8 | `react-jsx`, `noEmit`, `@/*` → repo root |
| Build | Vite 6 | dev server :3000, proxies `/api` → `127.0.0.1:3001` |
| Styling | Tailwind CSS 3.4 + PostCSS | plus `index.css` for the animated "Recommended" border |
| Icons | `lucide-react` (7 files) + many hand-inlined SVGs | two icon idioms coexist |
| API runtime | Express 5 on `@vercel/node` | `local-server.ts` runs the same app on :3001 |
| AI | `@openrouter/sdk` (primary) → `@google/genai` (fallback) | server-side only |
| ATS | `fuse.js` fuzzy matching + a hand-built skill dictionary | server-side only |
| PDF | `html2pdf.js` 0.10.1 from cdnjs (`<script defer>`) | **not** an npm dependency |
| Analytics | Google Analytics 4 (`G-X2S7ZJMFS6`) in `index.html` | no custom events |
| Tests | Jest 30 + jsdom + Testing Library | `__tests__/`, cover-letter focused |

**`react-helmet-async` is a declared dependency but is imported nowhere** — SEO is done
imperatively instead (`utils/seoUtils.ts` + `hooks/usePageSEO.ts`).

---

## 4. Directory structure

```
App.tsx                     Root: state, routing, view switch. The single most important file.
index.tsx                   Mount point; wraps <App/> in <AuthProvider>.
types.ts                    ALL data models + initial/seed data + cover-letter template registry.
constants.ts                Fonts, page formats, template list, colour palettes.
index.html                  SEO meta, JSON-LD, GA4, Google Fonts, html2pdf CDN, GSI script.
index.css                   Tailwind entry + custom animations.

api/
  index.ts                  ★ The real production API (Express app, all routes).
  ai.ts, ats-score.ts,      Dead in production — shadowed by the vercel.json rewrite.
  health.ts
local-server.ts             Boots api/index.ts on :3001 for `npm run dev`.

services/
  atsService.ts             ATS scoring engine (server-side, pure function).
  geminiService.ts          5-line back-compat re-export of utils/aiClient.
utils/
  aiClient.ts               ★ Client's only AI entry point — fetches /api/ai.
  seoUtils.ts               updateMetaTags() + per-page SEO_CONFIGS.
  ats/canonicalMap.ts       Skill dictionary: standardSkills, canonicalMap aliases, stopWords.
  testAI.ts                 Dev-only console helper; never imported.

components/
  Header.tsx                Resume-tool header: PDF options dropdown + ATS modal trigger.
  LandingPage.tsx           Marketing hero + "Choose what to build" cards.
  ResumeBuilderPage.tsx     Simple-vs-Custom mode chooser (SEO landing).
  CoverLetterBuilderPage.tsx Cover-letter SEO landing.
  ArtifactSelector.tsx      DEAD — imported by App.tsx, never rendered.
  AuthButton.tsx            Built, but every call site is commented out.
  editor/                   Left panel: one component per resume section + EditorPanel host.
  preview/                  Centre panel: ResumeTemplate switch + 6 resume templates.
  customization/            Right panel: Template/Color/Typography/Layout tabs.
  coverLetter/              Full cover-letter feature incl. templates/ (8 files, 7 wired).
  ats/                      ATS modal, dashboard, score, metrics, gap analysis, alerts.
  ui/                       Input, Textarea (hosts the "Enhance with AI" button), Select,
                            Accordion, Toast.
  layout/Footer.tsx         Global footer.
  legal/                    Privacy, Terms, Contact.
  showcase/TemplateShowcase.tsx  DEAD — byte-identical duplicate of src/components/... .

src/config/
  privateConfig.ts          Support email + optional phone/LinkedIn. See §12.
  footerConfig.ts           Copyright + contact items derived from privateConfig.
contexts/AuthContext.tsx    Google Identity Services; also defines window.checkUserLimit.
hooks/useAuth.ts            Thin re-export of useAuthContext.
hooks/usePageSEO.ts         Declarative SEO hook (used by the two SEO landing pages only).
public/                     robots.txt, sitemap.xml.
docs/                       Design/spec docs written alongside features. Partly aspirational.
__tests__/                  Jest suites, almost entirely cover-letter + geminiService.
```

Files at the repo root that are build/debug residue, not source: `build_log.txt`,
`diff.txt`, `jest_output.txt`, `jest_output_utf8.txt`.

---

## 5. Data flow

### 5.1 Resume flow (the critical path)

```
User types in components/editor/<Section>.tsx
  → section calls onUpdate(partial)
  → EditorPanel spreads it:  onUpdate({ ...resumeData, summary })
  → App.handleResumeChange(newResumeData)
       ├─ setResumeData(newResumeData)
       └─ setCoverLetterData(prev => ({ ...prev, ...syncResumeToLetter(newResumeData) }))
  → re-render of the WHOLE tree
  → PreviewPanel → ResumeTemplate (switch on customization.template)
                 → <XTemplate data settings/>  renders into #resume-preview
  → Header "Download PDF"
       ├─ window.checkUserLimit() gate (currently always true)
       ├─ clones #resume-preview off-screen at exact paper width (210mm / 8.5in)
       ├─ html2pdf(...).set({ margins from customization.layout, scale: 3 })
       └─ .save()  or  .toPdf() → window.open(blob)
```

There is **no validation layer on the resume side** — every field is a free-text input and
goes straight into state and into the PDF. Validation exists only in the cover-letter
editor (`validateField` in `CoverLetterEditor.tsx`).

### 5.2 Resume ⇄ cover-letter sync

Four fields are kept in sync **bidirectionally** through `App.tsx`:
`name/location/phone/email` ⇄ `senderName/senderAddress/senderPhone/senderEmail`
(`syncResumeToLetter` in `types.ts`, plus the inverse written inline in
`App.handleCoverLetterChange`). Any change to `Basics` must preserve this.

### 5.3 AI enhancement flow

```
Textarea "Enhance with AI"
  → section handler → services/geminiService (re-export) → utils/aiClient.generateText
  → POST /api/ai { prompt, systemMessage, temperature, maxTokens, type }
  → api/index.ts: OpenRouter "nex-agi/deepseek-v3.1-nex-n1:free"
                  on ANY throw → Gemini "gemini-2.5-flash-lite"
  → { success, content, provider }
  → onUpdate(enhancedText)   ← overwrites the user's text with no undo and no diff view
```

### 5.4 ATS flow

```
Header ▾ → "Resume Score" → ATSModal → ATSDashboard
  → POST /api/ats-score { candidate: <entire ResumeData>, jobDescription: { description } }
  → services/atsService.calculateATSScore
       Phase 0  regex-extract years-of-experience from the JD text
       Phase 1  extract skills: substring scan of the JD against standardSkills + aliases
       Phase 2  lowercase/trim normalisation
       Phase 3  canonicalisation: exact → alias → Fuse fuzzy (threshold 0.3)
       Phase 4  score = 0.40·hard_constraints + 0.35·skill_match + 0.25·semantic_match
       Phase 5  gap analysis (top 5 critical / bonus missing) + seniority flag
  → ATSScore / ATSMetrics / ATSGapAnalysis / ATSAlerts
  → "Add skill" pushes the keyword into resumeData.skills[0].keywords via Header.handleAddSkill
```

---

## 6. Deployment

- **Host:** Vercel. Framework auto-detected as Vite; `npm run build` → `dist/`.
- **`vercel.json`** has exactly two rewrites, order matters:
  1. `/api/(.*)` → `/api/index.js` — every API call hits the one Express function.
  2. `/(.*)` → `/index.html` — SPA fallback so client routes deep-link correctly.
- **Environment variables** (server-side only; none are exposed to the bundle):
  - `OPENROUTER_API_KEY` — primary AI provider.
  - `API_KEY` *or* `GEMINI_API_KEY` — Gemini fallback.
  - `VITE_GOOGLE_CLIENT_ID` — **is** inlined into the client bundle (that is correct for a
    public OAuth client ID). Currently unused since sign-in is disabled.
  - `PORT` — local API server only.
- **Local dev:** `npm run dev` runs `concurrently` → `tsx local-server.ts` (:3001) + Vite
  (:3000) with a `/api` proxy. `api/index.ts` also loads `.env` and `.env.local`.
- **Verified live:** `GET /api/health` → `{"status":"ok","openRouterConfigured":true,"geminiConfigured":true}`.
- **Build status:** `npm run build` succeeds. `npx tsc --noEmit` reports **0 errors in
  application code** (all remaining errors are missing `@types/jest`, see §11).

---

## 7. Design system

There is no token file. The design system is Tailwind utility conventions applied
consistently. Reuse these exact values.

### Colour
| Role | Value |
| --- | --- |
| Primary action / resume brand | `blue-600` bg, `blue-700` hover, `blue-500` focus ring |
| Cover-letter brand | `green-600` / `green-700`, accents `green-50`/`green-200`/`green-700` |
| ATS / "Recommended" accent | `purple-600`, `purple-50` |
| App background | `bg-gray-100` light, `dark:bg-gray-900` |
| Surface / card | `bg-white`, `dark:bg-gray-800` |
| Preview gutter | `bg-gray-200`, `dark:bg-gray-700` |
| Body text | `text-gray-800`, `dark:text-gray-200` |
| Labels | `text-gray-700`, `dark:text-gray-300` |
| Muted / help text | `text-gray-500`, `dark:text-gray-400` |
| Borders | `border-gray-200/300`, `dark:border-gray-600/700` |
| Destructive | `text-red-500` → `hover:text-red-700` |

**Dark mode:** `tailwind.config.js` sets no `darkMode` key, so Tailwind's default `media`
strategy applies — dark mode follows the OS and **there is no in-app toggle**. The
`:is(.dark …)` rules in `index.css` therefore never match; a `prefers-color-scheme`
fallback block covers them. Do not add a `.dark`-class-based component and expect it to work.

**Resume/cover-letter document colours are separate** and come from
`CustomizationSettings.colors` + `COLOR_PALETTES` in `constants.ts` — six named palettes
(`primary` / `text` / `background` / `sidebarText`). Never style the document with app chrome colours.

### Typography
- App chrome: Tailwind `font-sans` (system stack). Sizes: `text-5xl`/`text-6xl` hero,
  `text-3xl`/`text-4xl` section, `text-xl` panel titles, `text-sm` labels/buttons,
  `text-xs` help text.
- Document: driven entirely by `CustomizationSettings.typography` — heading + body
  families from `GOOGLE_FONTS`, numeric weights, and **`pt` font sizes** (`name` 32,
  `headline` 14, `sectionTitle` 11, `subheading` 11, `body` 10, `meta` 9).
  Templates inject an `@import url(...)` `<style>` for the selected Google fonts.

### Spacing / radius / elevation
- Panels: `p-4` outer grid gap `gap-4`; cards `p-6`/`p-8`; form fields `px-3 py-2`, `mb-4`.
- Radius: `rounded-md` for inputs and standard buttons, `rounded-lg` for panels and
  dropdown items, `rounded-xl` for marketing cards, `rounded-full` for pills and avatars.
- Elevation: `shadow-sm` inputs → `shadow-md` panels/header → `shadow-lg`/`shadow-xl`
  marketing cards and dropdowns → `shadow-inner` for the preview gutter.

### Recurring components
- **Button (primary):** `px-4 py-2 text-sm font-medium text-white bg-blue-600 border
  border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none
  focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`
- **Input / Textarea:** always via `components/ui/Input.tsx` / `Textarea.tsx` — they own
  the label, the `htmlFor`/`id` pairing and the focus ring. `Textarea` also owns the
  "Enhance with AI" button + spinner (pass `onEnhance` / `isEnhancing`).
- **Accordion (`ui/Accordion.tsx`):** supports controlled *and* uncontrolled use; the
  editor panels drive it controlled so only one section is open at a time. Optional
  `dragHandle` slot.
- **Modal:** the only pattern is `ats/ATSModal.tsx` — `fixed inset-0 z-50`,
  `bg-gray-500 bg-opacity-75` backdrop, backdrop click closes, inner
  `onClick={e => e.stopPropagation()}`, `sm:max-w-4xl`, body `max-h-[80vh] overflow-y-auto`.
- **Dropdown menu:** `Header.tsx` — `origin-top-right absolute right-0 mt-2 w-72 rounded-lg
  shadow-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm ring-1 ring-black
  ring-opacity-5 z-50 animate-slideIn`, items are icon-tile + title + one-line description.
- **Tab bar:** `CustomizationPanel` / `CoverLetterBuilder` — `border-b-2`,
  active `border-blue-500 text-blue-600`, inactive `border-transparent text-gray-500`.
- **Toast (`ui/Toast.tsx`):** fixed top-centre, auto-dismiss after 3 s, success/error/info.
  **Only the cover-letter editor uses it** — everything else still uses `alert()`. New work
  should use `Toast`.
- **Animations:** only `animate-slideIn` is defined in `tailwind.config.js`.
  (`ATSDashboard` references `animate-fadeIn`, which does not exist and silently no-ops.)

### Layout & breakpoints

**`components/builder/BuilderShell.tsx` is the responsive host for both builders.**
`ResumeBuilder.tsx` and `CoverLetterBuilder.tsx` each build their three surfaces
(editor / preview / design) and hand them to the shell along with their untouched
desktop JSX. `hooks/useViewport.ts` (`matchMedia`) buckets the width:

| Bucket | Width | Layout |
| --- | --- | --- |
| `desktop` | ≥ 1024 | The original three-panel grid below — **unchanged**, rendered by the builder itself (the shell is never mounted). |
| `tablet` | 768–1023 | Editor (section rail + form) beside a persistent live `PreviewViewport`; **Design** opens as a right slide-over. |
| `mobile` | < 768 | One surface at a time. Compact `MobileTopBar` + a bottom `ModeSwitch` (**Edit / Preview / Design**). Edit shows one section, chosen from a horizontally-scrolling `SectionNav`. |

Desktop three-panel grid (built by `ResumeBuilder` / `CoverLetterBuilder`, not the shell):

```html
<div class="w-full grid grid-cols-1 lg:grid-cols-10 xl:grid-cols-4 gap-4 p-4 items-start">
  <!-- editor:  lg:col-span-3 xl:col-span-1 -->
  <!-- preview: lg:col-span-4 xl:col-span-2   (7 / 3 when Simple mode hides the right panel) -->
  <!-- custom:  lg:col-span-3 xl:col-span-1 -->
</div>
```

Key facts:

- **The 1024 boundary remounts the builder's children** (desktop tree vs shell tree).
  Accepted: it only fires on a rare mid-session resize across 1024. The one casualty
  — cover-letter `customization` — was lifted to `App.tsx` (`coverLetterCustomization`)
  so it survives.
- **`PreviewViewport` (`components/builder/`) never transforms `#resume-preview` /
  `#cover-letter-preview`.** It scales a *wrapper* so the sheet renders at true paper
  width (794 / 816px) and is shrunk to fit — matching the exported PDF exactly. The PDF
  clone still grabs the untouched node by id. `PreviewPanel` / `CoverLetterPreview` gained
  a `variant="bare"` for this (drops the desktop padding / scroll box).
- **PDF export is `hooks/usePdfExport.ts` + `utils/pdfOptions.ts`** — the mobile Download
  button and (for the cover letter) the desktop dropdown share it. `Header.tsx` still has
  its own copy for the résumé desktop dropdown (untouched).
- `EditorPanel` takes a controlled `activeSection` + `display="single"`; drag-reorder is
  desktop-only, mobile uses up/down buttons (same `sectionOrder` / `layout` mutation).
- Touch targets: `ui/Input` `min-h-[44px]` below `sm`, `ui/RemoveButton` (40px, replaces
  the 12×24 `✕` in 7 section files), `ui/Textarea` moves "Enhance with AI" full-width
  below the field on phones. `TypographyTab` leads with Compact/Standard/Large presets and
  hides the six `pt` inputs behind a `<details>`.

---

## 8. Important dependencies

| Dependency | Why it is critical |
| --- | --- |
| `html2pdf.js` (CDN, `defer`) | The entire export feature. Not in `package.json`, typed as `declare var html2pdf: any`. If cdnjs is blocked or the SRI hash changes, **all downloads break**. It rasterises via html2canvas — the PDF contains an image, so text is not selectable and not machine-readable by real ATS software. |
| `@openrouter/sdk` + `@google/genai` | Both AI paths. The free OpenRouter model is rate-limited; the Gemini fallback fires on *any* OpenRouter throw. |
| `fuse.js` | ATS fuzzy skill matching. Server-side only — it is not in the client bundle. |
| `lucide-react` | Icons in 7 components. Tree-shaken, but mixing it with inline SVG is inconsistent. |
| `react` 19 | `AuthProvider` runs under `StrictMode`, so effects double-invoke in dev. |
| Google Identity Services (CDN) | Loaded on every page even though sign-in is disabled. |

---

## 9. Performance considerations

**Measured from a production build in this repo:**

| Asset | Size |
| --- | --- |
| `index.js` | 460 KB raw / 110 KB gzip — **one chunk, no code splitting** |
| `index.css` | 75 KB raw / 12.7 KB gzip |
| `favicon.png` | **1.14 MB** — served as the tab icon on every page |

1. **`favicon.png` is 1.14 MB.** The single highest-leverage fix in the repo. It should be
   a few KB.
2. **No route-level code splitting.** All six resume templates, all eight cover-letter
   templates, the ATS dashboard and the three legal pages ship to a visitor who only
   opens the landing page. `React.lazy` on the template switches and the legal routes is
   the obvious win.
3. **Tailwind scans `node_modules`.** `content: ["./**/*.{tsx,ts,jsx,js}"]` triggers
   Tailwind's own warning on every build and inflates the CSS. Narrowing the glob to the
   real source directories is safe and shrinks the CSS.
4. **Every keystroke re-renders the whole tree.** `App` holds all resume state and
   `handleResumeChange` also rewrites `coverLetterData`, so typing one character in
   `Basics` re-renders the editor, every preview template and the customisation panel.
   It is tolerable today because the tree is small; it is the first thing to bite when
   templates get heavier. Fix with `React.memo` on the preview templates before reaching
   for a state library.
5. **PDF generation blocks the main thread** at `html2canvas` `scale: 3` with no progress
   UI beyond the dropdown closing.
6. **Serverless:** `/api/ai` is I/O-bound on the model call; a slow OpenRouter response
   followed by a Gemini retry can approach the Vercel function timeout. `/api/ats-score`
   is pure CPU and fast, but it re-instantiates a `Fuse` index at module load (fine — it
   is module-scoped and reused across warm invocations).
7. **Fonts:** the Google Fonts stylesheet in `index.html` is deferred via the
   `media="print"` / `onload` trick, but each template *additionally* injects an
   `@import url(...)` at render time — a render-blocking request inside the component tree.

---

## 10. Security considerations

**Good today:**
- No AI API key reaches the browser. `vite.config.ts` deliberately defines nothing, and
  `utils/aiClient.ts` only talks to same-origin `/api/*`.
- No database and no stored PII — resume data exists only in the tab's memory.
- All template links use `target="_blank" rel="noopener noreferrer"`.
- No `dangerouslySetInnerHTML` anywhere; React escapes all user text.
- `html2pdf` CDN script carries an SRI `integrity` hash.

**Needs attention:**
1. **`/api/ai` is unauthenticated, unmetered and un-rate-limited**, and it accepts a
   caller-supplied `systemMessage`, `temperature` and `maxTokens`. Anyone can use it as a
   free LLM proxy on your keys. This is the top security/cost item.
2. **`cors()` with no options** on the Express app allows every origin; the standalone
   handlers hardcode `Access-Control-Allow-Origin: *` *and* `Allow-Credentials: true`.
3. **`/api/ats-score` accepts an arbitrary `candidate` object** and `JSON.stringify`s the
   whole thing for semantic matching — an unbounded payload is an easy CPU/memory DoS.
   There is no size limit on `express.json()`.
4. **JSON import is not validated.** `CustomizationPanel.handleFileChange` merges parsed
   JSON over `initialResumeData` with only shallow guards; a malformed file can put
   non-string values into fields that templates render.
5. **`src/config/privateConfig.ts` is committed and bundled.** Its header comment claims it
   is "not exposed to client bundle" — that is false: `Footer.tsx` imports it, so every
   value in it ships to the browser. Today it holds only a public support address, which is
   fine; **never put an actual secret in that file.**
6. Server logs echo prompt lengths and full error stacks to Vercel logs.

---

## 11. Technical debt

Recorded, **not to be refactored on sight**. Fix only when a feature genuinely requires it.

1. **Duplicate API implementations.** `api/ai.ts` / `api/ats-score.ts` / `api/health.ts`
   duplicate `api/index.ts` and are unreachable behind the rewrite. Two copies of the AI
   logic will drift. *If you change AI behaviour, change `api/index.ts` — that is the live one.*
2. **Dead code:**
   - `components/showcase/TemplateShowcase.tsx` is byte-identical to
     `src/components/showcase/TemplateShowcase.tsx`; neither is imported.
   - `ArtifactSelector.tsx` is imported by `App.tsx` but never rendered.
   - `App.tsx` still defines `handleStartBuilding`, `handleSelectResume`,
     `handleSelectCoverLetter`, `handleGoToResume`, which set view names
     (`'selector'`, `'resume'`, `'coverLetter'`) that are **not in the `AppView` union**.
   - `utils/testAI.ts` is never imported.
   - `services/atsService.ts` computes `jdExperienceKeywords` and never uses it.
   - `react-helmet-async` is a dependency with zero imports.
   - `hooks/usePageSEO.ts` and `utils/seoUtils.updateMetaTags` are two parallel SEO
     mechanisms; `App.tsx` uses the latter, two pages use the former, and they overwrite
     each other on those pages.
3. **`MinimalistTemplate` is orphaned.** `CoverLetterTemplateRenderer` has a `'minimalist'`
   case, but `coverLetterTemplates` in `types.ts` lists only 7 ids — the picker can never
   select it.
4. ~~**`services/atsService.ts` writes to the filesystem.**~~ **Fixed** — the
   `require('fs').appendFileSync('debug_ats.log', …)` per-keyword debug block was
   deleted (it also used CommonJS `require` in an ESM module).
5. ~~**Naive JD skill extraction produces false positives.**~~ **Fixed** — a
   `mentions(haystack, needle)` helper in `atsService.ts` now matches skills as
   standalone tokens (`(?<![a-z0-9+#.])…(?![a-z0-9+#.])`, needle escaped), so
   `"r"` / `"go"` / `"c#"` / `.net` are no longer pulled out of ordinary words.
   Applied to JD extraction, the candidate-summary fallback, and the semantic
   token match. The unescaped `${kw}` in the bonus/critical regex (which threw
   on a skill like `c++`) is escaped too. Covered by
   `__tests__/services/atsService.test.ts` (the first tests for this file);
   `jest.config.cjs` gained a `.js`-extension mapper and `esModuleInterop` so
   `atsService` and its `fuse.js` import resolve under ts-jest.
6. ~~**`Header.handleAddSkill` builds an invalid `Skill`.**~~ **Fixed** — the
   zero-skill-categories fallback now emits `{ id: \`skill-${Date.now()}\`, name,
   keywords }` (was `{ name, level: "", keywords }` — no `id`, bogus `level`). The
   mobile path (`useAtsModal`) was already correct.
7. **Testing setup is fragile.** `jest.config.cjs` uses `preset: 'ts-jest'`, but neither
   `ts-jest` nor `@types/jest` is in `devDependencies` — tests run only because `ts-jest`
   resolves transitively, and `tsc --noEmit` reports ~40 errors in test files for the
   missing types. Coverage is mostly cover-letter + the resume-import suites;
   `atsService` now has a small suite (word-boundary matching only). **Still no
   tests for the PDF export path or the resume templates.**
8. **Full suite green.** `npm test` = 206/206. The long-standing
   `CoverLetterWorkflow › form validation prevents invalid submissions` failure was a
   test bug: the editor's accordions are single-open, so opening "Job Application
   Details" unmounts the Enhance-with-AI button, and the test's `queryByText(/Enhance
   with AI/i)` guard always matched the preview's placeholder copy instead of the
   button, so it never re-opened "Letter Content". Fixed by querying the button via
   `getByRole` and re-opening the accordion explicitly.
9. **Two error-reporting idioms.** `alert()` in the resume editor and `Header`;
   `Toast` in the cover-letter editor. Standardise on `Toast`.
10. ~~**Cover-letter customisation is local state.**~~ **Fixed** — lifted to
    `App.tsx` (`coverLetterCustomization`) during the mobile redesign, so it now
    survives navigation and a viewport-driven shell remount.
11. **No lockfile is committed.** There is no `package-lock.json` in the repo, and every
    dependency uses a caret range. Vercel resolves fresh versions on each build, so a
    transitive release can change or break production without a single code change.
    Committing a lockfile is the cheapest reliability win available.
12. **Committed build residue:** `build_log.txt`, `diff.txt`, `jest_output.txt`,
    `jest_output_utf8.txt`.
13. **`README.md` is the unedited AI-Studio template** and describes nothing about this app.

---

## 12. Known risks for future development

Read this section before touching anything below.

| Area | Risk |
| --- | --- |
| **`ResumeData` shape** | Consumed by 6 resume templates, `EditorPanel`, `atsService`, the JSON import/export round-trip, and the cover-letter sync. Adding an optional field with a default is safe; renaming or removing one breaks every template *and* every previously exported `resume.json` a user still has. There is no migration path and no schema version. **Add a `version` field before the first breaking change.** |
| **`resumeData.layout`** | Keyed by template name. A new multi-column template needs an entry in `initialResumeData.layout`, or `EditorPanel` falls back to the flat `sectionOrder` list and drag-and-drop across columns silently stops working. Imported JSON from before a new template will lack the key — the shallow merge in `handleFileChange` covers this only because it spreads `initialResumeData.layout` first. |
| **`#resume-preview` / `#cover-letter-preview` DOM ids** | PDF export finds the element by `getElementById` and clones it. Renaming the id breaks downloads with only a `console.error`. The mobile `PreviewViewport` deliberately scales a **wrapper** around this node, not the node — keep it that way; a `transform` / `zoom` on the node itself corrupts the export. Verify a real download at mobile, tablet and desktop after any preview change. |
| **PDF fidelity** | `html2pdf` rasterises. Anything that renders differently at a fixed 210mm/8.5in width than on screen — `md:`/`lg:` responsive classes inside a template, `position: sticky`, CSS the cloned node inherits from an ancestor — shows up only in the exported PDF. **Always verify a real download, not just the preview.** |
| **Routing** | Paths are string-matched in *two* places in `App.tsx` (the `popstate` handler and the global click handler) and again in `public/sitemap.xml`. A new route needs all three, plus an `AppView` union member. The global click interceptor swallows every same-origin `<a>` — an anchor that should do something else needs `e.stopPropagation()` or a non-anchor element. |
| **Simple vs Custom mode** | `resumeData.resumeMode` drives both the grid spans and whether `CustomizationPanel` renders at all. Simple mode force-sets `template: 'Professional'` on entry; a feature that lives in the right panel is invisible in Simple mode. |
| **Resume ⇄ cover-letter sync** | The two `useCallback`s in `App.tsx` write into each other. Adding a synced field means editing both `syncResumeToLetter` and the inverse mapping, or edits silently get reverted on the next keystroke. |
| **AI overwrite** | "Enhance with AI" replaces the user's text in place with no undo. Any change here needs to preserve at least that expectation. |
| **`window.checkUserLimit`** | Six call sites gate on it. It is the intended quota seam — if limits are ever introduced, implement them there rather than adding new gates. |
| **`AuthProvider`** | Still mounted and still initialising Google One Tap even though the UI is commented out. Re-enabling sign-in means un-commenting three `<AuthButton />` sites and confirming `VITE_GOOGLE_CLIENT_ID` is set in Vercel. |
| **No persistence** | Any feature that implies durability ("save", "my resumes", "resume history") requires new infrastructure that does not exist today. Say so before designing it. |

---

## 13. Development principles for this repo

1. **`api/index.ts` is the live API.** Do not add routes to `api/ai.ts` / `api/ats-score.ts`.
2. **Never change `ResumeData` in a breaking way.** New fields are optional and defaulted in
   `initialResumeData`, and must survive the JSON import merge.
3. **Verify PDF output, not just the preview**, for any change to a template or preview container.
4. **Reuse `ui/Input`, `ui/Textarea`, `ui/Accordion`, `ui/Toast`** and the button/panel/modal
   classes in §7 rather than inventing new styling.
5. **Prefer `Toast` over `alert()`** in new code; leave existing `alert()`s alone unless the
   feature touches them.
6. **Every UI needs light and dark** (`dark:` variants, `media` strategy) and must work in all
   three viewport buckets (§7). Builder features live in one of the three surfaces the shell
   arranges; a new builder control needs a home in Edit, Preview **or** Design, not a fourth
   floating element.
7. **Do not add npm dependencies casually** — the client bundle is already one ~490 KB chunk.
8. **Any new server endpoint needs input size limits and abuse protection** from day one; the
   existing endpoints do not have them and that is a known gap, not a precedent.
9. **Route changes touch four places:** the `popstate` handler, the click handler, the `AppView`
   union, and `public/sitemap.xml`.
10. **Keep `docs/` and this file honest.** When a feature lands, update §11/§12 rather than
    letting the docs drift the way `README.md` and `PRIVATE_CONFIG_SETUP.md` have.
