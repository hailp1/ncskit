---
title: 'NCSKit: A Serverless, WebAssembly-Powered Statistical Analysis Platform with Automated APA Interpretation'
tags:
  - WebAssembly
  - WebR
  - statistical analysis
  - structural equation modeling
  - automated interpretation
  - edge computing
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

Quantitative research in the social sciences faces a persistent tension between accessibility and rigour. Proprietary GUI tools (e.g., IBM SPSS, SmartPLS) are accessible but closed-source and costly; open-source environments (e.g., R, Python) are powerful but impose steep programming barriers. Cloud-hosted bridges remove installation barriers but introduce server-side computational bottlenecks and data-privacy risks when sensitive datasets are transmitted remotely.

`NCSKit` resolves this tension through *serverless edge computing*. By compiling the R interpreter to WebAssembly via `WebR` [@stagg2023webr], `NCSKit` executes a complete R statistical environment entirely within the user's web browser. No data ever leaves the client machine, ensuring absolute data privacy. Beyond computation, `NCSKit` introduces the **Automated Statistical Insight Generation (ASIG)** engine—a deterministic, rule-based system that translates raw R output matrices into publication-ready, APA 7th Edition narrative interpretations grounded in established methodological thresholds [@hair2017pls; @hu1999cutoff; @nunnally1978].

# Statement of need

Traditional web-based statistical tools rely on a client–server architecture. The R language is single-threaded; consequently, a server under concurrent load (e.g., a university seminar running PLS-SEM bootstrapping) will experience CPU saturation or prohibitive scaling costs. Furthermore, Institutional Review Boards (IRBs) and regulations like GDPR impose strict controls on the transmission of sensitive research data, often making remote processing non-compliant.

Additionally, standard software outputs raw numeric matrices (p-values, loadings, fit indices) without interpretive guidance. Novice researchers, graduate students, and interdisciplinary scientists regularly misinterpret these outputs [@osborne2008best]. Generative AI tools can produce fluent prose but suffer from non-determinism and hallucination [@ji2023hallucination], making them unsuitable for peer-reviewed reporting.

`NCSKit` addresses these problems by providing zero-infrastructure scalability (computing on the local CPU), absolute data privacy (datasets are never transmitted over the network), and deterministic interpretation (the ASIG engine maps statistical outputs to APA-formatted prose through hard-coded, auditable decision trees).

# State of the field

Existing tools address social science research with distinct trade-offs. **JASP** [@love2019jasp] and **Jamovi** [@the2022jamovi] provide excellent GUI environments over an R backend but require local installation, creating barriers for Chromebook users and institutional IT environments. Neither supports PLS-SEM natively. **RStudio Server** and **Posit Cloud** bring R to the browser but retain a server-side architecture. **Shinylive** [@chang2023shiny] compiles R to WebAssembly but follows a reactive programming model requiring Shiny code, lacking a structured wizard workflow or automated interpretation. **SmartPLS** [@ringle2022smartpls] dominates PLS-SEM but remains closed-source and commercial.

`NCSKit` was built because no existing open-source tool combines browser-native R execution with automated APA interpretation. The ASIG engine is a novel contribution that does not map onto existing package architectures. Furthermore, `NCSKit` specifically targets researchers in resource-constrained institutions who cannot afford commercial licenses or rely on stable cloud connectivity.

# Software design

`NCSKit` integrates `WebR` 0.5.8 [@stagg2023webr], which compiles the R interpreter to WebAssembly using Emscripten. The browser fetches the pre-compiled `R.wasm` binary and mounts a virtual UNIX filesystem (VFS) in memory. R packages are compiled to WASM binaries and hosted statically to comply with strict Content Security Policies. Communication between JavaScript and WASM utilizes WebR's PostMessage channel, leveraging `globalEnv.bind()` for direct 2D array memory mapping to eliminate string-parsing latency.

A key engineering challenge is that many popular R packages depend on compiled Fortran/C libraries (LAPACK, BLAS) that cannot be transparently ported to WASM, leading to non-deterministic crashes in early prototypes. To resolve this, `NCSKit` re-implements core analyses (Cronbach's $\alpha$, EFA, Regression, ANOVAs) in pure base R. The `lavaan` [@rosseel2012lavaan] and `seminr` [@hair2021seminr] packages are retained as they were successfully compiled to WASM by the WebR project. A multi-core parallel worker pool (`WebRPoolManager`) handles heavy iterative algorithms (e.g., 5,000-subsample bootstrapping) while explicit lexical scoping and garbage collection prevent sandbox memory exhaustion.

The **ASIG Engine** operates in a three-stage pipeline: (1) Extraction of serialised R outputs; (2) Threshold evaluation against peer-reviewed decision trees (e.g., CFI $\geq .95$ is excellent per @hu1999cutoff); and (3) Natural language generation using APA 7th Edition linguistic templates. The engine supports 22 analysis types, returning a structured APA prose summary, itemised technical details, anti-p-hacking warnings, and a formatted citation list. This rule-based design guarantees that every threshold and sentence is deterministic and auditable.

# Research impact statement

`NCSKit` is actively deployed at `https://open.ncskit.org` and is utilized in graduate research methods courses and doctoral thesis supervision at Vietnamese universities. Its numerical outputs have been validated against native R 4.4.2 to five decimal places of precision. By providing a zero-configuration entry point, a fully transparent end-to-end test suite, and the open-source ASIG logic, `NCSKit` significantly lowers the barrier to rigorous, reproducible quantitative research for students and scientists globally.

# Acknowledgements

The authors acknowledge George Stagg and the WebR project team at Posit PBC, whose WebAssembly compilation of the R interpreter makes the architecture of `NCSKit` possible. We also thank the developers of `lavaan` [@rosseel2012lavaan] and `seminr` [@hair2021seminr].

# AI usage disclosure

Generative AI tools (Claude, Kiro IDE) were used to assist with code refactoring, documentation drafting, and copy-editing of this manuscript. All AI-assisted outputs were reviewed, edited, and validated by the human author. All core architectural decisions, methodological threshold choices, and ASIG logic design were made exclusively by the human author.

# References
