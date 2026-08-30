# Resume Import — Session Context

**Purpose:** everything a fresh session needs to continue this work. Written
2026-08-30 at the end of Phase 1, updated the same day at the end of Phase 2.

**Repo:** `/Users/pranaydasari/projects/buildresumenow` (clone of
`djkoushik/Resume-Builder-AI`, branch `main`, deployed at buildresumenow.in).
**Nothing is committed.** All work — both phases — is uncommitted in the working
tree.

**Status**

| Phase | | |
| --- | --- | --- |
| **1 — local import** (tasks 1–10) | **done** | PDF/DOCX → text → sections → heuristics → review → builder. Entirely in the browser. Stands alone. |
| **2 — LLM refinement** (tasks 11–13) | **done** | `/api/parse-resume`, per-IP rate limiting, privacy disclosure, opt-out. Purely additive; absorbs every failure. |
| **3 — polish** (tasks 14–17) | **done** | Responsive `Header` + mid-session import button (14); confidence highlighting (15); column-detection tuning — multi-candidate gutter, narrower-rail threshold (16); scanned-PDF guidance split into `own-export` vs genuine scan, each with its own advice (17). Text-based PDF export remains a separate item — §10. |

To **test what exists**, go to §8 — a step-by-step playbook written for a
session with no prior context. §5 is the current state, §9 is what is left.

**Companion docs**
- [`PROJECT_CONTEXT.md`](../../PROJECT_CONTEXT.md) — whole-app architecture, design system, risks. Read this for anything outside the importer.
- [`design.md`](design.md) — the feature's design decisions.
- [`tasks.md`](tasks.md) — the task checklist with per-task results.

---

## 1. What the feature is

Experienced users already have a resume. Rather than retyping it, they upload a
**PDF or DOCX**, the app extracts and structures the content, they **review and
correct** it, and it loads into the builder.

**Entry point:** a third card on `/resume-builder` — "Upload Existing Resume"
(teal, badged "Fastest"), beside Simple and Custom. On mobile it comes **first**
in the DOM; on desktop it sits third via `md:order-3`.

Design mockups (9 artboards, desktop + mobile):
https://claude.ai/code/artifact/13740c46-fe9c-40dc-a1a7-b745be5daf67

---

## 2. Architecture

Everything runs **in the browser**. The file never reaches a server.

```
ImportResumeModal
  1. File select (.pdf / .docx, <= 10 MB)
  2. EXTRACT   utils/resumeImport/extractText.ts    (lazy-loads pdfjs / mammoth)
  3. SPLIT     utils/resumeImport/sectionSplitter.ts
  4. PARSE     utils/resumeImport/heuristicParser.ts
  5. REFINE    utils/resumeImport/aiRefine.ts -> POST /api/parse-resume
               optional, opt-out-able, never blocking, flagged entries only
  6. NORMALIZE utils/resumeImport/normalize.ts
  7. REVIEW    ImportReviewPanel -> user confirms
  8. applyImportedContent() -> App.handleResumeChange()
```

**No dictionary of technologies.** The parser has never heard of "Kubernetes".
It works on *shape*: heading wordings (~50), company suffixes (22), job-title
words (26). The 267-entry `standardSkills` list in `utils/ats/canonicalMap.ts`
belongs to the **ATS scorer**, a separate server-side feature; the importer
references it zero times.

### Files

**New**
```
utils/resumeImport/types.ts            85   ImportedContent, ParsedResume, ImportError
utils/resumeImport/extractText.ts     536   PDF/DOCX -> text; columns, pages, headers, own-export vs scan
utils/resumeImport/sectionSplitter.ts 325   headings, section blocks, entry splitting
utils/resumeImport/heuristicParser.ts 598   text -> ResumeData content
utils/resumeImport/normalize.ts       205   ids, dates, bullets, caps, empty defaults
utils/resumeImport/index.ts            93   pipeline orchestration
utils/resumeImport/aiRefine.ts        150   optional refinement; absorbs every failure
api/parseResumeSupport.ts             280   guards, rate limiter, prompt, schema
utils/resumeData.ts                   123   mergeResumeData, isPristineResume
components/import/ImportResumeModal.tsx  393
components/import/ImportReviewPanel.tsx  246
__tests__/resumeImport/                     8 suites, 103 tests, 6 text fixtures
vite-env.d.ts                               for the `?url` worker import
```

**Modified**
```
api/index.ts                             + POST /api/parse-resume, trust proxy
components/legal/PrivacyPolicy.tsx       + AI Processing subsection under section 7
App.tsx                                  + handleImportResume
components/Header.tsx                     responsive flex-wrap + "Upload Resume" mid-session import (task 14)
components/ui/Input.tsx                   + optional `highlight` (amber "unsure" state) for task 15
components/ResumeBuilderPage.tsx         + third card, lazy modal
components/customization/CustomizationPanel.tsx  uses shared mergeResumeData
components/ui/Accordion.tsx              + optional `meta` slot (trailing content)
package.json                             + pdfjs-dist@6.2.108, mammoth@1.12.2
                                         + ts-jest, @types/jest (devDeps)
```

---

## 3. Decisions that must not be undone

Each of these exists because something broke. Reverting any reintroduces a bug.

| Decision | Why |
| --- | --- |
| `mergeResumeData(data, {source})` — `'file'` defaults missing sections to **empty**, `'json'` keeps the old fallback-to-seed | Without it, a resume with no Projects inherited **John Doe's projects**, and a missing phone became **(555) 123-4567**, silently, into the exported PDF |
| `isPristineResume` compares **content fields only** | Navigation sets `resumeMode`, so a whole-object compare flagged every Custom-mode user as having unsaved work |
| Data is set **before** navigating in `handleImportResume` | Route handlers use functional updates; reversed, a plain set clobbers `resumeMode` to `undefined` and breaks `isSimpleMode` |
| `normalize` emits **every** section explicitly | Omission is what triggers the seed fallback |
| ids are `` `${Date.now()}-${index}` `` | Editor sections use bare `Date.now()`; a bulk insert gives every row the same id |
| Bullets converted to `"* "` | `renderSummaryList` splits on `\n` and tests `startsWith('*')`; anything else renders as flat paragraphs in all six templates |
| Dates normalised to `"January 2019"` | `atsService` runs `new Date()` over them; `"03/2019"` does not parse |
| `references` is a **string** | It is `string` in `ResumeData`, not an array |
| In-modal guidance uses `<button>`, never `<a>` | `App.tsx` intercepts every same-origin link and navigates away |
| Modal is `lazy()` + prefetched on hover | Static import put the whole parser in the main bundle (+37 KB); lazy costs +5 KB |
| Import modal has its **own** shell, not `ATSModal` | `ATSModal` has `pb-20` dead space and no `w-full` below `sm:`. `ATSModal` itself is deliberately untouched |
| DOCX uses `convertToHtml`, not `extractRawText` | `extractRawText` throws away table boundaries **and** Word bullet markers |
| Column split requires **vertical independence** | Right-aligned dates produce two x-clusters too; only real columns own their own lines |
| Column size floor counted in **lines**, not runs | Runs-per-line is a property of the PDF generator, not the layout |
| Gutter is chosen from **all** candidate gaps, not just the widest (task 16) | A two-column page with right-aligned dates in the main column has three x-clusters; the widest gap is body→dates, not the real gutter. Each wide-enough gap is scored by how cleanly it divides the lines; the best wins |
| Unknown-heading detection needs **both** neighbours checked | Checking only the next line misclassifies the last acronym in a run and truncates the section |
| Wrapped bullet lines rejoin their bullet (lowercase start) | Otherwise a wrapped line becomes a second job named after the sentence tail |
| `lowConfidence` paths keyed on the entry's **position in the finished array**, assigned after it is pushed | The splitter's index diverges the moment an entry is dropped as noise. The review panel flagged the wrong row, and refinement would have merged onto the wrong job |
| Refinement sends **only flagged entries**, and skips the call entirely when there are none | A cleanly parsed resume should make no network call at all |
| A count mismatch discards the model's reply **whole** | The merge is by index; a dropped or invented entry shifts every later job onto the wrong employer. There is no safe partial recovery |
| Refinement never blanks a value — an empty field from the model keeps the heuristic's | A model returning `""` must not be able to delete an employer we already read correctly |
| Declining AI shows **no** `ai-unavailable` banner | That banner means "we tried and could not". A deliberate choice is not a failure |
| Refinement lives inside the existing `structuring` stage | It sometimes does not happen; its own stage would flicker in and out of the progress list |
| Endpoint failure is **502, not 500** | Nothing is broken for the user — we simply have nothing to add |

---

## 4. Bugs found during Phase 1

All fixed, all covered by regression tests. Listed so they are recognisable if
they resurface.

**Extraction**
1. `doc.destroy()` does not exist on a pdfjs 6 document proxy — it is on the loading task. Leaked a worker per import.
2. pdfjs's standard build needs `DOMMatrix`; jsdom lacks it, so `extractText.ts` can never be unit-tested in Jest. Tests use text fixtures and synthetic coordinates.
3. mammoth's browser build accepts **only** `{arrayBuffer}`; a broken browser-field substitution fails at runtime, not build time.
4. DOCX arrived uniformly double-spaced from `extractRawText`, so a two-job resume read as five.
5. DOCX tables lost all cell/row boundaries — an education table merged both degrees into one entry.
6. Word bullets carry no literal bullet character, so achievements rendered as paragraphs.
7. Running headers/footers landed inline as resume content.
8. A job split across a page break became two jobs.

**Parsing**
9. An email local part matched the website pattern (`sam.taylor@outlook.com` -> website `sam.taylor`).
10. A wrapped URL truncated the profile handle (`linkedin.com/in/pr` + `iyasharma` -> username `pr`).
11. An all-caps job title under an all-caps name **discarded email and phone**.
12. An all-caps comma list (`HTML, CSS, JAVASCRIPT`) read as a heading and emptied the section.
13. A run of all-caps acronyms (`AWS`/`DOCKER`) each read as headings.
14. A year range in the contact block was stored as the phone number.
15. A `CONTACT` heading discarded the contact block (sidebar layouts always label it).
16. `Title, Company` and `Title at Company` were never split.
17. A suffix-less employer was swallowed by the location (`Stripe, San Francisco, CA`).
18. A prose description instead of bullets was dropped entirely.
19. A phone with a parenthesised area code and a 7-digit local part (`(555) 123-4567`) was dropped — the `PHONE` inner run required 9+ chars after the `(NNN)` group; loosened `{7,14}` → `{5,14}`, `isPlausiblePhone` still enforces the real 7-digit floor. (Found while testing Phase 2; regression test added.)

**Process note:** several of these passed unit tests and were caught only by
driving the real app in a browser. Do both.

---

## 5. Current state

| | |
| --- | --- |
| `npx tsc --noEmit` | exit 0, zero errors project-wide |
| `npm test` | **200 pass, 1 fail** |
| The 1 failure | `__tests__/integration/CoverLetterWorkflow.test.tsx:289` — **pre-existing**, unrelated, failing before this work started |
| Import test suite | 10 suites, 148 tests |
| Main bundle | 468.61 KB (baseline 459.95, so **+8.66 KB**; +0.89 task-14 header, +0.19 task-15 `Input`) |
| Lazy chunks | ImportResumeModal 44.64 KB (Phase 3 grew it ~2.8 KB — highlight markup + scanned-PDF copy), pdfjs 479 KB, mammoth 504 KB, pdf worker 1.26 MB asset |

### Verified in the running app
Single-column PDF, two-column PDF, multi-page PDF with running header/footer and
a role split across the break, plain DOCX, table-based DOCX (`w:tbl`),
scanned/image PDF, a genuine BuildResumeNow export, a `.doc` renamed to `.docx`,
a corrupt PDF, a password-protected PDF, mobile (375px) and dark mode, the
overwrite-warning both ways, and the existing JSON import unchanged.

**Phase 2, additionally:** the endpoint absent entirely (vite alone returns a
hard 500) — banner shown, all content intact; a stubbed success — banner and
"2 to check" badge both cleared, dates and bullets untouched; the request
payload inspected and confirmed to carry only flagged heading lines, with no
name, email, phone or address; the opt-out issuing **no request at all** and
persisting across a full reload; the new checkbox at 375px in light mode.

There are **no API keys in this working copy**, so the real Gemini and
OpenRouter paths have never executed here. That is a *local* limitation:
production already has both keys, and `/api/parse-resume` reuses `/api/ai`'s
env vars rather than adding its own. The provider calls are the one part of
Phase 2 unverified against a live service — first real exercise will be on
deploy.

### Known gaps (deliberate)
- **Non-English resumes** — untested.
- **Unrecognised sections** (`AWARDS`, `PUBLICATIONS`) are discarded; `ResumeData` has nowhere to put them.
- **Company/position where the employer has no suffix AND the title is outside the 26-word list** — a positional guess, flagged "we guessed this" in the review. Phase 2's refinement resolves these when it is reachable and the user has not opted out; when it is not, the flag stands and the review panel asks the user to check.
- A `.pages` file renamed to `.docx` reports "corrupt", which is accurate but not specific.

---

## 6. Phase 2 — LLM refinement (shipped)

Phase 2 is **purely additive accuracy**. It changes no data shape. If it never
runs, the feature still works. Do not let it become load-bearing.

### 6.1 Rate limiting and privacy (task 11)

**Per-IP, in memory**, in `api/parseResumeSupport.ts`: 6 per 10 minutes to stop
bursts, 40 per day to bound the bill. The app has no sign-in — every
`<AuthButton />` call site is commented out — so an IP is the only handle a
request carries. `app.set('trust proxy', true)` is required for `req.ip` to
resolve behind Vercel's TLS termination.

**The known limitation is accepted, not overlooked.** Each warm Vercel instance
holds its own map, so the true ceiling is (instances × limit). It stops a
scripted loop, which is the realistic threat. Everything goes through
`checkRateLimit(ip)` so a shared KV store is a one-function replacement.
Note `/api/ai` remains an open unmetered LLM proxy — see `PROJECT_CONTEXT.md`
§10. That is untouched and still worth fixing.

**Privacy Policy** gained an "AI Processing" subsection under §7. It covers
*both* AI paths — including `/api/ai`, which was sending resume text to third
parties with no disclosure at all before this.

**Opt-out:** a checkbox on the upload screen, on by default, stored under
`buildresumenow:import-ai-refine`. Unticked, the import is entirely local.

### 6.2 The endpoint (task 12)

`POST /api/parse-resume` in **`api/index.ts`** — the only live API, since
`vercel.json` rewrites all of `/api/*` to it and the sibling `api/*.ts` handlers
are unreachable duplicates. Guards, prompt and schema live in
`api/parseResumeSupport.ts`, split out to be unit testable without Express.

```
Request   { blocks: { experience: string[], education: string[] } }
Response  { success: true,  data: { experience: [...], education: [...] }, provider }
          { success: false, error: string }
```

**Gemini first, OpenRouter second — inverted versus `/api/ai`.** Gemini supports
`responseMimeType: 'application/json'` with a `responseSchema`; OpenRouter's free
deepseek model has no such guarantee and will occasionally return prose in a code
fence, which is why `parseModelJson` exists.

The model is asked for `company`/`position`/`location` and
`institution`/`degree`/`areaOfStudy` and **nothing else**. Dates, bullets and
skills are already resolved deterministically and are more reliable than a model.

Guards: `express.json()`'s 100 KB default; 25 blocks and 4,000 chars per block,
**truncated rather than rejected**; a 12 s provider timeout (`abortSignal` for
Gemini, a `Promise.race` for OpenRouter, whose SDK takes no signal); server-side
schema validation; and a reply whose array length does not match the input is
**discarded whole**.

### 6.3 Client integration (task 13)

`utils/resumeImport/aiRefine.ts`, called from `utils/resumeImport/index.ts`
after `parseResumeText`. Only entries the heuristics flagged are sent — often
zero, in which case there is no call. On success it overwrites only
company/position/location and the education equivalents, and clears those
`lowConfidence` paths. On **any** failure it returns the input with
`'ai-unavailable'` appended to `warnings`, which `ImportReviewPanel` renders as a
notice, not an error.

**If you change anything here, re-test by forcing the endpoint to fail.** That
Phase 1 survives intact is the acceptance criterion, and `aiRefine.test.ts`
exists mostly to assert that nothing happened.

### 6.4 Cost

~3–5K input tokens, ~2K output per resume on `gemini-2.5-flash-lite` — a
fraction of a cent, and only for resumes with ambiguous headings. Cost was never
the constraint; abuse and privacy were.

---

## 7. Running and verifying

```bash
npx vite --port 3000        # what to use while testing import
```

A `.claude/launch.json` now defines a **vite-only** `vite` configuration, so
`preview_start` cannot accidentally bring up the API and steal the port.

**Do not use `npm run dev` while testing import in a Claude Code preview.** It
starts the Express API alongside Vite via `concurrently`, and when `PORT=3000`
is set in the environment the API steals Vite's port — you get a 404 shell
instead of the app. The importer is entirely client-side and needs no API
server. In a normal terminal with `PORT` unset, `npm run dev` is fine.

```bash
npx tsc --noEmit                 # must be exit 0
npm test                         # 193 pass, 1 pre-existing failure
npx jest __tests__/resumeImport  # the import suite alone
npm run build                    # check the lazy chunks still split
```

**There are no API keys in this working copy**, so `/api/parse-resume` cannot be
exercised against a live provider locally. Test the client by stubbing
`window.fetch` in the browser (that is how the success path was verified), and
test the server's guards through `__tests__/resumeImport/parseResumeSupport.test.ts`.

**Test fixtures** live in `__tests__/resumeImport/fixtures/` as **text**, not
binaries — `extractText.ts` cannot run under jsdom (see bug 2). Column detection
is tested with synthetic positioned runs, which is the right level for it.

To generate real binary files for manual browser testing: `cupsfilter x.txt >
x.pdf` and `textutil -convert docx x.html -output x.docx` on macOS. Note
`textutil` **flattens HTML tables**, so a real `w:tbl` DOCX must be built by
hand as a zip (see `tasks.md`). Stage such files in `public/` to fetch them from
the page, and **delete them afterwards**.

---

## 8. Testing the whole feature, step by step

Written for a session starting with no context. Work top to bottom; each stage
assumes the one before it passed.

Two things about this feature make testing it unusual, and both have bitten
already:

- **`extractText.ts` cannot run under Jest.** pdfjs's standard build needs
  `DOMMatrix`, which jsdom lacks. Everything from a real file onward can only be
  tested in a browser. Unit tests use text fixtures.
- **Several Phase 1 bugs passed unit tests and were caught only in the running
  app.** Green tests are necessary and not sufficient. Do both stages.

---

### Stage 0 — Preconditions

```bash
cd /Users/pranaydasari/projects/buildresumenow
git status --short        # everything should still be uncommitted
```

There are **no `.env` files and no API keys** in this working copy. That is
expected and is not a missing setup step: production holds both provider keys
already, and `/api/parse-resume` reuses `/api/ai`'s env vars rather than adding
its own. It simply means `/api/parse-resume` cannot reach a live model *here*,
so the AI success path is stubbed (stage 4). Do not go looking for keys, and do
not create a `.env` without asking the user.

### Stage 1 — Static checks

```bash
npx tsc --noEmit
```
Must be **exit 0, no output**. Anything else is a regression — this was taken
from ~40 errors to 0 by making `ts-jest`/`@types/jest` real devDependencies.

```bash
npm test
```
Expect **193 pass, 1 fail**. The one failure must be
`__tests__/integration/CoverLetterWorkflow.test.tsx:289` (a company-validation
toast). It is **pre-existing and unrelated** — it was failing before any of this
work started. Any *other* failure is real.

```bash
npx jest __tests__/resumeImport
```
Expect **10 suites, 141 tests, all passing**. The two Phase 2 suites are worth
knowing by name:
- `parseResumeSupport.test.ts` — the server guards: block caps, schema
  validation, the count-match rule, code-fence parsing, and the rate limiter's
  window arithmetic (driven by an injected `now`, so it is instant and not flaky).
- `aiRefine.test.ts` — the client. Most of it asserts that **nothing happened**:
  network error, timeout, non-200, 429, non-JSON body, `success:false`, missing
  data, count mismatch. Each must leave the heuristic result byte-identical and
  add exactly one `ai-unavailable` warning.

```bash
npm run build
```
Confirm the chunks still split — if pdfjs or mammoth lands in the main bundle,
something switched to a static import. Expected roughly:

| chunk | size |
| --- | --- |
| `index-*.js` (main) | ~467 KB |
| `ImportResumeModal-*.js` | ~42 KB |
| `pdf-*.js` | ~479 KB |
| `index-*.js` (mammoth) | ~505 KB |
| `pdf.worker.min-*.mjs` | ~1.26 MB asset |

### Stage 2 — Start the app

```bash
npx vite --port 3000
```

Or `preview_start` with the **`vite`** configuration from `.claude/launch.json`,
which exists precisely to make this the easy path.

**Do not use `npm run dev` here.** It starts the Express API alongside Vite via
`concurrently`, and when `PORT=3000` is set in the environment the API steals
Vite's port — you get a 404 shell instead of the app. In a normal terminal with
`PORT` unset it is fine.

Navigate to `/resume-builder`. Three cards; "Upload Existing Resume" is the teal
one badged "Fastest".

### Stage 3 — Driving the modal (read this before clicking anything)

The file input is `display:none`, so there is no file picker to drive. Stage a
file in `public/` and dispatch it:

```js
const res = await fetch('/__import-test.pdf');
const buf = await res.arrayBuffer();
const input = document.querySelector('input[type=file]');
const dt = new DataTransfer();
dt.items.add(new File([buf], 'test.pdf', { type: 'application/pdf' }));
input.files = dt.files;
input.dispatchEvent(new Event('change', { bubbles: true }));
await new Promise(r => setTimeout(r, 3000));
```

The input is rendered in **every** phase, so this works to re-import without
closing the modal first.

Three gotchas, all hit during Phase 2:

- **Screenshots go stale.** A screenshot taken right after an import showed the
  previous render and cost real time chasing a bug that did not exist. **Assert
  on `document.body.innerText`**, not on a picture. Screenshot only to check how
  something *looks*.
- **The click tool times out on this page** (30 s, repeatedly, on the card and
  on refs from `find`). Fall back to a JS `.click()`, walking up from the text
  node until the modal opens:
  ```js
  const nodes = [...document.querySelectorAll('*')].filter(e => e.textContent.includes('Upload and Continue'));
  let el = nodes[nodes.length - 1];
  for (let i = 0; i < 6 && el; i++) { el.click(); await new Promise(r => setTimeout(r, 400)); if (/Drop your resume|Choose your resume file/.test(document.body.innerText)) break; el = el.parentElement; }
  ```
- **Clean up `public/` afterwards.** `rm -f public/__import-test.pdf`. Nothing
  staged for a test may survive the session.

Generating fixtures on macOS:
```bash
cupsfilter resume.txt > public/__import-test.pdf
textutil -convert docx resume.html -output test.docx
```
`textutil` **flattens HTML tables**, so a genuine `w:tbl` DOCX has to be built
by hand as a zip.

### Stage 4 — Phase 2: the AI refinement

This is the part most worth re-testing, because its whole design claim is that
it can fail without anyone noticing.

**A fixture that actually triggers it.** Refinement only fires on entries the
heuristics *flagged*, so an easily parsed resume tests nothing. You need an
employer with no company suffix and a job title outside the 26-word list:

```
Flipkart, Bengaluru, India
Growth Pod Lead
March 2021 - Present
* Grew activation 24% across three cohorts

Razorpay
Payments Craftsperson
January 2019 - February 2021
* Shipped the UPI retry path
```

To check what the parser makes of a fixture without a browser, run
`parseResumeText` under `npx tsx` with an **absolute** import path and print
`lowConfidence` and `rawHeadings`. The fixture above yields six flagged paths
and three raw headings.

**4a. The failure path — this is the acceptance criterion.** With vite alone,
`/api/parse-resume` does not exist, so the request fails hard on its own. Import
and assert:

```js
const body = document.body.innerText;
({ banner: body.includes('without AI assistance'),   // must be TRUE
   badge:  /\d+ to check/.exec(body)?.[0],           // must still be there
   header: /Found [^\n]*/.exec(body)?.[0] })         // "Found 2 roles, 1 degree and 4 skills"
```
Every field must be intact — name, email, phone, location, roles, skills. **If
Phase 1 content is degraded in any way, that is the bug**, not the missing
endpoint.

**4b. The success path — stub it at the network boundary.** No keys here, so:

```js
const real = window.fetch;
window.fetch = async (url, init) => {
  if (typeof url === 'string' && url.includes('/api/parse-resume')) {
    window.__sent = JSON.parse(init.body);          // inspect this
    return new Response(JSON.stringify({ success: true, provider: 'gemini', data: {
      experience: [ { company: 'Flipkart', position: 'Growth Pod Lead', location: 'Bengaluru, India' },
                    { company: 'Razorpay', position: 'Payments Craftsperson', location: 'Bengaluru, India' } ],
      education:  [ { institution: 'Some Place Of Learning', degree: 'Advanced Studies', areaOfStudy: 'Design' } ]
    }}), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return real(url, init);
};
```
Import, then assert **both** halves:
- the banner is gone and the "N to check" badge is gone;
- `window.__sent` contains **only** the flagged heading lines. Grep it for the
  fixture's name, email, phone and city — **all four must be absent**. This is
  the privacy claim made in the Privacy Policy and in the modal's own copy; it
  is the single most important assertion in this stage.

Also confirm dates, bullets and ids survived. Refinement may only touch
company / position / location and the education equivalents.

**4c. The opt-out.** Untick "Use AI to sort out unclear job titles", import
again, and assert:
- `window.__sent` is still `null` — **no request at all**, not a request that
  was ignored;
- `localStorage.getItem('buildresumenow:import-ai-refine') === 'off'`;
- the "N to check" badge is back (heuristic flags stand);
- **no** `ai-unavailable` banner. Declining is a choice, not a failure — if the
  banner appears here, that is a bug.

Reload the page and reopen the modal: the checkbox must still be unticked.

**4d. Count mismatch.** Change the stub to return three experience objects for
two blocks. The whole reply must be discarded — banner shown, heuristic values
untouched. A partial merge here would silently attach every later job to the
wrong employer, which is why the rule is all-or-nothing.

**What cannot be tested here:** the actual Gemini and OpenRouter calls. They
have never executed against a live service, because this working copy has no
`.env`. Note this is a *local* gap only — Vercel already holds both keys (§9),
and the endpoint reuses `/api/ai`'s variables rather than adding its own, so
nothing needs provisioning before deploy.

To exercise the providers for real you would need a `.env.local` with
`GEMINI_API_KEY` (or `API_KEY`) and/or `OPENROUTER_API_KEY`, plus the Express
server running — `npm run server`, with `PORT` unset — and Vite pointed at it.
**Ask the user before creating any such file**; do not go looking for keys.

### Stage 5 — Phase 1 regression sweep

Phase 2 refactored how `lowConfidence` paths are assigned (see §3), so the
parser is not untouched. Re-drive the file types:

single-column PDF, two-column PDF, multi-page PDF with a running header/footer
and a role split across the page break, plain DOCX, table-based DOCX with real
`w:tbl` elements, a scanned/image PDF, a BuildResumeNow-exported PDF, a `.doc`
renamed `.docx`, a corrupt PDF, a password-protected PDF.

Expected error handling: a genuine scan gets OCR guidance (Google Docs /
Acrobat / Preview) and no Import-JSON pitch; a BuildResumeNow export is
identified by its `jsPDF` metadata and pointed at Import JSON on the Custom
builder's Layout tab; the password-protected and corrupt files each get their
own three tips. (Our own PDFs are rasterised and have no text layer — see §10.)

Then: **mobile 375px and dark mode**, the overwrite warning both ways (pristine
vs. edited resume), and confirm the pre-existing JSON import still behaves.

### Stage 6 — Finish and report

- `rm -f public/__import-test.pdf` and anything else staged.
- Reset any emulated viewport.
- Report the pre-existing `CoverLetterWorkflow` failure as pre-existing —
  do not present it as new, and do not try to fix it as part of this work.

---

## 9. What is next

Phase 3 (tasks 14–17 in `tasks.md`) is **complete** — responsive `Header` with
the mid-session "Upload Resume" button, confidence highlighting in the review
panel, column-detection tuning (multi-candidate gutter + narrower-rail
threshold), and scanned-PDF guidance split into `own-export` vs genuine scan.

What is left is not Phase 3:
- **Text-based PDF export** (§10) — the `html2pdf` rasterisation that makes our
  own exports unreadable by both this importer and real ATS software.
- **The in-memory rate limiter** on `/api/parse-resume` (§6.1) — move
  `checkRateLimit` to Vercel KV / Upstash if the endpoint sees real traffic.
- **The ATS scorer's word-boundary bug** (§10) — the user asked for this after
  the importer.
- Still uncommitted: the entire feature plus all of Phase 3.

**Before this reaches production**, two things are worth a decision rather than
a default:
- **Provider keys — already satisfied, no action needed.** `/api/parse-resume`
  reads the *same* env vars as the existing `/api/ai` (`API_KEY` ||
  `GEMINI_API_KEY`, and `OPENROUTER_API_KEY`) and introduces none of its own.
  Confirmed live on 2026-08-30: `GET https://buildresumenow.in/api/health`
  returns `openRouterConfigured: true, geminiConfigured: true`. The endpoint
  will work on deploy. **Locally** there is no `.env`, which is why the AI path
  has to be stubbed here (§8 stage 4).
- **The in-memory rate limiter** is deliberately imperfect (§6.1). If the
  endpoint sees real traffic, move `checkRateLimit` to Vercel KV / Upstash.

---

## 10. Adjacent work the user has raised

- ~~**The ATS scorer bug**~~ — **fixed** (2026-08-30, after the importer). `services/atsService.ts` now uses a `mentions()` token-boundary matcher instead of `text.includes(skill)`; the `"3+ years of react and docker…"` JD no longer returns `"r"`. Also removed the `debug_ats.log` filesystem write and escaped the bonus/critical regex. Tests: `__tests__/services/atsService.test.ts`. See `PROJECT_CONTEXT.md` §11.4/§11.5.
- **Text-based PDF export.** `html2pdf` rasterises via html2canvas, so BuildResumeNow's own PDFs contain an image and no text layer. Consequences: a user cannot re-import a resume they downloaded (the importer detects this and points them at Import JSON), **and those PDFs are not readable by real ATS software** despite "ATS-friendly" being the product's core claim. Fixing export repairs both.
