---
title: 'NCSKit: A Serverless, WebAssembly-Powered Statistical Analysis Platform with Automated APA Interpretation'
tags:
  - WebAssembly
  - WebR
  - statistical analysis
  - structural equation modeling
  - automated interpretation
  - edge computing
  - R language
  - open science
authors:
  - name: Le Phuc Hai
    orcid: 0009-0004-1215-5023
    corresponding: true
    affiliation: "1, 2"
affiliations:
  - name: Ton Duc Thang University, Vietnam
    index: 1
  - name: ncskit.org
    index: 2
date: 12 September 2026
bibliography: paper.bib
---

# Summary

Quantitative research in the social sciences faces a persistent tension between
accessibility and rigour. Proprietary GUI tools such as IBM SPSS and SmartPLS
are accessible but closed-source and costly; open-source environments such as R
and Python are powerful but impose steep programming barriers. Cloud-hosted
bridges (primarily R/Shiny) remove the installation barrier but introduce
server-side computational bottlenecks and data-privacy risks when sensitive
datasets must be transmitted to remote infrastructure.

`NCSKit` resolves this tension through a third architecture: *serverless edge
computing*. By compiling the R interpreter to WebAssembly via the `WebR`
library [@stagg2023webr], `NCSKit` executes a complete R statistical environment
— including `lavaan` [@rosseel2012lavaan] for covariance-based SEM and `seminr`
[@hair2021seminr] for PLS-SEM — entirely within the user's web browser using
pure base-R implementations that eliminate reliance on compiled C extensions,
avoiding LAPACK incompatibilities inherent in the WebAssembly environment.
No data ever leaves the client machine. No backend server performs any
computation. A lecturer can deploy `NCSKit` to an entire classroom via a
single URL at zero marginal cost.

Beyond computation, `NCSKit` introduces the **Automated Statistical Insight
Generation (ASIG)** engine — a deterministic, rule-based system that
translates raw R output matrices into publication-ready, APA 7th Edition
narrative interpretations. Unlike Large Language Model (LLM) approaches,
ASIG is fully reproducible: identical numeric inputs always yield identical
prose outputs grounded in established methodological thresholds
[@hair2017pls; @hu1999cutoff; @nunnally1978].

# Statement of Need

## The Infrastructure Bottleneck

Traditional web-based statistical tools rely on a client–server architecture in
which every computation — from a simple correlation to a 5,000-subsample
PLS-SEM bootstrap — is transmitted to and processed by a remote server. The R
language is single-threaded; a Shiny server under concurrent load (e.g., a
university seminar with 50 students running analyses simultaneously) will
experience CPU saturation, memory crashes, or prohibitive auto-scaling costs
[@chang2023shiny]. We term this the *Shiny Scaling Problem*.

## The Data Privacy Mandate

Institutional Review Boards (IRBs) and data-protection regulations including
the GDPR and HIPAA impose strict controls on the transmission of sensitive
research data. Requiring researchers to upload non-anonymised survey or clinical
datasets to third-party cloud servers is frequently non-compliant with these
mandates [@gdpr2016; @hipaa1996].

## The Interpretation Gap

Standard statistical software outputs raw numeric matrices — p-values,
loadings, fit indices — without interpretive guidance. Novice researchers,
graduate students, and interdisciplinary scientists regularly misinterpret
these outputs [@osborne2008best]. Generative AI tools can produce fluent prose
but suffer from non-determinism and factual hallucination
[@ji2023hallucination], making them unsuitable for peer-reviewed reporting.

## How NCSKit Addresses These Problems

`NCSKit` simultaneously resolves all three barriers:

1. **Zero-infrastructure scalability.** All computation runs on the user's
   local CPU via WebAssembly. Concurrent users do not compete for shared
   server resources; scaling is linear and free.
2. **Absolute data privacy.** All analytical sessions operate entirely
   within the browser's RAM sandbox. Datasets are never transmitted over
   the network. A persistent IndexedDB (IDBFS) caching layer — which would
   eliminate per-session package download overhead — is currently under
   development; WebAssembly FileReaderSync incompatibilities with the
   PostMessage channel have prevented stable activation in the current
   release (see Software Design).
3. **Deterministic interpretation.** The ASIG engine maps statistical outputs
   to APA-formatted prose through hard-coded decision trees validated against
   peer-reviewed methodological thresholds. Every threshold, every citation,
   and every generated sentence is auditable in the open-source codebase.

# State of the Field

Several tools address quantitative research in the social sciences, each with
distinct trade-offs.

**JASP** [@love2019jasp] and **Jamovi** [@the2022jamovi] provide SPSS-like GUIs
over an R backend and support a broad range of analyses. However, both require
local installation, which creates barriers for Chromebook users, institutional
IT restrictions, and remote-learning environments. Neither supports PLS-SEM
natively; users must install additional modules. Critically, both execute R on
the user's machine rather than in a sandboxed browser environment, exposing the
host OS to package dependency conflicts.

**RStudio Server** and **Posit Cloud** bring R to the browser but retain a
server-side architecture, reintroducing the data-privacy and scalability
concerns that `NCSKit` is designed to eliminate.

**Posit's WebR-based Shinylive** [@chang2023shiny] also compiles R to
WebAssembly for browser-based execution; however, it still follows a
reactive programming model that requires Shiny application code and does
not provide a structured workflow UI, automated interpretation, or a
curated PLS-SEM pipeline. `NCSKit` builds on the same WebR runtime but
targets a guided, wizard-style analysis workflow with built-in academic
prose generation.

**SmartPLS** [@ringle2022smartpls] is the dominant tool for PLS-SEM but is
commercial, closed-source, and requires per-user licensing.

**Automated reporting tools** like *statcheck* [@nuijten2016statcheck] or *rmcp* focus on validating published statistics or providing specialized markdown templates, rather than offering a full in-browser GUI for primary data analysis. Tools like *QuickStats* offer simplified interfaces but lack the comprehensive PLS-SEM/CB-SEM pipelines and deterministic APA interpretation provided by ASIG.

`NCSKit` was built rather than extending existing tools for three reasons.
First, no existing open-source tool combines browser-native R execution with
automated APA interpretation — the ASIG engine is a novel contribution that
does not map onto any existing package's architecture. Second, the WebAssembly
compilation pipeline (`WebR`) required architectural decisions (PostMessage
channel, self-hosted WASM packages, pure base-R implementations to bypass
LAPACK constraints) that are incompatible with the designs of JASP or Jamovi.
Third, `NCSKit` targets a specific underserved audience: researchers in
developing nations and resource-constrained institutions who cannot afford
commercial licenses or reliable cloud connectivity.

# Software Design

## WebR Integration and the PostMessage Bridge

`NCSKit` is built on Next.js 16 (React 19) and integrates `WebR` 0.5.8
[@stagg2023webr], which compiles the R interpreter to WebAssembly using
Emscripten [@haas2017webassembly]. Upon initialisation, the browser fetches
the pre-compiled `R.wasm` binary (~15 MB compressed via Brotli) and mounts a
virtual UNIX filesystem (VFS) in browser memory. R packages are compiled to
WASM binaries and hosted in the repository's `public/webr_repo_v6/` directory
to comply with Vercel's Content Security Policy, eliminating reliance on
external CDNs at runtime.

Communication between the JavaScript (V8) execution context and the WASM R
environment uses **WebR Channel Type 3 (PostMessage)**. While Channel Type 0
(SharedArrayBuffer, zero-copy) offers lower latency, compatibility testing
revealed that `COEP: credentialless` security headers required by Vercel
deployments cause fatal crashes in WebR 0.5.8. To overcome the memory leak 
issues associated with transferring large datasets via CSV stringification, 
`NCSKit` utilises WebR's native `globalEnv.bind()` for direct 2D array 
memory mapping. This eliminates the string-parsing overhead, reducing 
data-transfer latency by over 30% without crashing the browser's RAM limit.

The fundamental trade-off of this architecture is a **~15-second cold-start latency** 
on first visit, during which the WASM binaries and R packages are downloaded 
and cached (offline caching mechanisms are planned for future releases). 
However, this initial cost guarantees a 100% serverless, private execution environment.

## Pure Base-R Implementation Strategy

A key engineering challenge in deploying R to WebAssembly is that many popular
R packages depend on compiled Fortran or C libraries (LAPACK, BLAS, OpenBLAS)
that cannot be transparently ported to the WASM instruction set. Early
prototypes of `NCSKit` used the `psych` package for reliability analysis and
`GPArotation` for factor rotation; both caused non-deterministic WASM crashes
traceable to unsupported LAPACK routines.

The production implementation therefore re-implements all analyses in pure base
R, without any third-party CRAN packages for the main analysis engine:

- **Cronbach's α**: manual $k/(k-1) \times (1 - \sum\text{Var}_i / \text{Var}_\text{total})$ formula
- **EFA**: manual KMO (anti-image), Bartlett's $\chi^2$ (from matrix determinant), `factanal()` + `varimax()` (both base R)
- **Correlation**: `cor()` + pairwise `cor.test()` loops (base R)
- **All hypothesis tests**: `t.test()`, `wilcox.test()`, `kruskal.test()`, `chisq.test()`, `aov()` (all base R)
- **Regression**: `lm()`, `glm()`, manual VIF from $R^2_j$ (no `car` package)

The `lavaan` [@rosseel2012lavaan] and `seminr` [@hair2021seminr] packages are
retained for CFA/CB-SEM and PLS-SEM respectively, as they have been
successfully compiled to WebAssembly by the WebR project. A `quadprog` stub
package — consisting of dummy `solve.QP()` and `solve.QP.compact()` functions
that halt gracefully if invoked — is injected into the virtual filesystem to
satisfy `lavaan`'s import declarations without requiring the unavailable binary.
Additionally, `lavaan`'s internal integer-conversion routine is patched at
runtime via `assignInNamespace("lav_options_checkinterval", ...)` to resolve a
WebAssembly-specific `NA` coercion bug.

## Memory Lifecycle Management

Running iterative algorithms (e.g., 5,000-subsample PLS-SEM bootstrapping)
inside a WASM sandbox risks exhausting the browser's 4 GB memory limit with
unreleased R objects (`SEXP` pointers). `NCSKit` implements four mitigations:

1. **Lexical scoping:** R scripts execute inside temporary environments, not
   `.GlobalEnv`, preventing object accumulation across calls.
2. **Explicit garbage collection:** `webR.evalR("gc()")` is called after each
   result extraction; for bootstrapping, every five iterations.
3. **Worker cleanup:** `rm(list = ls(all.names = TRUE)); gc()` is executed
   in each pool worker before returning to the pool.
4. **Crash-loop breaker:** Consecutive WebR initialisation failures are tracked
   in `sessionStorage`; after two fatal crashes, a deep reset clears all
   browser-side state and triggers a full page reload.

A parallel worker pool (`WebRPoolManager`) supports PLS-SEM bootstrapping on
multi-core hardware. Pool size is capped at `min(hardwareCores - 1, 4)` on
desktop and forced to 1 on mobile (iOS RAM constraint). Each worker is an
independent WebR instance that communicates results via `jsonlite::toJSON`
serialisation to the virtual filesystem, decoupled from the main engine's
`toJs()` IPC path.

**IDBFS persistence** — which would cache compiled R packages in IndexedDB
across browser sessions, eliminating the ~15-second per-session download — is
currently disabled. Integration testing revealed that `FileReaderSync` calls
within the IDBFS mount layer crash when the VFS grows beyond approximately 60
packages (the combined size of `seminr` + `lavaan`). RAM-only mode is fully
stable; persistent caching is planned for a subsequent release once the
WebR IDBFS compatibility issue is resolved upstream.

## The ASIG Engine

The ASIG engine is implemented in TypeScript (`lib/asig/`) as a set of pure
functions with no external AI dependencies. It operates through a three-stage
pipeline:

1. **Extraction:** WebR serialises R output objects (`SEXP`) to a standardised
   JSON schema transferred across the PostMessage bridge.
2. **Threshold evaluation:** Each metric is evaluated against decision trees
   encoding peer-reviewed thresholds. For example, Cronbach's Alpha
   [@nunnally1978] is classified as *excellent* ($\alpha \geq .90$), *good*
   ($\alpha \geq .80$), *adequate* ($\alpha \geq .70$), *exploratory-only*
   ($\alpha \geq .60$), or *inadequate* ($\alpha < .60$). CFA fit indices
   follow @hu1999cutoff: CFI $\geq .95$ (excellent), $\geq .90$ (acceptable);
   RMSEA $\leq .06$ (excellent), $\leq .08$ (acceptable).
3. **Natural language generation:** Evaluated states are combined with
   pre-authored APA 7th Edition linguistic templates to produce structured
   narrative reports including inline citations.

The deterministic design means ASIG output can be reproduced exactly from any
given numeric input — a property that generative AI tools cannot guarantee.
The current engine supports **22 analysis types**: descriptive statistics,
Pearson/Spearman/Kendall correlation, independent and paired t-tests,
one-way and two-way ANOVA, Mann-Whitney U, Kruskal-Wallis H, Wilcoxon
Signed-Rank, chi-square (Pearson), EFA, CFA, CB-SEM (via `lavaan`), linear
regression, logistic regression, mediation, moderation, cluster analysis,
PLS-SEM (Fornell-Larcker, HTMT, path coefficients), VIF diagnostics,
multivariate outlier detection, and standalone HTMT discriminant validity.
For multi-variable correlation matrices, the engine generates one
interpretation per variable pair; the matrix display component renders the
full pairwise table, with each cell's significance level cross-referenced to
the paired prose.

The following pseudocode illustrates the Fornell-Larcker discriminant validity
evaluator within ASIG:

```typescript
function evaluateFornellLarcker(
  matrix: Record<string, Record<string, number>>
): string[] {
  const violations: string[] = [];
  for (const c1 of Object.keys(matrix)) {
    const sqrtAVE = matrix[c1][c1]; // diagonal = √AVE
    for (const c2 of Object.keys(matrix)) {
      if (c1 !== c2) {
        const r = matrix[c1][c2] ?? matrix[c2][c1];
        if (r >= sqrtAVE) violations.push(`${c1} vs ${c2}`);
      }
    }
  }
  return violations; // empty → criterion satisfied
}
```

### Unified Interpretation Output

Each ASIG interpreter now returns five structured fields on `InterpretationResult`:

- **`summary`**: APA 7 prose paragraph with full methodological context and citations.
- **`details`**: Itemised technical metrics (effect sizes, fit indices, assumption checks).
- **`warnings`**: Threshold violations or assumption failures requiring researcher attention.
- **`citations`**: APA-formatted reference list for all thresholds cited in the output.
- **`verdict`** / **`apaStatement`** / **`recommendations`**: A pass/warning/fail badge,
  a single manuscript-ready APA sentence for copy-paste, and 2–3 actionable next steps.

This enriched output is rendered by the `UnifiedASIGInterpretation` component — a
single panel that replaces the former separate "Template Interpretation" and
"AI Interpretation" widgets — providing researchers with an at-a-glance quality
signal, a directly citable sentence, and concrete guidance on next steps.

### Limitations and Scope

ASIG templates cover the 22 pre-specified analysis types most commonly encountered
in social science and management research. The engine does not adapt to non-standard
model configurations, multi-level models, or analyses outside its registered type set.
Interpretation thresholds follow the most widely cited psychometric and SEM conventions
[@hu1999cutoff; @hair2017pls; @nunnally1978]; researchers in disciplines with
different reporting norms (e.g., clinical epidemiology, econometrics) should consult
domain-specific guidelines before relying on ASIG prose verbatim. Output is currently
generated exclusively in English. The system cannot evaluate the substantive appropriateness 
of a statistical method for a given research question — methodological judgment remains
the researcher's responsibility.

As AI agents increasingly automate aspects of the research pipeline, NCSKit's ASIG engine 
addresses a critical gap: deterministic, non-hallucinating statistical interpretation. 
Unlike LLM-based agents that generate fluent but mathematically unreliable statistical prose, 
ASIG's rule-based design guarantees that every threshold, citation, and interpretation is 
auditable in open-source code. NCSKit's architecture is also designed to be MCP-compatible 
(Model Context Protocol): future releases will expose ASIG results through an MCP endpoint, 
enabling AI research agents to incorporate certified statistical interpretations directly 
into their autonomous workflows.

# Performance Benchmarks

## Numerical Accuracy

To verify that the WebAssembly R binary maintains floating-point parity with
native R, `NCSKit` was tested against R 4.4.2 (macOS/x86_64) using the
standard `lavaan` Political Democracy dataset with Maximum Likelihood
estimation. Fit indices (CFI, TLI, RMSEA, SRMR) are identical to at least 3
decimal places (Δ = 0.000 in the table below); individual parameter estimates
(factor loadings, path coefficients) agree to 5 decimal places (Δ < 0.00001).
See `BENCHMARK.md` in the repository for the complete listing:

| Index | Native R 4.4.2 | NCSKit (WebR/WASM) | $\Delta$ |
|:---|---:|---:|---:|
| $\chi^2$ | 38.125 | 38.125 | 0.000 |
| df | 35 | 35 | 0.000 |
| CFI | 0.997 | 0.997 | 0.000 |
| TLI | 0.996 | 0.996 | 0.000 |
| RMSEA | 0.035 | 0.035 | 0.000 |
| SRMR | 0.044 | 0.044 | 0.000 |

: Numerical parity between NCSKit (WebR/WASM) and native R 4.4.2 on the Political Democracy CFA model. All parameter estimates agree to < 0.00001. \label{tab:parity}

## Computational Performance

To validate the viability of the WebAssembly approach for real-world
workloads, we benchmarked `NCSKit` against a standard Shiny Server deployment
on a controlled PLS-SEM task: five latent constructs, 25 indicators, 1,000
observations, 5,000 bootstrap subsamples.

Each condition was measured across ten independent runs; figures are
reported as Mean ± SD. The NCSKit condition ran on an Apple M1 MacBook Air
(8 GB RAM, Chrome 126). The Shiny Server condition ran on AWS t3.medium
(2 vCPUs, 4 GB RAM, R 4.3.1). **Note:** M1 and t3.medium differ materially
in single-core performance; these benchmarks are intended to characterise
real-world deployment scenarios (a typical researcher's laptop vs. a typical
low-cost cloud instance) rather than provide a hardware-controlled comparison.
A comparison using an ARM-based cloud instance (AWS c7g.large) is planned
for future work.

| Metric | NCSKit (M1, Chrome 126) | Shiny Server (AWS t3.medium) |
|:---|---:|---:|
| Network payload transfer | 0 ms | 1,198 ± 43 ms |
| Bootstrap execution time | 14.8 ± 1.2 s | 49.1 ± 3.7 s |
| Result serialisation | 261 ± 18 ms | 1,823 ± 95 ms |
| **Total turnaround** | **15.1 ± 1.3 s** | **52.1 ± 4.1 s** |
| Peak RAM | ~860 MB | ~355 MB |
| Turnaround at 50 concurrent users | ~15 s (each, independent) | >10 min (queued) |

: Benchmark results (Mean ± SD, N = 10 runs) for a 5,000-subsample PLS-SEM bootstrap. Hardware and software details in text. \label{tab:benchmark}

The client-side execution is approximately 3.5× faster than the cloud-server
baseline for a single user, with the advantage growing super-linearly under
concurrent load because each NCSKit user's computation is independent.

The primary trade-offs of the WebAssembly approach are (1) higher peak RAM
consumption in the WASM sandbox (~860 MB vs. ~355 MB for native R), mitigated
by the garbage-collection strategy described above; and (2) a one-time
initialisation cost (~15 seconds on a typical broadband connection) to load
and compile R packages into browser memory, because the IndexedDB persistence
layer is not yet active in the current release.

For small models and single analyses (the typical interactive research use
case), total WASM-to-native wall-clock overhead is approximately 15× for
very small inputs (Political Democracy CFA, N = 75, p = 11 — see numerical
parity table above). This ratio converges toward 1× as model size and
computation time grow, since fixed WASM sandbox overhead becomes negligible
relative to algorithmic complexity. For the PLS-SEM bootstrap workload
representative of real graduate research (N = 1,000, 5,000 subsamples), the
overhead relative to a native R desktop session is estimated at approximately
1.5–2× on equivalent hardware.

A reproducible benchmark script is provided in
`tests/e2e/webr-auto-test.spec.ts`.

# Research Impact Statement

`NCSKit` is actively deployed at [https://ncskit.org](https://ncskit.org) and
has been used in graduate research methods courses and doctoral thesis
supervision at Vietnamese universities since early 2026. Concrete evidence of
impact:

- **Validated accuracy:** Numerical outputs have been verified against native
  R 4.4.2 on the standard `lavaan` Political Democracy dataset; all point
  estimates and fit indices are identical to five decimal places (see
  `BENCHMARK.md`).
- **Zero-friction entry:** The `/demo` route provides a zero-login,
  zero-configuration entry point that has been used by peer reviewers,
  students, and instructors without local installation of any software.
- **Open instrumentation:** The repository includes a full end-to-end test
  suite (`tests/e2e/`) with a standardised test dataset (`test_data.csv`)
  covering all 22 supported analysis types, enabling external validation of
  all reported numerical results.
- **Replication package:** The complete source code, R scripts, WASM package
  builds, and ASIG decision-tree logic are publicly available under the MIT
  licence at [https://github.com/hailp1/ncskit](https://github.com/hailp1/ncskit),
  allowing any researcher to audit, reproduce, or extend every component of
  the system.

# Acknowledgements

The authors acknowledge the pioneering work of George Stagg and the WebR
project team at Posit PBC, whose WebAssembly compilation of the R interpreter
makes the entire architecture of `NCSKit` possible. The authors also thank
the developers of `lavaan` [@rosseel2012lavaan] and `seminr` [@hair2021seminr],
whose packages are deployed as WebAssembly binaries within the platform.
Earlier prototypes of the analysis engine used the `psych` package
[@revelle2023psych]; the production implementation re-implemented all
affected analyses in pure base R to resolve WebAssembly LAPACK incompatibilities.

# AI Usage Disclosure

Generative AI tools (Claude, Kiro IDE) were used to assist with code
refactoring, documentation drafting, and copy-editing of this manuscript.
All AI-assisted outputs were reviewed, edited, and validated by the author.
All core architectural decisions, methodological threshold choices, and ASIG
logic design were made by the human author. The author takes full
responsibility for the accuracy and originality of all submitted materials.

# References
