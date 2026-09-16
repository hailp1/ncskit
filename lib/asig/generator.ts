/**
 * ASIG — generator.ts
 * Central dispatch router: maps AnalysisType → specific interpreter.
 * Also exports standalone utilities: interpretVIF, interpretOutlier, interpretHTMT.
 *
 * All interpreters return an InterpretationResult with APA 7 prose.
 */

import { AnalysisType, InterpretationResult, formatCoef, formatNum, safeNum } from './shared';
import { interpretCronbachAlpha, interpretEFA, interpretCFA }       from './factor';
import {
    interpretDescriptive,
    interpretCorrelation,
    interpretTTestIndependent,
    interpretTTestPaired,
    interpretANOVA,
    interpretTwoWayANOVA,
    interpretMannWhitney,
    interpretKruskalWallis,
    interpretWilcoxonSigned,
    interpretChiSquare,
} from './basic';
import {
    interpretLinearRegression,
    interpretLogisticRegression,
    interpretMediation,
    interpretModeration,
    interpretClusterAnalysis,
} from './regression';
import { interpretPLSSEM } from './pls-sem';


// ─── MAIN DISPATCH ROUTER ────────────────────────────────────────────────────

export function generateInterpretation(
    analysisType: AnalysisType,
    results: Record<string, any>,
    locale: 'en' | 'vi' = 'en'
): InterpretationResult {
    switch (analysisType) {
        case 'cronbach_alpha':
        case 'cronbach':
        case 'omega':
            return interpretCronbachAlpha(results as any, locale);
        case 'correlation':         return interpretCorrelation(results as any, locale);
        case 'ttest_independent':   return interpretTTestIndependent(results as any, locale);
        case 'ttest_paired':        return interpretTTestPaired(results as any, locale);
        case 'anova':               return interpretANOVA(results as any, locale);
        case 'two_way_anova':       return interpretTwoWayANOVA(results as any, locale);
        case 'efa':                 return interpretEFA(results as any, locale);
        case 'cfa':                 return interpretCFA(results as any, locale);
        case 'linear_regression':
        case 'regression':
            return interpretLinearRegression(results as any, locale);
        case 'logistic_regression':
        case 'logistic':
            return interpretLogisticRegression(results as any, locale);
        case 'mann_whitney':        return interpretMannWhitney(results as any, locale);
        case 'kruskal_wallis':      return interpretKruskalWallis(results as any, locale);
        case 'wilcoxon_signed':
        case 'wilcoxon':
            return interpretWilcoxonSigned(results as any, locale);
        case 'chi_square':
        case 'chisquare':
        case 'chi-square':
            return interpretChiSquare(results as any, locale);
        case 'mediation':           return interpretMediation(results as any, locale);
        case 'moderation':          return interpretModeration(results as any, locale);
        case 'cluster':             return interpretClusterAnalysis(results as any, locale);
        case 'descriptive':         return interpretDescriptive(results as any, locale);
        case 'pls-sem':             return interpretPLSSEM(results as any, locale);

        // Inline handlers for lightweight diagnostics
        case 'vif':    return interpretVIF(results as any, locale);
        case 'outlier': return interpretOutlier(results as any, locale);
        case 'htmt':   return interpretHTMT(results as any, locale);

        default:
            return {
                summary:   `No ASIG template is currently registered for analysis type "${analysisType}". Please contact the development team to request support for this method.`,
                details:   [],
                warnings:  ['This analysis type is not yet supported by the ASIG engine.'],
                citations: [],
                verdict:   'warning',
                apaStatement: `Analysis type "${analysisType}" is not yet supported by the ASIG engine.`,
                recommendations: ['Contact the development team to request support for this analysis type.'],
            };
    }
}


// ─── VIF — MULTICOLLINEARITY DIAGNOSTIC ──────────────────────────────────────

export function interpretVIF(params: {
    vifValues:      number[];
    variableNames?: string[];
    threshold?:     number;
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const { variableNames, threshold = 5 } = params;
    // Ensure every VIF value is a finite number
    const vifValues = (params.vifValues ?? []).map(v => safeNum(v));

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Hair, J. F., Black, W. C., Babin, B. J., & Anderson, R. E. (2010). Multivariate data analysis (7th ed.). Pearson.',
        'O\'Brien, R. M. (2007). A caution regarding rules of thumb for variance inflation factors. Quality & Quantity, 41(5), 673–690.',
    ];

    const hasSevere   = vifValues.some(v => v >= 10);
    const hasModerate = vifValues.some(v => v >= threshold && v < 10);

    let summary = '';
    if (locale === 'vi') {
        if (hasSevere) {
            summary = `Chẩn đoán đa cộng tuyến phát hiện hiện tượng cộng tuyến nghiêm trọng trong mô hình: một hoặc nhiều biến độc lập có VIF ≥ 10, chỉ ra rằng các biến này chia sẻ hơn 90% phương sai với các biến dự báo khác. Các ước lượng hệ số hồi quy rất không ổn định trong điều kiện này (Hair et al., 2010). Khuyến nghị mạnh mẽ việc chỉ định lại mô hình.`;
        } else if (hasModerate) {
            summary = `Chẩn đoán đa cộng tuyến phát hiện cộng tuyến ở mức độ trung bình: một hoặc nhiều biến độc lập có VIF nằm giữa ${threshold} và 10. Mặc dù các ước lượng vẫn có giá trị, sai số chuẩn tăng cao có thể làm giảm ý nghĩa thống kê. Cần theo dõi sự ổn định của các hệ số hồi quy.`;
        } else {
            summary = `Kết quả kiểm tra đa cộng tuyến cho thấy tất cả các biến độc lập đều có VIF < ${threshold}, chứng tỏ không có hiện tượng đa cộng tuyến nghiêm trọng trong mô hình hồi quy. Các ước lượng hệ số ổn định và có thể giải thích được.`;
        }
    } else {
        if (hasSevere) {
            summary = `Multicollinearity diagnostics revealed severe collinearity in the model: one or more predictors have VIF ≥ 10, indicating that these variables share more than 90% of their variance with other predictors. Regression coefficient estimates are highly unstable under these conditions (Hair et al., 2010). Model re-specification is strongly recommended.`;
        } else if (hasModerate) {
            summary = `Multicollinearity diagnostics revealed moderate collinearity: one or more predictors have VIF between ${threshold} and 10. While estimates remain valid, inflated standard errors may reduce statistical power. Researchers should monitor the stability of regression coefficients.`;
        } else {
            summary = `Multicollinearity diagnostics indicate that all predictors have VIF < ${threshold}, suggesting no problematic collinearity in the regression model. Coefficient estimates are stable and interpretable.`;
        }
    }

    vifValues.forEach((v, i) => {
        const name = variableNames?.[i] ?? (locale === 'vi' ? `Biến ${i + 1}` : `Variable ${i + 1}`);
        if (v >= 10) {
            warnings.push(locale === 'vi' 
                ? `"${name}": VIF = ${formatNum(v)} ≥ 10 — đa cộng tuyến nghiêm trọng. Cân nhắc loại bỏ, gộp biến hoặc trực giao hóa biến dự báo này.`
                : `"${name}": VIF = ${formatNum(v)} ≥ 10 — severe multicollinearity. Consider removing, combining, or orthogonalising this predictor.`);
        } else if (v >= threshold) {
            warnings.push(locale === 'vi' 
                ? `"${name}": VIF = ${formatNum(v)} ≥ ${threshold} — đa cộng tuyến trung bình. Theo dõi sự ổn định của hệ số trong các mô hình khác nhau.`
                : `"${name}": VIF = ${formatNum(v)} ≥ ${threshold} — moderate multicollinearity. Monitor coefficient stability across model specifications.`);
        } else {
            details.push(locale === 'vi'
                ? `"${name}": VIF = ${formatNum(v)} ✓ (dưới ngưỡng ${threshold}).`
                : `"${name}": VIF = ${formatNum(v)} ✓ (below threshold of ${threshold}).`);
        }
    });

    return {
        summary, details, warnings, citations,
        verdict: hasSevere ? 'fail' : hasModerate ? 'warning' : 'pass',
        apaStatement: locale === 'vi' 
            ? (hasSevere
                ? `Đa cộng tuyến nghiêm trọng được phát hiện: ${vifValues.filter(v => v >= 10).length} biến dự báo có VIF ≥ 10, cho thấy > 90% phương sai dùng chung.`
                : hasModerate
                    ? `Đa cộng tuyến ở mức độ trung bình: ${vifValues.filter(v => v >= threshold && v < 10).length} biến dự báo có VIF ≥ ${threshold}.`
                    : `Tất cả các biến độc lập có VIF < ${threshold}, chứng tỏ không có đa cộng tuyến nghiêm trọng.`)
            : (hasSevere
                ? `Severe multicollinearity was detected: ${vifValues.filter(v => v >= 10).length} predictor${vifValues.filter(v => v >= 10).length > 1 ? 's' : ''} had VIF ≥ 10, indicating > 90% shared variance with other predictors.`
                : hasModerate
                    ? `Moderate multicollinearity was detected: ${vifValues.filter(v => v >= threshold && v < 10).length} predictor${vifValues.filter(v => v >= threshold && v < 10).length > 1 ? 's had' : ' had'} VIF ≥ ${threshold}.`
                    : `All predictors had VIF < ${threshold}, indicating no problematic multicollinearity.`),
        recommendations: locale === 'vi'
            ? (hasSevere
                ? [
                    'Loại bỏ hoặc kết hợp các biến độc lập có độ cộng tuyến cao (VIF ≥ 10) — các ước lượng hệ số của chúng không đáng tin cậy.',
                    'Cân nhắc hồi quy thành phần chính hoặc hồi quy Ridge để xử lý đa cộng tuyến nghiêm trọng.',
                    'Kiểm tra ma trận tương quan để xác định các biến dự báo nào gần như dư thừa.',
                  ]
                : hasModerate
                    ? [
                        `Theo dõi sự ổn định của hệ số hồi quy qua các cấu hình mô hình cho các biến dự báo có VIF ≥ ${threshold}.`,
                        'Mean-centering (tập trung trung bình) các biến độc lập có thể giúp giảm đa cộng tuyến.',
                        'Báo cáo dung sai (Tolerance = 1/VIF) cùng với giá trị VIF để chẩn đoán toàn diện hơn.',
                      ]
                    : [
                        'Không cần hành động — đa cộng tuyến nằm trong giới hạn cho phép.',
                        'Tiến hành phân tích hồi quy; các ước lượng hệ số ổn định.',
                      ])
            : (hasSevere
                ? [
                    'Remove or combine the severely collinear predictors (VIF ≥ 10) — their coefficient estimates are unreliable.',
                    'Consider principal component regression or ridge regression to handle severe multicollinearity.',
                    'Check the correlation matrix to identify which predictors are near-redundant.',
                  ]
                : hasModerate
                    ? [
                        `Monitor the stability of regression coefficients across model specifications for predictors with VIF ≥ ${threshold}.`,
                        'Mean-centering predictors or using orthogonal coding can help reduce non-essential multicollinearity.',
                        'Report tolerance (1/VIF) alongside VIF values for comprehensive collinearity diagnostics.',
                      ]
                    : [
                        'No action required — multicollinearity is within acceptable bounds.',
                        'Proceed with regression analysis; coefficient estimates are stable.',
                      ]),
    };
}


// ─── MULTIVARIATE OUTLIER DETECTION ──────────────────────────────────────────

export function interpretOutlier(params: {
    nOutliers:   number;
    totalN:      number;
    cutoffValue: number;
    method?:     string;
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const { method = 'Mahalanobis Distance' } = params;
    const nOutliers   = safeNum(params.nOutliers, 0);
    const totalN      = safeNum(params.totalN, 1);
    const cutoffValue = safeNum(params.cutoffValue);

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Tabachnick, B. G., & Fidell, L. S. (2013). Using multivariate statistics (6th ed.). Pearson.',
        'Mahalanobis, P. C. (1936). On the generalised distance in statistics. Proceedings of the National Institute of Sciences of India, 2(1), 49–55.',
    ];

    const pct = (nOutliers / totalN) * 100;

    let summary = '';
    if (nOutliers === 0) {
        summary = locale === 'vi' 
            ? `Phát hiện ngoại lai đa biến sử dụng phương pháp ${method} (giá trị tới hạn χ² = ${formatNum(cutoffValue)}) không phát hiện trường hợp ngoại lai có ảnh hưởng nào trong số ${totalN} quan sát. Dữ liệu không có điểm bất thường đa biến làm biến dạng các ước lượng hồi quy hoặc SEM.`
            : `Multivariate outlier detection using ${method} (critical χ² cutoff = ${formatNum(cutoffValue)}) identified no influential outliers across the ${totalN} observations. The dataset is free of multivariate anomalies that could distort regression or SEM estimates.`;
        details.push(locale === 'vi'
            ? `Tất cả ${totalN} quan sát đều nằm trong phạm vi khoảng cách Mahalanobis chấp nhận được.`
            : `All ${totalN} observations fall within the acceptable Mahalanobis distance range.`);
    } else {
        summary = locale === 'vi'
            ? `Phát hiện ngoại lai đa biến sử dụng phương pháp ${method} đã chỉ ra ${nOutliers} trường hợp (${formatNum(pct, 1)}% của N = ${totalN}) có khoảng cách Mahalanobis vượt quá ngưỡng χ² tới hạn (D² > ${formatNum(cutoffValue)}). Những quan sát này có thể ảnh hưởng bất cân xứng đến các ước lượng tham số.`
            : `Multivariate outlier detection using ${method} identified ${nOutliers} observation${nOutliers > 1 ? 's' : ''} (${formatNum(pct, 1)}% of N = ${totalN}) with Mahalanobis distances exceeding the critical χ² threshold (D² > ${formatNum(cutoffValue)}). These observations may disproportionately influence parameter estimates.`;
        warnings.push(locale === 'vi'
            ? `Phát hiện ${nOutliers} ngoại lai đa biến. Cần xem xét từng trường hợp: nếu là lỗi nhập liệu thì cần sửa lại; nếu là các quan sát cực đoan hợp lệ, nên chạy phân tích độ nhạy (sensitivity analyses) có và không có các ngoại lai này trước khi báo cáo kết quả chính thức (Tabachnick & Fidell, 2013).`
            : `${nOutliers} multivariate outlier${nOutliers > 1 ? 's' : ''} detected. Researchers should examine these cases individually: if they represent data entry errors, they should be corrected; if they are genuine but extreme observations, sensitivity analyses with and without outliers are recommended before final reporting (Tabachnick & Fidell, 2013).`);
    }

    details.push(locale === 'vi' 
        ? `Phương pháp phát hiện: ${method}, tiêu chí p < .001 (ngưỡng χ² = ${formatNum(cutoffValue)}).`
        : `Detection method: ${method}, p < .001 criterion (χ² cutoff = ${formatNum(cutoffValue)}).`);

    return {
        summary, details, warnings, citations,
        verdict: nOutliers === 0 ? 'pass' : nOutliers / totalN < 0.05 ? 'warning' : 'fail',
        apaStatement: locale === 'vi'
            ? (nOutliers === 0
                ? `Không có ngoại lai đa biến nào được phát hiện bằng phương pháp ${method} (N = ${totalN}, ngưỡng χ² = ${formatNum(cutoffValue)}).`
                : `${nOutliers} ngoại lai đa biến (${((nOutliers / totalN) * 100).toFixed(1)}% của N = ${totalN}) đã được xác định qua ${method} (D² > ${formatNum(cutoffValue)}).`)
            : (nOutliers === 0
                ? `No multivariate outliers were detected using ${method} (N = ${totalN}, χ² cutoff = ${formatNum(cutoffValue)}).`
                : `${nOutliers} multivariate outlier${nOutliers > 1 ? 's' : ''} (${((nOutliers / totalN) * 100).toFixed(1)}% of N = ${totalN}) were identified via ${method} (D² > ${formatNum(cutoffValue)}).`),
        recommendations: locale === 'vi'
            ? (nOutliers === 0
                ? ['Tiếp tục với các phân tích dự kiến — không có ngoại lai bất thường.', 'Kiểm tra độ chính xác của việc nhập dữ liệu như một bước kiểm soát chất lượng thường quy.']
                : [
                    'Kiểm tra riêng lẻ từng quan sát bị đánh dấu — xác định xem đó là lỗi nhập liệu hay là trường hợp cực đoan thực sự.',
                    'Chạy phân tích trong cả hai trường hợp có và không có các ngoại lai, sau đó báo cáo xem kết luận có thay đổi hay không (phân tích độ nhạy).',
                    `${nOutliers / totalN > 0.05 ? 'Tỷ lệ ngoại lai cao (> 5%) có thể chỉ ra vấn đề về chất lượng dữ liệu — xem xét lại quy trình thu thập dữ liệu.' : 'Tỷ lệ ngoại lai dưới 5% — phân tích độ nhạy là đủ trước khi quyết định loại bỏ.'}`,
                  ])
            : (nOutliers === 0
                ? ['Proceed with planned analyses — no influential outliers detected.', 'Verify data entry accuracy as a routine quality check before finalising the dataset.']
                : [
                    'Examine each flagged observation individually — determine whether it represents a data entry error or a genuine extreme case.',
                    'Run analyses both with and without outliers and report whether conclusions differ (sensitivity analysis).',
                    `${nOutliers / totalN > 0.05 ? 'High outlier rate (> 5%) may indicate data quality issues — review data collection procedures.' : 'Outlier rate is below 5% — sensitivity analysis is sufficient before deciding on exclusions.'}`,
                  ]),
    };
}


// ─── HTMT — STANDALONE DISCRIMINANT VALIDITY ─────────────────────────────────

export function interpretHTMT(params: {
    htmtMatrix:   any; // Might be 1D or 2D array due to WebR serialization
    factorNames:  string[];
    threshold?:   number;
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const { htmtMatrix, factorNames, threshold = 0.85 } = params;
    const n = factorNames.length;
    
    let normalizedMatrix: number[][] = [];
    if (Array.isArray(htmtMatrix)) {
        if (n > 0 && htmtMatrix.length > 0 && !Array.isArray(htmtMatrix[0])) {
            // It's a 1D array, chunk it into 2D (row-major fallback)
            for (let i = 0; i < n; i++) {
                const row = [];
                for (let j = 0; j < n; j++) {
                    // Usually WebR matrix serialization is column-major if as.vector, but let's just chunk it
                    // Actually, if we don't know, we just take elements linearly.
                    row.push(htmtMatrix[i * n + j]);
                }
                normalizedMatrix.push(row);
            }
        } else {
            normalizedMatrix = htmtMatrix as number[][];
        }
    }

    const safeMatrix = normalizedMatrix.map(row => (Array.isArray(row) ? row : []).map(v => safeNum(v)));

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Henseler, J., Ringle, C. M., & Sarstedt, M. (2015). A new criterion for assessing discriminant validity in variance-based structural equation modeling. Journal of the Academy of Marketing Science, 43(1), 115–135.',
    ];

    const violations: string[] = [];

    for (let i = 0; i < safeMatrix.length; i++) {
        for (let j = i + 1; j < safeMatrix[i].length; j++) {
            const val = safeMatrix[i][j];
            const f1  = factorNames[i] ?? (locale === 'vi' ? `Nhân tố ${i + 1}` : `Factor ${i + 1}`);
            const f2  = factorNames[j] ?? (locale === 'vi' ? `Nhân tố ${j + 1}` : `Factor ${j + 1}`);

            if (val >= threshold) {
                violations.push(`${f1} & ${f2} (HTMT = ${formatCoef(val)})`);
            } else {
                details.push(`${f1} & ${f2}: HTMT = ${formatCoef(val)} < ${formatCoef(threshold)} ✓`);
            }
        }
    }

    let summary = '';
    if (violations.length === 0) {
        summary = locale === 'vi'
            ? `Đánh giá độ giá trị phân biệt bằng tỷ lệ Heterotrait-Monotrait (HTMT) cho thấy tất cả các cặp cấu trúc tiềm ẩn đều có giá trị HTMT dưới ngưỡng ${formatCoef(threshold)} (Henseler et al., 2015), khẳng định rằng tất cả các khái niệm đều khác biệt về mặt khái niệm và thống kê.`
            : `Discriminant validity assessment using the Heterotrait-Monotrait (HTMT) ratio indicated that all construct pairs have HTMT values below the threshold of ${formatCoef(threshold)} (Henseler et al., 2015), confirming that all constructs are conceptually and statistically distinct.`;
    } else {
        summary = locale === 'vi'
            ? `Đánh giá độ giá trị phân biệt bằng HTMT phát hiện ${violations.length} cặp cấu trúc tiềm ẩn có giá trị HTMT lớn hơn hoặc bằng ngưỡng ${formatCoef(threshold)} (Henseler et al., 2015), cho thấy sự khác biệt khái niệm không đủ giữa các cấu trúc tiềm ẩn này.`
            : `HTMT-based discriminant validity assessment identified ${violations.length} construct pair${violations.length > 1 ? 's' : ''} with HTMT values at or above the threshold of ${formatCoef(threshold)} (Henseler et al., 2015), indicating insufficient conceptual distinctiveness between these constructs.`;
        warnings.push(locale === 'vi'
            ? `Cảnh báo độ giá trị phân biệt: ${violations.join('; ')}. Hãy kiểm tra các hệ số tải chéo (cross-loadings), xem xét gán lại các biến quan sát hoặc gộp các cấu trúc tiềm ẩn nếu có sự chồng chéo lớn.`
            : `Discriminant validity concern(s): ${violations.join('; ')}. Inspect cross-loadings, consider item reassignment, or merge constructs if conceptual overlap is substantive.`);
    }

    details.push(locale === 'vi'
        ? `Ngưỡng áp dụng: HTMT < ${formatCoef(threshold)} (nghiêm ngặt) hoặc < .90 (nới lỏng; Henseler et al., 2015).`
        : `Applied threshold: HTMT < ${formatCoef(threshold)} (strict) or < .90 (liberal; Henseler et al., 2015).`);

    return {
        summary, details, warnings, citations,
        verdict: violations.length === 0 ? 'pass' : 'fail',
        apaStatement: locale === 'vi'
            ? (violations.length === 0
                ? `Độ độ giá trị phân biệt HTMT đã được khẳng định: tất cả các cặp cấu trúc tiềm ẩn có HTMT < ${formatCoef(threshold)} (Henseler et al., 2015).`
                : `Độ độ giá trị phân biệt HTMT bị vi phạm cho ${violations.length} cặp: ${violations.join('; ')}.`)
            : (violations.length === 0
                ? `HTMT-based discriminant validity was confirmed: all construct pairs had HTMT < ${formatCoef(threshold)} (Henseler et al., 2015).`
                : `HTMT discriminant validity was violated for ${violations.length} pair${violations.length > 1 ? 's' : ''}: ${violations.join('; ')}.`),
        recommendations: locale === 'vi'
            ? (violations.length === 0
                ? [
                    'Độ độ giá trị phân biệt được xác nhận — tiếp tục phân tích mô hình cấu trúc tiềm ẩn.',
                    'Báo cáo các giá trị HTMT trong ma trận tương quan để đảm bảo tính minh bạch.',
                  ]
                : [
                    'Kiểm tra các hệ số tải chéo cho các cặp vi phạm để xác định biến quan sát có tính phân biệt kém.',
                    'Cân nhắc gộp các cấu trúc tiềm ẩn tương đồng về lý thuyết và thực nghiệm (HTMT ≥ .90).',
                    'Chạy Bootstrap để lấy khoảng tin cậy của HTMT — nếu cận trên vượt quá .90, vi phạm này có ý nghĩa thống kê.',
                  ])
            : (violations.length === 0
                ? [
                    'Discriminant validity is confirmed — proceed with structural model interpretation.',
                    'Report HTMT values in a correlation matrix table for transparency.',
                  ]
                : [
                    'Examine cross-loadings for the violating construct pairs to identify poorly discriminating items.',
                    'Consider merging constructs that are conceptually and empirically similar (HTMT ≥ .90).',
                    'Obtain bootstrap CIs for HTMT values — if the upper bound exceeds .90, the violation is statistically significant.',
                  ]),
    };
}
