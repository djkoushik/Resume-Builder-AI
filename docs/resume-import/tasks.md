# Implementation Plan — Resume Import

Phase 1 is independently shippable. Phase 2 is additive and gated on two decisions
(rate limiting, Privacy Policy) recorded in `design.md`.

---

## Phase 1 — Deterministic import

- [x] 1. Spike the pdfjs + Vite worker setup — **DONE, no design change needed**

  - Added `pdfjs-dist@6.2.108`, `mammoth@1.12.2`; `ts-jest`+`@types/jest` to devDependencies
  - `GlobalWorkerOptions.workerSrc` resolves via `import('pdfjs-dist/build/pdf.worker.min.mjs?url')`.
    No legacy build or manual asset copy needed in the browser
  - Vite **does** substitute mammoth's `browser/unzip.js` — verified in the built chunk:
    no `fs`, and the browser-only code path is present
  - Chunk split confirmed (measured, production build):

    | Chunk | Size | When it loads |
    | --- | --- | --- |
    | main `index.js` | 461.80 KB (**+1.85 KB** vs baseline 459.95) | always |
    | `extractText` | 2.25 KB | on upload |
    | `pdf` (pdfjs) | 479.34 KB | on upload |
    | mammoth chunk | 504.52 KB | on DOCX upload |
    | `pdf.worker.min.mjs` | 1,262.40 KB asset | when a PDF is parsed |

  - End-to-end smoke test against a real PDF and a real DOCX: name, employer, phone,
    skills and dates all round-trip through both formats

  **Three findings that constrain later tasks:**

  1. **`destroy()` lives on the loading task, not the document proxy** in pdfjs 6.
     `doc.destroy()` throws; keep the `loadingTask` and destroy that, or the worker leaks.
  2. **pdfjs's standard build needs browser globals** (`DOMMatrix`) and throws on import
     under Node. jsdom does not provide them either — so `extractText.ts` must never be
     unit-tested in Jest. Task 9's text-fixture approach is now a requirement, not a preference.
  3. **mammoth's browser build accepts ONLY `{arrayBuffer}`** (the Node build accepts only
     `path`/`buffer`). If the browser-field substitution ever stops working, the failure is
     a runtime "Could not find file in options", not a build error.

- [x] 2. Text extraction layer

  - `utils/resumeImport/extractText.ts` — dynamic-import pdfjs / mammoth on demand
  - PDF: collect text items with x/y coordinates, not just concatenated strings
  - Enforce the 10 MB cap before parsing; reject `.doc` with a clear message
  - Detect near-empty output and return a `scanned-pdf` warning code
  - `utils/resumeImport/types.ts` — `ParsedResume { data, warnings, lowConfidence[] }`

- [x] 3. Section splitting

  - `utils/resumeImport/sectionSplitter.ts`
  - Header synonym list (EXPERIENCE / WORK HISTORY / EMPLOYMENT, EDUCATION, SKILLS, PROJECTS,
    CERTIFICATIONS, SUMMARY / OBJECTIVE / PROFILE, INTERESTS, LANGUAGES)
  - Formatting cues: ALL CAPS, short standalone line, blank-line delimited
  - Column detection from the x-coordinates captured in task 2 (`detectColumnSplit`)

- [x] 4. Heuristic parser

  - `utils/resumeImport/heuristicParser.ts`
  - Contacts: email, phone, website, LinkedIn/GitHub, name-from-top-line
  - Skills incl. the `Label: a, b, c` → `{ name, keywords[] }` category pattern
  - Date ranges + `isCurrent` from Present/Current/Now
  - Bullet lines from `•` `-` `▪` `‣`
  - Best-effort company/position/location split (suffix + title-keyword signals)
  - Emit `lowConfidence` markers for every field the rules had to guess

- [x] 5. Normalisation

  - `utils/resumeImport/normalize.ts`
  - Unique ids: `` `${Date.now()}-${index}` `` — verify uniqueness across a bulk insert
  - Dates → `January 2019` form so `atsService`'s `new Date()` math works
  - Bullets → `* ` prefix, `\n` joined, to match `renderSummaryList`
  - Field length caps mirroring `CoverLetterEditor.validateField`
  - Strip anything the parser must never set: `sectionOrder`, `layout`, `resumeMode`
  - **Emit every section explicitly** — `[]` for arrays, `''` for strings — so nothing can
    fall through to seed data. `references` is a `string`, not an array.

- [x] 6. Shared merge utility — and fix the seed-data fallback

  - Lift the merge logic out of `CustomizationPanel.handleFileChange` into
    `utils/resumeData.ts` as `mergeResumeData(data, { source: 'json' | 'file' })`
  - `'json'` reproduces today's behaviour exactly — the existing import must not regress
  - `'file'` defaults missing sections to **empty, never to `initialResumeData`**.
    Without this a resume with no Projects section inherits John Doe's projects, and a
    resume with no phone inherits `(555) 123-4567` — silently, into the exported PDF
  - Preserve `basics.photo` when the parse has none
  - Pristine check must **exclude `resumeMode`, `sectionOrder`, `layout`** — navigation
    mutates `resumeMode`, so a naive deep-equal falsely flags every Custom-mode user
  - Preserve `resumeMode`, `sectionOrder`, `layout` across an import

- [x] 7. Import + review UI

  - `components/import/ImportResumeModal.tsx` — follow the `ats/ATSModal.tsx` shell, but
    with its two mobile defects fixed: drop the `pb-20` dead space and add `w-full` below
    `sm:` so the panel fills the gutters. Do not modify `ATSModal` itself
  - Mobile: single-column fields, `py-3` buttons (44px targets), 16px inputs (14px
    triggers iOS Safari zoom-on-focus)
  - `components/import/ImportReviewPanel.tsx` — `Accordion` sections, `Input`/`Textarea`
    prefilled, low-confidence hints, parsed counts
  - All states from `design.md`: idle, parsing, review, empty, scanned PDF, legacy `.doc`, error
  - Errors via `ui/Toast`, not `alert()`
  - Confirmation prompt when the current resume is not pristine
  - **Use `<button>`, never `<a>`, for in-modal guidance** — the document-level click
    handler in `App.tsx` hijacks every same-origin link and would navigate the app away

- [x] 8. Wire up the entry point

  - `App.tsx`: add the import handler and thread a new prop to `ResumeBuilderPage`
    (its props are only `onBuildSimple` / `onBuildCustom` / `onBack` today — there is
    currently no way for imported data to reach resume state)
  - **Set data first, then navigate.** `onBuildSimple` uses a functional update so batching
    is safe in that order; reversed, a plain object set clobbers `resumeMode` to `undefined`
    and silently breaks `isSimpleMode` and the grid column spans
  - Third card on `ResumeBuilderPage` — "Upload existing resume".
    Grid is `grid-cols-1 md:grid-cols-3`; on mobile the Upload card comes **first**
  - **No `Header` button in Phase 1** — the header is `flex justify-between` with no
    `flex-wrap` and already overflows on mobile; deferred to Phase 3
  - Confirm exactly one `handleResumeChange` call fires on confirm
  - Leave the existing Custom → Layout → Import JSON button untouched

- [x] 9. Tests

  - [x] `ts-jest` + `@types/jest` added to `devDependencies` — this took `tsc --noEmit`
        from ~40 errors to **0 across the whole project**
  - Never import `extractText.ts` from a Jest test (see finding 2 in task 1)
  - `heuristicParser` against six committed text fixtures covering the layout variants
  - `columnDetection` against synthetic positioned runs — the right level for it,
    since the input is coordinates rather than text
  - `normalize` — dates, bullets, id uniqueness
  - `mergeResumeData` — both source modes; **explicit regression test that a parse with
    missing sections yields empty values and never John Doe's seed data**; and that
    `source: 'json'` still behaves exactly as before
  - `ImportReviewPanel` component test (7 cases)

- [x] 10. Verify Phase 1

  - `npm run build` succeeds; confirm the lazy chunk split in the output
  - `npx tsc --noEmit` — no new errors in application code
  - `npm test` — no new failures (one pre-existing cover-letter failure is expected)
  - Manual: real PDF, real DOCX, and a **BuildResumeNow-exported PDF** (must show the
    scanned-file message, not a silent empty parse)
  - Manual: import a resume with **no Projects / no Interests / no phone** and confirm none
    of John Doe's data appears anywhere, including in the exported PDF
  - Manual: enter Custom mode without typing, then import — there must be no spurious
    "you'll lose your work" prompt
  - Mobile (375px) and desktop; light and dark. Check the modal fills the gutters and
    that no field is under 16px
  - Existing flows unaffected: JSON import/export, PDF download, ATS modal, cover letter sync

---

## Phase 1 results

Complete and verified. Measured on the production build:

| Chunk | Size | Loads |
| --- | --- | --- |
| main `index.js` | 465.26 KB (**+5.31 KB** vs the 459.95 KB baseline) | always |
| `ImportResumeModal` | 34.14 KB | on first click of the upload card (prefetched on hover) |
| pdfjs | 479.34 KB | on upload |
| mammoth | 504.52 KB | on DOCX upload |
| `pdf.worker.min.mjs` | 1,262.40 KB asset | when a PDF is parsed |

`tsc --noEmit` exits 0. Tests: 110 pass, 1 fail — the pre-existing
`CoverLetterWorkflow` toast assertion, unchanged from before this work.

**Verified in the running app**, not just in tests:

- A real PDF and a real DOCX of the same resume now produce *identical* output
  (2 roles, 1 degree, 10 skills), and the imported resume renders correctly in
  every builder panel.
- A genuine BuildResumeNow export — 657 KB, generated by the app's own
  `html2pdf` pipeline — has no text layer and lands on the scanned-PDF screen
  with the Import JSON guidance. The claim that our PDFs cannot be re-imported
  is now measured, not assumed.
- Entering Custom mode without typing shows **no** overwrite warning; typing one
  character and then importing **does**. Both halves of the pristine-check fix.
- The existing JSON import still applies partial files exactly as before,
  seed-data fallback included.
- Mobile (375px): panel fills the gutters at 343px, every field is 16px, no
  horizontal overflow. Dark mode correct.

**Column detection** (`detectColumnSplit` in `extractText.ts`)

Spotting two clusters of x values is easy; the trap is that a single-column
resume with right-aligned dates ("Acme Ltd .......... Jan 2019") produces them
too. The discriminator is **vertical independence**: real columns occupy their
own lines, whereas right-aligned text always shares a line with something on
its left. A page is split only when the widest x-gap leaves at least 20% of runs
on each side, spans at least 12% of the text width, and the right side has lines
of its own.

The size floor is counted in **distinct lines, not runs** — how many runs a PDF
emits per line is a property of the generator, not of the layout.

Verified end to end against a real two-column PDF: both roles, the sidebar's
education and skills, and all five contact fields came through correctly.

**Multi-page handling** (`stripRunningHeadersAndFooters`, `joinPages`)

Two problems, both invisible on a single-page document:

- **Running headers and footers** landed inline as content. A line near the top
  or bottom of a page is now dropped when the same text — with digits masked,
  so "Page 1 of 2" and "Page 2 of 2" compare equal — appears in the same
  position on at least half the pages. Single-page documents are never
  stripped: there is nothing to compare against, and a real heading would be
  indistinguishable from a header.
- **A job split across a page break became two jobs**, because joining pages
  with a blank line reads as a paragraph break downstream. A page whose first
  line continues the previous one — a bullet, or a line starting mid-sentence —
  is now joined without one.

Verified against a real two-page PDF: the repeated header and the page footer
are gone, and all four bullets of the split role stayed on that one role.

**DOCX tables and lists** (`htmlToLines`, `splitDatedEntries`)

DOCX extraction moved from `extractRawText` to `convertToHtml`. The simpler API
throws away table boundaries entirely, and resumes use tables constantly —
both as page layout (a sidebar cell beside a main cell) and as data (a date
column beside a detail column). Without row boundaries, every row of an
education table merged into a single entry.

A table ROW is treated as one logical entry: its cells stay together, rows are
separated by a blank line. List items get a leading "- " because **Word bullets
carry no literal bullet character** — without this, a real Word resume's
achievements render as paragraphs rather than bullets in every template. That
was a second, unrelated bug the switch fixed. `convertToHtml` costs nothing
extra: mammoth bundles it either way.

Blank lines alone are not a reliable entry boundary in DOCX, because Word
authors separate entries with paragraph *spacing* rather than empty paragraphs,
and that spacing does not survive into text. `splitDatedEntries` adds two more
signals for experience and education: a non-bullet line straight after a bullet
(bullets belong to the entry above them), and a second date range inside one
entry. Where the boundary falls depends on layout — with the date last the
lines after it head the next entry; with the date first, as in a date-column
table, they do not — so both orderings are handled explicitly.

Verified against a hand-built DOCX containing genuine `w:tbl` elements: two
roles from a single table cell with no blank line between them, two degrees
from a date-column table, and all contact fields from the sidebar cell.

**Work-experience heading formats**

A sweep of 31 real-world layouts found the parser handling 27 and failing 4.
All now pass, and are locked in as `experienceFormats.test.ts`:

- **`Title, Company` and `Title at Company`** — neither a comma nor the word
  "at" was a segment separator, so the whole line became the company. Adding
  them to the global separator list would have wrecked "New York, NY" and
  "Engineer, Backend Systems", so the split is a fallback that only fires on a
  single unresolved segment where exactly one side carries title vocabulary.
- **A suffix-less employer swallowed by the location** — "Stripe, San
  Francisco, CA" has no company marker and no title word, so it read as a
  location and the employer disappeared. When nothing else supplied a company,
  the leading part of a three-part location now becomes it.
- **A bullet wrapped onto a second line became a second job** whose company was
  the tail of the sentence. This was a regression from `splitDatedEntries`.
  Wrapped text carries on mid-sentence, so a lowercase opening marks a
  continuation — it rejoins its bullet instead of starting an entry.
- **A prose description instead of bullets was dropped entirely**, because only
  bullet lines reached the summary. Five words plus sentence punctuation (or
  real length) separates prose from "Acme Inc." and "San Francisco, CA".

Two smaller additions from the same sweep: "Remote" and "Hybrid" now count as
locations despite having no comma, and a promotion block — which lists only the
new title under the employer above it — inherits that employer and is flagged
low-confidence.

**Review pass**

A review of the finished Phase 1 diff found seven further issues, three of them
high severity, all in code already reported as verified. Root cause of the three:
the unknown-heading rule treated any short all-caps line as a section boundary
and then DISCARDED everything beneath it — so an all-caps job title threw away
the user's email and phone, and an all-caps skills list emptied the section.
The rule is now much stricter (no commas, no digits, at most three words) and a
candidate counts as a heading only when NEITHER neighbour looks like one; a run
of all-caps lines is a list, not a series of headings. Also fixed: a year range
in the contact block was being stored as the phone number.

The first attempt at that fix checked only the *following* line, which
misclassified the last acronym in a run and still truncated the section. It
passed the unit tests and was caught only by running the real app.

**Six bugs found during implementation that the plan had not anticipated:**

1. **`doc.destroy()` does not exist** on a pdfjs 6 document proxy — it lives on
   the loading task. Caught by the task-1 smoke test; would have leaked a worker
   on every import.
2. **A wrapped URL yielded a truncated profile handle.** Long contact lines wrap
   mid-URL in real PDFs, so `linkedin.com/in/pr` + `iyasharma` parsed as the
   username `pr`. Fixed by also matching against the un-wrapped text and taking
   the longer handle.
3. **DOCX arrives uniformly double-spaced.** mammoth separates every paragraph
   with a blank line, so blank-line entry splitting read a two-job resume as
   five one-line jobs. Fixed with `collapseUniformSpacing`, guarded so a
   normally spaced document is untouched.
4. **An email local part matched the website pattern** — `sam.taylor@outlook.com`
   produced the website `sam.taylor`. Fixed by stripping emails before scanning
   for URLs.
5. **A `CONTACT` heading discarded the contact block.** Unmapped all-caps
   headings drop their content, which is right for sections with no home in
   `ResumeData` — but sidebar layouts almost always label their contact
   details, so the user's email and phone were being thrown away. Found only
   once column detection made sidebar resumes parseable. `CONTACT`,
   `PERSONAL DETAILS` and friends now route back into the contact block.
6. **The column-size floor was counted in runs**, which is generator-specific
   rather than layout-specific; a document emitting one run per line never
   split. Now counted in distinct lines.

**One shared component changed:** `ui/Accordion` gained an optional `meta` slot
for trailing content, because the count badges were otherwise being smuggled in
through `dragHandle` and rendered on the wrong side. Additive and
backward-compatible; no existing usage changed.

**Also fixed in passing:** `ts-jest` and `@types/jest` are now real
devDependencies, taking `tsc --noEmit` from ~40 errors to 0 project-wide.

---

## Phase 2 — LLM refinement

- [x] 11. Decide rate limiting and update the Privacy Policy

  **Rate limiting: per-IP, in memory** (`api/parseResumeSupport.ts`). The app has
  no sign-in — every `<AuthButton />` call site is commented out — so an IP
  address is the only handle a request carries. Two caps: 6 per 10 minutes to
  stop bursts, 40 per day to bound the worst-case bill.

  **Known limitation, accepted.** Each warm Vercel instance holds its own map,
  so the true ceiling is (instances × limit). It stops a scripted loop, which is
  the realistic threat. Everything goes through `checkRateLimit(ip)`, so a
  shared KV store can replace it without the route changing. `app.set('trust
  proxy', true)` was needed for `req.ip` to resolve behind Vercel's TLS
  termination.

  **Privacy Policy updated** — new "AI Processing" subsection under §7
  (Third-Party Data Processing; extending §7 avoided renumbering §8–§12). It
  covers *both* AI paths, including `/api/ai`, which was sending resume text to
  third parties with no disclosure at all before this. Last-Updated bumped to
  30 August 2026.

  **Opt-out shipped.** A checkbox on the upload screen, on by default,
  remembered in `localStorage` under `buildresumenow:import-ai-refine`. Unticked,
  the import is entirely local. Declining shows **no** `ai-unavailable` banner —
  that banner means "we tried and could not", and a deliberate choice is not a
  failure.

- [x] 12. `POST /api/parse-resume`

  Route in `api/index.ts`; guards and prompt in `api/parseResumeSupport.ts`,
  split out so the count-match rule and the rate limiter's window arithmetic are
  unit testable without Express or a model.

  Gemini first with `responseMimeType: 'application/json'` and a response
  schema, OpenRouter as fallback. 25 blocks / 4,000 chars per block, truncated
  rather than rejected. 12 s provider timeout (an `abortSignal` for Gemini; the
  OpenRouter SDK takes no signal, so a `Promise.race`). Replies are validated
  server-side and **discarded whole on any count mismatch**.

  Failure returns **502, not 500**: nothing is broken for the user, we simply
  have nothing to add.

- [x] 13. Client integration

  `utils/resumeImport/aiRefine.ts`, called from `utils/resumeImport/index.ts`
  after `parseResumeText`. Only entries the heuristics **flagged** are sent, so a
  cleanly parsed resume makes no network call at all. On success it overwrites
  only company/position/location (and the education equivalents) and clears
  those `lowConfidence` paths; dates, bullets and ids are never touched.

  Refinement stays inside the existing `structuring` progress stage — a stage
  that sometimes does not happen would flicker in the progress list.

  **Verified in the browser both ways.** With the endpoint absent (vite alone,
  hard 500) the review panel showed the `ai-unavailable` banner with all Phase 1
  content intact — the acceptance criterion. With a stubbed success the banner
  and the "2 to check" badge both cleared. Payload inspected: only the flagged
  heading lines, no name, email, phone or address. Opt-out verified to issue no
  request at all, and to persist across a reload. Mobile 375px and light mode
  both check out.

  **Bug found and fixed while doing this.** `lowConfidence` paths were built
  from the *splitter's* index, not the entry's position in the finished array.
  Entries dropped as noise shift every later one, so the review panel could flag
  the wrong row — and refinement would have merged onto the wrong job. Paths are
  now assigned after the entry is pushed. Pre-existing Phase 1 defect, latent
  until Phase 2 made it load-bearing.

  Promotions (a bare title inheriting the employer above) are now flagged as a
  guess on `company` too. They are an inference, and the review panel should say
  so.

---

## Phase 3 — Polish

- [x] 14. Make `Header` responsive (`flex-wrap`, matching `CoverLetterBuilder`), then add
      the mid-session import button deferred from Phase 1 — **DONE**

  - `components/Header.tsx`: outer `<header>` lost `flex justify-between items-center`;
    an inner `flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`
    wrapper now stacks the title above the actions below `sm`. Actions row is
    `flex flex-wrap items-center gap-2` (was `space-x-4`, no wrap). Buttons scale
    `px-2 sm:px-3` / `text-xs sm:text-sm`, chevron `h-4 w-4 sm:h-5 sm:w-5`.
    `role="banner"` added. Mirrors `coverletter/CoverLetterBuilder.tsx:126-167`.
  - New **"Upload Resume"** button (teal, matches the `/resume-builder` card),
    first in the actions row. Opens the same `lazy()` `ImportResumeModal`,
    prefetched on hover/focus. Result goes straight to `onImport`
    (= `App.handleResumeChange`), **not** `handleImportResume` — the modal's
    `applyImportedContent(currentResume, …)` already carries over `resumeMode`,
    `layout`, `sectionOrder` and the photo, so a mid-session import is an
    in-place content swap with no navigation and no forced simple mode.
  - Main bundle 467.53 → 468.42 KB (+0.89); `ImportResumeModal` chunk unchanged
    at 41.87 KB — the parser did not leak into main.
  - Verified in-app: modal opens from the header, a PDF imported mid-session
    replaces content and stays on `/build-resume`; header at 375px wraps to
    title / [Upload Resume][Build Cover Letter] / [Download PDF] with no
    horizontal overflow (was a cramped 3-line bar); Download PDF dropdown
    still works.
- [x] 15. Confidence highlighting in the review panel — **DONE**

  - `components/ui/Input.tsx` gained an optional `highlight?: boolean` — amber
    border + `bg-amber-50` / `dark:bg-amber-900/10` + amber focus ring instead of
    blue. Default `false`, non-highlight output byte-identical to before, so the
    ~10 editor call sites are unaffected. Also now forwards a passed `className`.
  - `components/import/ImportReviewPanel.tsx`:
    - flagged `basics` inputs (`name`, `location`, `headline`) render
      `highlight` + `aria-describedby` → their `GuessHint` (which now takes an
      `id`). Empty-value flags (`name`/`location`) get "We could not read this —
      please add it"; `headline` keeps "We guessed this one, worth a check".
    - flagged experience rows: each `Input` highlights on its **own** path
      (`experience.${i}.company` / `.position`), and the card border turns amber
      when either is flagged.
    - Education: the accordion now shows the same **"N to check"** `CheckBadge`
      as Experience (`educationGuesses`), and a flagged entry gets an amber
      left-border + a "please confirm it in the builder" hint. (Education is a
      read-only list, so no `Input` highlight there.)
  - Bundle: main 468.42 → 468.61 KB (+0.19, `Input` is in the main chunk);
    `ImportResumeModal` chunk 41.87 → 43.12 KB. Parser still fully split out.
  - Verified in-app (light + dark) with a fixture flagging every path type:
    amber inputs carry the right `aria-describedby`, non-flagged fields
    (Full Name, Email, an unambiguous role) stay neutral, both accordion badges
    render, `npm test` 194 pass / 1 pre-existing fail.
- [x] 16. Column-detection tuning against real two-column resumes — **DONE**

  `utils/resumeImport/extractText.ts` `detectColumnSplit` reworked:
  - **Was:** take the single widest x-gap inside the middle 20–80% of runs,
    then check vertical independence once. Two failure modes:
    1. a **narrow rail** (contact-only sidebar, under a fifth of the runs) sits
       entirely below the `lower` index, so the loop never sees the gutter and
       the page interleaves;
    2. a two-column page whose **main column has right-aligned dates** makes a
       third x-cluster; when that cluster is big enough to fall in-window the
       widest gap lands between the body and its dates, not at the gutter.
  - **Now:** every gap ≥ `MIN_GUTTER_RATIO × span` with enough runs on both
    sides is a *candidate*; each is scored by `classifyLines` and the one that
    leaves the most lines cleanly on one side or the other wins. Right-aligned
    text still shares a line with the other side, so it never wins.
  - `MIN_COLUMN_SHARE` 0.2 → **0.15** (catches the narrow rail); the 0.5
    straddle limit is now the named `MAX_STRADDLING_LINE_RATIO` and also guards
    `leftOnly === 0` (mirror of the existing `rightOnly === 0` guard).
  - `__tests__/resumeImport/columnDetection.test.ts`: +4 tests — right-aligned
    dates in the main column (split + parser recovery), a full-width header
    band above the columns, and a contact-only narrow rail. Confirmed the old
    `detectColumnSplit` returns `null` on the narrow-rail fixture, so the test
    has teeth. All 10 column tests pass; suite 198 pass / 1 pre-existing fail.
  - Real two-column PDFs still can't be generated in this environment (no
    tooling), and `extractText` can't run under Jest, so coverage stays at the
    synthetic positioned-run level — which the test file itself notes is the
    right level for geometry. Single-column real-PDF import re-verified
    unchanged in-browser.
- [x] 17. Better scanned-PDF guidance — **DONE** (text-based PDF export still
      separate; see CONTEXT.md §10)

  - The single `scanned-pdf` state conflated two very different files: a resume
    the user exported from here (recoverable via Import JSON) and a genuine scan
    or photo (needs OCR). They now split on PDF metadata.
  - `extractText.ts` `extractPdf` reads `doc.getMetadata()` and keeps a
    lowercased `Producer` + `Creator` string. When the text layer is empty it
    pushes `own-export` if that string matches `jspdf|html2canvas|html2pdf`
    (BuildResumeNow's export stack), otherwise `scanned-pdf`. Metadata read is
    wrapped — its absence just means we can't self-identify.
  - `types.ts`: new `own-export` `ImportWarningCode`. `index.ts` throws a
    distinct `ImportError` for each.
  - `ImportResumeModal.tsx` error state:
    - `own-export` — "This is a resume you exported from BuildResumeNow…", a
      blue box pointing at **Import JSON on the Custom builder's Layout tab**,
      and `.json`/`.docx`/blank tips. (Was a *"Did you download this from…?"*
      guess; now a statement.)
    - `scanned-pdf` — "This PDF looks like a scan or photo…", a blue box with
      concrete OCR routes (Google Docs / Acrobat / Preview), and OCR/original-
      file/retype tips. No BuildResumeNow mention.
  - `ImportReviewPanel.test.tsx`: +2 tests backfilling **task 15** (amber
    highlight class + `aria-describedby` wiring; flagged-education badge + hint),
    since the component test infra was already there.
  - Verified in-browser with two hand-built text-less PDFs (`Producer` =
    `Adobe Scan…` vs `jsPDF 2.5.1`): each routes to its own guidance; a normal
    text PDF is unaffected by the metadata read. Suite 200 pass / 1 pre-existing
    fail.
