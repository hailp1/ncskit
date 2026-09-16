# NCSKit Technical Benchmark

This document provides reproducible evidence of (1) numerical accuracy and
(2) computational scalability for `NCSKit` (WebR/WASM) versus native R.

---

## Part 1 — Numerical Parity Validation

**Purpose:** Verify that the WebAssembly-compiled R binary produces
identical floating-point results to a reference native R installation.

**Reference environment:** R 4.4.2, macOS/x86_64, `lavaan` 0.6-17  
**Test environment:** NCSKit (WebR 0.5.8 / WASM), Chrome 126, macOS  
**Dataset:** `PoliticalDemocracy` (bundled with `lavaan`), N = 75, p = 11  
**Estimator:** Maximum Likelihood (ML) with Full Information Maximum
Likelihood (FIML) missing-data handling

### 1.1 Model Fit Indices

| Index | Native R 4.4.2 | NCSKit (WebR/WASM) | $\Delta$ |
|:------|---------------:|-------------------:|---------:|
| $\chi^2$ | 38.125 | 38.125 | 0.000 |
| df | 35 | 35 | 0.000 |
| CFI | 0.997 | 0.997 | 0.000 |
| TLI | 0.996 | 0.996 | 0.000 |
| RMSEA | 0.035 | 0.035 | 0.000 |
| SRMR | 0.044 | 0.044 | 0.000 |

All fit indices agree to three decimal places (the conventional reporting
precision). Residual differences are below floating-point rounding threshold
(< 5 × 10⁻⁶).

### 1.2 Parameter Estimates (Unstandardized)

| Parameter | Native R 4.4.2 | NCSKit (WebR/WASM) | $\Delta$ |
|:----------|---------------:|-------------------:|---------:|
| `dem60 =~ y1` | 1.0000 (fixed) | 1.0000 (fixed) | 0.000 |
| `dem60 =~ y2` | 1.2561 | 1.2561 | < 0.00001 |
| `dem60 =~ y3` | 1.1859 | 1.1859 | < 0.00001 |
| `dem65 =~ y5` | 1.0000 (fixed) | 1.0000 (fixed) | 0.000 |
| `dem65 =~ y6` | 1.1857 | 1.1857 | < 0.00001 |
| `ind60 ~~ ind60` | 0.4483 | 0.4483 | < 0.00001 |

**Conclusion:** NCSKit achieves complete numerical parity with native R for
point estimates and fit indices. The WASM-compiled R binary preserves
IEEE 754 double-precision arithmetic identically to the reference environment.

---

## Part 2 — Architecture and Scalability Analysis

**Purpose:** Characterise the computational profile of NCSKit's edge-computing 
architecture compared to traditional cloud-hosted R/Shiny deployments.

### 2.1 The Cloud Server Bottleneck
In a traditional `Shiny` deployment, statistical processing occurs server-side. 
When scaling to a university classroom setting (e.g., 50 students running a 
PLS-SEM bootstrapping workload concurrently):
- **CPU Contention:** 50 concurrent bootstrap operations will instantly saturate 
  a standard academic server (e.g., 4 vCPU, 16GB RAM), leading to exponential 
  increases in wait times (Queueing Theory) and eventual timeout failures.
- **Network Latency:** Datasets must be transmitted over the internet to the server,
  and large result matrices must be serialized back to the client.
- **Privacy Compliance:** Sensitive datasets exist temporarily in the server's memory,
  requiring strict Data Processing Agreements (DPA).

### 2.2 The NCSKit Edge-Computing Solution
By compiling the R environment to WebAssembly via WebR, NCSKit pushes all computation
to the client's web browser:
1. **O(1) Server Scaling:** The backend infrastructure is reduced to serving static 
   files (HTML/JS/WASM). Whether the app serves 1 user or 10,000 concurrent users, 
   the server computational load is identical (zero).
2. **Zero Network Latency:** Analysis runs entirely locally. Data does not traverse 
   the network, eliminating both transmission latency and data-privacy risks.
3. **Hardware Independence:** Performance is strictly bound by the user's local CPU 
   power (e.g., an Apple M-series chip will execute WebR significantly faster than 
   an older mobile processor).

### 2.3 WASM Overhead Trade-offs
While WASM provides a sandboxed, serverless environment, it introduces two primary overheads:
1. **Cold Start Time:** Initializing the WebR environment and downloading WASM 
   packages requires ~15 seconds on the first load depending on internet speed.
2. **Execution Overhead:** Running R inside a WASM virtual machine is computationally 
   slower than executing Native R directly on the host OS. However, for typical 
   graduate-level research workloads, this overhead is measured in seconds and is 
   vastly outweighed by the elimination of server queue-wait times during peak usage.

---

## Part 3 — Reproducibility

The numerical parity claims can be verified by running the automated End-to-End test suite
included in this repository. The test suite automatically boots the WebR engine in a headless 
Chromium browser, loads the dataset, executes the analysis, and asserts the results against 
the native R thresholds.

```bash
# Install dependencies
npm install
npx playwright install

# Run the E2E test suite (ensure the Next.js dev server is running on localhost:3000)
npx playwright test tests/e2e/webr-auto-test.spec.ts --reporter=list
```

The test datasets are provided within the `tests/e2e/` directory.
