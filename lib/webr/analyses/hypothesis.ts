/**
 * Hypothesis Testing Modules - Fully Template-Driven
 *
 * Data passing strategy:
 * - All functions use executeRWithRecovery's csvData param to avoid
 *   FileReaderSync/Blob crash when data strings are too large.
 * - Data is passed as a number[][] matrix; R reads it from `raw_data`.
 * - Column layout per function is documented in each R code block.
 */
import { WEBR_TIMEOUTS } from '../constants';
import { validateAndCleanData } from '../input-validator';
import { executeRWithRecovery, loadPackagesForMethod } from '../core';
import { parseWebRResult, parseMatrix } from '../utils';
import { getAnalysisRTemplate } from '../templates';

/**
 * Run correlation analysis
 * csvData layout: columns = variables
 */
export async function runCorrelation(
    data: number[][],
    method: 'pearson' | 'spearman' | 'kendall' = 'pearson'
): Promise<{
    correlationMatrix: number[][];
    pValues: number[][];
    ciLowerMatrix?: number[][];
    ciUpperMatrix?: number[][];
    method: string;
    N: number[];
    rCode: string;
}> {
    await loadPackagesForMethod('correlation');

    const defaultRCode = `
    # PURE BASE-R CORRELATION (NO psych::corr.test)
    data_mat <- raw_data;
    df <- as.data.frame(data_mat);
    colnames(df) <- paste0("V", 1:ncol(df));
    method_name <- "{{method}}";
    
    # Compute correlation matrix
    r_mat <- cor(df, use = "pairwise.complete.obs", method = method_name)
    
    # Compute p-values and CI matrices manually
    p_mat <- matrix(0, nrow = ncol(df), ncol = ncol(df))
    ci_low_mat <- matrix(NA, nrow = ncol(df), ncol = ncol(df))
    ci_up_mat <- matrix(NA, nrow = ncol(df), ncol = ncol(df))
    for (i in 1:(ncol(df)-1)) {
        for (j in (i+1):ncol(df)) {
            test_result <- tryCatch(
                cor.test(df[[i]], df[[j]], method = method_name),
                error = function(e) list(p.value = NA, conf.int = c(NA, NA))
            )
            p_mat[i, j] <- test_result$p.value
            p_mat[j, i] <- test_result$p.value
            if(!is.null(test_result$conf.int)) {
                ci_low_mat[i, j] <- test_result$conf.int[1]
                ci_low_mat[j, i] <- test_result$conf.int[1]
                ci_up_mat[i, j] <- test_result$conf.int[2]
                ci_up_mat[j, i] <- test_result$conf.int[2]
            }
        }
    }
    
    list(
        correlation = as.vector(r_mat),
        p_values = as.vector(p_mat),
        ci_lower = as.vector(ci_low_mat),
        ci_upper = as.vector(ci_up_mat),
        n_cols = ncol(df),
        n_obs = nrow(df),
        method = method_name
    );
    `;

    const template = await getAnalysisRTemplate('correlation', defaultRCode);
    const rCode = template.replace(/\{\{method\}\}/g, method);

    const jsResult = await executeRWithRecovery(rCode, 'correlation', 0, 2, WEBR_TIMEOUTS.STANDARD, data);
    const getValue = parseWebRResult(jsResult);
    const numCols = getValue('n_cols')?.[0] || data[0]?.length || 0;

    return {
        correlationMatrix: parseMatrix(getValue('correlation'), numCols),
        pValues: parseMatrix(getValue('p_values'), numCols),
        ciLowerMatrix: parseMatrix(getValue('ci_lower'), numCols),
        ciUpperMatrix: parseMatrix(getValue('ci_upper'), numCols),
        method: method,
        N: getValue('n_obs'),
        rCode: rCode
    };
}

/**
 * Run Independent Samples T-test
 * csvData layout: col0 = group1 values, col1 = group2 values (padded with NA if unequal length)
 */
export async function runTTestIndependent(group1: number[], group2: number[]): Promise<{
    t: number;
    tStatistic: number;
    df: number;
    pValue: number;
    mean1: number;
    sd1: number;
    mean2: number;
    sd2: number;
    meanDiff: number;
    ci95Lower: number;
    ci95Upper: number;
    effectSize: number;
    varTestP: number;
    leveneP: number;
    leveneF: number;
    normalityP1: number;
    normalityP2: number;
    rCode: string;
}> {
    await loadPackagesForMethod('ttest');

    // Pack both groups into a 2-column matrix (pad shorter with NA)
    const maxLen = Math.max(group1.length, group2.length);
    const csvData: number[][] = Array.from({ length: maxLen }, (_, i) => [
        i < group1.length ? group1[i] : NaN,
        i < group2.length ? group2[i] : NaN,
    ]);

    const defaultRCode = `
    g1 <- raw_data[!is.na(raw_data[,1]), 1];
    g2 <- raw_data[!is.na(raw_data[,2]), 2];
    shapiro_p1 <- tryCatch({ if (length(g1) >= 3) shapiro.test(g1)$p.value else NA }, error = function(e) { NA });
    shapiro_p2 <- tryCatch({ if (length(g2) >= 3) shapiro.test(g2)$p.value else NA }, error = function(e) { NA });
    med1 <- median(g1); med2 <- median(g2);
    z1 <- abs(g1 - med1); z2 <- abs(g2 - med2);
    levene_res <- tryCatch({
        combined <- c(z1, z2);
        group_fact <- factor(c(rep("G1", length(z1)), rep("G2", length(z2))));
        summary(aov(combined ~ group_fact))[[1]]
    }, error = function(e) { NULL });
    lev_p <- if(!is.null(levene_res)) levene_res["group_fact", "Pr(>F)"] else 0.5;
    lev_f <- if(!is.null(levene_res)) levene_res["group_fact", "F value"] else 0;
    var_equal <- lev_p > 0.05;
    tt <- t.test(g1, g2, var.equal = var_equal);
    m1 <- mean(g1); m2 <- mean(g2);
    s1 <- sd(g1); s2 <- sd(g2);
    n1 <- length(g1); n2 <- length(g2);
    pooled_sd <- sqrt(((n1-1)*s1^2 + (n2-1)*s2^2)/(n1+n2-2));
    d <- if(pooled_sd > 0) (m1 - m2) / pooled_sd else 0;
    list(
        t = tt$statistic, df = tt$parameter, p_value = tt$p.value,
        mean1 = m1, mean2 = m2, mean_diff = m1 - m2,
        sd1 = s1, sd2 = s2,
        ci_lower = tt$conf.int[1], ci_upper = tt$conf.int[2],
        effect_size = d, levene_p = lev_p, levene_f = lev_f,
        shapiro_p1 = shapiro_p1, shapiro_p2 = shapiro_p2
    );
    `;

    const template = await getAnalysisRTemplate('ttest-indep', defaultRCode);
    const rCode = template;

    const result = await executeRWithRecovery(rCode, 'ttest', 0, 2, WEBR_TIMEOUTS.STANDARD, csvData);
    const getValue = parseWebRResult(result);

    return {
        t: getValue('t')?.[0] ?? 0,
        tStatistic: getValue('t')?.[0] ?? 0,
        df: getValue('df')?.[0] ?? 0,
        pValue: getValue('p_value')?.[0] ?? 1,
        mean1: getValue('mean1')?.[0] ?? 0,
        sd1: getValue('sd1')?.[0] ?? 0,
        mean2: getValue('mean2')?.[0] ?? 0,
        sd2: getValue('sd2')?.[0] ?? 0,
        meanDiff: getValue('mean_diff')?.[0] ?? 0,
        ci95Lower: getValue('ci_lower')?.[0] ?? 0,
        ci95Upper: getValue('ci_upper')?.[0] ?? 0,
        effectSize: getValue('effect_size')?.[0] ?? 0,
        varTestP: getValue('levene_p')?.[0] ?? 0.5,
        leveneP: getValue('levene_p')?.[0] ?? 0.5,
        leveneF: getValue('levene_f')?.[0] ?? 0,
        normalityP1: getValue('shapiro_p1')?.[0] ?? 1,
        normalityP2: getValue('shapiro_p2')?.[0] ?? 1,
        rCode
    };
}

/**
 * Run Paired Samples T-test
 * csvData layout: col0 = before, col1 = after
 */
export async function runTTestPaired(before: number[], after: number[]): Promise<{
    t: number;
    df: number;
    pValue: number;
    meanBefore: number;
    sdBefore: number;
    meanAfter: number;
    sdAfter: number;
    meanDiff: number;
    ci95Lower: number;
    ci95Upper: number;
    effectSize: number;
    normalityDiffP: number;
    rCode: string;
}> {
    await loadPackagesForMethod('paired-ttest');

    const csvData: number[][] = before.map((b, i) => [b, after[i] ?? NaN]);

    const defaultRCode = `
    b <- raw_data[,1];
    a <- raw_data[,2];
    diffs <- b - a;
    sh_p <- tryCatch({ if (length(diffs) >= 3) shapiro.test(diffs)$p.value else NA }, error = function(e) { NA });
    tt <- t.test(b, a, paired = TRUE);
    m_diff <- mean(diffs);
    sd_diff <- sd(diffs);
    d <- if(!is.na(sd_diff) && sd_diff > 0) m_diff / sd_diff else 0;
    list(
        t = tt$statistic, df = tt$parameter, pValue = tt$p.value,
        meanBefore = mean(b), sdBefore = sd(b),
        meanAfter = mean(a), sdAfter = sd(a),
        meanDiff = m_diff,
        ci_lower = tt$conf.int[1], ci_upper = tt$conf.int[2],
        effect_size = d, norm_p = sh_p
    );
    `;

    const template = await getAnalysisRTemplate('ttest-paired', defaultRCode);
    const rCode = template;

    const result = await executeRWithRecovery(rCode, 'paired-ttest', 0, 2, WEBR_TIMEOUTS.STANDARD, csvData);
    const getValue = parseWebRResult(result);

    return {
        t: getValue('t')?.[0] ?? 0,
        df: getValue('df')?.[0] ?? 0,
        pValue: getValue('pValue')?.[0] ?? 1,
        meanBefore: getValue('meanBefore')?.[0] ?? 0,
        sdBefore: getValue('sdBefore')?.[0] ?? 0,
        meanAfter: getValue('meanAfter')?.[0] ?? 0,
        sdAfter: getValue('sdAfter')?.[0] ?? 0,
        meanDiff: getValue('meanDiff')?.[0] ?? 0,
        ci95Lower: getValue('ci_lower')?.[0] ?? 0,
        ci95Upper: getValue('ci_upper')?.[0] ?? 0,
        effectSize: getValue('effect_size')?.[0] ?? 0,
        normalityDiffP: getValue('norm_p')?.[0] ?? 1,
        rCode
    };
}

/**
 * Run One-Way ANOVA
 * csvData layout: col0 = values, col1 = group index (1-based integer)
 */
export async function runOneWayANOVA(groups: number[][]): Promise<{
    F: number;
    fStatistic: number;
    dfBetween: number;
    dfWithin: number;
    pValue: number;
    ssBetween: number;
    ssWithin: number;
    msBetween: number;
    msWithin: number;
    groupMeans: number[];
    grandMean: number;
    etaSquared: number;
    assumptionCheckP: number;
    normalityResidP: number;
    methodUsed: string;
    postHoc: { comparison: string; diff: number; pAdj: number }[];
    postHocWarning: string;
    rCode: string;
}> {
    await loadPackagesForMethod('anova');

    // Pack: col0 = value, col1 = group index
    const csvData: number[][] = groups.flatMap((g, i) => g.map(v => [v, i + 1]));

    const defaultRCode = `
    vals <- raw_data[,1];
    grps <- factor(raw_data[,2]);
    mod <- aov(vals ~ grps);
    res <- summary(mod)[[1]];
    
    # Assumption Check: Homogeneity of Variance (Levene-like)
    m_meds <- tapply(vals, grps, median);
    devs <- vals - m_meds[as.numeric(grps)];
    lev_p <- summary(aov(abs(devs) ~ grps))[[1]][1, "Pr(>F)"];
    
    if (lev_p < 0.05) {
        # Heteroscedasticity -> Welch ANOVA + Games-Howell
        w_res <- oneway.test(vals ~ grps, var.equal = FALSE);
        f_val <- w_res$statistic; df_b <- w_res$parameter[1]; df_w <- w_res$parameter[2]; p_val <- w_res$p.value;
        method <- "Welch ANOVA (Vi pham dong nhat phuong sai)";
        
        means <- tapply(vals, grps, mean); vars <- tapply(vals, grps, var); ns <- tapply(vals, grps, length);
        k <- length(levels(grps)); comb <- combn(k, 2);
        c_names <- c(); c_diffs <- c(); c_p <- c();
        
        for(i in 1:ncol(comb)) {
            idx1 <- comb[1,i]; idx2 <- comb[2,i];
            md <- means[idx1]-means[idx2]; 
            se <- sqrt(vars[idx1]/ns[idx1] + vars[idx2]/ns[idx2]);
            df_gh <- (vars[idx1]/ns[idx1] + vars[idx2]/ns[idx2])^2 / 
                     ((vars[idx1]/ns[idx1])^2/(ns[idx1]-1) + (vars[idx2]/ns[idx2])^2/(ns[idx2]-1));
            q <- abs(md)/se * sqrt(2);
            c_names <- c(c_names, paste0(levels(grps)[idx1], " vs ", levels(grps)[idx2]));
            c_diffs <- c(c_diffs, md); 
            c_p <- c(c_p, ptukey(q, k, df_gh, lower.tail=FALSE));
        }
        warn <- "Chu y: Phuong sai khong dong nhat, su dung Welch ANOVA va Games-Howell.";
    } else {
        # Homoscedasticity -> Classic ANOVA + Tukey HSD
        f_val <- res[1, "F value"]; df_b <- res[1, "Df"]; df_w <- res[2, "Df"]; p_val <- res[1, "Pr(>F)"];
        method <- "Classic ANOVA (Phuong sai dong nhat)";
        tk <- TukeyHSD(mod);
        tk_res <- tk[[1]]; # Access first element of list
        c_names <- rownames(tk_res); 
        c_diffs <- tk_res[,"diff"]; 
        c_p <- tk_res[,"p adj"];
        warn <- "Gia thuyet phuong sai dong nhat duoc dam bao. Su dung Tukey HSD.";
    }
    
    # Normality of residuals
    sh_res_p <- tryCatch({ if(length(residuals(mod)) >= 3) shapiro.test(residuals(mod))$p.value else NA }, error = function(e) NA);
    ssb <- res[1, "Sum Sq"]; ssw <- res[2, "Sum Sq"];
    
    list(
        f = f_val, df_b = df_b, df_w = df_w, p = p_val, ssb = ssb, ssw = ssw, 
        msb = res[1, "Mean Sq"], msw = res[2, "Mean Sq"],
        means = as.numeric(tapply(vals, grps, mean)), grand = mean(vals), 
        eta = ssb/(ssb+ssw), lev_p = lev_p, sh_p = sh_res_p, 
        method = method, warn = warn,
        comp_names = c_names, comp_diffs = c_diffs, comp_p = c_p
    );
    `;

    const template = await getAnalysisRTemplate('anova', defaultRCode);
    const rCode = template;

    const result = await executeRWithRecovery(rCode, 'anova', 0, 2, WEBR_TIMEOUTS.STANDARD, csvData);
    const getValue = parseWebRResult(result);

    const ph_names = getValue('comp_names') || [];
    const ph_diffs = getValue('comp_diffs') || [];
    const ph_p = getValue('comp_p') || [];
    const postHoc = ph_names.map((n: string, i: number) => ({ comparison: n, diff: ph_diffs[i], pAdj: ph_p[i] }));

    return {
        F: getValue('f')?.[0] ?? 0,
        fStatistic: getValue('f')?.[0] ?? 0,
        dfBetween: getValue('df_b')?.[0] ?? 0,
        dfWithin: getValue('df_w')?.[0] ?? 0,
        pValue: getValue('p')?.[0] ?? 1,
        ssBetween: getValue('ssb')?.[0] ?? 0,
        ssWithin: getValue('ssw')?.[0] ?? 0,
        msBetween: getValue('msb')?.[0] ?? 0,
        msWithin: getValue('msw')?.[0] ?? 0,
        groupMeans: getValue('means') || [],
        grandMean: getValue('grand')?.[0] ?? 0,
        etaSquared: getValue('eta')?.[0] ?? 0,
        assumptionCheckP: getValue('lev_p')?.[0] ?? 0.5,
        normalityResidP: getValue('sh_p')?.[0] ?? 1,
        methodUsed: getValue('method')?.[0] ?? 'ANOVA',
        postHoc,
        postHocWarning: getValue('warn')?.[0] ?? '',
        rCode
    };
}

/**
 * Run Mann-Whitney U Test
 * csvData layout: col0 = group1 values, col1 = group2 values (padded with NA)
 */
export async function runMannWhitneyU(group1: number[], group2: number[]): Promise<{
    statistic: number;
    pValue: number;
    median1: number;
    median2: number;
    effectSize: number;
    skew1: number;
    skew2: number;
    distSimilar: boolean;
    rCode: string;
}> {
    await loadPackagesForMethod('mann-whitney');

    const maxLen = Math.max(group1.length, group2.length);
    const csvData: number[][] = Array.from({ length: maxLen }, (_, i) => [
        i < group1.length ? group1[i] : NaN,
        i < group2.length ? group2[i] : NaN,
    ]);

    const defaultRCode = `
    # PURE BASE-R MANN-WHITNEY (NO psych::skew)
    g1 <- raw_data[!is.na(raw_data[,1]), 1];
    g2 <- raw_data[!is.na(raw_data[,2]), 2];
    tt <- wilcox.test(g1, g2, conf.int = TRUE);
    n1 <- length(g1); n2 <- length(g2); n_total <- n1 + n2;
    U <- tt$statistic;
    mu_U <- n1 * n2 / 2;
    sigma_U <- sqrt(n1 * n2 * (n_total + 1) / 12);
    z_score <- (U - mu_U) / sigma_U;
    r <- min(abs(z_score) / sqrt(n_total), 1.0);
    
    # Inline skewness (no psych needed)
    calc_skew <- function(x) {
        x <- x[!is.na(x)]
        n <- length(x)
        if (n < 3) return(0)
        m <- mean(x); s <- sd(x)
        if (s == 0) return(0)
        (n / ((n-1)*(n-2))) * sum(((x - m) / s)^3)
    }
    sk1 <- calc_skew(g1); sk2 <- calc_skew(g2);
    sim <- (sign(sk1) == sign(sk2)) && (abs(sk1 - sk2) < 1.0);
    list(stat = tt$statistic, p = tt$p.value, m1 = median(g1), m2 = median(g2), r = r, sk1 = sk1, sk2 = sk2, dist_similar = sim);
    `;

    const template = await getAnalysisRTemplate('mann-whitney', defaultRCode);
    const rCode = template;

    const result = await executeRWithRecovery(rCode, 'mann-whitney', 0, 2, WEBR_TIMEOUTS.STANDARD, csvData);
    const getValue = parseWebRResult(result);

    return {
        statistic: getValue('stat')?.[0] ?? 0,
        pValue: getValue('p')?.[0] ?? 1,
        median1: getValue('m1')?.[0] ?? 0,
        median2: getValue('m2')?.[0] ?? 0,
        effectSize: getValue('r')?.[0] ?? 0,
        skew1: getValue('sk1')?.[0] ?? 0,
        skew2: getValue('sk2')?.[0] ?? 0,
        distSimilar: getValue('dist_similar')?.[0] === true || getValue('dist_similar')?.[0] === 1,
        rCode
    };
}

/**
 * Run Chi-Square Test
 * Chi-square uses string data — keep inline (small contingency table, not large dataset)
 */
export async function runChiSquare(data: unknown[][]): Promise<{
    statistic: number;
    df: number;
    pValue: number;
    observed: { data: number[][]; rows: string[]; cols: string[] };
    expected: { data: number[][]; rows: string[]; cols: string[] };
    cramersV: number;
    phi: number;
    oddsRatio: number | null;
    fisherPValue: number | null;
    warning: string;
    rCode: string;
}> {
    await loadPackagesForMethod('chi-square');
    const flatStr = data.flat().map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(',');

    const defaultRCode = `
    v <- c(${flatStr});
    m <- matrix(v, nrow = ${data.length}, byrow = TRUE);
    tbl <- table(m[,1], m[,2]);
    tt <- chisq.test(tbl);
    n <- sum(tbl);
    cv <- if(min(dim(tbl)) > 1) sqrt(tt$statistic / (n * (min(dim(tbl)) - 1))) else 0;
    phi <- NA; fisher_p <- NA; or <- NA;
    if (nrow(tbl) == 2 && ncol(tbl) == 2) {
        phi <- sqrt(tt$statistic / n);
        ft <- fisher.test(tbl);
        fisher_p <- ft$p.value; or <- ft$estimate;
    }
    list(
        stat = tt$statistic, df = tt$parameter[1], p = tt$p.value,
        cv = cv, phi = phi, fisher = fisher_p, or = or,
        rows = rownames(tbl), cols = colnames(tbl),
        nr = nrow(tbl), nc = ncol(tbl),
        ovs = as.vector(tt$observed), evs = as.vector(tt$expected)
    );
    `;

    const rCode = await getAnalysisRTemplate('chi-square', defaultRCode);
    // Chi-square uses inline data (categorical strings, not large numeric matrix)
    const result = await executeRWithRecovery(rCode, 'chi-square', 0, 2, WEBR_TIMEOUTS.STANDARD);
    const getValue = parseWebRResult(result);

    const nr = getValue('nr')?.[0] || 0;
    const nc = getValue('nc')?.[0] || 0;
    const ovs = getValue('ovs') || [];
    const evs = getValue('evs') || [];

    const reconstruct = (vals: number[]) => {
        const res = [];
        for (let r = 0; r < nr; r++) {
            const rowArr = [];
            for (let c = 0; c < nc; c++) rowArr.push(vals[r + c * nr]);
            res.push(rowArr);
        }
        return res;
    };

    return {
        statistic: getValue('stat')?.[0] ?? 0,
        df: getValue('df')?.[0] ?? 0,
        pValue: getValue('p')?.[0] ?? 1,
        observed: { data: reconstruct(ovs), rows: getValue('rows') || [], cols: getValue('cols') || [] },
        expected: { data: reconstruct(evs), rows: getValue('rows') || [], cols: getValue('cols') || [] },
        cramersV: getValue('cv')?.[0] ?? 0,
        phi: getValue('phi')?.[0] ?? 0,
        oddsRatio: getValue('or')?.[0] ?? null,
        fisherPValue: getValue('fisher')?.[0] ?? null,
        warning: '',
        rCode
    };
}

/**
 * Run Kruskal-Wallis Test
 * csvData layout: col0 = values, col1 = group index (1-based)
 */
export async function runKruskalWallis(groups: number[][]): Promise<{
    statistic: number;
    df: number;
    pValue: number;
    medians: number[];
    method: string;
    postHoc: { comparison: string; pAdj: number }[];
    rCode: string;
}> {
    await loadPackagesForMethod('kruskal');

    const csvData: number[][] = groups.flatMap((g, i) => g.map(v => [v, i + 1]));

    const defaultRCode = `
    vals <- raw_data[,1]; grps <- factor(raw_data[,2]);
    tt <- kruskal.test(vals ~ grps);
    meds <- as.numeric(tapply(vals, grps, median));
    pw <- tryCatch({
        pmat <- pairwise.wilcox.test(vals, grps, p.adjust.method = "bonferroni")$p.value;
        comps <- c(); ps <- c();
        for(i in 1:nrow(pmat)) for(j in 1:ncol(pmat)) if(!is.na(pmat[i,j])) {
            comps <- c(comps, paste0(rownames(pmat)[i], "-", colnames(pmat)[j]));
            ps <- c(ps, pmat[i,j]);
        }
        list(c = comps, p = ps);
    }, error = function(e) list(c = c(), p = c()));
    list(stat = tt$statistic, df = tt$parameter, p = tt$p.value, meds = meds, m = tt$method, ph_c = pw$c, ph_p = pw$p);
    `;

    const template = await getAnalysisRTemplate('kruskal', defaultRCode);
    const rCode = template;

    const result = await executeRWithRecovery(rCode, 'kruskal', 0, 2, WEBR_TIMEOUTS.STANDARD, csvData);
    const getValue = parseWebRResult(result);

    const ph_c = getValue('ph_c') || [];
    const ph_p = getValue('ph_p') || [];
    const postHoc = ph_c.map((n: string, i: number) => ({ comparison: n, pAdj: ph_p[i] }));

    return {
        statistic: getValue('stat')?.[0] ?? 0,
        df: getValue('df')?.[0] ?? 0,
        pValue: getValue('p')?.[0] ?? 1,
        medians: getValue('meds') || [],
        method: getValue('m')?.[0] ?? 'Kruskal-Wallis',
        postHoc,
        rCode
    };
}

/**
 * Run Wilcoxon Signed Rank Test
 * csvData layout: col0 = before, col1 = after
 */
export async function runWilcoxonSignedRank(before: number[], after: number[]): Promise<{
    statistic: number;
    pValue: number;
    medianDiff: number;
    method: string;
    rCode: string;
}> {
    await loadPackagesForMethod('wilcoxon');

    const csvData: number[][] = before.map((b, i) => [b, after[i] ?? NaN]);

    const defaultRCode = `
    b <- raw_data[,1]; a <- raw_data[,2];
    tt <- wilcox.test(b, a, paired = TRUE, conf.int = TRUE);
    list(stat = tt$statistic, p = tt$p.value, md = if(!is.null(tt$estimate)) tt$estimate else median(b-a), m = tt$method);
    `;

    const template = await getAnalysisRTemplate('wilcoxon', defaultRCode);
    const rCode = template;

    const result = await executeRWithRecovery(rCode, 'wilcoxon', 0, 2, WEBR_TIMEOUTS.STANDARD, csvData);
    const getValue = parseWebRResult(result);

    return {
        statistic: getValue('stat')?.[0] ?? 0,
        pValue: getValue('p')?.[0] ?? 1,
        medianDiff: getValue('md')?.[0] ?? 0,
        method: getValue('m')?.[0] ?? 'Wilcoxon',
        rCode
    };
}
