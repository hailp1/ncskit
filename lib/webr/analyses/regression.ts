/**
 * Regression Analysis Modules - Template-Driven
 */
import { WEBR_TIMEOUTS, getTimeoutForMethod } from '../constants';
import { validateAndCleanData } from '../input-validator';
import { executeRWithRecovery, loadPackagesForMethod } from '../core';
import { parseWebRResult } from '../utils';
import { getAnalysisRTemplate } from '../templates';

/**
 * Run Multiple Linear Regression
 */
export async function runLinearRegression(data: number[][], names: string[]): Promise<{
    coefficients: {
        term: string;
        estimate: number;
        stdBeta: number;
        stdError: number;
        tValue: number;
        pValue: number;
        vif?: number;
        ci95Lower?: number;
        ci95Upper?: number;
    }[];
    modelFit: {
        rSquared: number;
        adjRSquared: number;
        fStatistic: number;
        df: number;
        dfResid: number;
        pValue: number;
        residualStdError: number;
        normalityP: number;
        durbinWatson?: number;
    };
    equation: string;
    chartData: {
        fitted: number[];
        residuals: number[];
        actual: number[];
    };
    rCode: string;
}> {
    await loadPackagesForMethod('linear-regression');

    // Validate and clean input data
    const validation = validateAndCleanData(data, {
        minRows: 10,
        minCols: 2,
        analysisName: 'Linear Regression',
    });
    if (!validation.valid) throw new Error(validation.warnings[validation.warnings.length - 1]);
    const cleanData = validation.cleanData;

    const defaultRCode = `
    df <- as.data.frame({{data}});
    colnames(df) <- c({{names}});
    y_name <- colnames(df)[1];
    f_str <- paste0("\`", y_name, "\` ~ .");
    mod <- lm(as.formula(f_str), data = df);
    s <- summary(mod);
    cf <- coef(s);
    fs <- s$fstatistic;
    
    # VIF Calculation
    vifs <- tryCatch({
        x_data <- df[, -1, drop = FALSE];
        if (ncol(x_data) > 1) {
            v <- numeric(ncol(x_data));
            for (i in 1:ncol(x_data)) {
                r2 <- summary(lm(x_data[, i] ~ ., data = x_data[, -i, drop = FALSE]))$r.squared;
                v[i] <- if (r2 >= 0.9999) 999.99 else 1 / (1 - r2);
            }
            v;
        } else { 1.0 }
    }, error = function(e) numeric(0));

    # Standardized Betas
    sb <- tryCatch({
        b <- cf[-1, 1];
        sx <- sapply(df[, -1, drop = FALSE], sd, na.rm = TRUE);
        sy <- sd(df[, 1], na.rm = TRUE);
        c(NA, b * sx / sy);
    }, error = function(e) rep(NA, nrow(cf)));

    sh_p <- tryCatch(shapiro.test(residuals(mod))$p.value, error = function(e) 0);
    f_p_val <- if(!is.null(fs) && fs[2] > 0 && fs[3] > 0) pf(fs[1], fs[2], fs[3], lower.tail = FALSE) else 1;
    
    ci <- tryCatch(confint(mod), error = function(e) cbind(rep(NA, nrow(cf)), rep(NA, nrow(cf))));
    res <- residuals(mod);
    dw <- tryCatch(sum(diff(res)^2) / sum(res^2), error = function(e) NA);

    list(
        c_names = rownames(cf),
        estimates = as.vector(cf[, 1]),
        s_betas = as.vector(sb),
        errors = as.vector(cf[, 2]),
        t_vals = as.vector(cf[, 3]),
        p_vals = as.vector(cf[, 4]),
        ci_lower = as.vector(ci[, 1]),
        ci_upper = as.vector(ci[, 2]),
        r2 = as.numeric(s$r.squared),
        ar2 = as.numeric(s$adj.r.squared),
        f = if(is.null(fs)) 0 else fs[1],
        df_n = if(is.null(fs)) 0 else fs[2],
        df_d = if(is.null(fs)) 0 else fs[3],
        sigma = as.numeric(s$sigma),
        f_p = as.numeric(f_p_val),
        fit = as.vector(fitted(mod)),
        res = as.vector(residuals(mod)),
        act = as.vector(df[, 1]),
        vifs = as.vector(vifs),
        norm_p = as.numeric(sh_p),
        dw = as.numeric(dw)
    );
    `;

    const namesStr = names.map(n => `"${n}"`).join(',');
    const template = await getAnalysisRTemplate('regression', defaultRCode);
    const rCode = template
        .replace(/\{\{data\}\}/g, 'raw_data')
        .replace(/\{\{names\}\}/g, namesStr);

    const result = await executeRWithRecovery(rCode, 'linear-regression', 0, 2, WEBR_TIMEOUTS.COMPLEX, cleanData);
    const getValue = parseWebRResult(result);

    const cNames = getValue('c_names') || [];
    const estimates = getValue('estimates') || [];
    const sBetas = getValue('s_betas') || [];
    const errors = getValue('errors') || [];
    const tVals = getValue('t_vals') || [];
    const pVals = getValue('p_vals') || [];
    const vifs = getValue('vifs') || [];
    const ciLower = getValue('ci_lower') || [];
    const ciUpper = getValue('ci_upper') || [];

    const coefficients = cNames.map((name: string, i: number) => ({
        term: name,
        estimate: estimates[i] || 0,
        stdBeta: sBetas[i] || 0,
        stdError: errors[i] || 0,
        tValue: tVals[i] || 0,
        pValue: pVals[i] || 0,
        vif: i > 0 ? vifs[i - 1] : undefined,
        ci95Lower: ciLower[i] ?? 0,
        ci95Upper: ciUpper[i] ?? 0
    }));

    const f = getValue('f')?.[0] ?? 0;
    const df_n = getValue('df_n')?.[0] ?? 0;
    const df_d = getValue('df_d')?.[0] ?? 0;
    const fPValue = getValue('f_p')?.[0] ?? 1;

    return {
        coefficients,
        modelFit: {
            rSquared: getValue('r2')?.[0] ?? 0,
            adjRSquared: getValue('ar2')?.[0] ?? 0,
            fStatistic: f,
            df: df_n,
            dfResid: df_d,
            pValue: fPValue,
            residualStdError: getValue('sigma')?.[0] ?? 0,
            normalityP: getValue('norm_p')?.[0] ?? 0,
            durbinWatson: getValue('dw')?.[0] ?? 0
        },
        equation: `${names[0]} = ...`, // Equation builder can be more complex
        chartData: {
            fitted: getValue('fit') || [],
            residuals: getValue('res') || [],
            actual: getValue('act') || []
        },
        rCode
    };
}

/**
 * Run Logistic Regression (Binary)
 */
export async function runLogisticRegression(data: number[][], names: string[]): Promise<{
    coefficients: {
        term: string;
        estimate: number;
        oddsRatio: number;
        stdError: number;
        zValue: number;
        pValue: number;
        orCI95Lower: number;
        orCI95Upper: number;
    }[];
    modelFit: {
        aic: number;
        nullDeviance: number;
        residualDeviance: number;
        mcfaddenR2: number;
        nagelkerkeR2: number;
        accuracy: number;
        sensitivity: number;
        specificity: number;
        auc?: number;
    };
    confusionMatrix: {
        tp: number; fp: number;
        fn: number; tn: number;
    };
    rCode: string;
}> {
    await loadPackagesForMethod('logistic-regression');
    const defaultRCode = `
    df <- as.data.frame({{data}});
    colnames(df) <- c({{names}});
    y_name <- colnames(df)[1];
    
    # Validate binary outcome
    y_vals <- unique(df[[y_name]]);
    if (length(y_vals) > 2) {
        stop("Biáº¿n phá»¥ thuá»™c pháº£i lÃ  nhá»‹ phÃ¢n (2 giÃ¡ trá»‹). Hiá»‡n cÃ³: ", length(y_vals), " giÃ¡ trá»‹.")
    }
    
    f_str <- paste0("\`", y_name, "\` ~ .");
    mod <- glm(as.formula(f_str), data = df, family = binomial);
    s <- summary(mod);
    cf <- coef(s);
    
    # Odds Ratios with 95% CI
    or <- exp(cf[, 1]);
    ci <- tryCatch(exp(confint(mod)), error = function(e) {
        # Fallback: Wald CI
        cbind(exp(cf[, 1] - 1.96 * cf[, 2]), exp(cf[, 1] + 1.96 * cf[, 2]))
    });
    
    # Pseudo R-squared
    null_dev <- s$null.deviance;
    resid_dev <- s$deviance;
    n <- nrow(df);
    mcfadden_r2 <- 1 - (resid_dev / null_dev);
    # Nagelkerke RÂ²
    cox_snell <- 1 - exp((resid_dev - null_dev) / n);
    nagelkerke_r2 <- cox_snell / (1 - exp(-null_dev / n));
    
    # Confusion Matrix (threshold = 0.5)
    pred_prob <- fitted(mod);
    pred_class <- as.integer(pred_prob >= 0.5);
    actual <- as.integer(df[[y_name]]);
    # Normalize actual to 0/1 if needed
    if (!all(actual %in% c(0, 1))) {
        actual <- as.integer(actual == max(actual))
    }
    tp <- sum(pred_class == 1 & actual == 1);
    fp <- sum(pred_class == 1 & actual == 0);
    fn <- sum(pred_class == 0 & actual == 1);
    tn <- sum(pred_class == 0 & actual == 0);
    accuracy <- (tp + tn) / n;
    sensitivity <- if ((tp + fn) > 0) tp / (tp + fn) else 0;
    specificity <- if ((tn + fp) > 0) tn / (tn + fp) else 0;
    
    # AUC using Mann-Whitney U on predicted probabilities (pure R)
    auc <- tryCatch({
        n1 <- sum(actual == 1)
        n0 <- sum(actual == 0)
        if(n1 > 0 && n0 > 0) {
            r <- rank(pred_prob)
            u <- sum(r[actual == 1]) - n1 * (n1 + 1) / 2
            u / (n1 * n0)
        } else { NA }
    }, error = function(e) NA);
    
    list(
        c_names = rownames(cf),
        estimates = as.vector(cf[, 1]),
        odds_ratios = as.vector(or),
        errors = as.vector(cf[, 2]),
        z_vals = as.vector(cf[, 3]),
        p_vals = as.vector(cf[, 4]),
        or_ci_lower = as.vector(ci[, 1]),
        or_ci_upper = as.vector(ci[, 2]),
        aic = s$aic,
        null_dev = null_dev,
        resid_dev = resid_dev,
        mcfadden_r2 = as.numeric(mcfadden_r2),
        nagelkerke_r2 = as.numeric(nagelkerke_r2),
        accuracy = as.numeric(accuracy),
        sensitivity = as.numeric(sensitivity),
        specificity = as.numeric(specificity),
        auc = as.numeric(auc),
        tp = as.integer(tp), fp = as.integer(fp),
        fn = as.integer(fn), tn = as.integer(tn)
    );
    `;
    const namesStr = names.map(n => `"${n}"`).join(',');
    const template = await getAnalysisRTemplate('logistic', defaultRCode);
    const rCode = template.replace(/\{\{data\}\}/g, 'raw_data').replace(/\{\{names\}\}/g, namesStr);
    const result = await executeRWithRecovery(rCode, 'logistic-regression', 0, 2, WEBR_TIMEOUTS.COMPLEX, data);
    const getValue = parseWebRResult(result);

    const cNames = getValue('c_names') || [];
    const estimates = getValue('estimates') || [];
    const oddsRatios = getValue('odds_ratios') || [];
    const errors = getValue('errors') || [];
    const zVals = getValue('z_vals') || [];
    const pVals = getValue('p_vals') || [];
    const orCiLower = getValue('or_ci_lower') || [];
    const orCiUpper = getValue('or_ci_upper') || [];

    return {
        coefficients: cNames.map((name: string, i: number) => ({
            term: name,
            estimate: estimates[i] ?? 0,
            oddsRatio: oddsRatios[i] ?? 1,
            stdError: errors[i] ?? 0,
            zValue: zVals[i] ?? 0,
            pValue: pVals[i] ?? 1,
            orCI95Lower: orCiLower[i] ?? 0,
            orCI95Upper: orCiUpper[i] ?? 0,
        })),
        modelFit: {
            aic: getValue('aic')?.[0] ?? 0,
            nullDeviance: getValue('null_dev')?.[0] ?? 0,
            residualDeviance: getValue('resid_dev')?.[0] ?? 0,
            mcfaddenR2: getValue('mcfadden_r2')?.[0] ?? 0,
            nagelkerkeR2: getValue('nagelkerke_r2')?.[0] ?? 0,
            accuracy: getValue('accuracy')?.[0] ?? 0,
            sensitivity: getValue('sensitivity')?.[0] ?? 0,
            specificity: getValue('specificity')?.[0] ?? 0,
            auc: getValue('auc')?.[0] ?? 0,
        },
        confusionMatrix: {
            tp: getValue('tp')?.[0] ?? 0,
            fp: getValue('fp')?.[0] ?? 0,
            fn: getValue('fn')?.[0] ?? 0,
            tn: getValue('tn')?.[0] ?? 0,
        },
        rCode
    };
}

