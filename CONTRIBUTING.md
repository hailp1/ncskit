# Contributing to NCSKit

Thank you for your interest in contributing to NCSKit! This document explains
how to contribute code, documentation, new analysis methods, or ASIG
interpretation rules.

NCSKit is an open-source project submitted to the
[Journal of Open Source Software (JOSS)](https://joss.theoj.org). We follow
JOSS open development practices and the [Contributor Covenant](CODE_OF_CONDUCT.md).

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Types of Contributions](#types-of-contributions)
4. [Adding a New Analysis Method](#adding-a-new-analysis-method)
5. [Extending the ASIG Engine](#extending-the-asig-engine)
6. [Code Standards](#code-standards)
7. [Testing](#testing)
8. [Submitting a Pull Request](#submitting-a-pull-request)

---

## Getting Started

```bash
git clone https://github.com/hailp1/ncskit.git
cd ncskit
npm install
npm run dev
# → http://localhost:3000/demo
```

No database or external API key is required for local development.
The `/demo` route provides full access to the statistical engine without login.

---

## Project Structure

The two most relevant directories for contributors:

```
lib/
  asig/                   # ASIG — Automated Statistical Insight Generation
    shared.ts             # APA formatting utilities and shared types
    basic.ts              # Correlation, t-tests, ANOVA, non-parametric, chi-square
    factor.ts             # Cronbach's Alpha / McDonald's Omega, EFA, CFA
    regression.ts         # Linear, logistic, mediation, moderation, cluster
    pls-sem.ts            # PLS-SEM: outer loadings, AVE, CR, HTMT, path coefficients
    generator.ts          # Central dispatch router — maps AnalysisType → interpreter
    index.ts              # Public exports

  webr/
    core.ts               # WebR engine init, crash recovery, gc lifecycle
    analyses/             # R script templates for each analysis method
      reliability.ts      # Cronbach's Alpha, McDonald's Omega R scripts
      hypothesis.ts       # t-tests, ANOVA, non-parametric R scripts
      descriptive.ts      # Descriptive statistics R scripts
      regression.ts       # Linear, logistic, mediation, moderation R scripts
      factor/             # EFA, CFA R scripts
      sem.ts              # PLS-SEM (seminr) R scripts
      cb-sem.ts           # CB-SEM (lavaan) R scripts
```

---

## Types of Contributions

| Type | Where to start |
|:-----|:--------------|
| Bug report | [Open an issue](https://github.com/hailp1/ncskit/issues) with reproduction steps and a sample dataset if applicable |
| Feature request | Open an issue describing the analysis method or feature needed |
| New analysis method | See [Adding a New Analysis Method](#adding-a-new-analysis-method) |
| New ASIG threshold / interpretation | See [Extending the ASIG Engine](#extending-the-asig-engine) |
| Documentation improvement | Edit `.md` files and open a PR |
| Numerical validation | Add test cases to `tests/e2e/webr-auto-test.spec.ts` |

---

## Adding a New Analysis Method

Adding a new statistical method requires changes in three places:

### Step 1 — R script template (`lib/webr/analyses/`)

Create or edit a file in `lib/webr/analyses/` with the R script that computes
the analysis. The script must return a named R list that can be serialised to
JSON by WebR. Follow the existing pattern in e.g. `reliability.ts`:

```typescript
// lib/webr/analyses/my-method.ts
export const MY_METHOD_SCRIPT = (data: string, options: MyOptions): string => `
  result <- my_r_function(${data}, ...)
  list(
    statistic = result$stat,
    p_value   = result$p.value,
    ...
  )
`;
```

All R scripts must be compatible with **WebR 0.5 (R 4.5)** and use only
packages available in `public/webr_repo_v6/`.

### Step 2 — Add AnalysisType (`lib/asig/shared.ts`)

Add your new analysis key to the `AnalysisType` union:

```typescript
export type AnalysisType =
  | 'cronbach_alpha'
  | ...
  | 'my_new_method';   // ← add here
```

### Step 3 — ASIG interpreter (`lib/asig/`)

Add the interpreter function in the appropriate file (`basic.ts`, `factor.ts`,
`regression.ts`, or a new file if the method is a new category). The function
must accept a typed params object and return `InterpretationResult`:

```typescript
// lib/asig/basic.ts (or wherever appropriate)
export function interpretMyMethod(params: {
  statistic: number;
  pValue:    number;
  // ...
}): InterpretationResult {
  const { statistic, pValue } = params;
  const citations = ['Author, A. (Year). Title. Journal.'];

  const summary = pValue < 0.05
    ? `The test was statistically significant ...`
    : `The test was not statistically significant ...`;

  return { summary, details: [], warnings: [], citations };
}
```

Key rules for ASIG prose:
- All output in **English**, **APA 7th Edition** style
- No leading zero for values bounded in (−1, 1): use `formatCoef()` from `shared.ts`
- p-values formatted with `formatPValue()` (e.g., `p < .001`, `p = .032`)
- Every threshold must trace to a published citation in the `citations` array

### Step 4 — Register in generator (`lib/asig/generator.ts`)

Add a `case` to `generateInterpretation()`:

```typescript
case 'my_new_method':
  return interpretMyMethod(results as any);
```

---

## Extending the ASIG Engine

The ASIG engine (`lib/asig/`) is a set of pure TypeScript functions with
**no AI dependencies**. Every threshold is hard-coded and citable.

### Modifying an existing threshold

All thresholds with their citations are documented in [`ASIG_LOGIC.md`](./ASIG_LOGIC.md).
To change a threshold (e.g., update the HTMT cutoff from 0.85 to 0.90 for a
specific discipline), edit the relevant function in `lib/asig/` and update the
citation in `ASIG_LOGIC.md`.

### Current threshold registry

| Analysis | Key threshold | Citation |
|:---------|:-------------|:---------|
| Cronbach's Alpha / Omega | α ≥ .70 (adequate), ≥ .60 (exploratory) | Nunnally (1978) |
| CFA fit: CFI / TLI | ≥ .90 acceptable, ≥ .95 excellent | Hu & Bentler (1999) |
| CFA fit: RMSEA | ≤ .08 acceptable, ≤ .06 excellent | Hu & Bentler (1999) |
| AVE (convergent validity) | ≥ .50 | Fornell & Larcker (1981) |
| Composite Reliability | ≥ .70 | Hair et al. (2017) |
| HTMT (discriminant validity) | < .85 strict, < .90 liberal | Henseler et al. (2015) |
| VIF (multicollinearity) | < 5 recommended, < 10 tolerable | Hair et al. (2010) |
| Cohen's d effect size | .20 small, .50 medium, .80 large | Cohen (1988) |
| η² effect size | .01 small, .06 medium, .14 large | Cohen (1988) |
| R² (PLS-SEM) | .25 weak, .50 moderate, .75 substantial | Hair et al. (2017) |

---

## Code Standards

- **TypeScript strict mode** — `tsc --noEmit` must pass with 0 errors
- **No `any` in ASIG** — all ASIG functions must have fully typed params
- **APA 7 formatting** — use `formatPValue()`, `formatCoef()`, `formatNum()`
  from `lib/asig/shared.ts`; never format statistics manually
- **R compatibility** — all R templates must run in WebR 0.5 (R 4.5)
- **No side effects in interpreters** — ASIG functions are pure: same input →
  same output, no global state, no randomness

Run the linter before submitting:

```bash
npm run type-check   # TypeScript — must be 0 errors
npm run lint         # ESLint
```

---

## Testing

### Numerical validation

```bash
npm run verify-math
# Runs Playwright tests comparing NCSKit (WebR) output against expected values
# derived from native R. All differences must be < 0.00001.
```

Tests are in `tests/e2e/webr-auto-test.spec.ts`.

### Adding validation tests

When adding a new analysis method, add at least one test case with:

1. A known-good dataset
2. Expected output computed in native R
3. Tolerance assertions (Δ < 0.00001 for continuous statistics)

---

## Submitting a Pull Request

1. Fork the repository and create a branch:
   ```bash
   git checkout -b feature/my-analysis-method
   ```
2. Make your changes following the standards above.
3. Ensure `npm run type-check` and `npm run lint` pass.
4. Run `npm run verify-math` to confirm numerical accuracy.
5. Update `ASIG_LOGIC.md` if you modified any threshold.
6. Update `CHANGELOG.md` with a brief description under `[Unreleased]`.
7. Open a Pull Request with a clear description of:
   - **What** the change does
   - **Why** the threshold values were chosen (with citations)
   - **How** numerical accuracy was verified

---

## Questions

Open an issue on GitHub or contact the maintainer at **phuchai.le@gmail.com**.
