# Báo Cáo Chạy Tự Động 22 Phân Tích (500 Samples)

## descriptive
**Biến sử dụng:** ["Age","Education","SN1","ATT1"]

### Diễn giải ASIG
Descriptive statistics were computed for 4 variables (N = 500). All variables demonstrated skewness values within ±2 and excess kurtosis within ±7 (West et al., 1995; George & Mallery, 2010), indicating approximate univariate normality and suitability for parametric analyses.

> **APA:** Descriptive statistics were computed for 4 variables (N = 500). All variables met criteria for approximate normality (|skewness| ≤ 2, |kurtosis| ≤ 7; West et al., 1995).

---

## t_test_independent
**Biến sử dụng:** {"dv":"INT1","iv":"Gender"}

### Diễn giải ASIG
An independent-samples t-test (equal variances assumed) was conducted to compare "INT1" between the Female group (M = 3.49, SD = 0.52) and the Male group (M = 3.47, SD = 0.56). The difference in means (ΔM = 0.03) was not statistically significant at α = .05: t(498) = 0.53, p = .595. Interpret the 95% confidence interval for the mean difference to gauge the range of plausible effects.

> **APA:** No statistically significant difference was found in "INT1" between the Female and Male groups, t(498) = 0.53, p = .595.

---

## t_test_paired
**Biến sử dụng:** {"before":"INT1","after":"INT2"}

### Diễn giải ASIG
A paired-samples t-test was conducted to evaluate change in "Intention" across two related measurement occasions. The mean difference between pre-test (M = 3.48, SD = 0.54) and post-test (M = 3.46, SD = 0.53) (ΔM = 0.02) did not reach statistical significance at α = .05: t(499) = 0.74, p = .462. A 95% CI for the mean difference should be reported to convey the precision of the estimate.

> **APA:** No statistically significant change was found in "Intention" between measurement occasions, t(499) = 0.74, p = .462.

**Cảnh báo:** The distribution of difference scores violated normality (Shapiro-Wilk, p < .001). The Wilcoxon Signed-Rank Test is recommended as a non-parametric alternative. The t-test is robust to moderate non-normality when N ≥ 30.

---

## anova
**Biến sử dụng:** {"dv":"ATT1","iv":"Education"}

### Diễn giải ASIG
A one-way ANOVA was conducted to examine whether "ATT1" differed across levels of "Education." The omnibus F-test was not statistically significant (α = .05): F(3, 496) = 1.46, p = .223. The null hypothesis of equal population group means was retained. Inspect the 95% CIs on group means to evaluate the practical magnitude of any observed differences.

> **APA:** A one-way ANOVA found no statistically significant effect of "Education" on "ATT1", F(3, 496) = 1.46, p = .223.

**Cảnh báo:** Residuals violated normality (Shapiro-Wilk, p < .001). ANOVA is moderately robust to this violation when group sizes are ≥ 15; for smaller groups, the Kruskal-Wallis H test is recommended.

---

## mann_whitney
**Biến sử dụng:** {"dv":"PBC1","iv":"Gender"}

### Diễn giải ASIG
A Mann-Whitney U test was conducted as a non-parametric alternative to the independent-samples t-test, to compare the rank distribution of "PBC1" between the Female (Mdn = 3.00) and Male (Mdn = 3.50) groups. The test did not reach statistical significance (α = .05): U = 30090, p = .433.

> **APA:** A Mann-Whitney U test found no statistically significant difference in "PBC1" between the Female and Male groups, U = 30090, p = .433.

**Cảnh báo:** The Mann-Whitney U test evaluates stochastic dominance (rank-ordering), not specifically medians. Medians are valid descriptors only when the distributional shapes of the two groups are identical. Report medians alongside the U statistic for interpretability.

---

## kruskal_wallis
**Biến sử dụng:** {"dv":"SN1","iv":"Education"}

### Diễn giải ASIG
A Kruskal-Wallis H test was conducted as a non-parametric omnibus test to compare the rank distributions of "SN1" across levels of "Education." The test did not reach statistical significance (α = .05): H(3) = 7.44, p = .059, indicating no significant difference in rank distributions across groups.

> **APA:** A Kruskal-Wallis H test found no statistically significant difference in "SN1" across groups of "Education", H(3) = 7.44, p = .059.

**Cảnh báo:** The Kruskal-Wallis H test compares rank distributions, not medians per se. Medians are descriptively appropriate when group distributional shapes are similar.

---

## wilcoxon_signed
**Biến sử dụng:** {"before":"ATT1","after":"ATT2"}

### Diễn giải ASIG
A Wilcoxon Signed-Rank Test was conducted as a non-parametric alternative to the paired-samples t-test, to assess change in "Attitude" between two related measurement occasions. The test did not reach statistical significance (α = .05): W = 10631, p = .270, with a median difference of 0.00 (pseudo-median of differences).

> **APA:** A Wilcoxon Signed-Rank Test found no statistically significant change in "Attitude" between the two measurement occasions, W = 10631, p = .270.

**Cảnh báo:** Report the counts of positive, negative, and tied pairs to provide full transparency about the rank distribution (recommended by APA 7).

---

## chi_square
**Biến sử dụng:** {"v1":"Gender","v2":"Education"}

### Diễn giải ASIG
A Pearson chi-square test of independence was conducted to examine the association between "undefined" and "undefined." The test was not statistically significant (α = .05): χ²(3) = 0.34, p = .953. The data are consistent with the assumption of statistical independence between the two categorical variables (Cramér's V = .03, indicating a negligible association).

> **APA:** A Pearson chi-square test of independence found no statistically significant association between "undefined" and "undefined", χ²(3) = 0.34, p = .953, V = .03.

**Cảnh báo:** Chi-square assumes expected cell frequencies ≥ 5 in at least 80% of cells and ≥ 1 in all cells. When this assumption is violated, use Fisher's Exact Test (2×2) or collapse rare categories.; Chi-square tests association, not directionality or causality. For ordered categorical data, consider Goodman-Kruskal gamma or Kendall's tau-b to leverage the ordinal information.

---

## correlation
**Biến sử dụng:** ["ATT1","SN1","PBC1","INT1","BEH1"]

### Diễn giải ASIG
A Pearson product-moment correlation was conducted to examine the linear relationship between "ATT1" and "SN1." The analysis yielded a negligible association (r(498) = .05, N = 500, p = .237), which did not reach statistical significance (α = .05). The 95% confidence interval should be reported alongside this result to bound the plausible range of effects.

> **APA:** No statistically significant correlation was found between "ATT1" and "SN1" (r = .05, p = .237).

**Cảnh báo:** Correlation quantifies linear co-variation only. Inspect the scatter plot for non-linearity, heteroscedasticity, or influential data points that may distort the coefficient.; Pearson r assumes interval-level measurement and approximate bivariate normality. For ordinal data, use Spearman rs or polychoric correlation.

---

## linear_regression
**Biến sử dụng:** ["INT1","ATT1","SN1","PBC1"]

### Diễn giải ASIG
Multiple linear regression was conducted to predict "INT1" from 3 predictors (α = .05). The overall model was not statistically significant: F(3, N−4) = 0.00, p = 1.000, adjusted R² = .00. The predictors did not explain a significant proportion of variance in "INT1."

> **APA:** The regression model did not significantly predict "INT1", F(3, N−4) = 0.00, p = 1.000, adjusted R² = .00.

---

## cronbach_alpha
**Biến sử dụng:** ["SN1","SN2","SN3","SN4"]

### Diễn giải ASIG
Reliability analysis of the "Subjective Norm" scale (4 items) yielded Cronbach's Alpha (α) = .69. Although this value falls below the conventional threshold of .70 (Nunnally & Bernstein, 1994), it remains within the acceptable range (.60–.70) for exploratory research (Hair et al., 2019). Scale refinement is recommended before confirmatory use. Examine item-total statistics to identify underperforming items.

> **APA:** Reliability analysis of the "Subjective Norm" scale (4 items) yielded Cronbach's Alpha (α) = .69, ω = .00, indicating borderline internal consistency.

**Cảnh báo:** Cronbach's Alpha (α) = .69 (.60–.70 range) is acceptable for exploratory research only. Confirmatory use or hypothesis testing requires α / ω ≥ .70. Review item-total correlations and consider removing items with CITC < .30.

---

## efa
**Biến sử dụng:** ["SN1","SN2","SN3","SN4","ATT1","ATT2","ATT3","ATT4","PBC1","PBC2","PBC3","PBC4","INT1","INT2","INT3","INT4","BEH1","BEH2","BEH3","BEH4"]

### Diễn giải ASIG
Prior to conducting Exploratory Factor Analysis (EFA), the suitability of the correlation matrix was evaluated. The Kaiser-Meyer-Olkin (KMO) measure of sampling adequacy yielded KMO = .79 (middling; Kaiser, 1974). Bartlett's Test of Sphericity was statistically significant (p < .001), confirming that the correlation matrix is sufficiently non-identity for factor analysis. EFA was conducted using Kaiser criterion (eigenvalue > 1; Kaiser, 1974; note: this criterion tends to over-extract), retaining 5 factors with no rotation applied.

> **APA:** An EFA using minres extraction was conducted. KMO = .79, Bartlett's p < .001. A 5-factor solution was retained.

**Cảnh báo:** EFA is exploratory: the derived factor structure should be replicated in an independent sample via CFA before being treated as the definitive measurement model.

---

## mediation
**Biến sử dụng:** ["ATT1","INT1","BEH1"]

### Diễn giải ASIG
Mediation analysis did not support a significant indirect effect of "ATT1" on "BEH1" through "INT1." The Sobel test was not significant (Z = 0.00, p = 1.000). The total effect of "ATT1" on "BEH1" (B = .00, p = 1.000) should be interpreted in the absence of demonstrated mediation.

> **APA:** No significant mediation was found for the "ATT1" → "INT1" → "BEH1" pathway (indirect effect = .00).

**Cảnh báo:** Baron and Kenny's (1986) causal-steps approach is now considered obsolete. The bootstrap indirect effect CI (Hayes, 2018) is the current methodological standard and provides more accurate Type I error control than the Sobel test.; Mediation analysis does not establish causality: it is a statistical, not experimental, test. Causal inference requires time precedence, covariation, and ruling out third-variable explanations.

---

## cfa
**Biến sử dụng:** ["SN1","SN2","SN3","SN4","ATT1","ATT2","ATT3","ATT4","PBC1","PBC2","PBC3","PBC4","INT1","INT2","INT3","INT4","BEH1","BEH2","BEH3","BEH4"]

### Diễn giải ASIG
Confirmatory Factor Analysis (CFA) was conducted to evaluate the pre-specified measurement model. The overall pattern of model fit indices indicated excellent fit: CFI = .98, TLI = .98, RMSEA = .02, SRMR = .03 (Hu & Bentler, 1999; Kline, 2016). All reported fit indices satisfy recommended thresholds, supporting the adequacy of the measurement model.

> **APA:** CFA results indicated excellent fit: CFI = .98, TLI = .98, RMSEA = .02, SRMR = .03, χ²(160) = 190.01, p = .053 (Hu & Bentler, 1999).

---

## pls_sem
**Biến sử dụng:** ["SN1","SN2","SN3","SN4","ATT1","ATT2","ATT3","ATT4","PBC1","PBC2","PBC3","PBC4","INT1","INT2","INT3","INT4","BEH1","BEH2","BEH3","BEH4"]

### Diễn giải ASIG
PLS-SEM measurement model assessment identified violations in the following areas: convergent validity (AVE < .50). These issues must be resolved — by revising items, reconsidering the measurement model, or addressing construct conceptualisation — before the structural model results can be meaningfully interpreted (Hair et al., 2017, 2021). Proceeding with hypothesis testing under measurement model violations risks biased path coefficient estimates and inflated Type I error.

> **APA:** PLS-SEM assessment identified measurement model violations. Resolve issues in AVE (< .50) before interpreting structural paths (Hair et al., 2017).

**Cảnh báo:** Outer loading for "V5" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V6" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V7" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V8" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V9" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V10" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V11" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V12" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V13" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V14" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V15" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V16" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V17" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V18" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V19" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V20" (→ SN) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V1" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V2" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V3" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V4" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V9" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V10" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V11" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V12" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V13" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V14" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V15" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V16" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V17" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V18" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V19" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V20" (→ ATT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V1" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V2" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V3" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V4" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V5" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V6" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V7" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V8" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V13" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V14" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V15" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V16" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V17" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V18" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V19" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V20" (→ PBC) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V1" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V2" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V3" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V4" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V5" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V6" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V7" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V8" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V9" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V10" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V11" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V12" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V17" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V18" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V19" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V20" (→ INT) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V1" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V2" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V3" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V4" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V5" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V6" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V7" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V8" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V9" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V10" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V11" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V12" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V13" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V14" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V15" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; Outer loading for "V16" (→ BEH) = .00 < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).; AVE for "INT" = .47 < .50: the construct captures less than half its variance from indicators; measurement error dominates (Fornell & Larcker, 1981). Remove low-loading items or reconsider the construct definition.; AVE for "BEH" = .40 < .50: the construct captures less than half its variance from indicators; measurement error dominates (Fornell & Larcker, 1981). Remove low-loading items or reconsider the construct definition.; Path PBC → BEH: statistically significant but |β| = .09 < .10. This effect is very small; evaluate practical significance and consider f² effect size (small ≥ .02, medium ≥ .15, large ≥ .35; Hair et al., 2017).

---

