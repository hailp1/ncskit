# Changelog

All notable changes to NCSKit are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.1] - 2026-09-13

### Fixed
- **Middleware crash (`MIDDLEWARE_INVOCATION_FAILED`)**: Added top-level
  `try/catch` around the entire middleware function so any unhandled error
  from `updateSession` (Supabase timeout, missing env var, network issue)
  falls through gracefully with `NextResponse.next()` instead of returning
  a 500 to the user.
- **Domain redirect**: Updated `REDIRECT_HOSTS` list in middleware to redirect
  `ncskit.org`, `www.ncskit.org`, `stat.ncskit.org`, `ncsstat.ncskit.org`
  all to the canonical domain `ncskit.org`.
- **ASIG analysisType aliases**: All result components now correctly map to
  their ASIG interpreters (`wilcoxon` → `wilcoxon_signed`, `chisquare` →
  `chi_square`, `regression` → `linear_regression`, `logistic` →
  `logistic_regression`, `cronbach`/`omega` → `cronbach_alpha`).
- **TypeScript errors (0)**: Fixed `runBlindfolding`, `runMGA` optional params;
  removed stray `columns` arg from `runIPMA`; removed non-existent `columns`
  prop from `HTMTResults`.
- **Rate-limit 429 error**: `UnifiedASIGInterpretation` now calls
  `generateInterpretation()` directly client-side instead of via
  `/api/template-interpret`, eliminating the 10 req/min rate limit entirely.

### Changed
- Canonical domain updated to `open.ncskit.org` across README, paper.md,
  CITATION.cff, and `.env.example`.
- Extended WASM file exclusions in middleware matcher (added `.ico`, `.ttf`,
  `.woff`, `.woff2`).

---

## [0.1.0] - 2026-09-13

### Added
- **UnifiedASIGInterpretation component** (`components/results/shared/UnifiedASIGInterpretation.tsx`):
  Merges the former `TemplateInterpretation` (auto-fire ASIG widget) and
  `AIInterpretation` (button-triggered AI widget) into a single rich panel.
  Features: verdict badge (pass / warning / fail), APA statement copy box,
  expandable technical details, collapsible warnings, numbered recommendations,
  and collapsible citations. Auto-fires via `useEffect` on mount.
- **ASIG interpreter enrichment**: all 19 interpreters across `lib/asig/basic.ts`,
  `factor.ts`, `regression.ts`, `pls-sem.ts`, and `generator.ts` now return
  three new optional fields on `InterpretationResult`:
  - `verdict`: `'pass' | 'warning' | 'fail'` — computed from the primary test metric.
  - `apaStatement`: a single manuscript-ready APA 7 sentence for direct copy-paste.
  - `recommendations`: 2–3 concrete next-step bullet points.
- **Null-safety fixes**: `KruskalWallisResults`, `ChiSquareResults`,
  `SEMPathDiagram`, `ResearchModelDiagram`, `MGAResults`, `BootstrapResults`,
  `ANOVAResults` — all `.toFixed()` calls now guarded against `null`/`undefined`.
- **Result component wiring**: `ResultsDisplay.tsx` now lazy-loads and renders
  `BootstrapResults`, `BlindFoldingResults`, `MGAResults`, `IPMAResults`,
  `HTMTResults`, `VIFResults`, `OutlierResults`, and `OmegaDetailResults`.
- **PLSSEMView**: replaced placeholder stubs with full UI blocks for Bootstrap,
  Blindfolding, MGA, and IPMA sub-analyses.
- **PLSResults**: added Outer Loadings table (Hair et al., 2017 thresholds) and
  f² Effect Size table (Cohen, 1988 benchmarks).

### Changed
- `TemplateInterpretation` replaced with `UnifiedASIGInterpretation` across all
  23 result components; `AIInterpretation` removed from `ResultsDisplay.tsx`.
- `InterpretationResult` type in `lib/asig/shared.ts` extended with
  `verdict?`, `apaStatement?`, `recommendations?` (all optional — fully
  backward-compatible).
- README: removed incorrect claims (psych as active runtime dep, IDBFS offline
  capable); fixed R version in architecture diagram (4.4.x); corrected
  architecture diagram; updated Acknowledgements.
- CITATION.cff: synced title and affiliation to match `paper.md` exactly.

### Fixed
- Admin RBAC architecture refactored to Server Components with HTTP 307 redirect.
- `page.tsx` (analyze) reduced from ~82 KB to ~15 KB via hook extraction.

---

## [2026-09-08] - Architecture & Security Refactoring (pre-versioning)

### Changed
- **Analysis Engine (`app/analyze`)**: decoupled from God Object anti-pattern.
  `page.tsx` broken into `useAnalyzeLifecycle.ts`, `useAnalysisRunner.ts`,
  and `AnalyzeStepRenderer.tsx`. Page size: ~82 KB → ~15 KB.
- **Admin RBAC**: client-side protection replaced with Server Components.
  `app/admin/layout.tsx` is now a Server Component; unauthorised users receive
  HTTP 307 Redirect before HTML renders.
- **Repository maintenance**: removed ~25 MB of Git bloat (`.tgz` R packages,
  large tree files).
