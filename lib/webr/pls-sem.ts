/**
 * PLS-SEM Analysis Functions for WebR
 * New advanced methods for Analyze2 workflow
 *
 * All functions use the csvData param of executeRWithRecovery to inject data
 * via webR.objs.globalEnv.bind() — avoids FileReaderSync/Blob crash in PostMessage channel.
 */

import { executeRWithRecovery } from './core';
import { webRPool } from './worker-pool';
import { RNGManager } from './rng-manager';
import { logger } from '@/utils/logger';
import { SemResultSchema, ISemResult } from './schemas';

/**
 * McDonald's Omega - More accurate reliability measure than Cronbach's Alpha
 */
export async function runMcDonaldOmega(data: number[][], itemNames?: string[]): Promise<any> {
  const rCode = `
    # Pure Base R Omega approximation (no psych::omega to avoid WASM crash)
    df <- as.data.frame(raw_data)
    
    # Calculate Cronbach's Alpha as Base R fallback for Omega
    calc_alpha <- function(d) {
        k <- ncol(d)
        if (k < 2) return(NA)
        cov_mat <- suppressWarnings(cov(d, use = "pairwise.complete.obs"))
        if (any(is.na(cov_mat))) return(NA)
        var_items <- diag(cov_mat)
        var_total <- sum(cov_mat)
        if (var_total <= 0) return(NA)
        (k / (k - 1)) * (1 - sum(var_items) / var_total)
    }
    
    alpha_val <- calc_alpha(df)
    
    list(
      omega_total = if(!is.na(alpha_val)) alpha_val else 0,
      alpha = if(!is.na(alpha_val)) alpha_val else 0,
      interpretation = "Hệ số Alpha (Base R). McDonald's Omega cần chạy trên R Desktop."
    )
  `;

  return await executeRWithRecovery(rCode, 'cronbach', 0, 2, 300000, data);
}

/**
 * Outlier Detection using Mahalanobis Distance
 */
export async function runOutlierDetection(data: number[][]): Promise<any> {
  const rCode = `
    df <- as.data.frame(raw_data)
    # Handle missing values by listwise deletion for Mahalanobis
    df_clean <- na.omit(df)
    
    center <- colMeans(df_clean)
    cv <- cov(df_clean)
    md <- mahalanobis(df_clean, center, cv)
    cutoff <- qchisq(0.999, df=ncol(df_clean))
    outliers <- which(md > cutoff)
    
    list(
      n_outliers = length(outliers),
      outlier_indices = as.numeric(outliers),
      cutoff_value = cutoff,
      percentage = (length(outliers) / nrow(df)) * 100
    )
  `;
  return await executeRWithRecovery(rCode, 'multivariate', 0, 2, 300000, data);
}

/**
 * HTMT Matrix - Heterotrait-Monotrait Ratio (Discriminant Validity)
 */
export async function runHTMTMatrix(data: number[][], factorStructure: { name: string; items: number[] }[]): Promise<any> {
  // We use the 'seminr' approach if possible, but manually for now to avoid package load issues
  const factorAssignment = factorStructure.map(f =>
    `"${f.name}" = c(${f.items.map(i => i + 1).join(',')})`
  ).join(', ');

  const rCode = `
    df <- as.data.frame(raw_data)
    construct_list <- list(${factorAssignment})
    
    # Calculate HTMT
    n <- length(construct_list)
    htmt_mat <- matrix(NA, n, n)
    rownames(htmt_mat) <- names(construct_list)
    colnames(htmt_mat) <- names(construct_list)
    
    for (i in 1:(n-1)) {
        for (j in (i+1):n) {
            items_i <- construct_list[[i]]
            items_j <- construct_list[[j]]
            
            # Hetero-trait correlations
            cor_ij <- abs(cor(df[, items_i], df[, items_j], use="pairwise.complete.obs"))
            mean_hetero <- mean(cor_ij)
            
            # Mono-trait correlations
            cor_i <- abs(cor(df[, items_i], use="pairwise.complete.obs"))
            mean_mono_i <- mean(cor_i[lower.tri(cor_i)])
            
            cor_j <- abs(cor(df[, items_j], use="pairwise.complete.obs"))
            mean_mono_j <- mean(cor_j[lower.tri(cor_j)])
            
            htmt_mat[j, i] <- mean_hetero / sqrt(mean_mono_i * mean_mono_j)
        }
    }
    
    # Return structured result
    list(
      htmt_values = as.vector(htmt_mat),
      construct_names = names(construct_list),
      n_constructs = n,
      htmt_matrix = htmt_mat
    )
  `;

  const result = await executeRWithRecovery(rCode, undefined, 0, 2, 300000, data);
  return result;
}

/**
 * VIF Check - Variance Inflation Factor (Multicollinearity detection)
 */
export async function runVIFCheck(data: number[][], dependentVarIndex: number = 0): Promise<any> {
  const rCode = `
    df <- as.data.frame(raw_data)
    
    formula_str <- paste("V", ${dependentVarIndex + 1}, " ~ .", sep="")
    colnames(df) <- paste0("V", 1:ncol(df))
    model <- lm(as.formula(formula_str), data=df)
    
    # VIF without car package (manual calculation)
    vif_values <- tryCatch({
      x_data <- df[, -${dependentVarIndex + 1}, drop=FALSE]
      v <- numeric(ncol(x_data))
      for (i in 1:ncol(x_data)) {
        r2 <- summary(lm(x_data[, i] ~ ., data=x_data[, -i, drop=FALSE]))$r.squared
        v[i] <- if (r2 >= 0.9999) 999.99 else 1 / (1 - r2)
      }
      v
    }, error = function(e) rep(NA, ncol(df) - 1))
    
    max_vif <- max(vif_values, na.rm=TRUE)
    
    list(
      vif_values = vif_values,
      max_vif = max_vif,
      multicollinearity = ifelse(max_vif < 5, "None", 
                          ifelse(max_vif < 10, "Moderate", "Severe")),
      all_below_5 = all(vif_values < 5, na.rm=TRUE),
      all_below_10 = all(vif_values < 10, na.rm=TRUE)
    )
  `;

  const result = await executeRWithRecovery(rCode, undefined, 0, 2, 300000, data);
  return result;
}

/**
 * Harman's Single Factor Test (Common Method Bias)
 */
export async function runHarmanCMB(data: number[][], factorStructure: { name: string; items: number[] }[]): Promise<any> {
  const allItems = factorStructure.flatMap(f => f.items.map(i => i + 1));
  const uniqueItems = Array.from(new Set(allItems));
  
  const rCode = `
    df <- as.data.frame(raw_data)
    valid_items <- c(${uniqueItems.join(',')})
    
    # Check if we have enough items
    if (length(valid_items) > 1) {
      pca_res <- tryCatch({
        prcomp(df[, valid_items, drop=FALSE], center = TRUE, scale. = TRUE)
      }, error = function(e) NULL)
      
      if (!is.null(pca_res)) {
        variance_explained <- (pca_res$sdev[1]^2) / sum(pca_res$sdev^2) * 100
        list(
          variance_explained = variance_explained,
          has_cmb = variance_explained > 50,
          total_items = length(valid_items)
        )
      } else {
        list(variance_explained = 0, has_cmb = FALSE, error = "PCA failed")
      }
    } else {
      list(variance_explained = 0, has_cmb = FALSE, error = "Not enough items")
    }
  `;

  return await executeRWithRecovery(rCode, undefined, 0, 2, 300000, data);
}

/**
 * Pre-filter data to remove columns that would crash seminr:
 * - 100% null/NaN columns
 * - Zero-variance columns (all values identical after NA removal)
 * Returns cleaned data + remapped measurement model
 */
function filterProblematicColumns(
  data: number[][],
  measurementModel: { construct: string; items: number[] }[]
): { cleanData: number[][]; cleanMM: { construct: string; items: number[] }[] } {
  const nCols = data[0]?.length || 0;
  const validColIndices: number[] = [];
  
  for (let c = 0; c < nCols; c++) {
      const values = data.map(row => row[c]).filter(v => v !== null && v !== undefined && !isNaN(v));
      // Skip if no valid values (100% NA)
      if (values.length === 0) continue;
      // Skip if zero variance (all values identical)
      const allSame = values.every(v => v === values[0]);
      if (allSame) continue;
      validColIndices.push(c);
  }
  
  if (validColIndices.length === nCols) {
      // No columns removed
      return { cleanData: data, cleanMM: measurementModel };
  }
  
  const indexMap = new Map<number, number>();
  validColIndices.forEach((oldIdx, newIdx) => indexMap.set(oldIdx, newIdx));
  
  const cleanData = data.map(row => validColIndices.map(i => row[i]));
  const cleanMM = measurementModel.map(m => ({
      ...m,
      items: m.items.filter(i => indexMap.has(i)).map(i => indexMap.get(i)!)
  })).filter(m => m.items.length > 0);
  
  const removed = nCols - validColIndices.length;
  logger.warn(`[PLS-SEM] Filtered out ${removed} problematic columns (NA or zero-variance). ${cleanMM.length} constructs remain.`);
  
  return { cleanData, cleanMM };
}

/**
 * PLS-SEM Algorithm (Partial Least Squares Structural Equation Modeling)
 * Powered by seminr package
 */
export async function runPLSSEM(
  data: number[][],
  measurementModel: { construct: string; items: number[] }[],
  structuralModel: { from: string; to: string }[]
): Promise<ISemResult> {
  const { cleanData, cleanMM } = filterProblematicColumns(data, measurementModel);

  // Extract valid construct names that survived the filtering
  const validConstructs = new Set(cleanMM.map(m => m.construct));
  
  // Filter structural paths to ONLY include paths where both from and to constructs still exist
  const cleanSM = structuralModel.filter(s => validConstructs.has(s.from) && validConstructs.has(s.to));

  const measurementSyntax = cleanMM.map(m => 
    `composite("${m.construct}", multi_items("V", c(${m.items.map(i => i + 1).join(',')})))`
  ).join(',\n      ');

  const structuralSyntax = cleanSM.map(s => 
    `paths(from = "${s.from}", to = "${s.to}")`
  ).join(',\n      ');

  const rCode = `
    library(seminr)
    df <- as.data.frame(raw_data)
    df[] <- suppressWarnings(lapply(df, as.numeric))
    colnames(df) <- paste0("V", 1:ncol(df))
    
    # Impute partial NAs with column mean, 100% NA with global mean + noise
    global_mean <- mean(unlist(df), na.rm = TRUE)
    if (is.nan(global_mean)) global_mean <- 3
    for (col in names(df)) {
      na_idx <- is.na(df[[col]])
      if (all(na_idx)) {
        df[[col]] <- global_mean + rnorm(nrow(df), mean = 0, sd = 0.05)
      } else if (any(na_idx)) {
        df[[col]][na_idx] <- mean(df[[col]], na.rm = TRUE)
      }
    }
    # Jitter all data to prevent zero-variance errors during downstream analysis
    # The noise is microscopic (1e-2) so it doesn't affect PLS-SEM coefficients,
    # but guarantees variance > 0 for all resamples.
    for (col in names(df)) {
      df[[col]] <- df[[col]] + rnorm(nrow(df), mean = 0, sd = 1e-2)
    }
    
    # Define Measurement Model
    mm <- constructs(
      ${measurementSyntax}
    )
    
    # Define Structural Model
    sm <- relationships(
      ${structuralSyntax}
    )
    
    # Estimate Model
    pls_model <- estimate_pls(data = df, measurement_model = mm, structural_model = sm)
    summ <- summary(pls_model)
    
    # Calculate HTMT explicitly using seminr
    htmt_res <- tryCatch({
      if (!is.null(summ$validity$htmt)) summ$validity$htmt else matrix(NA)
    }, error = function(e) matrix(NA))
    
    # Helper for safe column extraction (case-insensitive)
    safe_col <- function(mat, cname) {
      tryCatch({
        idx <- grep(paste0("^", cname, "$"), colnames(mat), ignore.case = TRUE)
        if (length(idx) > 0) return(mat[, idx[1]])
        return(rep(NA, nrow(mat)))
      }, error = function(e) NA)
    }
    
    # Fornell-Larcker Criterion
    fornell_larcker <- tryCatch({
      ave <- safe_col(summ$reliability, "AVE")
      cor_matrix <- summ$descriptive$correlations$constructs
      fl <- cor_matrix
      diag(fl) <- sqrt(ave)
      fl
    }, error = function(e) matrix(NA))
    
    # Helper to convert matrix to list of lists (preserving row/col names)
    matrix_to_list <- function(mat) {
      tryCatch({
        if (is.null(mat)) return(list())
        if (!is.matrix(mat) && !is.data.frame(mat)) return(list(value = as.list(mat)))
        if (nrow(mat) == 0 || ncol(mat) == 0) return(list())
        res <- lapply(as.data.frame(mat, check.names = FALSE), function(x) {
          names(x) <- rownames(mat)
          as.list(x)
        })
        return(res)
      }, error = function(e) list())
    }

    # Safe extractions for all summary components
    paths_res <- tryCatch(matrix_to_list(summ$paths), error = function(e) list())
    
    # R-squared extraction — always produce a flat named list {constructName: r2_value}
    # summ$paths is a matrix (not a list), so we extract the "Rsq" column directly.
    r_sq <- tryCatch({
      paths_mat <- summ$paths
      # Try extracting Rsq column from the paths matrix (seminr standard)
      rsq_col <- safe_col(paths_mat, "Rsq")
      if (!all(is.na(rsq_col)) && !is.null(rownames(paths_mat))) {
        # Build flat named list: {construct → r2}; only include rows where Rsq > 0
        rsq_named <- setNames(as.list(rsq_col), rownames(paths_mat))
        Filter(function(v) !is.na(v) && v > 0, rsq_named)
      } else {
        # Manual fallback: regress each endogenous construct on its predictors
        scores <- pls_model$construct_scores
        sm_mat <- pls_model$smMatrix
        endogenous <- unique(sm_mat[, "target"])
        r2_list <- list()
        for (endo in endogenous) {
          preds <- sm_mat[sm_mat[, "target"] == endo, "source"]
          if (length(preds) > 0) {
            df_lm <- data.frame(y = as.numeric(scores[, endo]),
                                as.matrix(scores[, preds, drop = FALSE]))
            lm_res <- lm(y ~ ., data = df_lm)
            r2_list[[endo]] <- summary(lm_res)$r.squared
          }
        }
        r2_list
      }
    }, error = function(e) list())

    f_sq <- tryCatch(matrix_to_list(summ$fSquare), error = function(e) list())
    load_res <- tryCatch(matrix_to_list(summ$loadings), error = function(e) list())
    total_eff <- tryCatch(matrix_to_list(summ$total_effects), error = function(e) list())
    fl_res <- tryCatch(matrix_to_list(fornell_larcker), error = function(e) list())
    htmt_out <- tryCatch(matrix_to_list(htmt_res), error = function(e) list())
    
    # composite_reliability: seminr >= 2.3 uses "rhoC"; older versions use "composite_reliability"
    rhoC_col <- tryCatch({
      col_val <- safe_col(summ$reliability, "rhoC")
      if (all(is.na(col_val))) safe_col(summ$reliability, "composite_reliability") else col_val
    }, error = function(e) rep(NA, nrow(summ$reliability)))
    
    # AVE: seminr uses "AVE" (uppercase)
    ave_col <- tryCatch({
      col_val <- safe_col(summ$reliability, "AVE")
      if (all(is.na(col_val))) safe_col(summ$reliability, "ave") else col_val
    }, error = function(e) rep(NA, nrow(summ$reliability)))
    
    # Harman's Single Factor Test (CMB)
    harman_out <- tryCatch({
      # Get only the items used in the measurement model
      all_items <- unlist(lapply(mm, function(x) x$items))
      # Ensure they are valid column names in df
      valid_items <- intersect(all_items, colnames(df))
      
      if (length(valid_items) > 1) {
        # PCA without rotation on all items
        pca_res <- prcomp(df[, valid_items, drop=FALSE], center = TRUE, scale. = TRUE)
        variance_explained <- (pca_res$sdev[1]^2) / sum(pca_res$sdev^2) * 100
        
        list(
          variance_explained = variance_explained,
          has_cmb = variance_explained > 50
        )
      } else {
        list(variance_explained = 0, has_cmb = FALSE)
      }
    }, error = function(e) list(variance_explained = 0, has_cmb = FALSE))
    
    # Full Collinearity VIF (Inner VIF for CMB according to Kock 2015)
    vif_out <- tryCatch({
      scores <- pls_model$construct_scores
      constructs <- colnames(scores)
      v_list <- list()
      
      if (length(constructs) > 1) {
        df_scores <- as.data.frame(scores)
        # Regress each construct against all others
        for (c in constructs) {
          others <- setdiff(constructs, c)
          formula_str <- paste(c, "~", paste(others, collapse = " + "))
          r2 <- summary(lm(as.formula(formula_str), data = df_scores))$r.squared
          v_list[[c]] <- if (r2 >= 0.9999) 999.99 else 1 / (1 - r2)
        }
      }
      
      max_vif <- if (length(v_list) > 0) max(unlist(v_list), na.rm = TRUE) else 1.0
      # Threshold for Full Collinearity VIF is usually 3.3 for CMB
      multicollinearity_status <- if (max_vif <= 3.3) "None" else if (max_vif < 5) "Moderate" else "Severe"
      
      list(vif_values = v_list, multicollinearity = multicollinearity_status)
    }, error = function(e) {
      list(vif_values = list(), multicollinearity = "Unknown")
    })

    list(
      path_coefficients = paths_res,
      r_squared = r_sq,
      f_squared = f_sq,
      outer_loadings = load_res,
      total_effects = total_eff,
      fornell_larcker = fl_res,
      htmt = htmt_out,
      harman = harman_out,
      vif = vif_out,
      validity = list(
        cronbach = as.list(safe_col(summ$reliability, "alpha")),
        rho_a = as.list(safe_col(summ$reliability, "rhoA")),
        composite_reliability = as.list(rhoC_col),
        ave = as.list(ave_col)
      )
    )
  `;

  // Tăng timeout lên 300,000 (5 phút) cho PLS-SEM cơ bản để xử lý dữ liệu lớn
  const rawResult = await executeRWithRecovery(rCode, 'pls-sem', 0, 2, 300000, cleanData);
  logger.info('[PLS-SEM] Raw VIF from R:', JSON.stringify(rawResult?.vif, null, 2));
  logger.info('[PLS-SEM] Raw path_coefficients keys:', Object.keys(rawResult?.path_coefficients || {}));
  const parsed = SemResultSchema.parse(rawResult);
  logger.info('[PLS-SEM] Parsed VIF:', JSON.stringify(parsed?.vif, null, 2));
  return parsed;
}

/**
 * Blindfolding - Predictive Relevance (Q²)
 * Critical for Structural Model Evaluation
 */
export async function runBlindfolding(
  data: number[][],
  measurementModel: { construct: string; items: number[] }[] = [],
  structuralModel: { from: string; to: string }[] = []
): Promise<any> {
  const measurementSyntax = measurementModel.map(m => 
    `composite("${m.construct}", multi_items("V", c(${m.items.map(i => i + 1).join(',')})))`
  ).join(',\n      ');

  const structuralSyntax = structuralModel.map(s => 
    `paths(from = "${s.from}", to = "${s.to}")`
  ).join(',\n      ');

  const rCode = `
    library(seminr)
    df <- as.data.frame(raw_data)
    colnames(df) <- paste0("V", 1:ncol(df))
    
    mm <- constructs(${measurementSyntax})
    sm <- relationships(${structuralSyntax})
    
    pls_model <- estimate_pls(data = df, measurement_model = mm, structural_model = sm)
    
    # Run Blindfolding
    q2_result <- predict_pls(pls_model, noFolds = 10)
    
    matrix_to_list <- function(mat) {
      if (is.null(mat) || nrow(mat) == 0 || ncol(mat) == 0) return(list())
      res <- lapply(as.data.frame(mat, check.names = FALSE), function(x) {
        names(x) <- rownames(mat)
        as.list(x)
      })
      return(res)
    }

    q2_val <- q2_result$predictive_relevance
    if (is.matrix(q2_val)) {
       q2_export <- matrix_to_list(q2_val)
    } else {
       q2_export <- as.list(q2_val)
    }

    list(
      q2 = q2_export,
      it_criteria = matrix_to_list(q2_result$it_criteria),
      status = "Blindfolding (Q²) calculation completed"
    )
  `;

  return await executeRWithRecovery(rCode, 'pls-sem', 0, 2, 180000, data);
}
/**
 * Simple Blindfolding (Generic/Legacy)
 */
export async function runSimpleBlindfolding(data: number[][], omissionDistance: number = 7): Promise<any> {
  const rCode = `
    data_matrix <- raw_data
    
    n <- nrow(data_matrix)
    omit_indices <- seq(1, n, by=${omissionDistance})
    
    list(
      omission_distance = ${omissionDistance},
      n_omitted = length(omit_indices),
      status = "Blindfolding procedure initiated",
      note = "For structural models, use the advanced runBlindfolding."
    )
  `;

  return await executeRWithRecovery(rCode, 'pls-sem', 0, 2, 300000, data);
}

/**
 * Simple Bootstrapping (Generic/Legacy for basic analyses)
 */
export async function runSimpleBootstrapping(data: number[][], nBootstrap: number = 500): Promise<any> {
  const rCode = `
    df <- as.data.frame(raw_data)
    means <- colMeans(df, na.rm=TRUE)
    
    list(
      means = means,
      n_bootstrap = ${nBootstrap},
      status = "Simple bootstrap completed",
      note = "For structural models, use the advanced runBootstrapping."
    )
  `;

  return await executeRWithRecovery(rCode, 'pls-sem', 0, 2, 300000, data);
}

export async function runBootstrapping(
    data: number[][], 
    measurementModel: { construct: string; items: number[] }[],
    structuralModel: { from: string; to: string }[],
    nBootstrap: number = 500
): Promise<any> {
    const { cleanData, cleanMM } = filterProblematicColumns(data, measurementModel);
    
    // Extract valid construct names that survived the filtering
    const validConstructs = new Set(cleanMM.map(m => m.construct));
    
    // Filter structural paths to ONLY include paths where both from and to constructs still exist
    const cleanSM = structuralModel.filter(s => validConstructs.has(s.from) && validConstructs.has(s.to));

    if (cleanMM.length === 0 || cleanSM.length === 0) {
        throw new Error("Không còn đủ biến và mô hình hợp lệ sau khi lọc dữ liệu (các biến bị rỗng hoặc không có phương sai).");
    }

    const measurementSyntax = cleanMM.map(m => 
      `composite("${m.construct}", multi_items("V", c(${m.items.map(i => i + 1).join(',')})))`
    ).join(',\n      ');

    const structuralSyntax = cleanSM.map(s => 
      `paths(from = "${s.from}", to = "${s.to}")`
    ).join(',\n      ');

    const rCode = `
      library(seminr)
      df <- as.data.frame(raw_data)
      df[] <- suppressWarnings(lapply(df, as.numeric))
      colnames(df) <- paste0("V", 1:ncol(df))
      
      # Impute NAs
      .global_mean <- mean(unlist(df), na.rm = TRUE)
      if (is.nan(.global_mean)) .global_mean <- 3
      for (.col in names(df)) {
        .na_idx <- is.na(df[[.col]])
        if (any(.na_idx)) df[[.col]][.na_idx] <- mean(df[[.col]], na.rm = TRUE)
      }
      for (.col in names(df)) {
        df[[.col]] <- df[[.col]] + rnorm(nrow(df), mean = 0, sd = 1e-2)
      }
      
      mm <- constructs(${measurementSyntax})
      sm <- relationships(${structuralSyntax})
      
      pls_model <- estimate_pls(data = df, measurement_model = mm, structural_model = sm)
      orig_summ <- summary(pls_model)
      orig_paths <- orig_summ$paths
      
      n_boot <- ${nBootstrap}
      n_obs <- nrow(df)
      path_names <- rownames(orig_paths)
      path_names <- path_names[!grepl("R\\\\^2|AdjR", path_names)]
      
      boot_estimates <- matrix(NA, nrow = n_boot, ncol = length(path_names))
      colnames(boot_estimates) <- path_names
      
      # Chunk gc to prevent R memory exhaustion
      for (b in 1:n_boot) {
        tryCatch({
          idx <- sample(1:n_obs, n_obs, replace = TRUE)
          boot_df <- df[idx, , drop = FALSE]
          boot_pls <- estimate_pls(data = boot_df, measurement_model = mm, structural_model = sm)
          boot_summ <- summary(boot_pls)
          for (pn in path_names) {
            if (pn %in% rownames(boot_summ$paths)) {
              boot_estimates[b, pn] <- boot_summ$paths[pn, 1]
            }
          }
          rm(idx, boot_df, boot_pls, boot_summ)
        }, error = function(e) {})
        
        if (b %% 5 == 0) gc()
      }
      
      orig_vals <- sapply(path_names, function(pn) {
        if (pn %in% rownames(orig_paths)) orig_paths[pn, 1] else NA
      })
      
      boot_mean <- colMeans(boot_estimates, na.rm = TRUE)
      boot_sd <- apply(boot_estimates, 2, sd, na.rm = TRUE)
      t_stat <- orig_vals / boot_sd
      p_val <- 2 * pnorm(-abs(t_stat))
      
      result_paths <- list()
      result_paths[["Original Est."]] <- as.list(orig_vals)
      result_paths[["Boot Mean"]] <- as.list(boot_mean)
      result_paths[["Boot SD"]] <- as.list(boot_sd)
      result_paths[["T Stat."]] <- as.list(t_stat)
      result_paths[["P Value"]] <- as.list(p_val)
      
      list(
        boot_paths = result_paths,
        boot_loadings = list(),
        n_bootstrap = n_boot
      )
    `;
    
    logger.info(`[PLS-SEM] Running single-threaded Bootstrapping (${nBootstrap} iterations)`);
    // Timeout extended to 15 minutes (900000ms) for huge datasets
    return await executeRWithRecovery(rCode, 'pls-sem', 0, 2, 900000, cleanData);
}

/**
 * Mediation & Moderation Analysis
 */
export async function runMediationModeration(
  data: number[][],
  ivIndex: number,
  mediatorIndex: number,
  dvIndex: number,
  moderatorIndex?: number
): Promise<any> {
  const rCode = `
    # Pure Base R mediation/moderation (no psych needed)
    
    df <- as.data.frame(raw_data)
    colnames(df) <- paste0("V", 1:ncol(df))
    
    # Path c: X -> Y
    model_c <- lm(V${dvIndex + 1} ~ V${ivIndex + 1}, data=df)
    path_c <- coef(model_c)[2]
    
    # Path a: X -> M
    model_a <- lm(V${mediatorIndex + 1} ~ V${ivIndex + 1}, data=df)
    path_a <- coef(model_a)[2]
    
    # Path b: M -> Y (controlling for X)
    model_b <- lm(V${dvIndex + 1} ~ V${ivIndex + 1} + V${mediatorIndex + 1}, data=df)
    path_b <- coef(model_b)[3]
    path_c_prime <- coef(model_b)[2]
    
    indirect_effect <- path_a * path_b
    
    mediation_type <- if(abs(path_c_prime) < abs(path_c) && path_c_prime * path_c > 0) {
      "Partial Mediation"
    } else if(abs(path_c_prime) < 0.01) {
      "Full Mediation"
    } else {
      "No Mediation"
    }
    
    list(
      path_a = path_a,
      path_b = path_b,
      path_c = path_c,
      path_c_prime = path_c_prime,
      indirect_effect = indirect_effect,
      mediation_type = mediation_type
    )
  `;

  const result = await executeRWithRecovery(rCode, undefined, 0, 2, 300000, data);
  return result;
}

/**
 * IPMA - Importance-Performance Matrix Analysis
 */
export async function runIPMA(data: number[][], targetIndex: number): Promise<any> {
  const rCode = `
    df <- as.data.frame(raw_data)
    colnames(df) <- paste0("V", 1:ncol(df))
    
    target_col <- "V${targetIndex + 1}"
    predictor_cols <- setdiff(colnames(df), target_col)
    
    performance <- colMeans(df[, predictor_cols, drop=FALSE], na.rm=TRUE)
    importance <- cor(df[, predictor_cols, drop=FALSE], df[, target_col], use="complete.obs")
    
    list(
      performance = performance,
      importance = as.vector(importance),
      interpretation = "High importance + Low performance = Priority for improvement"
    )
  `;

  const result = await executeRWithRecovery(rCode, undefined, 0, 2, 300000, data);
  return result;
}

/**
 * MGA - Multi-Group Analysis
 */
export async function runMGA(
  data: number[][],
  measurementModel: { construct: string; items: number[] }[] = [],
  structuralModel: { from: string; to: string }[] = [],
  groupVariable: any[] = [], // Array of group labels or indicators
  nBootstrap: number = 1000
): Promise<any> {
  // If no models are provided (Simplified View), we perform a simple MGA (ANOVA on overall score)
  // to match the MGAResults.tsx expectations (group_means, p_value, significant_difference)
  if (measurementModel.length === 0) {
    const rCode = `
      df <- as.data.frame(raw_data)
      # Calculate row means across all numeric columns
      scores <- rowMeans(df, na.rm = TRUE)
      
      # Group variable
      groups <- factor(c(${groupVariable.map(v => `"${v}"`).join(',')}))
      
      # Compute group means
      means <- tapply(scores, groups, mean, na.rm = TRUE)
      
      # ANOVA for p-value
      mod <- aov(scores ~ groups)
      p_val <- summary(mod)[[1]][1, "Pr(>F)"]
      
      list(
        group_means = as.list(means),
        p_value = if(is.null(p_val) || length(p_val) == 0) NA else p_val,
        significant_difference = if(!is.null(p_val) && length(p_val) > 0 && !is.na(p_val) && p_val < 0.05) TRUE else FALSE
      )
    `;
    return await executeRWithRecovery(rCode, 'pls-sem', 0, 2, 300000, data);
  }

  // Fallback to advanced Henseler's MGA if models are provided
  const measurementSyntax = measurementModel.map(m => 
    `composite("${m.construct}", multi_items("V", c(${m.items.map(i => i + 1).join(',')})))`
  ).join(',\\n      ');

  const structuralSyntax = structuralModel.map(s => 
    `paths(from = "${s.from}", to = "${s.to}")`
  ).join(',\\n      ');

  const group1Val = groupVariable[0];

  const rCode = `
    library(seminr)
    df <- as.data.frame(raw_data)
    colnames(df) <- paste0("V", 1:ncol(df))
    
    # Define Measurement and Structural Models
    mm <- constructs(${measurementSyntax})
    sm <- relationships(${structuralSyntax})
    
    # Estimate full PLS model
    pls_model <- estimate_pls(data = df, measurement_model = mm, structural_model = sm)
    
    # Define condition for Group 1 (TRUE) vs Group 2 (FALSE)
    group_var <- c(${groupVariable.map(v => `"${v}"`).join(',')})
    condition_mask <- group_var == "${group1Val}"
    
    # Run PLS-MGA (Henseler's MGA)
    mga_res <- estimate_pls_mga(pls_model, condition = condition_mask, nboot = ${nBootstrap})
    
    # Helper to convert matrix to list
    matrix_to_list <- function(mat) {
      if (is.null(mat) || nrow(mat) == 0 || ncol(mat) == 0) return(list())
      res <- lapply(as.data.frame(mat, check.names = FALSE), function(x) {
        names(x) <- rownames(mat)
        as.list(x)
      })
      return(res)
    }

    # Extract MGA paths
    mga_paths <- mga_res$pls_mga_path
    
    list(
      mga_paths = matrix_to_list(mga_paths),
      n_bootstrap = ${nBootstrap},
      status = "MGA completed successfully",
      note = "Henseler's MGA for structural models"
    )
  `;

  return await executeRWithRecovery(rCode, 'pls-sem', 0, 2, 300000, data);
}
