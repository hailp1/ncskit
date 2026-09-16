/**
 * ASIG — pls-sem.ts
 * Interpreter: PLS-SEM (Partial Least Squares Structural Equation Modeling)
 *
 * Covers: Outer loadings, AVE, Composite Reliability (ρC), ρA,
 *         Fornell-Larcker, HTMT, R², f², path coefficients.
 * All prose conforms to APA 7th Edition reporting standards.
 * Primary references: Hair et al. (2017, 2021); Henseler et al. (2015).
 */

import { InterpretationResult, formatCoef, formatNum, formatPValue, safeNum } from './shared';


export function interpretPLSSEM(params: {
    fornell_larcker?:      Record<string, Record<string, number>>;
    htmt?:                 Record<string, Record<string, number>>;
    r_squared?:            Record<string, number>;
    ave?:                  Record<string, number>;
    compositeReliability?: Record<string, number>;
    outerLoadings?:        Record<string, Record<string, number>>;
    pathCoefficients?:     {
        from: string;
        to: string;
        beta: number;
        tValue?: number;
        pValue?: number;
        ci95Lower?: number;
        ci95Upper?: number;
    }[];
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const {
        fornell_larcker, htmt, r_squared,
        ave, compositeReliability,
        outerLoadings, pathCoefficients
    } = params;

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Hair, J. F., Hult, G. T. M., Ringle, C. M., & Sarstedt, M. (2017). A primer on partial least squares structural equation modeling (PLS-SEM) (2nd ed.). SAGE Publications.',
        'Hair, J. F., Hult, G. T. M., Ringle, C. M., Sarstedt, M., Danks, N. P., & Ray, S. (2021). Partial least squares structural equation modeling (PLS-SEM) using R: A workbook. Springer. https://doi.org/10.1007/978-3-030-80519-7',
        'Henseler, J., Ringle, C. M., & Sarstedt, M. (2015). A new criterion for assessing discriminant validity in variance-based structural equation modeling. Journal of the Academy of Marketing Science, 43(1), 115–135. https://doi.org/10.1007/s11747-014-0403-8',
        'Fornell, C., & Larcker, D. F. (1981). Evaluating structural equation models with unobservable variables and measurement error. Journal of Marketing Research, 18(1), 39–50. https://doi.org/10.1177/002224378101800104',
    ];

    let hasViolations   = false;
    let hasAnyData      = false;


    // ── SECTION 1: Outer Loadings ─────────────────────────────────────────────
    if (outerLoadings && Object.keys(outerLoadings).length > 0) {
        hasAnyData = true;
        details.push(locale === 'vi' ? '━━ Mô hình đo lường — Hệ số tải ngoài (Độ tin cậy biến quan sát) ━━' : '━━ Measurement Model — Outer Loadings (Indicator Reliability) ━━');
        let nGood = 0, nAcceptable = 0, nPoor = 0;

        Object.entries(outerLoadings).forEach(([construct, items]) => {
            Object.entries(items).forEach(([item, loading]) => {
                if (loading < 0.40) {
                    nPoor++;
                    warnings.push(locale === 'vi'
                        ? `Hệ số tải ngoài (outer loading) của biến "${item}" (→ ${construct}) = ${formatCoef(loading)} < .40: biến quan sát này giải thích tỷ lệ phương sai rất thấp cho cấu trúc tiềm ẩn và cần xem xét loại bỏ khỏi mô hình đo lường (Hair et al., 2017).`
                        : `Outer loading for "${item}" (→ ${construct}) = ${formatCoef(loading)} < .40: the item contributes negligible variance to the construct and should be removed from the measurement model (Hair et al., 2017).`
                    );
                    hasViolations = true;
                } else if (loading < 0.70) {
                    nAcceptable++;
                    details.push(locale === 'vi'
                        ? `"${item}" (${construct}): λ = ${formatCoef(loading)} — đạt mức chấp nhận được (.40–.69); xem xét loại bỏ biến này nếu AVE của cấu trúc chưa đạt ngưỡng tối thiểu.`
                        : `"${item}" (${construct}): λ = ${formatCoef(loading)} — acceptable (.40–.69); consider removing if AVE is also borderline.`
                    );
                } else {
                    nGood++;
                    details.push(`"${item}" (${construct}): λ = ${formatCoef(loading)} ✓ (≥ .70)`);
                }
            });
        });

        details.push(locale === 'vi'
            ? `Tổng hợp hệ số tải: ${nGood} biến ≥ .70 ✓; ${nAcceptable} biến ở mức chấp nhận (.40–.69); ${nPoor} biến vi phạm < .40 ✗.`
            : `Outer loading summary: ${nGood} items ≥ .70 ✓; ${nAcceptable} acceptable (.40–.69); ${nPoor} below .40 ✗.`
        );
        details.push(locale === 'vi'
            ? 'Khuyến nghị ngưỡng đánh giá: λ ≥ .70 là tối ưu (Hair et al., 2017); λ ≥ .40 có thể chấp nhận nếu AVE của thang đo vẫn đảm bảo ≥ .50.'
            : `Threshold guidance: λ ≥ .70 preferred (Hair et al., 2017); λ ≥ .40 minimally acceptable if AVE ≥ .50 is maintained.`
        );
    }


    // ── SECTION 2: AVE & Convergent Validity ─────────────────────────────────
    if (ave && Object.keys(ave).length > 0) {
        hasAnyData = true;
        details.push(locale === 'vi' ? '━━ Độ độ giá trị hội tụ — Phương sai trích xuất trung bình (AVE) ━━' : '━━ Convergent Validity — Average Variance Extracted (AVE) ━━');
        let nPass = 0, nFail = 0;

        Object.entries(ave).forEach(([construct, aveVal]) => {
            if (aveVal < 0.50) {
                nFail++;
                warnings.push(locale === 'vi'
                    ? `AVE cho cấu trúc "${construct}" = ${formatCoef(aveVal)} < .50: cấu trúc tiềm ẩn này giải thích dưới 50% phương sai của các biến quan sát thành phần; phần phương sai do sai số đo lường chiếm tỷ trọng lớn hơn (Fornell & Larcker, 1981). Hãy loại các biến có hệ số tải thấp.`
                    : `AVE for "${construct}" = ${formatCoef(aveVal)} < .50: the construct captures less than half its variance from indicators; measurement error dominates (Fornell & Larcker, 1981). Remove low-loading items or reconsider the construct definition.`
                );
                hasViolations = true;
            } else {
                nPass++;
                details.push(locale === 'vi'
                    ? `"${construct}": AVE = ${formatCoef(aveVal)} ${aveVal >= 0.60 ? '✓✓ (rất tốt ≥ .60)' : '✓ (đạt ngưỡng ≥ .50)'}.`
                    : `"${construct}": AVE = ${formatCoef(aveVal)} ${aveVal >= 0.60 ? '✓✓ (good ≥ .60)' : '✓ (meets ≥ .50 threshold)'}.`
                );
            }
        });

        details.push(locale === 'vi'
            ? `Tổng hợp AVE: ${nPass} cấu trúc đạt (≥ .50); ${nFail} cấu trúc vi phạm (< .50).`
            : `AVE summary: ${nPass} construct${nPass !== 1 ? 's' : ''} pass (≥ .50); ${nFail} construct${nFail !== 1 ? 's' : ''} fail (< .50).`
        );
        details.push(locale === 'vi'
            ? 'Đạt AVE ≥ .50 chứng tỏ độ giá trị hội tụ tốt: các biến quan sát chia sẻ nhiều phương sai với cấu trúc tiềm ẩn của nó hơn là với sai số ngẫu nhiên (Fornell & Larcker, 1981).'
            : `AVE ≥ .50 indicates convergent validity: items share more variance with their latent construct than with measurement error (Fornell & Larcker, 1981).`
        );
    }


    // ── SECTION 3: Composite Reliability (ρC) ────────────────────────────────
    if (compositeReliability && Object.keys(compositeReliability).length > 0) {
        hasAnyData = true;
        details.push(locale === 'vi' ? '━━ Độ tin cậy nhất quán nội tại — Độ tin cậy tổng hợp (Composite Reliability - ρC) ━━' : '━━ Internal Consistency — Composite Reliability (ρC) ━━');

        Object.entries(compositeReliability).forEach(([construct, cr]) => {
            if (cr < 0.70) {
                warnings.push(locale === 'vi'
                    ? `ρC của "${construct}" = ${formatCoef(cr)} < .70: thang đo không đủ độ tin cậy nhất quán nội tại (Hair et al., 2017). Cần hiệu chỉnh lại bộ câu hỏi trước khi phân tích tiếp.`
                    : `ρC for "${construct}" = ${formatCoef(cr)} < .70: insufficient internal consistency (Hair et al., 2017). Scale revision is required before proceeding.`
                );
                hasViolations = true;
            } else if (cr > 0.95) {
                warnings.push(locale === 'vi'
                    ? `ρC của "${construct}" = ${formatCoef(cr)} > .95: độ tin cậy quá cao, có thể là hệ quả của hiện tượng trùng lặp ngữ nghĩa (semantic redundancy) giữa các biến quan sát, chứ không phản ánh độ tin cậy thực sự. Xem xét lại các câu hỏi xem có bị lặp ý hay không.`
                    : `ρC for "${construct}" = ${formatCoef(cr)} > .95: potentially inflated by indicator redundancy rather than true reliability. Review items for conceptual overlap and consider removing near-duplicate indicators.`
                );
                details.push(locale === 'vi' ? `"${construct}": ρC = ${formatCoef(cr)} (lưu ý: CR > .95 cảnh báo hiện tượng trùng lặp).` : `"${construct}": ρC = ${formatCoef(cr)} (note: very high CR may indicate redundancy > .95).`);
            } else {
                const labelEn = cr >= 0.90 ? 'excellent' : cr >= 0.80 ? 'good' : 'adequate';
                const labelVi = cr >= 0.90 ? 'xuất sắc' : cr >= 0.80 ? 'tốt' : 'đạt yêu cầu';
                details.push(`"${construct}": ρC = ${formatCoef(cr)} ✓ (${locale === 'vi' ? labelVi : labelEn}).`);
            }
        });

        details.push(locale === 'vi'
            ? 'Tiêu chuẩn Composite Reliability: ≥ .70 đạt mức cơ bản; ≥ .80 tốt; ≥ .90 xuất sắc; > .95 cảnh báo khả năng lặp câu hỏi (Hair et al., 2017).'
            : `Composite Reliability thresholds: ≥ .70 adequate; ≥ .80 good; ≥ .90 excellent; > .95 may indicate redundancy (Hair et al., 2017).`
        );
    }


    // ── SECTION 4: Fornell-Larcker Criterion ─────────────────────────────────
    if (fornell_larcker && Object.keys(fornell_larcker).length > 0) {
        hasAnyData = true;
        details.push(locale === 'vi' ? '━━ Độ độ giá trị phân biệt — Tiêu chuẩn Fornell-Larcker ━━' : '━━ Discriminant Validity — Fornell-Larcker Criterion ━━');
        const constructs         = Object.keys(fornell_larcker);
        const fornellViolations: string[] = [];

        constructs.forEach(c1 => {
            const diagVal = fornell_larcker[c1]?.[c1];
            if (diagVal == null) return;
            constructs.forEach(c2 => {
                if (c1 === c2) return;
                const corr = fornell_larcker[c1]?.[c2] ?? fornell_larcker[c2]?.[c1];
                if (corr != null && corr >= diagVal) {
                    fornellViolations.push(
                        `${c1} vs. ${c2} (√AVE = ${formatCoef(diagVal)}, r = ${formatCoef(corr)})`
                    );
                }
            });
        });

        if (fornellViolations.length === 0) {
            details.push(locale === 'vi'
                ? 'Tiêu chuẩn Fornell-Larcker: ĐẠT YÊU CẦU ✓. Căn bậc hai AVE của mỗi cấu trúc đều lớn hơn tất cả các tương quan chéo giữa nó với các cấu trúc khác, chứng tỏ mỗi cấu trúc giải thích cho các biến quan sát của chính nó tốt hơn là giải thích cho các cấu trúc khác (Fornell & Larcker, 1981).'
                : 'Fornell-Larcker criterion: SATISFIED ✓. The square root of each construct\'s AVE exceeds all inter-construct correlations, confirming that each construct shares more variance with its own indicators than with any other construct (Fornell & Larcker, 1981).'
            );
        } else {
            hasViolations = true;
            warnings.push(locale === 'vi'
                ? `Tiêu chuẩn Fornell-Larcker BỊ VI PHẠM ở các cặp: ${fornellViolations.join('; ')}. Các cặp cấu trúc này không có sự tách biệt rõ ràng — độ giá trị phân biệt của chúng đáng ngờ. Bạn nên xem xét gộp các khái niệm hoặc dùng thêm tiêu chuẩn HTMT để đối chiếu.`
                : `Fornell-Larcker criterion VIOLATED for: ${fornellViolations.join('; ')}. These construct pairs are not sufficiently distinct — their discriminant validity is questionable. Consider item reassignment, construct consolidation, or applying the HTMT criterion for confirmation.`
            );
        }
    }


    // ── SECTION 5: HTMT ───────────────────────────────────────────────────────
    if (htmt && Object.keys(htmt).length > 0) {
        hasAnyData = true;
        details.push(locale === 'vi' ? '━━ Độ độ giá trị phân biệt — Tiêu chuẩn HTMT (Henseler et al., 2015) ━━' : '━━ Discriminant Validity — HTMT Criterion (Henseler et al., 2015) ━━');
        const constructs        = Object.keys(htmt);
        const htmtViolations09: string[] = [];
        const htmtWarnings85:   string[] = [];
        const seenPairs         = new Set<string>();

        constructs.forEach(c1 => {
            constructs.forEach(c2 => {
                if (c1 >= c2) return;
                const key = `${c1}|${c2}`;
                if (seenPairs.has(key)) return;
                seenPairs.add(key);
                const val = htmt[c1]?.[c2] ?? htmt[c2]?.[c1];
                if (val == null) return;

                if (val >= 0.90) {
                    htmtViolations09.push(`${c1} & ${c2} (HTMT = ${formatCoef(val)})`);
                    hasViolations = true;
                } else if (val >= 0.85) {
                    htmtWarnings85.push(`${c1} & ${c2} (HTMT = ${formatCoef(val)})`);
                    details.push(locale === 'vi'
                        ? `${c1} & ${c2}: HTMT = ${formatCoef(val)} ⚠️ (nằm sát ranh giới .85–.90; đề xuất thực hiện Bootstrap CI để kiểm tra ý nghĩa).`
                        : `${c1} & ${c2}: HTMT = ${formatCoef(val)} ⚠️ (borderline .85–.90; bootstrap CI recommended to assess statistical significance).`
                    );
                } else {
                    details.push(`${c1} & ${c2}: HTMT = ${formatCoef(val)} < .85 ✓`);
                }
            });
        });

        if (htmtViolations09.length > 0) {
            warnings.push(locale === 'vi'
                ? `HTMT ≥ .90 (VI PHẠM độ giá trị phân biệt) ở các cặp: ${htmtViolations09.join('; ')}. Về mặt thống kê, các cấu trúc này bị lẫn lộn vào nhau. Hãy rà soát lại các biến có cross-loadings cao, chia lại câu hỏi hoặc gộp khái niệm.`
                : `HTMT ≥ .90 (discriminant validity VIOLATED) for: ${htmtViolations09.join('; ')}. These constructs may not be empirically distinct. Inspect cross-loadings, consider item reassignment, or reconceptualise the constructs.`
            );
        }
        if (htmtWarnings85.length > 0) {
            warnings.push(locale === 'vi'
                ? `Cảnh báo HTMT nằm vùng cận biên .85–.90 ở các cặp: ${htmtWarnings85.join('; ')}. Hãy tính Bootstrap CI — nếu giới hạn trên của CI vượt ngưỡng .90, coi như thang đo thất bại ở tiêu chí độ giá trị phân biệt.`
                : `HTMT between .85–.90 (borderline) for: ${htmtWarnings85.join('; ')}. Obtain bootstrap CIs for HTMT values — if the CI upper bound exceeds .90, discriminant validity is statistically violated.`
            );
        }
        if (htmtViolations09.length === 0 && htmtWarnings85.length === 0) {
            details.push(locale === 'vi'
                ? 'Tiêu chuẩn HTMT: ĐẠT YÊU CẦU ✓. Tất cả tỷ số HTMT đều < .85, chứng tỏ tất cả các khái niệm đo lường trong mô hình hoàn toàn phân biệt với nhau (Henseler et al., 2015). HTMT hiện là tiêu chuẩn vàng thay thế Fornell-Larcker để đánh giá độ giá trị phân biệt trong PLS-SEM (Hair et al., 2021).'
                : 'HTMT criterion: SATISFIED ✓. All HTMT values < .85, confirming discriminant validity across all construct pairs (Henseler et al., 2015). HTMT is now the recommended discriminant validity criterion, superseding the Fornell-Larcker criterion in sensitivity (Hair et al., 2021).'
            );
        }
    }


    // ── SECTION 6: R-Squared ─────────────────────────────────────────────────
    if (r_squared && Object.keys(r_squared).length > 0) {
        hasAnyData = true;
        details.push(locale === 'vi' ? '━━ Mô hình cấu trúc — Mức độ giải thích (R²) ━━' : '━━ Structural Model — Explanatory Power (R²) ━━');

        Object.entries(r_squared).forEach(([construct, r2]) => {
            const levelEn = r2 >= 0.75 ? 'substantial' : r2 >= 0.50 ? 'moderate' : r2 >= 0.25 ? 'weak' : 'very weak (< .25)';
            const levelVi = r2 >= 0.75 ? 'đáng kể' : r2 >= 0.50 ? 'vừa phải' : r2 >= 0.25 ? 'yếu' : 'rất yếu (< .25)';
            const level = locale === 'vi' ? levelVi : levelEn;

            details.push(locale === 'vi'
                ? `"${construct}": R² = ${formatCoef(r2)} (mức độ giải thích ${level}). Chuẩn đánh giá PLS-SEM theo Hair et al. (2017): yếu ≥ .25, vừa phải ≥ .50, đáng kể ≥ .75.`
                : `"${construct}": R² = ${formatCoef(r2)} (${level}). Hair et al. (2017) benchmarks for social science PLS-SEM: weak ≥ .25, moderate ≥ .50, substantial ≥ .75.`
            );

            if (r2 < 0.10) {
                warnings.push(locale === 'vi'
                    ? `"${construct}": R² = ${formatCoef(r2)} < .10 — mô hình cấu trúc có sức mạnh dự báo cực kì thấp đối với cấu trúc nội sinh này. Xem xét lại khung lý thuyết vì có thể đang bỏ sót các yếu tố dự báo quan trọng.`
                    : `"${construct}": R² = ${formatCoef(r2)} < .10 — the structural model has very limited predictive power for this endogenous construct. Review the theoretical model for omitted predictors.`
                );
            }
        });

        details.push(locale === 'vi'
            ? 'Lưu ý: Chỉ số Adjusted R² (thường được báo cáo cùng R² trong PLS-SEM) kiểm soát số lượng biến độc lập tác động vào, vì thế phản ánh khả năng giải thích tổng thể trung thực hơn.'
            : 'Note: Adjusted R² (reported alongside R² in PLS-SEM output) corrects for the number of antecedent constructs and provides a less biased estimate of population explanatory power.'
        );
    }


    // ── SECTION 7: Path Coefficients (Bootstrapping) ─────────────────────────
    if (pathCoefficients && pathCoefficients.length > 0) {
        hasAnyData = true;
        details.push(locale === 'vi' ? '━━ Mô hình cấu trúc — Hệ số tác động (có Bootstrapping) ━━' : '━━ Structural Model — Path Coefficients (Bootstrapped) ━━');

        for (const path of pathCoefficients) {
            const ciStr = (path.ci95Lower != null && path.ci95Upper != null)
                ? `, 95% CI [${formatCoef(path.ci95Lower)}, ${formatCoef(path.ci95Upper)}]`
                : '';
            const tStr  = path.tValue != null ? `, t = ${formatNum(path.tValue)}` : '';
            const pStr  = path.pValue != null ? `, ${formatPValue(path.pValue)}` : '';
            
            const sigStr = path.pValue != null
                ? (path.pValue < 0.05 ? (locale === 'vi' ? ' ✓ ý nghĩa (α = .05)' : ' ✓ significant (α = .05)') : (locale === 'vi' ? ' ✗ không ý nghĩa' : ' ✗ not significant'))
                : '';
            const dirLabel = path.beta > 0 ? (locale === 'vi' ? 'dương (+)' : 'positive') : (locale === 'vi' ? 'âm (-)' : 'negative');

            details.push(
                `${path.from} → ${path.to}: ` +
                `β = ${formatCoef(path.beta)}${tStr}${pStr}${ciStr}${sigStr}. ` +
                (locale === 'vi' ? `Hướng tác động: ${dirLabel}.` : `Direction: ${dirLabel} effect.`)
            );

            if (path.pValue != null && path.pValue < 0.05 && Math.abs(path.beta) < 0.10) {
                warnings.push(locale === 'vi'
                    ? `Tác động ${path.from} → ${path.to}: có ý nghĩa thống kê nhưng cường độ tác động quá nhỏ |β| = ${formatCoef(Math.abs(path.beta))} < .10. Ý nghĩa thực tiễn của tác động này là rất yếu. Khuyến nghị kiểm tra thêm chỉ số effect size f² (nhỏ ≥ .02, vừa ≥ .15, lớn ≥ .35; Hair et al., 2017).`
                    : `Path ${path.from} → ${path.to}: statistically significant but |β| = ${formatCoef(Math.abs(path.beta))} < .10. This effect is very small; evaluate practical significance and consider f² effect size (small ≥ .02, medium ≥ .15, large ≥ .35; Hair et al., 2017).`
                );
            }
            if (path.ci95Lower != null && path.ci95Upper != null) {
                const ciInclZero = path.ci95Lower < 0 && path.ci95Upper > 0;
                if (ciInclZero && path.pValue != null && path.pValue < 0.05) {
                    warnings.push(locale === 'vi'
                        ? `Tác động ${path.from} → ${path.to}: p-value < .05 nhưng Bootstrap 95% CI lại vắt ngang qua 0 — trong PLS-SEM, Bootstrap CI là thước đo quyết định. Phải kết luận rằng tác động này không có ý nghĩa thống kê.`
                        : `Path ${path.from} → ${path.to}: p < .05 but 95% CI includes zero — the bootstrap CI provides the definitive inference. Treat this path as non-significant.`
                    );
                }
            }
        }

        details.push(locale === 'vi'
            ? 'Cảnh báo: Khoảng tin cậy Bootstrap 95% CI không chứa số 0 là tiêu chuẩn hàng đầu để kết luận ý nghĩa thống kê trong PLS-SEM (quan trọng hơn cả p-value) (Hair et al., 2017). Cần thiết lập vòng lặp Bootstrap ≥ 5,000 để có ước lượng CI chuẩn xác.'
            : 'Bootstrapped 95% CI that excludes zero is the primary significance criterion in PLS-SEM, taking precedence over p-values (Hair et al., 2017). Use ≥ 5,000 bootstrap subsamples for stable CI estimates.'
        );
        details.push(locale === 'vi'
            ? 'Chuẩn báo cáo APA 7 cho mô hình PLS-SEM: β = X.XX, t(df) = X.XX, p = .XXX, 95% CI [LL, UL].'
            : 'APA 7 format for PLS-SEM path reporting: β = X.XX, t(df) = X.XX, p = .XXX, 95% CI [LL, UL].'
        );
    }


    // ── OVERALL SUMMARY ───────────────────────────────────────────────────────
    let summary = '';

    if (!hasAnyData) {
        summary = locale === 'vi'
            ? 'Không có dữ liệu PLS-SEM nào được cung cấp. Cần cung cấp ít nhất một trong các dữ liệu: fornell_larcker, htmt, r_squared, ave, compositeReliability, outerLoadings, hoặc pathCoefficients.'
            : 'No PLS-SEM data were provided. Please supply at least one of: fornell_larcker, htmt, r_squared, ave, compositeReliability, outerLoadings, or pathCoefficients.';
    } else if (hasViolations) {
        const violationAreasEn: string[] = [];
        const violationAreasVi: string[] = [];
        if (ave && Object.values(ave).some(v => v < 0.50)) { violationAreasEn.push('convergent validity (AVE < .50)'); violationAreasVi.push('độ giá trị hội tụ (AVE < .50)'); }
        if (compositeReliability && Object.values(compositeReliability).some(v => v < 0.70)) { violationAreasEn.push('internal consistency (ρC < .70)'); violationAreasVi.push('độ tin cậy tổng hợp (ρC < .70)'); }
        if (fornell_larcker) {
            const constructs = Object.keys(fornell_larcker);
            const hasFLViolation = constructs.some(c1 =>
                constructs.some(c2 => {
                    if (c1 === c2) return false;
                    const diagVal = fornell_larcker[c1]?.[c1];
                    const corr = fornell_larcker[c1]?.[c2] ?? fornell_larcker[c2]?.[c1];
                    return diagVal != null && corr != null && corr >= diagVal;
                })
            );
            if (hasFLViolation) { violationAreasEn.push('discriminant validity (Fornell-Larcker violated)'); violationAreasVi.push('độ giá trị phân biệt (Fornell-Larcker bị vi phạm)'); }
        }
        if (htmt) {
            const constructs = Object.keys(htmt);
            const hasHTMTViolation = constructs.some(c1 =>
                constructs.some(c2 => {
                    if (c1 >= c2) return false;
                    const val = htmt[c1]?.[c2] ?? htmt[c2]?.[c1];
                    return val != null && val >= 0.90;
                })
            );
            if (hasHTMTViolation) { violationAreasEn.push('discriminant validity (HTMT ≥ .90)'); violationAreasVi.push('độ giá trị phân biệt (HTMT ≥ .90)'); }
        }

        const violationAreas = locale === 'vi' ? violationAreasVi : violationAreasEn;

        summary = locale === 'vi'
            ? `Kiểm định mô hình đo lường PLS-SEM phát hiện vi phạm ở các tiêu chí: ${violationAreas.length > 0 ? violationAreas.join('; ') : 'xem phần cảnh báo'}. Những lỗi này cần được khắc phục trước (bằng cách xóa biến hoặc gộp khái niệm) — nếu mô hình đo lường chưa đạt yêu cầu, mô hình cấu trúc sẽ không còn ý nghĩa diễn giải (Hair et al., 2017, 2021). Tiếp tục cố phân tích sẽ gây sai lệch lớn về hệ số đường dẫn và tăng rủi ro mắc sai lầm loại I (Type I error).`
            : `PLS-SEM measurement model assessment identified violations in the following areas: ${violationAreas.length > 0 ? violationAreas.join('; ') : 'see warnings'}. These issues must be resolved — by revising items, reconsidering the measurement model, or addressing construct conceptualisation — before the structural model results can be meaningfully interpreted (Hair et al., 2017, 2021). Proceeding with hypothesis testing under measurement model violations risks biased path coefficient estimates and inflated Type I error.`;
    } else {
        const sectionsEn: string[] = [];
        const sectionsVi: string[] = [];
        if (ave || compositeReliability) { sectionsEn.push('reliability and convergent validity'); sectionsVi.push('độ tin cậy và độ giá trị hội tụ'); }
        if (fornell_larcker || htmt)     { sectionsEn.push('discriminant validity'); sectionsVi.push('độ giá trị phân biệt'); }
        if (r_squared)                   { sectionsEn.push('structural model explanatory power'); sectionsVi.push('mức độ giải thích của mô hình cấu trúc'); }
        if (pathCoefficients)            { sectionsEn.push('path coefficients'); sectionsVi.push('hệ số đường dẫn'); }

        const sections = locale === 'vi' ? sectionsVi : sectionsEn;

        summary = locale === 'vi'
            ? `Kiểm định mô hình PLS-SEM cho thấy tất cả các tiêu chí đánh giá đo lường đều vượt qua mức quy chuẩn (Hair et al., 2017): Tiêu chí về ${sections.join('; ')} đều đạt. Cụ thể, mô hình chứng minh được độ giá trị hội tụ (AVE ≥ .50), độ tin cậy nội tại (ρC ≥ .70), và độ giá trị phân biệt (Fornell-Larcker và/hoặc HTMT). Mô hình đo lường vững chắc này hoàn toàn làm nền tảng tốt để đưa ra kết luận từ mô hình cấu trúc. ${pathCoefficients && pathCoefficients.length > 0 ? 'Tất cả hệ số đường dẫn được báo cáo dưới dạng ước lượng Bootstrap với 95% CI — khoảng tin cậy không chứa số 0 khẳng định tính ý nghĩa thống kê của giả thuyết.' : ''}`
            : `PLS-SEM measurement model assessment indicates that all evaluated criteria satisfy recommended thresholds (Hair et al., 2017): ${sections.join('; ')} criteria are all met. Specifically, convergent validity (AVE ≥ .50), internal consistency (ρC ≥ .70), and discriminant validity (Fornell-Larcker and/or HTMT criteria) are all satisfied. The measurement model provides an adequate foundation for interpreting the structural model results. ${pathCoefficients && pathCoefficients.length > 0 ? 'All reported path coefficients are bootstrapped estimates with 95% CI — CIs excluding zero indicate statistically significant causal pathways.' : ''}`;
    }

    return {
        summary, details, warnings, citations,
        verdict: hasViolations ? 'fail' : hasAnyData ? 'pass' : 'warning',
        apaStatement: hasViolations
            ? (locale === 'vi'
                ? `Kiểm định PLS-SEM phát hiện các vi phạm trong mô hình đo lường. Vui lòng khắc phục các điểm yếu ở ${[
                    ave && Object.values(ave).some(v => v < 0.50) ? 'AVE (< .50)' : null,
                    compositeReliability && Object.values(compositeReliability).some(v => v < 0.70) ? 'CR (< .70)' : null,
                    htmt && Object.keys(htmt).some(c1 => Object.keys(htmt).some(c2 => c1 < c2 && ((htmt[c1]?.[c2] ?? htmt[c2]?.[c1]) ?? 0) >= 0.90)) ? 'HTMT (≥ .90)' : null,
                  ].filter(Boolean).join(', ')} trước khi tiến hành diễn giải các đường dẫn (Hair et al., 2017).`
                : `PLS-SEM assessment identified measurement model violations. Resolve issues in ${[
                    ave && Object.values(ave).some(v => v < 0.50) ? 'AVE (< .50)' : null,
                    compositeReliability && Object.values(compositeReliability).some(v => v < 0.70) ? 'CR (< .70)' : null,
                    htmt && Object.keys(htmt).some(c1 => Object.keys(htmt).some(c2 => c1 < c2 && ((htmt[c1]?.[c2] ?? htmt[c2]?.[c1]) ?? 0) >= 0.90)) ? 'HTMT (≥ .90)' : null,
                  ].filter(Boolean).join(', ')} before interpreting structural paths (Hair et al., 2017).`)
            : (locale === 'vi'
                ? `Mô hình đo lường PLS-SEM hoàn toàn đạt chuẩn: thỏa mãn điều kiện về độ giá trị hội tụ (AVE ≥ .50), độ tin cậy nội tại (ρC ≥ .70), và độ giá trị phân biệt (Fornell-Larcker / HTMT) (Hair et al., 2017).`
                : `PLS-SEM measurement model assessment confirms all criteria are satisfied: convergent validity (AVE ≥ .50), internal consistency (ρC ≥ .70), and discriminant validity (Fornell-Larcker / HTMT) (Hair et al., 2017).`),
        recommendations: hasViolations
            ? (locale === 'vi' ? [
                ave && Object.values(ave).some(v => v < 0.50) ? 'Cải thiện AVE bằng cách xóa bỏ dần các biến có hệ số tải thấp (λ < .40) hoặc tinh gọn lại cấu trúc.' : null,
                htmt && Object.keys(htmt).some(c1 => Object.keys(htmt).some(c2 => c1 < c2 && ((htmt[c1]?.[c2] ?? htmt[c2]?.[c1]) ?? 0) >= 0.90)) ? 'Vi phạm HTMT cần được xử lý bằng cách kiểm tra cross-loadings, chuyển đổi hoặc gộp các khái niệm đang bị nhòe ranh giới.' : null,
                'Phải chạy lại đánh giá mô hình đo lường một lần nữa sau khi tinh chỉnh, rồi mới được xét tới mô hình cấu trúc (kiểm định giả thuyết).'
            ].filter((r): r is string => r !== null) : [
                ave && Object.values(ave).some(v => v < 0.50)
                    ? 'Improve AVE by removing low-loading items (λ < .40) or reconceptualising the construct.'
                    : null,
                htmt && Object.keys(htmt).some(c1 => Object.keys(htmt).some(c2 => c1 < c2 && ((htmt[c1]?.[c2] ?? htmt[c2]?.[c1]) ?? 0) >= 0.90))
                    ? 'Address HTMT violations by examining cross-loadings, reassigning items, or merging highly similar constructs.'
                    : null,
                'Re-run the measurement model assessment after revisions before proceeding to structural model interpretation.',
            ].filter((r): r is string => r !== null))
            : (locale === 'vi' ? [
                pathCoefficients && pathCoefficients.length > 0 ? 'Báo cáo hệ số đường dẫn lấy từ Bootstrapping với 95% CI (khuyến nghị lặp ≥ 5,000 lần) — khoảng tin cậy không chứa giá trị 0 chỉ ra mối quan hệ nhân quả có ý nghĩa.' : 'Chạy quy trình Bootstrapping (lặp ≥ 5,000 lần) để lấy được p-value và t-value cho các đường dẫn.',
                r_squared ? 'Ngoài R², hãy báo cáo thêm chỉ số Q² (phương pháp blindfolding) để chứng minh khả năng dự báo của mô hình trên dữ liệu mới.' : 'Theo dõi R² cho tất cả các cấu trúc nội sinh để biết mức độ được giải thích: yếu ≥ .25, vừa ≥ .50, đáng kể ≥ .75 (Hair et al., 2017).',
                'Nên bổ sung hệ số effect size (f²) cho từng đường dẫn để làm rõ mức độ tác động thực tế của biến.'
            ] : [
                pathCoefficients && pathCoefficients.length > 0
                    ? 'Report bootstrapped path coefficients with 95% CI (≥ 5,000 resamples) — CIs excluding zero indicate significance.'
                    : 'Run PLS bootstrapping (≥ 5,000 resamples) to obtain significance tests for path coefficients.',
                r_squared
                    ? 'Report Q² predictive relevance (blindfolding) alongside R² to assess out-of-sample predictive accuracy.'
                    : 'Assess R² for all endogenous constructs: weak ≥ .25, moderate ≥ .50, substantial ≥ .75 (Hair et al., 2017).',
                'Report f² effect sizes for each path to supplement the significance test with practical magnitude assessment.',
            ]),
    };
}
