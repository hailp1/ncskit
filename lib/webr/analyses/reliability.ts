/**
 * Reliability & Factor Analysis Modules
 */
import { WEBR_TIMEOUTS } from '../constants';
import { validateAndCleanData } from '../input-validator';
import { executeRWithRecovery, loadPackagesForMethod } from '../core';
import { useRawDataInCode, parseMatrix, parseWebRResult } from '../utils';
import { runLavaanAnalysis } from './sem';
import { CronbachResultSchema, ICronbachResult, EfaResultSchema, IEfaResult } from '../schemas';
import { getAnalysisRTemplate } from '../templates';
import { R_SNIPPETS } from '../r-helpers';

/**
 * Run Cronbach's Alpha analysis with SPSS-style Item-Total Statistics
 */
export async function runCronbachAlpha(
    data: number[][],
    likertMin: number = 1,
    likertMax: number = 5
): Promise<ICronbachResult> {
    // Lazy load required packages
    await loadPackagesForMethod('cronbach');

    // ── DIAGNOSTIC: Detect all-null input data before it reaches R ──
    if (data && data.length > 0) {
        const totalCells = data.length * (data[0]?.length || 0);
        const nullCells = data.flat().filter(v => v === null || v === undefined).length;
        console.log(`[DEBUG-CRONBACH] Input: ${data.length} rows × ${data[0]?.length} cols. Nulls: ${nullCells}/${totalCells} (${(nullCells/totalCells*100).toFixed(1)}%)`);
        console.log(`[DEBUG-CRONBACH] Row 0:`, JSON.stringify(data[0]));
        console.log(`[DEBUG-CRONBACH] Row 1:`, JSON.stringify(data[1]));
        
        if (nullCells === totalCells) {
            console.error('[DEBUG-CRONBACH] ⚠️ ALL DATA IS NULL! The column extraction failed.');
            throw new Error(
                `Toàn bộ dữ liệu đầu vào là null (${nullCells}/${totalCells} ô). ` +
                `Nguyên nhân thường gặp: tên cột trong dữ liệu không khớp với nhóm biến đã chọn. ` +
                `Vui lòng tải lại trang (Ctrl+Shift+R) và thử lại.`
            );
        }
    }

    // Validate and clean input data
    const validation = validateAndCleanData(data, {
        minRows: 10,
        minCols: 2,
        analysisName: "Cronbach's Alpha",
        allowPartialRows: true, // Allow NA so R can handle them
    });
    if (!validation.valid) {
        throw new Error(validation.warnings[validation.warnings.length - 1]);
    }
    const cleanData = validation.cleanData;

    const defaultRCode = `
    options(mc.cores = 1);
    
    # DATA CLEANING
    valid_min <- {{likertMin}};
    valid_max <- {{likertMax}};
    
    data <- raw_data
    data <- as.data.frame(data)
    
    # MANUAL CRONBACH'S ALPHA CALCULATION (NO PSYCH PACKAGE -> NO LAPACK CRASHES)
    calc_alpha <- function(df) {
        k <- ncol(df)
        if (k < 2) stop("Can it nhat 2 bien de tinh Cronbach Alpha.")
        
        # Use pairwise deletion for covariance to handle NAs
        cov_mat <- suppressWarnings(cov(df, use = "pairwise.complete.obs"))
        if (any(is.na(cov_mat))) stop("Khong the tinh ma tran hiep phuong sai. Du lieu co the chua toan gia tri NA (chuoi hoac rong).")
        
        var_items <- diag(cov_mat)
        var_total <- sum(cov_mat)
        
        if (var_total <= 0) stop(paste("Phuong sai tong bang 0 hoac am. Kiem tra xem du lieu co bi hang so (khong doi) hoac loi dinh dang khong."))
        (k / (k - 1)) * (1 - sum(var_items) / var_total)
    }

    n_items <- ncol(data)
    total_scores <- rowSums(data, na.rm = TRUE)
    scale_mean <- mean(total_scores, na.rm = TRUE)
    scale_var <- var(total_scores, na.rm = TRUE)
    
    raw_alpha <- calc_alpha(data)
    
    # Calculate item-total stats manually
    r_drop <- numeric(n_items)
    alpha_drop <- numeric(n_items)
    mean_drop <- numeric(n_items)
    var_drop <- numeric(n_items)
    
    for (i in 1:n_items) {
        # Data without item i
        df_drop <- data[, -i, drop = FALSE]
        
        # Alpha if deleted
        alpha_drop[i] <- tryCatch(calc_alpha(df_drop), error = function(e) 0)
        
        # Corrected item-total correlation
        item_i <- data[, i]
        total_without_i <- rowSums(df_drop, na.rm = TRUE)
        
        r_drop[i] <- suppressWarnings(cor(item_i, total_without_i, use = "pairwise.complete.obs"))
        
        # Mean/Var if deleted
        mean_drop[i] <- mean(total_without_i, na.rm = TRUE)
        var_drop[i] <- var(total_without_i, na.rm = TRUE)
    }
    
    # Handle NAs
    r_drop[is.na(r_drop)] <- 0
    alpha_drop[is.na(alpha_drop)] <- 0
    
    list(
        raw_alpha = if(is.numeric(raw_alpha)) raw_alpha else 0,
        std_alpha = if(is.numeric(raw_alpha)) raw_alpha else 0, # Simplify
        omega_total = NA,
        omega_h = NA,
        n_items = n_items,
        likert_min = valid_min,
        likert_max = valid_max,
        scale_mean_deleted = mean_drop,
        scale_var_deleted = var_drop,
        corrected_item_total = r_drop,
        alpha_if_deleted = alpha_drop,
        average_r = 0, # Not strictly needed for UI
        scale_mean = scale_mean,
        scale_var = scale_var,
        alphaVal = if(is.numeric(raw_alpha)) raw_alpha else 0,
        omegaVal = NA,
        n = n_items
    )
    `;

    // Fetch customized template and render it
    let template = await getAnalysisRTemplate('cronbach', defaultRCode);
    template = useRawDataInCode(template);
    
    const rCode = template
        .replace(/\{\{likertMin\}\}/g, String(likertMin))
        .replace(/\{\{likertMax\}\}/g, String(likertMax));

    const result = await executeRWithRecovery(rCode, 'cronbach', 0, 2, WEBR_TIMEOUTS.COMPLEX, cleanData);
    const getValue = parseWebRResult(result);

    const extractScalar = (val: any) => Array.isArray(val) ? val[0] : val;
    const extractArray = (val: any) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'object') return Object.values(val);
        return [val];
    };

    // Support both new explicit JSON mapping and old legacy template keys
    const rawAlpha = extractScalar(getValue('raw_alpha')) ?? extractScalar(getValue('alphaVal')) ?? 0;
    const stdAlpha = extractScalar(getValue('std_alpha')) ?? 0;
    const omegaTotal = extractScalar(getValue('omega_total')) ?? extractScalar(getValue('omegaVal')) ?? 0;
    const omegaH = extractScalar(getValue('omega_h')) ?? 0;
    const nItems = extractScalar(getValue('n_items')) ?? extractScalar(getValue('n')) ?? 'N/A';

    const scaleMeanDeleted = extractArray(getValue('scale_mean_deleted'));
    const scaleVarDeleted = extractArray(getValue('scale_var_deleted'));
    const correctedItemTotal = extractArray(getValue('corrected_item_total'));
    const alphaIfDeleted = extractArray(getValue('alpha_if_deleted'));

    const itemCount = typeof nItems === 'number' ? nItems : 0;
    const itemTotalStats = [];

    for (let i = 0; i < itemCount; i++) {
        itemTotalStats.push({
            itemName: `VAR${(i + 1).toString().padStart(2, '0')} `,
            scaleMeanIfDeleted: scaleMeanDeleted[i] || 0,
            scaleVarianceIfDeleted: scaleVarDeleted[i] || 0,
            correctedItemTotalCorrelation: correctedItemTotal[i] || 0,
            alphaIfItemDeleted: alphaIfDeleted[i] || 0
        });
    }

    const rawResult = {
        alpha: rawAlpha,
        rawAlpha: rawAlpha,
        standardizedAlpha: stdAlpha,
        omega: omegaTotal,
        omegaHierarchical: omegaH,
        nItems: nItems,
        likertRange: { min: likertMin, max: likertMax },
        itemTotalStats: itemTotalStats,
        rCode: rCode
    };

    return CronbachResultSchema.parse(rawResult);
}

/**
 * Run Exploratory Factor Analysis (EFA)
 */
export async function runEFA(
    data: number[][], 
    nFactors: number = 0, 
    rotation: string = 'varimax',
    method: 'minres' | 'pca' | 'pa' | 'ml' = 'minres'
): Promise<IEfaResult> {
    // NO psych package needed anymore - pure Base R implementation
    // Only need GPArotation for oblique rotations (promax, oblimin)
    const needsGPArotation = ['oblimin', 'promax'].includes(rotation.toLowerCase());
    if (needsGPArotation) {
        await loadPackagesForMethod('efa');
    }

    const defaultRCode = `
    # ============================================================
    # PURE BASE-R EFA (NO psych PACKAGE -> NO LAPACK WASM CRASHES)
    # ============================================================
    
    # Clean Data
    df <- as.data.frame(raw_data)
    
    if (ncol(df) < 2) {
        stop("Lỗi: Phân tích nhân tố cần ít nhất 2 biến.")
    }

    # Compute correlation matrix safely
    ${R_SNIPPETS.validateMatrixSingularity}

    n_obs <- nrow(na.omit(df))
    if (n_obs < 10) n_obs <- nrow(df)
    p <- ncol(df)

    # ---- KMO (Manual implementation - no psych) ----
    kmo_val <- tryCatch({
        inv_cor <- tryCatch(solve(cor_mat), error = function(e) NULL)
        if (is.null(inv_cor)) {
            0
        } else {
            # Anti-image correlation matrix
            anti_img <- -cov2cor(inv_cor)
            diag(anti_img) <- -diag(inv_cor)
            
            # Sum of squared correlations vs sum of squared partial correlations
            sum_r2 <- sum(cor_mat[upper.tri(cor_mat)]^2)
            sum_q2 <- sum(anti_img[upper.tri(anti_img)]^2)
            
            if ((sum_r2 + sum_q2) == 0) 0 else sum_r2 / (sum_r2 + sum_q2)
        }
    }, error = function(e) 0)
    
    # ---- Bartlett's Test of Sphericity (Manual - no psych) ----
    bartlett_p <- tryCatch({
        det_val <- det(cor_mat)
        if (det_val <= 0) det_val <- 1e-300
        chi_sq <- -((n_obs - 1) - (2 * p + 5) / 6) * log(det_val)
        df_test <- p * (p - 1) / 2
        pchisq(chi_sq, df = df_test, lower.tail = FALSE)
    }, error = function(e) 1)
    
    # ---- Determine number of factors ----
    n_factors_kaiser <- sum(eigenvalues > 1)
    n_factors_run <- {{nFactors}}
    n_factors_parallel <- NA

    if (n_factors_run <= 0) {
        # Simple Parallel Analysis using random data (no psych)
        n_factors_parallel <- tryCatch({
            set.seed(42)
            n_iter <- 20
            random_eigs <- matrix(0, nrow = n_iter, ncol = p)
            for (iter in 1:n_iter) {
                random_data <- matrix(rnorm(n_obs * p), nrow = n_obs, ncol = p)
                random_cor <- cor(random_data)
                random_eigs[iter, ] <- eigen(random_cor, symmetric = TRUE, only.values = TRUE)$values
            }
            mean_random_eigs <- colMeans(random_eigs)
            sum(eigenvalues > mean_random_eigs)
        }, error = function(e) NA)
        n_factors_run <- if (!is.na(n_factors_parallel) && n_factors_parallel >= 1) n_factors_parallel else n_factors_kaiser
    }
    if (n_factors_run < 1) n_factors_run <- 1
    if (n_factors_run >= p) n_factors_run <- p - 1

    # ---- Run Factor Analysis or PCA ----
    ext_method <- "{{method}}"
    rotation_method <- "{{rotation}}"
    
    loadings_mat <- NULL
    communalities_vec <- NULL

    if (ext_method == "pca") {
        # ---- PCA using eigen decomposition (Base R, no psych::principal) ----
        eig <- eigen(cor_mat, symmetric = TRUE)
        raw_loadings <- eig$vectors[, 1:n_factors_run, drop = FALSE] %*% diag(sqrt(eig$values[1:n_factors_run]), nrow = n_factors_run)
        
        # Apply rotation
        if (n_factors_run > 1) {
            if (tolower(rotation_method) == "varimax") {
                rot <- varimax(raw_loadings)
                loadings_mat <- rot$loadings
            } else if (tolower(rotation_method) == "promax") {
                rot_v <- varimax(raw_loadings)
                rot <- promax(rot_v$loadings)
                loadings_mat <- rot$loadings
            } else if (tolower(rotation_method) == "none") {
                loadings_mat <- raw_loadings
            } else {
                # For oblimin etc., try GPArotation if available
                loadings_mat <- tryCatch({
                    if (requireNamespace("GPArotation", quietly = TRUE)) {
                        rot <- GPArotation::GPFoblq(raw_loadings, method = tolower(rotation_method))
                        rot$loadings
                    } else {
                        varimax(raw_loadings)$loadings
                    }
                }, error = function(e) varimax(raw_loadings)$loadings)
            }
        } else {
            loadings_mat <- raw_loadings
        }
        communalities_vec <- rowSums(as.matrix(loadings_mat)^2)

    } else {
        # ---- Factor Analysis using factanal (Base R, no psych::fa) ----
        efa_result <- tryCatch({
            # factanal uses Maximum Likelihood
            fa_res <- factanal(covmat = cor_mat, factors = n_factors_run, rotation = "none", n.obs = n_obs)
            raw_fa_loadings <- fa_res$loadings
            
            # Apply rotation manually
            if (n_factors_run > 1) {
                if (tolower(rotation_method) == "varimax") {
                    rot <- varimax(raw_fa_loadings)
                    list(loadings = rot$loadings, communalities = 1 - fa_res$uniquenesses)
                } else if (tolower(rotation_method) == "promax") {
                    rot_v <- varimax(raw_fa_loadings)
                    rot <- promax(rot_v$loadings)
                    list(loadings = rot$loadings, communalities = 1 - fa_res$uniquenesses)
                } else if (tolower(rotation_method) == "none") {
                    list(loadings = raw_fa_loadings, communalities = 1 - fa_res$uniquenesses)
                } else {
                    # Oblimin etc.
                    loadings_rotated <- tryCatch({
                        if (requireNamespace("GPArotation", quietly = TRUE)) {
                            rot <- GPArotation::GPFoblq(unclass(raw_fa_loadings), method = tolower(rotation_method))
                            rot$loadings
                        } else {
                            varimax(raw_fa_loadings)$loadings
                        }
                    }, error = function(e) varimax(raw_fa_loadings)$loadings)
                    list(loadings = loadings_rotated, communalities = 1 - fa_res$uniquenesses)
                }
            } else {
                list(loadings = raw_fa_loadings, communalities = 1 - fa_res$uniquenesses)
            }
        }, error = function(e) {
            # Fallback: if factanal fails (e.g. Heywood cases), use PCA approach instead
            eig <- eigen(cor_mat, symmetric = TRUE)
            raw_loadings <- eig$vectors[, 1:n_factors_run, drop = FALSE] %*% diag(sqrt(eig$values[1:n_factors_run]), nrow = n_factors_run)
            if (n_factors_run > 1 && tolower(rotation_method) != "none") {
                rot <- varimax(raw_loadings)
                list(loadings = rot$loadings, communalities = rowSums(as.matrix(rot$loadings)^2))
            } else {
                list(loadings = raw_loadings, communalities = rowSums(raw_loadings^2))
            }
        })
        
        loadings_mat <- efa_result$loadings
        communalities_vec <- efa_result$communalities
    }

    list(
        kmo = kmo_val,
        bartlett_p = bartlett_p,
        loadings = as.vector(t(unclass(loadings_mat))),
        communalities = as.numeric(communalities_vec),
        structure = as.vector(t(unclass(loadings_mat))),
        eigenvalues = eigenvalues,
        n_factors_used = n_factors_run,
        n_factors_suggested = if(is.na(n_factors_parallel)) n_factors_kaiser else n_factors_parallel,
        extraction_method = ext_method
    )
    `;

    const template = await getAnalysisRTemplate('efa', defaultRCode);
    const rCode = template
        .replace(/\{\{nFactors\}\}/g, String(nFactors))
        .replace(/\{\{rotation\}\}/g, rotation)
        .replace(/\{\{method\}\}/g, method);

    const jsResult = await executeRWithRecovery(rCode, 'efa', 0, 2, WEBR_TIMEOUTS.COMPLEX, data);
    const getValue = parseWebRResult(jsResult);
    const extractScalar = (val: any) => Array.isArray(val) ? val[0] : val;
    const extractArray = (val: any) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'object') return Object.values(val);
        return [val];
    };

    const nFactorsUsed = extractScalar(getValue('n_factors_used')) || nFactors || 1;

    const rawResult = {
        kmo: extractScalar(getValue('kmo')) ?? 0,
        bartlettP: extractScalar(getValue('bartlett_p')) ?? 1,
        loadings: parseMatrix(getValue('loadings'), nFactorsUsed),
        communalities: extractArray(getValue('communalities')),
        structure: parseMatrix(getValue('structure'), nFactorsUsed),
        eigenvalues: extractArray(getValue('eigenvalues')),
        nFactorsUsed: nFactorsUsed,
        nFactorsSuggested: extractScalar(getValue('n_factors_suggested')) || nFactorsUsed,
        factorMethod: extractScalar(getValue('extraction_method')) || method,
        extractionMethod: extractScalar(getValue('extraction_method')) || method,
        rCode
    };

    return EfaResultSchema.parse(rawResult);
}



/**
 * Run Confirmatory Factor Analysis (CFA) using lavaan emulation via psych
 */
/**
 * Confirmatory Factor Analysis (CFA)
 * Upgraded to use true SEM engine (lavaan)
 */
export async function runCFA(data: number[][], columns: string[], modelSyntax: string): Promise<any> {
    // Lazy load required packages (needs lavaan)
    await loadPackagesForMethod('cfa');

    try {
        // Try running true CFA with lavaan
        const result = await runLavaanAnalysis(data, columns, modelSyntax);

        if (result.error) {
            console.warn("Lavaan failed:", result.error);
            // Do NOT fall back to EFA â€” return a clear error instead
            return {
                fitMeasures: { cfi: 0, tli: 0, rmsea: 0, srmr: 0, chisq: 0, df: 0, pvalue: 0 },
                estimates: [],
                rCode: '',
                error: `CFA yÃªu cáº§u thÆ° viá»‡n lavaan. Lá»—i: ${result.error}. Vui lÃ²ng thá»­ láº¡i sau khi WebR táº£i xong.`,
                warning: undefined
            };
        }

        return {
            ...result,
            warning: "PhÃ¢n tÃ­ch CFA thÃ nh cÃ´ng báº±ng thÆ° viá»‡n lavaan chuyÃªn sÃ¢u."
        };
    } catch (e: any) {
        console.warn("Lavaan not available or failed:", e);
        // Return a clear error â€” do NOT simulate CFA with EFA (statistically invalid)
        return {
            fitMeasures: { cfi: 0, tli: 0, rmsea: 0, srmr: 0, chisq: 0, df: 0, pvalue: 0 },
            estimates: [],
            rCode: '',
            error: `CFA yêu cầu thư viện lavaan chưa được tải. Vui lòng đợi WebR khởi động hoàn tất và thử lại. Chi tiết: ${e?.message || String(e)}`,
            warning: undefined
        };
    }
    // NOTE: The previous EFA-as-CFA fallback was removed because it produced
    // statistically invalid results (EFA â‰  CFA â€” no fixed measurement model,
    // fit indices are not comparable). Better to show a clear error than wrong results.
}

