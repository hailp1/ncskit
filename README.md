# NCSKit

**A Serverless, WebAssembly-Powered Statistical Analysis Platform with Automated APA Interpretation**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JOSS](https://joss.theoj.org/papers/pending/status.svg)](https://joss.theoj.org)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.pending.svg)](https://zenodo.org)
[![WebR](https://img.shields.io/badge/WebR-0.5.8-blue)](https://docs.r-wasm.org/webr/latest/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)

---

## Summary

`NCSKit` is an open-source web application that runs a complete R statistical
environment — including `lavaan` and `seminr` — entirely within the
user's browser via [WebR](https://docs.r-wasm.org/webr/latest/) and
WebAssembly. No server performs any computation. No data leaves the client
machine. A lecturer can deploy NCSKit to an entire classroom via a single URL
at zero marginal infrastructure cost.

NCSKit also introduces the **Automated Statistical Insight Generation (ASIG)**
engine: a deterministic, rule-based system that translates raw R output into
publication-ready, APA 7th Edition narrative interpretations across 22 analysis
types. Unlike LLM-based tools, ASIG output is fully reproducible — identical
numeric input always produces identical prose.

**Live deployment:** [https://ncskit.org](https://ncskit.org)

---

## Statement of Need

| Problem | NCSKit's Solution |
|:--------|:-----------------|
| **Shiny Scaling Problem** — Shiny servers saturate under concurrent classroom load | All computation runs on the user's CPU via WASM; concurrent users never compete for shared resources |
| **Data privacy** — IRB/GDPR prohibit uploading sensitive data to cloud servers | Datasets are loaded into browser RAM only; no data ever traverses the network |
| **Interpretation gap** — Raw R output (p-values, loadings, fit indices) is routinely misread | ASIG deterministically maps every metric to APA-formatted prose grounded in peer-reviewed thresholds |

---

## Features

- **22 statistical analysis types** including CFA, EFA, PLS-SEM, CB-SEM, linear
  and logistic regression, mediation/moderation, ANOVA, t-tests, non-parametric
  tests, chi-square, cluster analysis, and descriptive statistics
- **ASIG engine** — deterministic APA 7 interpretation of every analysis,
  with inline citations (Hu & Bentler, 1999; Hair et al., 2017; Nunnally, 1978)
- **Methodological guardrails** — automatic Levene's Test before group comparisons,
  Welch correction on heteroscedasticity, VIF multicollinearity detection,
  Shapiro-Wilk normality warnings, Fornell-Larcker + HTMT discriminant validity
- **AutoPilot workflow** — chained analysis sequences (Reliability → EFA → CFA →
  SEM bootstrapping) triggered by a single click
- **Zero-install** — works in any modern browser (Chrome, Firefox, Edge, Safari)
- **PDF export** — APA-formatted reports with tables and narrative
- **R script export** — every analysis outputs the underlying R code for
  reproducibility in native R/RStudio
- **Offline caching (planned)** — IndexedDB (IDBFS) persistence is under
  development; per-session package loading (~15 s on first visit) is currently
  required. The RAM-only mode is fully stable.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Client)                  │
│                                                      │
│  ┌──────────────────┐    PostMessage (Channel 3)    │
│  │  Next.js 16 UI   │ ◄──────────────────────────► │
│  │  (React 19)      │                               │
│  └────────┬─────────┘    ┌────────────────────────┐ │
│           │               │  WebR Web Worker       │ │
│           │ JSON payload  │  (R 4.4.x / WASM)      │ │
│           ▼               │                        │ │
│  ┌──────────────────┐    │  lavaan, seminr         │ │
│  │  ASIG Engine     │    │  (self-hosted WASM pkgs)│ │
│  │  lib/asig/       │    └────────────────────────┘ │
│  │  22 interpreters │                               │
│  └──────────────────┘          No network I/O       │
└─────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

- **PostMessage channel (Type 3)** rather than SharedArrayBuffer (Type 0): ensures
  100% cross-browser stability at ~10% computational overhead. See `lib/webr/core.ts`.
- **Self-hosted R packages** in `public/webr_repo_v6/`: eliminates runtime CDN
  dependency and satisfies Vercel's Content Security Policy.
- **Deterministic ASIG** rather than LLM: guarantees reproducibility, prevents
  hallucinated citations, and makes every interpretation auditable.

---

## JOSS Reviewer Guide

NCSKit is designed for zero-configuration peer review.

### 1. Quick Start (no database required)

```bash
git clone https://github.com/hailp1/ncskit.git
cd ncskit
npm install        # ~3–5 min first time (downloads WebR WASM binaries)
npm run dev
```

Open **http://localhost:3000** — full analysis engine.

### 2. Verify numerical accuracy

```bash
# Compare NCSKit (WebR) output against native R on the lavaan Political Democracy dataset
# Results documented in BENCHMARK.md
npm run verify-math
```

Expected: all fit indices and path coefficients match native R to ≥ 5 decimal places.

### 3. Verify ASIG logic

The full decision-tree logic for all 22 analysis types is documented in
[`ASIG_LOGIC.md`](./ASIG_LOGIC.md) with explicit threshold values and citations.
Source code: `lib/asig/` (TypeScript, ~1,000 lines, no external AI dependencies).

### 4. Project structure

```
lib/
  asig/              # ASIG engine — 22 deterministic interpreters
    shared.ts        # APA formatting utilities + shared types
    basic.ts         # Correlation, t-tests, ANOVA, non-parametric, chi-square
    factor.ts        # Cronbach's Alpha / McDonald's Omega, EFA, CFA
    regression.ts    # Linear, logistic, mediation, moderation, cluster
    pls-sem.ts       # PLS-SEM: outer loadings, AVE, CR, HTMT, R²
    generator.ts     # Central dispatch router (switch over AnalysisType)
  webr/              # WebR engine wrapper, memory management, package loading
    core.ts          # WebR initialisation, crash recovery, gc lifecycle
    analyses/        # R script templates per analysis method
app/
  demo/page.tsx      # Zero-auth demo entry point (isDemo=true)
  analyze/           # Authenticated analysis workflow
  api/               # Next.js API routes (AI explain, auth, admin)
public/
  webr_repo_v6/      # Self-hosted WASM-compiled R packages (runtime)
  webr_core_v3/      # WebR core binaries (generated by postinstall)
tests/
  e2e/               # Playwright end-to-end tests including WebR accuracy
BENCHMARK.md         # Numerical parity: NCSKit vs native R
ASIG_LOGIC.md        # All 22 interpretation thresholds with citations
```

---

## Installation

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Local development

```bash
git clone https://github.com/hailp1/ncskit.git
cd ncskit
npm install
npm run dev
# → http://localhost:3000
```

`npm install` runs a `postinstall` script (`scripts/copy-webr.js`) that copies
the WebR WASM binaries from `node_modules/webr/dist` to `public/webr_core_v3/`.
This is required for the application to serve the WASM runtime correctly.

### Production (Vercel)

```bash
npm run build
npm start
```

Optional environment variables (copy `.env.example` to `.env.local`):

| Variable | Purpose | Required |
|:---------|:--------|:---------|
| `NEXT_PUBLIC_SUPABASE_URL` | User auth and profiles | No — app runs without it |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client | No |
| `GEMINI_API_KEY` | Server-side AI interpretation (optional feature) | No |

---

## Supported Analyses

| Category | Methods |
|:---------|:--------|
| Descriptive | Descriptive statistics with normality assessment |
| Correlation | Pearson, Spearman, Kendall |
| Group comparison | Independent t-test (+ Welch), paired t-test, one-way ANOVA (+ Welch), two-way ANOVA |
| Non-parametric | Mann-Whitney U, Kruskal-Wallis H, Wilcoxon Signed-Rank |
| Association | Chi-square test of independence (+ Fisher's Exact) |
| Reliability | Cronbach's Alpha, McDonald's Omega |
| Factor analysis | EFA (Parallel Analysis / Kaiser), CFA (lavaan) |
| Regression | Linear, logistic, mediation (Baron-Kenny + Bootstrap), moderation (simple slopes) |
| SEM | CB-SEM (lavaan), PLS-SEM (seminr) with bootstrapping |
| Diagnostics | VIF multicollinearity, Mahalanobis outlier detection, HTMT discriminant validity |

---

## Numerical Accuracy

NCSKit achieves perfect numerical parity with native R on validated datasets.
See [`BENCHMARK.md`](./BENCHMARK.md) for a full comparison on the `lavaan`
Political Democracy dataset:

- CFI, TLI, RMSEA, SRMR: identical to 3 decimal places
- All factor loadings: difference Δ < 0.00001

---

## Contributing

We welcome contributions. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for:

- How to add a new analysis method (R template + ASIG interpreter)
- How to extend or modify ASIG decision thresholds
- Code style and testing requirements

---

## Citation

If you use NCSKit in your research, please cite:

```bibtex
@article{le2026ncskit,
  author  = {Le, Phuc Hai},
  title   = {{NCSKit}: A Serverless, {WebAssembly}-Powered Statistical Analysis
             Platform with Automated {APA} Interpretation},
  journal = {Journal of Open Source Software},
  year    = {2026},
  note    = {Under review},
  url     = {https://github.com/hailp1/ncskit}
}
```

A machine-readable citation is available in [`CITATION.cff`](./CITATION.cff).

---

## License

MIT © 2026 Le Phuc Hai. See [`LICENSE`](./LICENSE).

---

## Acknowledgements

Special thanks to George Stagg and the [WebR project team](https://docs.r-wasm.org)
at Posit PBC, and to the authors of
[`lavaan`](https://lavaan.ugent.be/) (Rosseel, 2012) and
[`seminr`](https://github.com/sem-in-r/seminr) (Hair et al., 2021),
without whose foundational work serverless R statistical computing would not
be possible. Earlier prototypes used [`psych`](https://cran.r-project.org/package=psych)
(Revelle, 2023) for reliability analysis; the production implementation
re-implements all affected routines in pure base R to resolve WebAssembly
LAPACK incompatibilities.
