# InsafDost AI web client

Next.js web client for InsafDost AI, an experimental research tool for Pakistani law. You describe a legal situation, and the backend retrieves related authorities and drafts an analysis. The client streams progress from the backend, renders the result, and exports it as PDF or Word in the browser.

Live site: https://insafdostai.abdurrafaylabs.tech

This is a research aid. It is not legal advice and it can be wrong. Read the [terms](app/terms/page.tsx) and the [privacy policy](app/privacy/page.tsx) before you use it with real facts.

Backend repository: https://github.com/Abdurrafay19/insaf_dost_backend

---

## How it works

```
Browser (Next.js, App Router)
   |
   |  POST /analyze/stream  (Server-Sent Events)
   v
FastAPI backend on Hugging Face Spaces
   1. guardrail   checks that the text describes a legal dispute
   2. processor   extracts a category and legal search terms
   3. retriever   searches Pakistani case law in Qdrant and reranks
   4. reasoner    drafts the analysis from the retrieved authorities
   5. auditor     scores how closely the analysis follows those authorities
```

The client turns the event stream (`case_start`, `node_start`, `node_complete`, `case_complete`, `error`, `done`) into a progress tracker and a result card per matter.

---

## What the interface does

- Accepts 1 to 5 matters per submission, up to 15,000 characters each. These limits are a usability guard in the browser. They do not protect the backend. The backend must enforce its own limits.
- Shows a grounding score per matter. An AI model compares the start of the analysis with the first part of up to three retrieved authorities and rates how closely the analysis stays within them. It does not check that the law is correct.
- Exports a matter as PDF (jsPDF) or Word (docx). Both libraries load only when you click export.
- Keeps draft text in `sessionStorage` (cleared when the tab closes). Nothing is stored in `localStorage`.
- Sends security headers, including a Content Security Policy built in `next.config.ts`. The backend origin comes from `NEXT_PUBLIC_API_BASE_URL` at build time.
- Renders model output as Markdown with a link filter (`http`, `https`, and `#` only) and drops images.

## Known limitations

- On the backend's 200-query internal benchmark, the correct authority was in the top 3 results for 49.5% of queries. See `benchmarks/results.json` in the backend repository. Treat every result as a lead to verify.
- The PDF export uses jsPDF's built-in Helvetica font, which has no Arabic-script glyphs. Urdu text will not export correctly to PDF. Urdu input and display in the browser use `dir="auto"`, but Urdu is not otherwise tested.
- The first request after a quiet period can be slow or return a "starting up" message while the backend loads its models.

---

## Tech stack

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Runtime | React 19 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Documents | jsPDF, docx (dynamic imports) |
| Markdown | react-markdown |
| Analytics | Vercel Web Analytics and Speed Insights |
| Lint | ESLint 9 (flat config) |

---

## Project structure

```
app/
  layout.tsx            Root layout, fonts, metadata, header, footer
  page.tsx              Input, progress, and results
  privacy/page.tsx      Privacy policy
  terms/page.tsx        Terms of use
  opengraph-image.tsx   Social preview image
  robots.ts, sitemap.ts
  error.tsx, not-found.tsx
  globals.css           Design tokens (light and dark), base styles
components/
  case/                 CaseInputWorkspace, ExecutionTracker, LitigationBrief,
                        PrecedentList, ResultsNav, GroundingInfo
  layout/               Header, Footer, Disclaimer
  ui/                   Button, Badge, Card, Textarea
lib/
  export.ts             PDF, Word, and clipboard export
  insafdost-api.ts      SSE client
  markdown-lite.ts      Small Markdown parser used by the exporters
  site.ts               Site URL, repo URL, contact email
  use-session-storage.ts
  utils.ts
types/insafdost.ts      API and event types
```

---

## Getting started

Requires Node.js 20.9 or newer.

```bash
cp .env.example .env.local   # then edit the values
npm install
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Required | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Backend URL. Read at build time. It is also added to the CSP `connect-src`. If unset, it falls back to `http://127.0.0.1:8000`. |
| `NEXT_PUBLIC_SITE_URL` | No | Public site URL for canonical links, Open Graph, `robots.txt`, and the sitemap. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | No | Contact address on the privacy page. If unset, the page links to this repository. |

### Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint
npm run build
```

---

## API contract

```
POST /analyze/stream
Content-Type: application/json

{ "cases": ["Scenario 1 text", "Scenario 2 text"] }
```

The response is `text/event-stream`, parsed in [lib/insafdost-api.ts](lib/insafdost-api.ts).

| Event | Fields | Meaning |
| :--- | :--- | :--- |
| `case_start` | `case_num`, `total_cases` | A matter began |
| `node_start` | `case_num`, `node`, `label` | A pipeline node started |
| `node_complete` | `case_num`, `node` | A pipeline node finished |
| `case_complete` | `case_num`, `data` | The matter's full result |
| `error` | `case_num`, `detail` | The matter failed |
| `done` | none | The stream ended |

---

## License

MIT. See [LICENSE.md](LICENSE.md).
