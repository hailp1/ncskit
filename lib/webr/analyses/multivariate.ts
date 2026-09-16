/**
 * Multivariate Analysis Modules - Template-Driven
 */
import { WEBR_TIMEOUTS, getTimeoutForMethod } from '../constants';
import { executeRWithRecovery, loadPackagesForMethod } from '../core';
import { parseWebRResult } from '../utils';
import { getAnalysisRTemplate } from '../templates';

/**
 * Run Cluster Analysis (K-Means)
 */
export async function runClusterAnalysis(
    data: number[][],
    k: number = 3,
    method: string = 'kmeans',
    columns: string[] = []
): Promise<{
    clusters: number[];
    centers: number[][];
    size: number[];
    withinSS: number[];
    totWithinSS: number;
    betweensSS: number;
    totalSS: number;
    silhoutteScore?: number;
    rCode: string;
}> {
    await loadPackagesForMethod('cluster');

    const defaultRCode = `
    library(cluster);
    df <- as.data.frame({{data}});
    colnames(df) <- c({{columns}});
    df_scaled <- scale(df);
    set.seed(123);
    km <- kmeans(df_scaled, centers = {{k}}, nstart = 25);
    
    sil_score <- tryCatch({
        dist_mat <- dist(df_scaled)
        sil <- silhouette(km$cluster, dist_mat)
        mean(sil[, 3])
    }, error = function(e) NA);
    
    list(
        cluster = km$cluster,
        centers = as.numeric(t(km$centers)),
        cols = ncol(km$centers),
        size = km$size,
        withinss = km$withinss,
        tot_withinss = km$tot.withinss,
        betweenss = km$betweenss,
        totss = km$totss,
        sil_score = as.numeric(sil_score)
    );
    `;

    const colNames = columns.map(c => `"${c}"`).join(',');
    const template = await getAnalysisRTemplate('cluster', defaultRCode);
    const rCode = template
        .replace(/\{\{data\}\}/g, 'raw_data')
        .replace(/\{\{columns\}\}/g, colNames)
        .replace(/\{\{k\}\}/g, String(k));

    const result = await executeRWithRecovery(rCode, 'cluster', 0, 2, WEBR_TIMEOUTS.COMPLEX, data);
    const getValue = parseWebRResult(result);

    const centersFlat = getValue('centers') || [];
    const nCols = getValue('cols')?.[0] || columns.length;
    const centers = [];
    for (let i = 0; i < k; i++) {
        centers.push(centersFlat.slice(i * nCols, (i + 1) * nCols));
    }

    return {
        clusters: getValue('cluster') || [],
        centers: centers,
        size: getValue('size') || [],
        withinSS: getValue('withinss') || [],
        totWithinSS: getValue('tot_withinss')?.[0] || 0,
        betweensSS: getValue('betweenss')?.[0] || 0,
        totalSS: getValue('totss')?.[0] || 0,
        silhoutteScore: getValue('sil_score')?.[0] ?? 0,
        rCode
    };
}

/**
 * Run Two-Way ANOVA
 * csvData layout: col0 = dependent variable (y), col1 = factor 1 (coded), col2 = factor 2 (coded)
 */
export async function runTwoWayANOVA(
    y: number[],
    f1: string[],
    f2: string[],
    f1Name: string = "Factor1",
    f2Name: string = "Factor2",
    yName: string = "Dependent"
): Promise<{
    table: {
        source: string;
        df: number;
        ss: number;
        ms: number;
        f: number;
        p: number;
        etaPartial: number;
    }[];
    rCode: string;
}> {
    await loadPackagesForMethod('anova');

    // Encode string factors to numeric indices for raw_data transfer
    const distinctF1 = Array.from(new Set(f1));
    const distinctF2 = Array.from(new Set(f2));
    
    const encodedData: number[][] = y.map((val, i) => [
        val,
        distinctF1.indexOf(f1[i]) + 1,
        distinctF2.indexOf(f2[i]) + 1
    ]);

    const defaultRCode = `
    y_vals <- raw_data[,1];
    f1_vals <- factor(raw_data[,2], labels = c({{f1_labels}}));
    f2_vals <- factor(raw_data[,3], labels = c({{f2_labels}}));
    
    # Model with interaction
    mod <- aov(y_vals ~ f1_vals * f2_vals);
    res <- summary(mod)[[1]];
    
    # Calculate Partial Eta Squared: SS_effect / (SS_effect + SS_error)
    ss_error <- res[nrow(res), "Sum Sq"];
    eta_p <- res[, "Sum Sq"] / (res[, "Sum Sq"] + ss_error);
    
    sources <- rownames(res);
    # Translate common R names to Vietnamese
    sources <- gsub("f1_vals", "{{f1_name}}", sources);
    sources <- gsub("f2_vals", "{{f2_name}}", sources);
    sources <- gsub("f1_vals:f2_vals", "Tuong tac ({{f1_name}} * {{f2_name}})", sources);
    sources <- gsub("Residuals", "Sai so (Residuals)", sources);

    list(
        sources = sources,
        df = res$Df,
        ss = res$"Sum Sq",
        ms = res$"Mean Sq",
        f = res$"F value",
        p = res$"Pr(>F)",
        eta_p = eta_p
    );
    `;

    const f1Labels = distinctF1.map(l => `"${l}"`).join(',');
    const f2Labels = distinctF2.map(l => `"${l}"`).join(',');

    const template = await getAnalysisRTemplate('anova2way', defaultRCode);
    const rCode = template
        .replace(/\{\{f1_labels\}\}/g, f1Labels)
        .replace(/\{\{f2_labels\}\}/g, f2Labels)
        .replace(/\{\{f1_name\}\}/g, f1Name)
        .replace(/\{\{f2_name\}\}/g, f2Name);

    const result = await executeRWithRecovery(rCode, 'anova2way', 0, 2, WEBR_TIMEOUTS.COMPLEX, encodedData);
    const getValue = parseWebRResult(result);

    const sources = getValue('sources') || [];
    const df = getValue('df') || [];
    const ss = getValue('ss') || [];
    const ms = getValue('ms') || [];
    const f = getValue('f') || [];
    const p = getValue('p') || [];
    const etaP = getValue('eta_p') || [];

    const table = sources.map((s: string, i: number) => ({
        source: s.trim(),
        df: df[i] || 0,
        ss: ss[i] || 0,
        ms: ms[i] || 0,
        f: f[i] || 0,
        p: p[i] || 0,
        etaPartial: etaP[i] || 0
    }));

    return { table, rCode };
}

