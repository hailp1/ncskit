/**
 * Mediation and Moderation Analysis Modules
 * Uses pure Base R (lm, bootstrap) for mediation/moderation modeling.
 */
import { WEBR_TIMEOUTS, getTimeoutForMethod } from '../constants';
import { executeRWithRecovery, loadPackagesForMethod } from '../core';
import { parseWebRResult } from '../utils';

/**
 * Run Mediation Analysis
 * Path: X -> M -> Y
 * Supports bootstrapping for indirect effects.
 */
export async function runMediationAnalysis(
    data: number[][],
    columns: string[],
    xVar: string,
    mVar: string,
    yVar: string,
    nBoot: number = 5000
): Promise<{
    effects: {
        total: number; // c
        direct: number; // c'
        indirect: number; // ab
    };
    paths: {
        a: { est: number; p: number }; // X -> M
        b: { est: number; p: number }; // M -> Y
        c: { est: number; p: number }; // X -> Y (Total)
        c_prime: { est: number; p: number }; // X -> Y (Direct)
    };
    bootstrap: {
        indirectLower: number;
        indirectUpper: number;
    };
    sobelTest: {
        z: number;
        p: number;
    };
    rCode: string;
}> {
    // Lazy load required packages
    await loadPackagesForMethod('mediation');

    const colNamesR = columns.map(c => `"${c}"`).join(',');
    const rCode = `
    # Pure Base R mediation (no psych needed)
    
    data_mat <- raw_data
    df <- as.data.frame(data_mat)
    colnames(df) <- c(${colNamesR})
    
    # Ensure variables exist
    if(!all(c("${xVar}", "${mVar}", "${yVar}") %in% colnames(df))) {
        stop("Biáº¿n khÃ´ng tá»“n táº¡i trong dá»¯ liá»‡u")
    }
    
    # === Step 1: Path a (X -> M) ===
    model_a <- lm(df[["${mVar}"]] ~ df[["${xVar}"]])
    sa <- summary(model_a)$coefficients
    a_est <- sa[2, "Estimate"]
    a_p   <- sa[2, "Pr(>|t|)"]
    a_se  <- sa[2, "Std. Error"]
    
    # === Step 2: Path c (X -> Y, Total Effect) ===
    model_c <- lm(df[["${yVar}"]] ~ df[["${xVar}"]])
    sc <- summary(model_c)$coefficients
    c_est <- sc[2, "Estimate"]
    c_p   <- sc[2, "Pr(>|t|)"]
    
    # === Step 3: Path b and c' (M -> Y controlling for X, Direct Effect) ===
    model_bc <- lm(df[["${yVar}"]] ~ df[["${xVar}"]] + df[["${mVar}"]])
    sbc <- summary(model_bc)$coefficients
    b_est      <- sbc[3, "Estimate"]
    b_p        <- sbc[3, "Pr(>|t|)"]
    b_se       <- sbc[3, "Std. Error"]
    c_prime_est <- sbc[2, "Estimate"]
    c_prime_p   <- sbc[2, "Pr(>|t|)"]
    
    # === Indirect effect ===
    indirect <- a_est * b_est
    total    <- c_est
    direct   <- c_prime_est
    
    # === Sobel Test ===
    sobel_se <- sqrt(b_est^2 * a_se^2 + a_est^2 * b_se^2)
    sobel_z  <- indirect / sobel_se
    sobel_p  <- 2 * (1 - pnorm(abs(sobel_z)))
    
    # === Bootstrap CI for indirect effect (bias-corrected method) ===
    set.seed(123)
    n_boot <- ${nBoot}
    boot_indirect <- numeric(n_boot)
    for(i in 1:n_boot) {
        idx     <- sample(1:nrow(df), replace = TRUE)
        boot_df <- df[idx, ]
        boot_a  <- coef(lm(boot_df[["${mVar}"]] ~ boot_df[["${xVar}"]]))[2]
        boot_b  <- coef(lm(boot_df[["${yVar}"]] ~ boot_df[["${xVar}"]] + boot_df[["${mVar}"]]))[3]
        boot_indirect[i] <- boot_a * boot_b
    }
    bias <- mean(boot_indirect, na.rm = TRUE) - indirect
    boot_ci <- quantile(boot_indirect - bias, c(0.025, 0.975), na.rm = TRUE)
    
    list(
        total    = as.numeric(total),
        direct   = as.numeric(direct),
        indirect = as.numeric(indirect),
        a_est    = as.numeric(a_est),
        a_p      = as.numeric(a_p),
        b_est    = as.numeric(b_est),
        b_p      = as.numeric(b_p),
        c_est    = as.numeric(c_est),
        c_p      = as.numeric(c_p),
        c_p_est  = as.numeric(c_prime_est),
        c_p_p    = as.numeric(c_prime_p),
        sobel_z  = as.numeric(sobel_z),
        sobel_p  = as.numeric(sobel_p),
        boot_lower = as.numeric(boot_ci[1]),
        boot_upper = as.numeric(boot_ci[2])
    )
    `;

    const result = await executeRWithRecovery(rCode, 'mediation', 0, 2, WEBR_TIMEOUTS.COMPLEX, data);
    const getValue = parseWebRResult(result);

    return {
        effects: {
            total:    getValue('total')?.[0]    ?? 0,
            direct:   getValue('direct')?.[0]   ?? 0,
            indirect: getValue('indirect')?.[0] ?? 0,
        },
        paths: {
            a:       { est: getValue('a_est')?.[0]   ?? 0, p: getValue('a_p')?.[0]   ?? 1 },
            b:       { est: getValue('b_est')?.[0]   ?? 0, p: getValue('b_p')?.[0]   ?? 1 },
            c:       { est: getValue('c_est')?.[0]   ?? 0, p: getValue('c_p')?.[0]   ?? 1 },
            c_prime: { est: getValue('c_p_est')?.[0] ?? 0, p: getValue('c_p_p')?.[0] ?? 1 }
        },
        sobelTest: {
            z: getValue('sobel_z')?.[0] ?? 0,
            p: getValue('sobel_p')?.[0] ?? 1
        },
        bootstrap: {
            indirectLower: getValue('boot_lower')?.[0] ?? 0,
            indirectUpper: getValue('boot_upper')?.[0] ?? 0
        },
        rCode
    };
}

/**
 * Run Moderation Analysis
 * Model: Y ~ X_c * W_c  (centered variables to reduce multicollinearity)
 *
 * FIX: Previous version used invalid R syntax `df$varName_c` for column assignment.
 * Now uses `df[["varName_c"]]` which is correct R.
 * Centering is now actually applied to the model (not just computed and ignored).
 * Simple slopes use the re-centering approach (Aiken & West, 1991).
 */
export async function runModerationAnalysis(
    data: number[][],
    columns: string[],
    xVar: string,
    mVar: string, // Moderator (W)
    yVar: string
): Promise<{
    coefficients: {
        term: string;
        estimate: number;
        stdError?: number;
        tValue?: number;
        pValue: number;
    }[];
    interceptEst?: number;
    interceptSE?: number;
    interceptT?: number;
    interceptP?: number;
    xEst?: number;
    xSE?: number;
    xT?: number;
    xP?: number;
    wEst?: number;
    wSE?: number;
    wT?: number;
    wP?: number;
    interactionTerm?: string;
    interactionEst?: number;
    interactionEstimate?: number;
    interactionSE?: number;
    interactionT?: number;
    interactionP?: number;
    rSquared?: number;
    rSquaredAdj?: number;
    interactionSignificant: boolean;
    slopes: {
        level: string; // -1 SD, Mean, +1 SD
        slope: number;
        pValue: number;
    }[];
    rCode: string;
}> {
    // Lazy load required packages
    await loadPackagesForMethod('moderation');

    const colNamesR = columns.map(c => `"${c}"`).join(',');
    const rCode = `
    # Pure Base R moderation (no psych needed)
    
    data_mat <- raw_data
    df <- as.data.frame(data_mat)
    colnames(df) <- c(${colNamesR})
    
    # Center X and W (moderator) to reduce multicollinearity in interaction term
    # Use df[["col"]] <- ... syntax (correct R column assignment)
    x_c <- as.numeric(scale(df[["${xVar}"]], scale = FALSE))
    w_c <- as.numeric(scale(df[["${mVar}"]], scale = FALSE))
    df[["x_c"]] <- x_c
    df[["w_c"]] <- w_c
    
    # Interaction model using centered variables
    model <- lm(df[["${yVar}"]] ~ x_c * w_c, data = df)
    s     <- summary(model)
    coefs <- coef(s)
    
    # Find interaction term (contains ':')
    int_row_idx <- grep(":", rownames(coefs))[1]
    int_p_val   <- if(is.na(int_row_idx)) 1 else coefs[int_row_idx, 4]
    
    # Simple Slopes Analysis â€” Aiken & West (1991) spotlight approach
    # With centered W: mean(w_c) = 0, so spotlight values are:
    w_sd   <- sd(w_c, na.rm = TRUE)
    w_low  <- -w_sd   # -1 SD
    w_mean <-  0      # Mean (= 0 after centering)
    w_high <-  w_sd   # +1 SD
    
    # Simple slope of X at each level of W:
    # slope(X | W=w) = b_X + b_XW * w
    b_x  <- coef(model)["x_c"]
    b_xw <- if(!is.na(int_row_idx)) coefs[int_row_idx, 1] else 0
    
    slope_low  <- b_x + b_xw * w_low
    slope_mean <- b_x + b_xw * w_mean
    slope_high <- b_x + b_xw * w_high
    
    # P-values for simple slopes via re-centering W at each spotlight value
    # (shift W so that the new mean = spotlight value, then X coefficient = simple slope)
    df[["w_at_low"]]  <- w_c - w_low
    df[["w_at_mean"]] <- w_c              # already centered at mean
    df[["w_at_high"]] <- w_c - w_high
    
    m_low  <- lm(df[["${yVar}"]] ~ x_c * w_at_low,  data = df)
    m_mean <- lm(df[["${yVar}"]] ~ x_c * w_at_mean, data = df)
    m_high <- lm(df[["${yVar}"]] ~ x_c * w_at_high, data = df)
    
    p_low  <- tryCatch(summary(m_low)$coefficients["x_c",  4], error = function(e) NA)
    p_mean <- tryCatch(summary(m_mean)$coefficients["x_c", 4], error = function(e) NA)
    p_high <- tryCatch(summary(m_high)$coefficients["x_c", 4], error = function(e) NA)
    
    r2 <- s$r.squared
    adj_r2 <- s$adj.r.squared

    list(
        terms           = rownames(coefs),
        estimates       = coefs[, 1],
        std_errors      = coefs[, 2],
        t_values        = coefs[, 3],
        p_values        = coefs[, 4],
        r_squared       = r2,
        adj_r_squared   = adj_r2,
        int_significant = int_p_val < 0.05,
        slope_low       = as.numeric(slope_low),
        p_low           = as.numeric(p_low),
        slope_mean      = as.numeric(slope_mean),
        p_mean          = as.numeric(p_mean),
        slope_high      = as.numeric(slope_high),
        p_high          = as.numeric(p_high)
    )
    `;

    const result = await executeRWithRecovery(rCode, 'moderation', 0, 2, WEBR_TIMEOUTS.COMPLEX, data);
    const getValue = parseWebRResult(result);

    const terms    = getValue('terms')    || [];
    const estimates = getValue('estimates') || [];
    const stdErrors = getValue('std_errors') || [];
    const tValues   = getValue('t_values') || [];
    const pValues  = getValue('p_values') || [];

    const coefficients = terms.map((term: string, i: number) => ({
        term,
        estimate: estimates[i] ?? 0,
        stdError: stdErrors[i] ?? 0,
        tValue:   tValues[i]   ?? 0,
        pValue:   pValues[i]   ?? 1,
    }));

    // Find specific terms to match UI expectations
    const intercept = coefficients.find((c: any) => c.term.includes('Intercept')) || {};
    const xCoef = coefficients.find((c: any) => c.term === 'x_c') || {};
    const wCoef = coefficients.find((c: any) => c.term === 'w_c') || {};
    const intCoef = coefficients.find((c: any) => c.term.includes(':')) || {};

    return {
        coefficients,
        interceptEst: intercept.estimate,
        interceptSE: intercept.stdError,
        interceptT: intercept.tValue,
        interceptP: intercept.pValue,
        xEst: xCoef.estimate,
        xSE: xCoef.stdError,
        xT: xCoef.tValue,
        xP: xCoef.pValue,
        wEst: wCoef.estimate,
        wSE: wCoef.stdError,
        wT: wCoef.tValue,
        wP: wCoef.pValue,
        interactionTerm: intCoef.term || '',
        interactionEst: intCoef.estimate,
        interactionEstimate: intCoef.estimate, // for TemplateInterpretation
        interactionSE: intCoef.stdError,
        interactionT: intCoef.tValue,
        interactionP: intCoef.pValue,
        rSquared: getValue('r_squared')?.[0] ?? 0,
        rSquaredAdj: getValue('adj_r_squared')?.[0] ?? 0,
        interactionSignificant: getValue('int_significant')?.[0] || false,
        slopes: [
            { level: 'Low (-1 SD)',  slope: getValue('slope_low')?.[0]  ?? 0, pValue: getValue('p_low')?.[0]  ?? 1 },
            { level: 'Mean',         slope: getValue('slope_mean')?.[0] ?? 0, pValue: getValue('p_mean')?.[0] ?? 1 },
            { level: 'High (+1 SD)', slope: getValue('slope_high')?.[0] ?? 0, pValue: getValue('p_high')?.[0] ?? 1 },
        ],
        rCode
    };
}

