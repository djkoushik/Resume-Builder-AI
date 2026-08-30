# Design Document — Resume Import (PDF / DOCX)

## Overview

Resume Import lets an experienced user upload an existing resume (`.pdf` or `.docx`),
have its content extracted and structured into `ResumeData`, review and correct the result,
and then continue editing in the existing builder.

The feature is **additive**. It writes into resume state through the same
`App.handleResumeChange` path every other edit already uses, and changes no existing data
model, route, or template.

Design stance, in priority order:

1. **The file never leaves the browser.** Text extraction is client-side.
2. **Deterministic first, LLM only where rules genuinely fail.** The parser must produce a
   usable result even when the AI provider is down or rate-limited.
3. **The user confirms before anything is applied.** A mandatory review step means ~75–80%
   parse accuracy is a good experience rather than a broken one.

---

## Architecture

```
ImportResumeModal
  │
  ├─ 1. File select (.pdf / .docx, ≤ 10 MB)
  │
  ├─ 2. EXTRACT  (client, lazy-loaded)         utils/resumeImport/extractText.ts
  │      pdf  → pdfjs-dist  (parses in a Web Worker, off the main thread)
  │      docx → mammoth
  │      → { text, warnings }
  │      ↳ if text is near-empty → "scanned/image PDF" error path, stop
  │
  ├─ 3. SPLIT   (client, pure)                 utils/resumeImport/sectionSplitter.ts
  │      text → { summary, experience[], education[], skills, projects, ... } raw blocks
  │
  ├─ 4. HEURISTIC PARSE (client, pure)         utils/resumeImport/heuristicParser.ts
  │      → contacts, skills, dates, bullets, and a best-effort pass at entries
  │
  ├─ 5. REFINE  (server, OPTIONAL)             POST /api/parse-resume
  │      Sends ONLY the ambiguous experience/education blocks.
  │      Any failure → keep the heuristic result, surface a soft warning. Never blocks.
  │
  ├─ 6. NORMALIZE (client, pure)               utils/resumeImport/normalize.ts
  │      unique ids · date normalisation · "* " bullet format · field length caps
  │
  └─ 7. REVIEW → user confirms → mergeResumeData() → handleResumeChange()
```

### Why extraction is client-side

- The resume file itself never touches our infrastructure — consistent with the product's
  no-database, privacy-first positioning.
- Keeps `pdfjs-dist` and `mammoth` out of the serverless function and its cold start.
- pdfjs runs in a Web Worker, so a large PDF does not freeze the UI.

### Why the LLM only sees blocks

Step 5 sends **only** the experience and education text blocks — never the contact block.
Name, phone, email and address are resolved deterministically in step 4 and never leave the
browser. This measurably reduces what a third-party provider sees, and it makes the prompt
smaller, cheaper, and much harder to derail.

---

## The LLM boundary

Rules handle most of the schema well. They fail on one thing: splitting a job entry into
`company` / `position` / `location`, because there is no consistent ordering across resumes.
The same applies to `degree` / `institution` / `areaOfStudy`.

| Handled deterministically | Delegated to the LLM |
| --- | --- |
| name, email, phone, website, LinkedIn/GitHub | `company` vs `position` vs `location` |
| section boundaries | `degree` vs `institution` vs `areaOfStudy` |
| bullet extraction and `* ` formatting | recovering entries from column-scrambled text |
| skills + `Label: a, b, c` categories | |
| date ranges and `isCurrent` | |
| summary / objective block | |

**Provider order is inverted for this endpoint.** `@google/genai` supports
`responseMimeType: 'application/json'` with a response schema, which constrains the model to
valid JSON. Gemini is tried first; OpenRouter is the fallback. This is the opposite of
`/api/ai` and is deliberate — that endpoint wants prose, this one wants a strict object.

### `POST /api/parse-resume`

Added as a route on the **existing** Express app in `api/index.ts` — that is the only live
API surface (`vercel.json` rewrites all of `/api/*` to it). Do not add it to `api/ai.ts`
or the other shadowed handlers.

```
Request   { blocks: { experience: string[], education: string[] } }
Response  { success: true,  data: { experience: [...], education: [...] }, provider }
          { success: false, error: string }
```

Guards, all required:

- `express.json()`'s default 100 KB limit already applies and is ample for text blocks.
- Cap at 25 blocks and 4,000 characters per block; truncate rather than reject.
- Explicit timeout so a slow provider cannot hold the function open.
- Response is parsed and **schema-checked server-side**; a malformed model reply returns
  `success: false` rather than passing unvalidated shapes to the client.

**Open decision — rate limiting.** This endpoint is more expensive than `/api/ai` and would
launch equally unauthenticated. Proper limiting needs shared state (Vercel KV / Upstash),
which does not exist in this project today. Options: (a) ship Phase 1 with no LLM at all and
decide before Phase 2, (b) add a per-IP in-memory counter — imperfect across instances but
raises the bar, (c) add KV. **Recommend (a) then (c).** This needs an explicit call before
Phase 2 ships.

---

## Data handling

### Merge policy

Import **replaces content, preserves presentation.** Merging two resumes section-by-section
produces confusing hybrids, so content fields are replaced wholesale — but
`resumeMode`, `sectionOrder`, `layout` and the separate `customization` state are kept from
the current session. A user who picked "Elegant Sidebar" keeps it after importing.

**Overwrite protection:** if the current resume is still the untouched seed, apply
silently; otherwise confirm in the review step.

The comparison **must exclude `resumeMode`, `sectionOrder` and `layout`.** Navigating to
`/build-custom-resume` runs `setResumeData(prev => ({ ...prev, resumeMode: 'custom' }))`,
which differs from the initial `'simple'` — so a naive deep-equal marks every Custom-mode
user as "dirty" and shows a spurious data-loss warning on a resume they never touched.
Compare content fields only.

### Shared merge utility — and the seed-data trap

`CustomizationPanel.handleFileChange` contains merge-with-defaults logic this feature wants
to reuse. It moves to `utils/resumeData.ts` as `mergeResumeData()` and serves both JSON
import and file import.

**It cannot be reused as-is.** The existing merge falls back to `initialResumeData` for any
missing field:

```js
...initialResumeData,
...importedData,
basics: { ...initialResumeData.basics, ...(importedData.basics || {}) },
projects: importedData.projects ?? initialResumeData.projects,
```

For JSON import this never fires — an exported file always contains every key. **For parsed
resumes, missing sections are the norm**, so a user whose resume has no Projects section
would receive John Doe's "E-Commerce Platform"; a resume with no phone number would receive
`(555) 123-4567`; a failed name extraction would produce `John Doe`. Because `basics` is
deep-merged per field, this lands silently in the exported PDF. `interests` is not even in
the guard list — it arrives via the `...initialResumeData` spread.

Two changes, both required:

1. **Normalisation emits explicit empty values for every section** (`[]` for arrays, `''`
   for `summary` and `references`, `''` for each `basics` field) so no `??` or spread can
   ever fall through to seed data.
2. **`mergeResumeData(data, { source })`** — `'json'` keeps today's behaviour exactly, so
   the existing import does not regress; `'file'` defaults missing values to empty.

`basics.photo` is the one exception: preserve the current photo when the parse has none,
since no resume file yields one and a mid-session import should not blank it.

### Normalisation rules

| Concern | Rule |
| --- | --- |
| **ids** | `` `${Date.now()}-${index}` `` — bulk insert must not reuse a bare `Date.now()`, or every parsed row gets the same id and React keys collide. Existing sections are left alone; the importer simply must not reproduce the bug. |
| **bullets** | `•` `-` `▪` `‣` → `* `, joined with `\n`. `renderSummaryList` splits on `\n` and tests `startsWith('*')`; anything else renders as flat paragraphs in all six templates. |
| **dates** | Normalise `01/2019`, `2019-01`, `Jan '19`, `Jan 2019` → `January 2019`. `atsService` runs `new Date(exp.startDate)` for the experience-years calculation, so sloppy dates silently degrade ATS scores. |
| **isCurrent** | `Present` / `Current` / `Now` in the end date → `true`, and `endDate` set to `'Present'`. |
| **skills** | `Label: a, b, c` → `{ name: 'Label', keywords: [...] }`. No labels → a single `{ name: 'Skills' }` category. |
| **caps** | Field length caps mirroring `CoverLetterEditor.validateField` (100 chars for names/titles, 5000 for long text) so a malformed parse cannot produce an unrenderable document. |
| **empty values** | Every section emitted explicitly — `[]` for arrays, `''` for strings. Never omit a key; omission is what triggers the seed-data fallback described above. |
| **`references`** | Is a `string` in `ResumeData`, not an array. Must not be emitted as `[]`. |

### Never taken from the parser

`sectionOrder`, `layout`, `resumeMode`. These are presentation state; the LLM must not be
able to set them, and the heuristic parser does not emit them.

---

## UI

The review step is a **modal** following the `ats/ATSModal.tsx` shell
(`fixed inset-0 z-50`, `bg-gray-500 bg-opacity-75` backdrop, `sm:max-w-4xl`,
`max-h-[80vh] overflow-y-auto`, backdrop-click to close). This keeps routing untouched —
a new route would mean edits in four places.

**It cannot be reused verbatim.** Two defects in that shell show up below `sm:`:

- `pb-20` puts **80px of dead space** beneath a bottom-anchored sheet, on the most
  valuable screen real estate a phone has.
- The panel has `sm:w-full` but **no `w-full` below `sm:`**, so it shrink-wraps to its
  content instead of filling the 16px gutters — ragged for a form-heavy panel.

The import modal gets its own shell with those two fixed. `ATSModal` is left alone (a
separate, deliberate call), so this feature does not change existing ATS behaviour.

**Mobile adaptations**, all inside the review panel:

| Desktop | Mobile |
| --- | --- |
| `grid-cols-2` field pairs | single column |
| `py-2` buttons (36px) | `py-3` (44px min touch target) |
| `sm:text-sm` (14px) inputs | 16px — below 16px, iOS Safari zooms the page on focus |
| Cards side by side | stacked, **Upload card first** |

The card reorder is deliberate: on a phone, three stacked cards bury whatever is third,
and the returning user with a resume already in hand is the likeliest mobile visitor.

States, using existing primitives (`ui/Input`, `ui/Textarea`, `ui/Accordion`, `ui/Toast`):

| State | Treatment |
| --- | --- |
| Idle | Drop zone + "Choose file". Accepted formats and the 10 MB cap stated up front. |
| Parsing | Existing spinner idiom from `ATSDashboard`; step label ("Reading PDF…", "Structuring…"). |
| Review | Sections in `Accordion`s, prefilled with `Input`/`Textarea`. Low-confidence fields flagged with a "check this" hint. Counts shown ("4 jobs, 2 degrees, 18 skills"). |
| Empty parse | "We couldn't find any content" + the JSON-import escape hatch. |
| Scanned PDF | Specific copy: image-based PDF, no text layer. **If exported from BuildResumeNow, tell them to use Export JSON** (see Risks). |
| `.doc` (legacy) | Rejected with "please save as .docx or PDF" — the binary format is out of scope. |
| AI unavailable | Soft banner: results still shown, "double-check job titles and companies". Not an error. |
| Error | `ui/Toast`, not `alert()`. |

**Entry point (Phase 1): one only.** A third card on `ResumeBuilderPage`
(`/resume-builder`) beside Simple and Custom: *"Upload existing resume"*. That page is where
the "I already have one" user lands, and it is an SEO page worth ranking for upload intent.

**A header button is deliberately deferred to Phase 3.** `Header` is
`flex justify-between items-center` with **no `flex-wrap`**, and on mobile "Build Cover
Letter" already wraps to three lines in a visibly cramped bar. Adding a fourth control
worsens an existing regression. (`CoverLetterBuilder`'s header uses `flex-col sm:flex-row`
plus `flex-wrap` — the resume header is simply the one that was never fixed.) Mid-session
import ships once that header is made responsive.

**Beware the global link interceptor.** `App.tsx` installs a document-level click handler
that hijacks every same-origin `<a>`. Any in-modal guidance — notably "use Export JSON
instead" in the scanned-PDF state — must be a `<button>`, or it will navigate the app out
from under the modal.

The existing Custom → Layout → **Import JSON** button stays exactly as-is.

---

## Files affected

**New**
```
utils/resumeImport/extractText.ts        PDF + DOCX → text (lazy-loads the parsers)
utils/resumeImport/sectionSplitter.ts    text → raw section blocks
utils/resumeImport/heuristicParser.ts    blocks → Partial<ResumeData>
utils/resumeImport/normalize.ts          ids, dates, bullets, caps
utils/resumeImport/index.ts              orchestration + LLM call + graceful fallback
utils/resumeImport/types.ts              ParsedResume { data, warnings, lowConfidence[] }
utils/resumeData.ts                      mergeResumeData() — shared with JSON import
components/import/ImportResumeModal.tsx  file select + progress + errors
components/import/ImportReviewPanel.tsx  the review/confirm step
__tests__/resumeImport/*.test.ts         parser + normalize + merge tests
```

**Modified**
```
App.tsx                       + onImportResume handler; threads a prop to ResumeBuilderPage.
                                REQUIRED — ResumeBuilderPageProps is only
                                { onBuildSimple, onBuildCustom, onBack } today, so there is
                                no channel for imported data to reach resume state.
                                Order matters: set data, THEN navigate. onBuildSimple uses a
                                functional update so batching is safe in that order;
                                reversed, a plain object set clobbers resumeMode to
                                undefined and silently breaks isSimpleMode and grid spans.
api/index.ts                  + POST /api/parse-resume (the live API — not api/ai.ts)
components/ResumeBuilderPage.tsx   + third entry card + onImportResume prop
components/customization/CustomizationPanel.tsx   use shared mergeResumeData({source:'json'})
package.json                  + pdfjs-dist, mammoth; + ts-jest & @types/jest (see Testing)
vite.config.ts                pdfjs worker resolution if the default does not work
```

Untouched: `types.ts` (`ResumeData` is unchanged), all six resume templates, PDF export,
routing, cover letter, auth.

---

## Dependencies

| Package | Version | Justification |
| --- | --- | --- |
| `pdfjs-dist` | 6.2.108 | No way to read PDF text without it. Measured: a 479 KB lazy chunk plus a 1.26 MB worker asset, neither on the critical path. Runs in a Web Worker. |
| `mammoth` | 1.12.2 | DOCX is zipped XML. Measured: a 504 KB lazy chunk. Larger than ideal — it bundles underscore and the full DOCX-to-HTML converter although we only call `extractRawText`. Acceptable while lazy; worth revisiting if DOCX import gets heavy use. |

**Measured against the real build:** wiring both in grew the main bundle by **1.85 KB**
(459.95 → 461.80 KB). Everything else is behind the dynamic `import()`.

Both are loaded via dynamic `import()` inside `extractText.ts`. This introduces the
project's **first code-split chunk** — a good precedent given the current single 460 KB bundle.
`npm run build` output must be checked to confirm the split actually happened.

No client-side LLM dependency: the refine step is a `fetch` to our own API.

---

## Performance

- Parsers are dynamic-imported; the main bundle is unchanged for non-importing users.
- pdfjs parses in a Web Worker — the UI stays responsive on large files.
- Hard 10 MB file cap checked **before** parsing.
- The LLM call carries only experience/education blocks, not the whole resume.
- Import produces exactly **one** `handleResumeChange` call on confirm, not one per field —
  important, since that handler re-renders the whole tree and rewrites `coverLetterData`.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| **A BuildResumeNow-exported PDF cannot be re-imported.** `html2pdf` rasterises via html2canvas, so our own PDFs contain an image and no text layer. This is the first thing users will try. | Detect near-zero extracted text and show copy that names the situation and points to **Export JSON**. The real fix is text-based PDF export — a separate change that also repairs the "ATS-friendly" claim, tracked outside this feature. |
| **pdfjs worker setup under Vite** is a known friction point (`GlobalWorkerOptions.workerSrc`). | Spike this first — it is task 1 for a reason. Fall back to the legacy build with a bundled worker asset if needed. |
| **Two-column PDFs extract in scrambled reading order.** | Use pdfjs per-item x/y coordinates for a simple column-detection pass; the LLM refine step recovers much of the rest; the review step catches the remainder. |
| **Import destroys work already typed.** | Pristine-state check (excluding `resumeMode`/`sectionOrder`/`layout`) + explicit confirmation; presentation settings preserved. |
| **Missing sections silently inherit the John Doe seed** — the highest-severity bug in the feature, since it reaches the user's exported PDF. | Explicit empty values from normalisation + `mergeResumeData` source mode. Covered by a dedicated regression test. |
| **`mammoth`'s `browser` field** only remaps two internal modules; the Node entry may still pull in Node-only code under Vite. | Prove it in the task-1 spike rather than assuming. |
| **Resume text is sent to a third-party model** in Phase 2. | Contact details never sent. Disclose before upload. **The Privacy Policy must be updated before Phase 2 ships — treat as a launch blocker.** A local-only ("don't send anything") toggle is straightforward because Phase 1 stands alone. |
| **Unauthenticated expensive endpoint.** | See the open decision above. Phase 1 has no endpoint at all. |
| **No persistence** — refreshing mid-review loses everything. | Consistent with the rest of the app. Out of scope; worth noting in review copy. |

---

## Testing

Focused, per the project's testing stance — high-value logic, not exhaustive E2E.

- **`heuristicParser`** against 5–6 committed **text fixtures** (not binary PDFs) covering:
  single-column, two-column, `Title | Company | Location`, company-above-title,
  no-suffix employers (Google/Stripe), and a skills block with `Label:` categories.
- **`normalize`** — date formats, bullet conversion, **id uniqueness across a bulk insert**.
- **`mergeResumeData`** — also protects the existing JSON import from regressing.
- **`ImportReviewPanel`** — one component test: renders parsed data, confirm fires once.
- Manual: a real PDF and a real DOCX end to end, plus **a downloaded BuildResumeNow PDF** to
  confirm the scanned-file message appears.

**Note on the test setup.** `jest.config.cjs` uses `preset: 'ts-jest'`, but neither
`ts-jest` nor `@types/jest` is in `devDependencies` — they resolve transitively today
(ts-jest 29.4.12 is present), which is why `tsc --noEmit` reports ~40 errors in test files.
Adding tests here makes that fragility load-bearing, so both should be added to
`devDependencies` as part of this work. That is a fix for a real problem, not scope creep.

---

## Phasing

**Phase 1 — deterministic import (independently shippable).**
Extraction, section splitting, heuristic parse, normalisation, review modal, entry points,
shared merge util, tests. No server changes, no new API surface, no privacy-policy impact.
Delivers a working feature on its own.

**Phase 2 — LLM refinement (purely additive).**
`POST /api/parse-resume`, Gemini-first structured output, graceful degradation to Phase 1
results. Gated on the rate-limiting and Privacy Policy decisions.

**Phase 3 — polish.**
Confidence highlighting in review, column-detection tuning, better scanned-PDF guidance.

Phase 1 is the commitment. Phase 2 changes nothing about Phase 1's behaviour when it fails,
which is the property that makes this safe to ship incrementally.
