/**
 * ASIG — regression.ts
 * Interpreters: Linear Regression, Logistic Regression, Mediation,
 *               Moderation, Cluster Analysis
 *
 * All prose conforms to APA 7th Edition reporting standards.
 */

import { formatPValue, formatCoef, formatNum, formatPct, safeNum, InterpretationResult } from './shared';


// ─── LINEAR REGRESSION ───────────────────────────────────────────────────────

export function interpretLinearRegression(params: {
    dependentVar:  string;
    rSquared:      number;
    adjRSquared:   number;
    fStatistic:    number;
    fPValue:       number;
    dfResidual?:   number;
    coefficients:  {
        term:     string;
        estimate: number;
        stdBeta:  number;
        pValue:   number;
        vif?:     number;
    }[];
    normalityP?:   number;
    durbinWatson?: number;
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const { dependentVar, dfResidual, coefficients, normalityP, durbinWatson } = params;
    const rSquared    = safeNum(params.rSquared);
    const adjRSquared = safeNum(params.adjRSquared);
    const fStatistic  = safeNum(params.fStatistic);
    const fPValue     = safeNum(params.fPValue, 1);

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Cohen, J., Cohen, P., West, S. G., & Aiken, L. S. (2003). Applied multiple regression/correlation analysis for the behavioral sciences (3rd ed.). Lawrence Erlbaum Associates.',
        'Hair, J. F., Black, W. C., Babin, B. J., & Anderson, R. E. (2019). Multivariate data analysis (8th ed.). Cengage Learning.',
        'O\'Brien, R. M. (2007). A caution regarding rules of thumb for variance inflation factors. Quality & Quantity, 41(5), 673–690.',
        'Field, A. (2018). Discovering statistics using IBM SPSS Statistics (5th ed.). SAGE Publications.',
    ];

    const modelSig = fPValue < 0.05;
    const r2Label  = locale === 'vi'
        ? (adjRSquared < 0.02 ? 'không đáng kể' : adjRSquared < 0.13 ? 'yếu' : adjRSquared < 0.26 ? 'vừa' : 'đáng kể')
        : (adjRSquared < 0.02 ? 'negligible' : adjRSquared < 0.13 ? 'weak' : adjRSquared < 0.26 ? 'moderate' : 'substantial');
    const nPred    = coefficients.filter(c => c.term !== '(Intercept)').length;
    const dfDenom  = dfResidual != null ? `${dfResidual}` : `N−${nPred + 1}`;

    let summary = '';
    if (modelSig) {
        summary = locale === 'vi'
            ? `Phân tích hồi quy tuyến tính bội được thực hiện để dự báo "${dependentVar}" dựa trên ${nPred} biến độc lập (α = .05). Mô hình tổng thể mang ý nghĩa thống kê: F(${formatNum(nPred, 0)}, ${dfDenom}) = ${formatNum(fStatistic)}, ${formatPValue(fPValue)}, R² = ${formatCoef(rSquared)}, R² hiệu chỉnh = ${formatCoef(adjRSquared)}. Mô hình này giải thích được khoảng ${formatPct(adjRSquared)} sự biến thiên của "${dependentVar}" (sức mạnh dự báo ở mức ${r2Label}; thang đo f² của Cohen (1988): yếu ≈ .02, vừa ≈ .15, mạnh ≈ .35).`
            : `Multiple linear regression was conducted to predict "${dependentVar}" from ${nPred} predictor${nPred > 1 ? 's' : ''} (α = .05). The overall model was statistically significant: F(${formatNum(nPred, 0)}, ${dfDenom}) = ${formatNum(fStatistic)}, ${formatPValue(fPValue)}, R² = ${formatCoef(rSquared)}, adjusted R² = ${formatCoef(adjRSquared)}. The model explained approximately ${formatPct(adjRSquared)} of the variance in "${dependentVar}" (${r2Label} explanatory power; Cohen, 1988 f² benchmarks: weak ≈ .02, moderate ≈ .15, large ≈ .35).`;
    } else {
        summary = locale === 'vi'
            ? `Phân tích hồi quy tuyến tính bội được thực hiện để dự báo "${dependentVar}" từ ${nPred} biến độc lập (α = .05). Mô hình tổng thể không đạt ý nghĩa thống kê: F(${formatNum(nPred, 0)}, ${dfDenom}) = ${formatNum(fStatistic)}, ${formatPValue(fPValue)}, R² hiệu chỉnh = ${formatCoef(adjRSquared)}. Các biến độc lập không giải thích được phần phương sai đáng kể nào của "${dependentVar}".`
            : `Multiple linear regression was conducted to predict "${dependentVar}" from ${nPred} predictor${nPred > 1 ? 's' : ''} (α = .05). The overall model was not statistically significant: F(${formatNum(nPred, 0)}, ${dfDenom}) = ${formatNum(fStatistic)}, ${formatPValue(fPValue)}, adjusted R² = ${formatCoef(adjRSquared)}. The predictors did not explain a significant proportion of variance in "${dependentVar}."`;
    }

    // Predictors
    const predictors = coefficients.filter(c => c.term !== '(Intercept)');
    for (const coef of predictors) {
        const directionEn = coef.estimate > 0 ? 'positively' : 'negatively';
        const directionVi = coef.estimate > 0 ? 'thuận' : 'nghịch';
        const incDecEn = coef.estimate > 0 ? 'increase' : 'decrease';
        const incDecVi = coef.estimate > 0 ? 'tăng' : 'giảm';

        if (coef.pValue < 0.05) {
            details.push(locale === 'vi'
                ? `"${coef.term}": β = ${formatCoef(coef.stdBeta)}, B = ${formatNum(coef.estimate)}, ${formatPValue(coef.pValue)} — có ý nghĩa thống kê, tác động chiều ${directionVi} đến "${dependentVar}". Khi "${coef.term}" tăng 1 đơn vị thì "${dependentVar}" sẽ ${incDecVi} ${formatNum(Math.abs(coef.estimate))} đơn vị, trong điều kiện các biến khác không đổi.`
                : `"${coef.term}": β = ${formatCoef(coef.stdBeta)}, B = ${formatNum(coef.estimate)}, ${formatPValue(coef.pValue)} — statistically significant, ${directionEn} associated with "${dependentVar}." A one-unit increase in "${coef.term}" is associated with a ${formatNum(Math.abs(coef.estimate))}-unit ${incDecEn} in "${dependentVar}" holding all other predictors constant.`
            );
        } else {
            details.push(locale === 'vi'
                ? `"${coef.term}": β = ${formatCoef(coef.stdBeta)}, B = ${formatNum(coef.estimate)}, ${formatPValue(coef.pValue)} — không có ý nghĩa thống kê. Biến này không có đóng góp riêng biệt nào cho "${dependentVar}" ngoài các biến khác trong mô hình.`
                : `"${coef.term}": β = ${formatCoef(coef.stdBeta)}, B = ${formatNum(coef.estimate)}, ${formatPValue(coef.pValue)} — not statistically significant. This predictor did not contribute uniquely to "${dependentVar}" beyond the other predictors in the model.`
            );
        }

        if (coef.vif != null) {
            if (coef.vif >= 10) {
                warnings.push(locale === 'vi'
                    ? `"${coef.term}": VIF = ${formatNum(coef.vif)} ≥ 10 — đa cộng tuyến nghiêm trọng. Biến này chia sẻ >90% phương sai với các biến khác; các ước lượng hệ số rất không ổn định. Hãy cân nhắc loại bỏ hoặc gộp các biến độc lập.`
                    : `"${coef.term}": VIF = ${formatNum(coef.vif)} ≥ 10 — severe multicollinearity. This predictor shares > 90% variance with other predictors; coefficient estimates are highly unstable. Consider removing or combining predictors.`
                );
            } else if (coef.vif >= 5) {
                warnings.push(locale === 'vi'
                    ? `"${coef.term}": VIF = ${formatNum(coef.vif)} ≥ 5 — đa cộng tuyến trung bình. Sai số chuẩn (SE) có thể bị phóng đại; cần theo dõi tính ổn định của hệ số (O'Brien, 2007).`
                    : `"${coef.term}": VIF = ${formatNum(coef.vif)} ≥ 5 — moderate multicollinearity. Standard errors may be inflated; monitor coefficient stability (O'Brien, 2007).`
                );
            } else {
                details.push(locale === 'vi'
                    ? `"${coef.term}": VIF = ${formatNum(coef.vif)} ✓ (< 5; không có dấu hiệu đa cộng tuyến).`
                    : `"${coef.term}": VIF = ${formatNum(coef.vif)} ✓ (< 5; no problematic multicollinearity).`
                );
            }
        }
    }

    // Assumption diagnostics
    if (normalityP != null) {
        if (normalityP < 0.05) {
            warnings.push(locale === 'vi'
                ? `Kiểm định Shapiro-Wilk cho thấy phần dư vi phạm giả định phân phối chuẩn (${formatPValue(normalityP)}). Nên sử dụng khoảng tin cậy Bootstrap hoặc Sai số chuẩn kháng Heteroscedasticity (HC SE) để suy luận vững chắc hơn (Field, 2018). Dù vậy, hồi quy thường kháng lại vi phạm này nếu N ≥ 30.`
                : `Shapiro-Wilk test indicated that residuals violated the normality assumption (${formatPValue(normalityP)}). Bootstrap confidence intervals or heteroscedasticity-robust (HC) standard errors are recommended for robust inference (Field, 2018). Regression is generally robust to non-normality for N ≥ 30.`
            );
        } else {
            details.push(locale === 'vi'
                ? `Phân phối chuẩn của phần dư: Shapiro-Wilk ${formatPValue(normalityP)} ✓ — giả định được thỏa mãn.`
                : `Residual normality: Shapiro-Wilk ${formatPValue(normalityP)} ✓ — assumption satisfied.`
            );
        }
    }
    if (durbinWatson != null) {
        const dwOk = durbinWatson >= 1.5 && durbinWatson <= 2.5;
        if (!dwOk) {
            warnings.push(locale === 'vi'
                ? `Durbin-Watson = ${formatNum(durbinWatson)} (ngưỡng an toàn: 1.5–2.5) cho thấy hiện tượng tự tương quan ${durbinWatson < 1.5 ? 'dương' : 'âm'} trong phần dư. Điều này vi phạm giả định tính độc lập; nên dùng Generalized Least Squares (GLS) hoặc Robust SE nếu dữ liệu có tính chuỗi thời gian hoặc phân cụm.`
                : `Durbin-Watson = ${formatNum(durbinWatson)} (acceptable range: 1.5–2.5) suggests ${durbinWatson < 1.5 ? 'positive' : 'negative'} autocorrelation in residuals. This violates the independence assumption; Generalised Least Squares or robust SEs should be used if the data have a time-ordered or clustered structure.`
            );
        } else {
            details.push(locale === 'vi'
                ? `Tính độc lập phần dư: Durbin-Watson = ${formatNum(durbinWatson)} ✓ (nằm trong ngưỡng 1.5–2.5).`
                : `Independence of residuals: Durbin-Watson = ${formatNum(durbinWatson)} ✓ (1.5–2.5 range satisfied).`
            );
        }
    }

    details.push(
        `APA 7 reporting: F(${formatNum(nPred, 0)}, ${dfDenom}) = ${formatNum(fStatistic)}, ` +
        `${formatPValue(fPValue)}, R² = ${formatCoef(rSquared)}, adjusted R² = ${formatCoef(adjRSquared)}.`
    );
    details.push(locale === 'vi'
        ? 'Báo cáo B (chưa chuẩn hoá, kèm SE và 95% CI) cho mục đích tái lập mô hình, và báo cáo β (chuẩn hoá) để so sánh tầm quan trọng tương đối của các biến.'
        : `Report B (unstandardized, with SE and 95% CI) for replication, and β (standardized) for comparing relative predictor importance within the model.`
    );

    const sigPredictors = coefficients.filter(c => c.term !== '(Intercept)' && c.pValue < 0.05);

    return {
        summary, details, warnings, citations,
        verdict: modelSig ? 'pass' : 'warning',
        apaStatement: modelSig
            ? (locale === 'vi'
                ? `Hồi quy tuyến tính bội dự đoán thành công "${dependentVar}", F(${formatNum(nPred, 0)}, ${dfDenom}) = ${formatNum(fStatistic)}, ${formatPValue(fPValue)}, R² = ${formatCoef(rSquared)}, R² hiệu chỉnh = ${formatCoef(adjRSquared)}. ${sigPredictors.length > 0 ? `Các biến dự báo có ý nghĩa: ${sigPredictors.map(c => `${c.term} (β = ${formatCoef(c.stdBeta)}, ${formatPValue(c.pValue)})`).join(', ')}.` : ''}`
                : `Multiple linear regression significantly predicted "${dependentVar}", F(${formatNum(nPred, 0)}, ${dfDenom}) = ${formatNum(fStatistic)}, ${formatPValue(fPValue)}, R² = ${formatCoef(rSquared)}, adjusted R² = ${formatCoef(adjRSquared)}. ${sigPredictors.length > 0 ? `Significant predictors: ${sigPredictors.map(c => `${c.term} (β = ${formatCoef(c.stdBeta)}, ${formatPValue(c.pValue)})`).join(', ')}.` : ''}`)
            : (locale === 'vi'
                ? `Mô hình hồi quy không dự báo có ý nghĩa cho "${dependentVar}", F(${formatNum(nPred, 0)}, ${dfDenom}) = ${formatNum(fStatistic)}, ${formatPValue(fPValue)}, R² hiệu chỉnh = ${formatCoef(adjRSquared)}.`
                : `The regression model did not significantly predict "${dependentVar}", F(${formatNum(nPred, 0)}, ${dfDenom}) = ${formatNum(fStatistic)}, ${formatPValue(fPValue)}, adjusted R² = ${formatCoef(adjRSquared)}.`),
        recommendations: modelSig
            ? (locale === 'vi' ? [
                sigPredictors.length > 0 ? `Tập trung biện luận vào các biến có ý nghĩa (${sigPredictors.map(c => c.term).join(', ')}); báo cáo β chuẩn hóa để so sánh tầm quan trọng tương đối.` : 'Báo cáo R² hiệu chỉnh (Adjusted R²) thay vì R² để tính đến độ phức tạp của mô hình.',
                'Báo cáo thêm khoảng tin cậy 95% CI cho toàn bộ hệ số B để các nghiên cứu sau có thể kiểm định lại.',
                coefficients.some(c => c.vif != null && c.vif >= 5) ? 'Phát hiện đa cộng tuyến — thử dùng hồi quy Ridge hoặc loại bỏ biến thừa.' : 'Kiểm tra các biểu đồ phần dư (fitted vs. residuals, Q-Q plot) để xác minh các giả định tính tuyến tính và phương sai đồng nhất.'
            ] : [
                sigPredictors.length > 0
                    ? `Focus interpretation on significant predictors (${sigPredictors.map(c => c.term).join(', ')}); report standardised β for relative importance comparison.`
                    : 'Report adjusted R² rather than R² to account for model complexity.',
                'Report 95% CIs for all unstandardised B coefficients for replication purposes.',
                coefficients.some(c => c.vif != null && c.vif >= 5)
                    ? 'Multicollinearity detected — consider ridge regression or removing redundant predictors.'
                    : 'Check residual plots (fitted vs. residuals, Q-Q plot) to verify linearity and homoscedasticity assumptions.',
            ])
            : (locale === 'vi' ? [
                'Mô hình không có ý nghĩa thống kê — hãy đánh giá xem các biến độc lập có thực sự phù hợp với outcome về mặt lý thuyết hay không.',
                'Tăng cỡ mẫu hoặc cân nhắc lại bộ biến dự báo dựa trên các tài liệu đã có.',
                'Cân nhắc tiếp cận hồi quy phân cấp (hierarchical regression) để xem xét việc thêm/bớt biến có cải thiện mô hình hay không.'
            ] : [
                'The model is non-significant — evaluate whether the predictors are theoretically appropriate for this outcome.',
                'Increase sample size or reconsider the predictor set based on prior literature.',
                'Consider a hierarchical regression approach to assess whether adding predictors improves model fit.',
            ]),
    };
}


// ─── LOGISTIC REGRESSION ─────────────────────────────────────────────────────

export function interpretLogisticRegression(params: {
    dependentVar:  string;
    pseudoR2:      number;
    accuracy:      number;
    auc?:          number;
    coefficients:  {
        term:       string;
        estimate:   number;
        oddsRatio:  number;
        ciLower?:   number;
        ciUpper?:   number;
        pValue:     number;
    }[];
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const { dependentVar, auc, coefficients } = params;
    const pseudoR2 = safeNum(params.pseudoR2);
    const accuracy = safeNum(params.accuracy);

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Hosmer, D. W., Lemeshow, S., & Sturdivant, R. X. (2013). Applied logistic regression (3rd ed.). Wiley. https://doi.org/10.1002/9781118548387',
        'McFadden, D. (1979). Quantitative methods for analyzing travel behaviour of individuals. In D. Hensher & P. Stopher (Eds.), Behavioural travel modelling (pp. 279–318). Croom Helm.',
        'Harrell, F. E. (2015). Regression modeling strategies (2nd ed.). Springer.',
        'Field, A. (2018). Discovering statistics using IBM SPSS Statistics (5th ed.). SAGE Publications.',
    ];

    const r2Label = locale === 'vi'
        ? (pseudoR2 < 0.10 ? 'yếu' : pseudoR2 < 0.20 ? 'vừa phải' : pseudoR2 < 0.40 ? 'tốt' : 'rất mạnh')
        : (pseudoR2 < 0.10 ? 'weak' : pseudoR2 < 0.20 ? 'moderate' : pseudoR2 < 0.40 ? 'good' : 'strong');

    let summary = locale === 'vi'
        ? `Hồi quy logistic nhị phân được áp dụng để dự báo xác suất của "${dependentVar}". Mô hình có năng lực giải thích ở mức ${r2Label}: Pseudo-R² McFadden = ${formatCoef(pseudoR2)} (${r2Label}; McFadden, 1979), với độ chính xác phân loại tổng thể là ${formatPct(accuracy)}. `
        : `Binary logistic regression was conducted to predict the probability of "${dependentVar}." The model demonstrated ${r2Label} explanatory power: McFadden's pseudo-R² = ${formatCoef(pseudoR2)} (${r2Label}; McFadden, 1979), with an overall classification accuracy of ${formatPct(accuracy)}. `;

    if (auc != null) {
        const aucLabel = locale === 'vi'
            ? (auc < 0.60 ? 'kém' : auc < 0.70 ? 'yếu' : auc < 0.80 ? 'chấp nhận được' : auc < 0.90 ? 'xuất sắc' : 'vượt trội')
            : (auc < 0.60 ? 'poor' : auc < 0.70 ? 'weak' : auc < 0.80 ? 'acceptable' : auc < 0.90 ? 'excellent' : 'outstanding');
        summary += locale === 'vi'
            ? `Diện tích dưới đường cong ROC (AUC = ${formatCoef(auc)}) cho thấy khả năng phân loại ${aucLabel} (Hosmer et al., 2013).`
            : `The area under the ROC curve (AUC = ${formatCoef(auc)}) indicated ${aucLabel} discriminative ability (Hosmer et al., 2013).`;
        details.push(locale === 'vi'
            ? `AUC = ${formatCoef(auc)} (Thang đo Hosmer et al. 2013: < .70 yếu, .70–.79 chấp nhận được, .80–.89 xuất sắc, ≥ .90 vượt trội).`
            : `AUC = ${formatCoef(auc)} (Hosmer et al., 2013 benchmarks: < .70 weak, .70–.79 acceptable, .80–.89 excellent, ≥ .90 outstanding).`
        );
    }

    const predictors = coefficients.filter(c => c.term !== '(Intercept)');
    for (const coef of predictors) {
        const or    = coef.oddsRatio;
        const ciStr = (coef.ciLower != null && coef.ciUpper != null)
            ? `, 95% CI [${formatNum(coef.ciLower)}, ${formatNum(coef.ciUpper)}]`
            : '';
        const pct   = or > 1 ? formatPct(or - 1) : formatPct(1 - or);

        if (coef.pValue < 0.05) {
            details.push(locale === 'vi'
                ? `"${coef.term}": OR = ${formatNum(or)}${ciStr}, ${formatPValue(coef.pValue)} — có ý nghĩa thống kê (α = .05). Mỗi đơn vị tăng thêm của "${coef.term}" đi kèm với xác suất (odds) của "${dependentVar}" ${or > 1 ? 'tăng' : 'giảm'} ${pct}.${ciStr === '' ? ' (Cần báo cáo thêm 95% CI cho bài báo khoa học).' : ''}`
                : `"${coef.term}": OR = ${formatNum(or)}${ciStr}, ${formatPValue(coef.pValue)} — statistically significant (α = .05). Each one-unit increase in "${coef.term}" is associated with a ${pct} ${or > 1 ? 'increase' : 'decrease'} in the odds of "${dependentVar}."${ciStr === '' ? ' Report 95% CI for the OR in publications.' : ''}`
            );
        } else {
            details.push(locale === 'vi'
                ? `"${coef.term}": OR = ${formatNum(or)}${ciStr}, ${formatPValue(coef.pValue)} — không đạt ý nghĩa thống kê (α = .05). Biến dự báo này không có đóng góp gì đáng kể vào mô hình.`
                : `"${coef.term}": OR = ${formatNum(or)}${ciStr}, ${formatPValue(coef.pValue)} — not statistically significant (α = .05). This predictor did not contribute significantly to the model.`
            );
        }
    }

    warnings.push(locale === 'vi'
        ? 'Hãy báo cáo tỉ số chênh (OR - Odds Ratio) kèm khoảng tin cậy 95% cho mọi biến độc lập — tỷ số Odds thiếu khoảng tin cậy sẽ không cung cấp đủ thông tin và có thể bị diễn giải sai.'
        : 'Report OR with 95% CI for each predictor — odds ratios without CIs are uninformative. A wide CI indicates high uncertainty even if OR is nominally large.'
    );
    warnings.push(locale === 'vi'
        ? 'Không nên coi Pseudo-R² McFadden giống hoàn toàn với R² OLS. Giá trị .10–.20 trong logistic thường tương đương với R² khoảng .30–.50 trong hồi quy tuyến tính (McFadden, 1979).'
        : 'McFadden\'s pseudo-R² should not be interpreted as equivalent to OLS R²: values of .10–.20 in logistic regression indicate models comparable to R² ≈ .30–.50 in OLS (McFadden, 1979).'
    );
    warnings.push(locale === 'vi'
        ? 'Độ chính xác phân loại (accuracy) dễ gây lầm tưởng khi cỡ mẫu hai nhóm của biến phụ thuộc bị chênh lệch lớn (imbalanced). Hãy cân nhắc báo cáo độ nhạy (sensitivity), độ đặc hiệu (specificity) và test Hosmer-Lemeshow để nhìn toàn diện mô hình.'
        : 'Classification accuracy is a misleading metric when the outcome is imbalanced. Report sensitivity, specificity, positive predictive value, and the Hosmer-Lemeshow test for a complete model evaluation.'
    );

    details.push(locale === 'vi'
        ? `Độ khít mô hình (Model fit): McFadden R² = ${formatCoef(pseudoR2)}, accuracy = ${formatPct(accuracy)}${auc != null ? `, AUC = ${formatCoef(auc)}` : ''}.`
        : `Model fit: McFadden R² = ${formatCoef(pseudoR2)}, accuracy = ${formatPct(accuracy)}${auc != null ? `, AUC = ${formatCoef(auc)}` : ''}.`
    );

    const logisticVerdict = pseudoR2 >= 0.10 && accuracy >= 0.70 ? 'pass' : pseudoR2 >= 0.05 ? 'warning' : 'fail';
    const sigLogPreds = coefficients.filter(c => c.term !== '(Intercept)' && c.pValue < 0.05);

    return {
        summary, details, warnings, citations,
        verdict: logisticVerdict,
        apaStatement: locale === 'vi'
            ? `Mô hình hồi quy logistic nhị phân dự báo "${dependentVar}" đem lại McFadden pseudo-R² = ${formatCoef(pseudoR2)}, tỷ lệ phân loại đúng = ${formatPct(accuracy)}${auc != null ? `, AUC = ${formatCoef(auc)}` : ''}. ${sigLogPreds.length > 0 ? `Các biến dự báo ý nghĩa: ${sigLogPreds.map(c => `${c.term} (OR = ${formatNum(c.oddsRatio)}, ${formatPValue(c.pValue)})`).join(', ')}.` : ''}`
            : `Binary logistic regression predicting "${dependentVar}" yielded McFadden pseudo-R² = ${formatCoef(pseudoR2)}, accuracy = ${formatPct(accuracy)}${auc != null ? `, AUC = ${formatCoef(auc)}` : ''}. ${sigLogPreds.length > 0 ? `Significant predictors: ${sigLogPreds.map(c => `${c.term} (OR = ${formatNum(c.oddsRatio)}, ${formatPValue(c.pValue)})`).join(', ')}.` : ''}`,
        recommendations: locale === 'vi' ? [
            'Báo cáo giá trị OR kèm 95% CI cho tất cả các biến — nó cung cấp bức tranh về độ tin cậy tốt hơn nhiều so với chỉ nhìn vào p-value.',
            auc != null && auc < 0.70 ? `AUC = ${formatCoef(auc)} cho thấy khả năng phân biệt yếu — cân nhắc bổ sung thêm các biến giải thích có lý thuyết ủng hộ.` : 'Đánh giá tính hiệu chuẩn mô hình qua kiểm định Hosmer-Lemeshow.',
            'Nếu biến phụ thuộc có mức chênh lệch lớn giữa hai nhóm (ví dụ 90/10), hãy báo cáo bổ sung điểm F1, Recall và Specificity thay vì chỉ Accuracy.'
        ] : [
            'Report OR with 95% CI for all predictors — CIs are more informative than p-values alone for logistic models.',
            auc != null && auc < 0.70
                ? `AUC = ${formatCoef(auc)} indicates weak discrimination — consider adding theoretically motivated predictors.`
                : 'Evaluate model calibration using the Hosmer-Lemeshow goodness-of-fit test.',
            'For imbalanced outcomes, report sensitivity, specificity, and the F1-score in addition to overall accuracy.',
        ],
    };
}


// ─── MEDIATION ANALYSIS ───────────────────────────────────────────────────────

export function interpretMediation(params: {
    xVar:           string;
    mVar:           string;
    yVar:           string;
    pathA:          { estimate: number; pValue: number };
    pathB:          { estimate: number; pValue: number };
    pathC:          { estimate: number; pValue: number };
    pathCprime:     { estimate: number; pValue: number };
    indirectEffect: number;
    sobelZ:         number;
    sobelP:         number;
    bootstrapCI?:   { lower: number; upper: number; nBootstrap?: number };
    mediationType:  'full' | 'partial' | 'none';
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const {
        xVar, mVar, yVar,
        pathA, pathB, pathC, pathCprime,
        bootstrapCI, mediationType
    } = params;
    const indirectEffect = safeNum(params.indirectEffect);
    const sobelZ         = safeNum(params.sobelZ);
    const sobelP         = safeNum(params.sobelP, 1);

    // Normalize path objects
    const safePathA      = { estimate: safeNum(pathA?.estimate), pValue: safeNum(pathA?.pValue, 1) };
    const safePathB      = { estimate: safeNum(pathB?.estimate), pValue: safeNum(pathB?.pValue, 1) };
    const safePathC      = { estimate: safeNum(pathC?.estimate), pValue: safeNum(pathC?.pValue, 1) };
    const safePathCprime = { estimate: safeNum(pathCprime?.estimate), pValue: safeNum(pathCprime?.pValue, 1) };

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Hayes, A. F. (2018). Introduction to mediation, moderation, and conditional process analysis (2nd ed.). Guilford Press.',
        'Preacher, K. J., & Hayes, A. F. (2008). Asymptotic and resampling strategies for assessing and comparing indirect effects in multiple mediator models. Behavior Research Methods, 40(3), 879–891. https://doi.org/10.3758/BRM.40.3.879',
        'Baron, R. M., & Kenny, D. A. (1986). The moderator-mediator variable distinction in social psychological research. Journal of Personality and Social Psychology, 51(6), 1173–1182.',
        'Shrout, P. E., & Bolger, N. (2002). Mediation in experimental and nonexperimental studies: New procedures and recommendations. Psychological Methods, 7(4), 422–445.',
    ];

    // Path details with APA notation
    details.push(locale === 'vi'
        ? `Đường dẫn a (${xVar} → ${mVar}): B = ${formatCoef(safePathA.estimate)}, ${formatPValue(safePathA.pValue)}${safePathA.pValue < 0.05 ? ' ✓ có ý nghĩa' : ' — không có ý nghĩa'}.`
        : `Path a (${xVar} → ${mVar}): B = ${formatCoef(safePathA.estimate)}, ${formatPValue(safePathA.pValue)}${safePathA.pValue < 0.05 ? ' ✓ significant' : ' — not significant'}.`
    );
    details.push(locale === 'vi'
        ? `Đường dẫn b (${mVar} → ${yVar} | ${xVar}): B = ${formatCoef(safePathB.estimate)}, ${formatPValue(safePathB.pValue)}${safePathB.pValue < 0.05 ? ' ✓ có ý nghĩa' : ' — không có ý nghĩa'}.`
        : `Path b (${mVar} → ${yVar} | ${xVar}): B = ${formatCoef(safePathB.estimate)}, ${formatPValue(safePathB.pValue)}${safePathB.pValue < 0.05 ? ' ✓ significant' : ' — not significant'}.`
    );
    details.push(locale === 'vi'
        ? `Đường dẫn c — Tác động tổng (${xVar} → ${yVar}): B = ${formatCoef(safePathC.estimate)}, ${formatPValue(safePathC.pValue)}.`
        : `Path c — Total effect (${xVar} → ${yVar}): B = ${formatCoef(safePathC.estimate)}, ${formatPValue(safePathC.pValue)}.`
    );
    details.push(locale === 'vi'
        ? `Đường dẫn c′ — Tác động trực tiếp (${xVar} → ${yVar} | ${mVar}): B = ${formatCoef(safePathCprime.estimate)}, ${formatPValue(safePathCprime.pValue)}.`
        : `Path c′ — Direct effect (${xVar} → ${yVar} | ${mVar}): B = ${formatCoef(safePathCprime.estimate)}, ${formatPValue(safePathCprime.pValue)}.`
    );
    details.push(locale === 'vi'
        ? `Tác động gián tiếp (a × b) = ${formatCoef(indirectEffect)}.`
        : `Indirect effect (a × b) = ${formatCoef(indirectEffect)}.`
    );

    if (bootstrapCI) {
        const n = bootstrapCI.nBootstrap ?? 5000;
        const ciInclZero = bootstrapCI.lower < 0 && bootstrapCI.upper > 0;
        details.push(locale === 'vi'
            ? `Khoảng tin cậy Bootstrap 95% cho tác động gián tiếp (${n} vòng lặp): [${formatCoef(bootstrapCI.lower)}, ${formatCoef(bootstrapCI.upper)}]. ${ciInclZero ? 'Khoảng CI chứa giá trị 0 → tác động gián tiếp KHÔNG mang ý nghĩa thống kê.' : 'Khoảng CI không chứa giá trị 0 → tác động gián tiếp có ý nghĩa thống kê (Hayes, 2018).'}`
            : `Bootstrap 95% CI for indirect effect (${n} resamples): [${formatCoef(bootstrapCI.lower)}, ${formatCoef(bootstrapCI.upper)}]. ${ciInclZero ? 'CI includes zero → indirect effect is NOT statistically significant.' : 'CI excludes zero → indirect effect IS statistically significant (Hayes, 2018).'}`
        );
    }

    details.push(locale === 'vi'
        ? `Kiểm định Sobel: Z = ${formatNum(sobelZ)}, ${formatPValue(sobelP)} (Kiểm định Sobel có quyền lực thấp hơn khoảng tin cậy bootstrap và đòi hỏi phân phối chuẩn, vì thế nên ưu tiên báo cáo Bootstrap CI; Shrout & Bolger, 2002).`
        : `Sobel test: Z = ${formatNum(sobelZ)}, ${formatPValue(sobelP)} (Sobel test is less powerful than bootstrap CI and assumes normality of the indirect effect distribution; bootstrap CI is the recommended standard; Shrout & Bolger, 2002).`
    );

    // Summary based on mediation type
    let summary = '';
    if (mediationType === 'full') {
        summary = locale === 'vi'
            ? `Phân tích trung gian (Mediation analysis) cho thấy "${mVar}" làm trung gian toàn phần (fully mediated) trong mối quan hệ giữa "${xVar}" và "${yVar}". Đường dẫn a (B = ${formatCoef(safePathA.estimate)}, ${formatPValue(safePathA.pValue)}) và đường dẫn b (B = ${formatCoef(safePathB.estimate)}, ${formatPValue(safePathB.pValue)}) đều có ý nghĩa thống kê, trong khi tác động trực tiếp c' của "${xVar}" lên "${yVar}" đã giảm thiểu đáng kể và không còn ý nghĩa thống kê khi đưa biến trung gian vào (c′ = ${formatCoef(safePathCprime.estimate)}, ${formatPValue(safePathCprime.pValue)}). Tác động gián tiếp (a × b = ${formatCoef(indirectEffect)}) có ý nghĩa thống kê${bootstrapCI ? `, được xác nhận bởi khoảng tin cậy Bootstrap 95% [${formatCoef(bootstrapCI.lower)}, ${formatCoef(bootstrapCI.upper)}]` : ` theo kiểm định Sobel (Z = ${formatNum(sobelZ)}, ${formatPValue(sobelP)})`}, ủng hộ lập luận mô hình trung gian toàn phần.`
            : `Mediation analysis indicated that "${mVar}" fully mediated the relationship between "${xVar}" and "${yVar}." Path a (${xVar} → ${mVar}: B = ${formatCoef(safePathA.estimate)}, ${formatPValue(safePathA.pValue)}) and path b (${mVar} → ${yVar}: B = ${formatCoef(safePathB.estimate)}, ${formatPValue(safePathB.pValue)}) were both statistically significant, while the direct effect of "${xVar}" on "${yVar}" was substantially reduced and non-significant after controlling for the mediator (c′ = ${formatCoef(safePathCprime.estimate)}, ${formatPValue(safePathCprime.pValue)}). The indirect effect (a × b = ${formatCoef(indirectEffect)}) was statistically significant${bootstrapCI ? `, as confirmed by bootstrap confidence intervals (95% CI [${formatCoef(bootstrapCI.lower)}, ${formatCoef(bootstrapCI.upper)}]; Hayes, 2018)` : ` per the Sobel test (Z = ${formatNum(sobelZ)}, ${formatPValue(sobelP)})`}, consistent with complete mediation.`;
    } else if (mediationType === 'partial') {
        summary = locale === 'vi'
            ? `Phân tích trung gian cho thấy "${mVar}" làm trung gian bán phần (partially mediated) trong mối quan hệ giữa "${xVar}" và "${yVar}". Cả tác động gián tiếp (a × b = ${formatCoef(indirectEffect)}) và tác động trực tiếp c' của "${xVar}" lên "${yVar}" (c′ = ${formatCoef(safePathCprime.estimate)}, ${formatPValue(safePathCprime.pValue)}) đều giữ được mức ý nghĩa thống kê sau khi đưa biến trung gian vào mô hình, ủng hộ lập luận trung gian bán phần.${bootstrapCI ? ` Khoảng tin cậy Bootstrap 95% cho tác động gián tiếp không chứa giá trị 0 [${formatCoef(bootstrapCI.lower)}, ${formatCoef(bootstrapCI.upper)}], chứng minh ý nghĩa của đường dẫn trung gian (Hayes, 2018).` : ''}`
            : `Mediation analysis indicated that "${mVar}" partially mediated the relationship between "${xVar}" and "${yVar}." Both the indirect effect (a × b = ${formatCoef(indirectEffect)}) and the direct effect of "${xVar}" on "${yVar}" (c′ = ${formatCoef(safePathCprime.estimate)}, ${formatPValue(safePathCprime.pValue)}) remained statistically significant after introducing the mediator into the model, consistent with partial mediation. ${bootstrapCI ? `Bootstrap 95% CI for the indirect effect excluded zero ([${formatCoef(bootstrapCI.lower)}, ${formatCoef(bootstrapCI.upper)}]; Hayes, 2018), confirming the significance of the mediated pathway.` : ''}`;
    } else {
        summary = locale === 'vi'
            ? `Phân tích trung gian không ủng hộ có một tác động gián tiếp mang ý nghĩa thống kê của "${xVar}" lên "${yVar}" thông qua "${mVar}". ${bootstrapCI ? `Khoảng tin cậy Bootstrap 95% cho tác động gián tiếp có chứa điểm 0 [${formatCoef(bootstrapCI.lower)}, ${formatCoef(bootstrapCI.upper)}], cho thấy đường dẫn trung gian không ý nghĩa (Hayes, 2018).` : `Kiểm định Sobel không đạt mức ý nghĩa (Z = ${formatNum(sobelZ)}, ${formatPValue(sobelP)}).`} Do đó, tác động tổng của "${xVar}" lên "${yVar}" (B = ${formatCoef(safePathC.estimate)}, ${formatPValue(safePathC.pValue)}) nên được biện luận dưới dạng trực tiếp độc lập chứ không thông qua trung gian.`
            : `Mediation analysis did not support a significant indirect effect of "${xVar}" on "${yVar}" through "${mVar}." ${bootstrapCI ? `The bootstrap 95% CI for the indirect effect included zero ([${formatCoef(bootstrapCI.lower)}, ${formatCoef(bootstrapCI.upper)}]; Hayes, 2018), indicating that the mediated pathway was not statistically significant.` : `The Sobel test was not significant (Z = ${formatNum(sobelZ)}, ${formatPValue(sobelP)}).`} The total effect of "${xVar}" on "${yVar}" (B = ${formatCoef(safePathC.estimate)}, ${formatPValue(safePathC.pValue)}) should be interpreted in the absence of demonstrated mediation.`;
    }

    warnings.push(locale === 'vi'
        ? 'Phương pháp tiếp cận Baron và Kenny (1986) bằng các bước hồi quy hiện đã được coi là lỗi thời. Nên dùng Bootstrap CI cho tác động gián tiếp (Hayes, 2018) vì phương pháp này chính xác hơn nhiều trong việc kiểm soát sai số loại I so với Sobel test.'
        : 'Baron and Kenny\'s (1986) causal-steps approach is now considered obsolete. The bootstrap indirect effect CI (Hayes, 2018) is the current methodological standard and provides more accurate Type I error control than the Sobel test.'
    );
    warnings.push(locale === 'vi'
        ? 'Phân tích trung gian mang tính thống kê, không chứng minh được quan hệ nhân quả tuyệt đối. Việc chứng minh nhân quả phải dựa vào thực nghiệm hoặc chuỗi thời gian.'
        : 'Mediation analysis does not establish causality: it is a statistical, not experimental, test. Causal inference requires time precedence, covariation, and ruling out third-variable explanations.'
    );

    const medVerdict = mediationType !== 'none' && (bootstrapCI ? (bootstrapCI.lower > 0 || bootstrapCI.upper < 0) : sobelP < 0.05) ? 'pass' : 'warning';

    return {
        summary, details, warnings, citations,
        verdict: medVerdict,
        apaStatement: mediationType === 'full'
            ? (locale === 'vi'
                ? `Trung gian toàn phần: tác động gián tiếp của "${xVar}" lên "${yVar}" qua "${mVar}" có ý nghĩa thống kê (a × b = ${formatCoef(indirectEffect)}${bootstrapCI ? `, 95% CI [${formatCoef(bootstrapCI.lower)}, ${formatCoef(bootstrapCI.upper)}]` : ''}), và tác động trực tiếp không mang ý nghĩa (c′ = ${formatCoef(safePathCprime.estimate)}, ${formatPValue(safePathCprime.pValue)}).`
                : `Full mediation: the indirect effect of "${xVar}" on "${yVar}" through "${mVar}" was statistically significant (a × b = ${formatCoef(indirectEffect)}${bootstrapCI ? `, 95% CI [${formatCoef(bootstrapCI.lower)}, ${formatCoef(bootstrapCI.upper)}]` : ''}), and the direct effect was non-significant (c′ = ${formatCoef(safePathCprime.estimate)}, ${formatPValue(safePathCprime.pValue)}).`)
            : mediationType === 'partial'
                ? (locale === 'vi'
                    ? `Trung gian bán phần: "${mVar}" làm trung gian đáng kể cho mối quan hệ "${xVar}" → "${yVar}" (TĐ gián tiếp = ${formatCoef(indirectEffect)}${bootstrapCI ? `, 95% CI [${formatCoef(bootstrapCI.lower)}, ${formatCoef(bootstrapCI.upper)}]` : ''}); đồng thời tác động trực tiếp vẫn có ý nghĩa (c′ = ${formatCoef(safePathCprime.estimate)}, ${formatPValue(safePathCprime.pValue)}).`
                    : `Partial mediation: "${mVar}" significantly mediated the "${xVar}" → "${yVar}" relationship (indirect effect = ${formatCoef(indirectEffect)}${bootstrapCI ? `, 95% CI [${formatCoef(bootstrapCI.lower)}, ${formatCoef(bootstrapCI.upper)}]` : ''}); the direct effect remained significant (c′ = ${formatCoef(safePathCprime.estimate)}, ${formatPValue(safePathCprime.pValue)}).`)
                : (locale === 'vi'
                    ? `Không tìm thấy vai trò trung gian có ý nghĩa ở đường dẫn "${xVar}" → "${mVar}" → "${yVar}" (TĐ gián tiếp = ${formatCoef(indirectEffect)}${bootstrapCI ? `, 95% CI [${formatCoef(bootstrapCI.lower)}, ${formatCoef(bootstrapCI.upper)}]` : ''}).`
                    : `No significant mediation was found for the "${xVar}" → "${mVar}" → "${yVar}" pathway (indirect effect = ${formatCoef(indirectEffect)}${bootstrapCI ? `, 95% CI [${formatCoef(bootstrapCI.lower)}, ${formatCoef(bootstrapCI.upper)}]` : ''}).`),
        recommendations: mediationType !== 'none'
            ? (locale === 'vi' ? [
                'Sử dụng PROCESS macro (Model 4) của Hayes hoặc thư viện lavaan trong R/WebR để dễ dàng lấy Bootstrap CI tiêu chuẩn.',
                'Nên báo cáo tỷ lệ tác động trung gian (Tác động gián tiếp / Tác động tổng) để làm rõ mức độ đóng góp của biến trung gian.',
                'Đảm bảo không kết luận nhân quả tuyệt đối mà chỉ nói về hướng dự đoán thống kê nếu số liệu là cross-sectional.'
            ] : [
                'Use Hayes\' PROCESS macro (Model 4) or lavaan in R for standardised indirect effect reporting with bootstrap CIs.',
                'Report the proportion of mediation (indirect / total effect) as a supplementary effect size index.',
                'Acknowledge that mediation cannot establish causality — longitudinal or experimental designs are required for causal claims.',
            ])
            : (locale === 'vi' ? [
                'Có thể mô hình đang thiếu quyền lực thống kê (power), vì Bootstrap CI cho kiểm định gián tiếp đòi hỏi mẫu N lớn.',
                'Nghiên cứu thêm lý thuyết và thử một biến trung gian khác có ý nghĩa hơn.',
                'Luôn báo cáo Bootstrap CI cho bài báo khoa học dù kết quả không mang ý nghĩa thống kê.'
            ] : [
                'A non-significant indirect effect may reflect insufficient power — bootstrap CIs for indirect effects require larger N than direct effects.',
                'Consider testing alternative mediators grounded in the theoretical model.',
                'Report the bootstrap CI for the indirect effect even when non-significant, to convey the bounds on the plausible effect.',
            ]),
    };
}


// ─── MODERATION ANALYSIS ─────────────────────────────────────────────────────

export function interpretModeration(params: {
    xVar:                string;
    mVar:                string;
    yVar:                string;
    interactionTerm:     string;
    interactionEstimate: number;
    interactionP:        number;
    r2Change?:           number;
    r2ChangeP?:          number;
    simpleSlopes?:       { level: string; slope: number; pValue: number }[];
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const {
        xVar, mVar, yVar,
        interactionTerm, r2Change, r2ChangeP, simpleSlopes
    } = params;
    const interactionEstimate = safeNum(params.interactionEstimate);
    const interactionP        = safeNum(params.interactionP, 1);

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Hayes, A. F. (2018). Introduction to mediation, moderation, and conditional process analysis (2nd ed.). Guilford Press.',
        'Aiken, L. S., & West, S. G. (1991). Multiple regression: Testing and interpreting interactions. SAGE Publications.',
        'Cohen, J., Cohen, P., West, S. G., & Aiken, L. S. (2003). Applied multiple regression/correlation analysis for the behavioral sciences (3rd ed.). Lawrence Erlbaum Associates.',
    ];

    let summary = '';

    if (interactionP > 0.05) {
        summary = locale === 'vi'
            ? `Phân tích điều tiết (Moderation analysis) được thực hiện nhằm kiểm tra xem liệu "${mVar}" có điều tiết tác động của "${xVar}" lên "${yVar}" hay không. Tích số đại diện cho hiệu ứng tương tác (${interactionTerm}) không đạt mức ý nghĩa thống kê: B = ${formatCoef(interactionEstimate)}, ${formatPValue(interactionP)} (α = .05). Dữ liệu không ủng hộ giả thuyết cho rằng mối quan hệ giữa "${xVar}" và "${yVar}" thay đổi dưới tác động của "${mVar}".`
            : `Moderation analysis was conducted to test whether "${mVar}" moderated the effect of "${xVar}" on "${yVar}." The product term representing the interaction (${interactionTerm}) was not statistically significant: B = ${formatCoef(interactionEstimate)}, ${formatPValue(interactionP)} (α = .05). The data do not support the hypothesis that the effect of "${xVar}" on "${yVar}" varies as a function of "${mVar}."`;
    } else {
        const direction = interactionEstimate > 0 ? (locale === 'vi' ? 'củng cố mạnh thêm' : 'strengthened') : (locale === 'vi' ? 'làm suy yếu' : 'attenuated');
        summary = locale === 'vi'
            ? `Phân tích điều tiết phát hiện có hiệu ứng tương tác mang ý nghĩa thống kê giữa "${xVar}" và "${mVar}" trong mô hình dự báo "${yVar}" (α = .05): B = ${formatCoef(interactionEstimate)}, ${formatPValue(interactionP)}. Điều này cho thấy "${mVar}" đóng vai trò điều tiết tác động của "${xVar}" lên "${yVar}" — cụ thể, "${mVar}" càng cao thì mối quan hệ này càng bị ${direction}. Khuyến nghị thực hiện phân tích simple slopes ở các điểm đại diện của "${mVar}" để mô tả rõ ràng hơn cấu trúc của sự tương tác (Aiken & West, 1991).`
            : `Moderation analysis revealed a statistically significant interaction between "${xVar}" and "${mVar}" in predicting "${yVar}" (α = .05): B = ${formatCoef(interactionEstimate)}, ${formatPValue(interactionP)}. This indicates that "${mVar}" moderates the effect of "${xVar}" on "${yVar}" — specifically, higher levels of "${mVar}" ${direction} this relationship. Simple slopes analysis at representative levels of "${mVar}" is recommended to characterise the nature of the interaction (Aiken & West, 1991).`;

        if (r2Change != null) {
            const sig = r2ChangeP != null && r2ChangeP < 0.05;
            details.push(locale === 'vi'
                ? `Độ thay đổi ΔR² nhờ bổ sung biến tương tác: ${formatCoef(r2Change)} (${sig ? 'có ý nghĩa thống kê' : 'không có ý nghĩa thống kê'}${r2ChangeP != null ? `, ${formatPValue(r2ChangeP)}` : ''}). ΔR² là kích thước hiệu ứng ưa dùng nhất trong phân tích điều tiết (Cohen et al., 2003): nhỏ ≈ .02, vừa ≈ .15, lớn ≈ .35.`
                : `ΔR² due to interaction term: ${formatCoef(r2Change)} (${sig ? 'statistically significant' : 'not statistically significant'}${r2ChangeP != null ? `, ${formatPValue(r2ChangeP)}` : ''}). ΔR² is the preferred effect size for moderation (Cohen et al., 2003): small ≈ .02, medium ≈ .15, large ≈ .35.`
            );
        }

        if (simpleSlopes && simpleSlopes.length > 0) {
            details.push(locale === 'vi' ? 'Phân tích đường dốc đơn (Simple slopes) tại các mức độ của biến điều tiết (Aiken & West, 1991):' : 'Simple slopes at representative levels of the moderator (Aiken & West, 1991):');
            for (const s of simpleSlopes) {
                const sig = s.pValue < 0.05;
                details.push(locale === 'vi'
                    ? `  • Tại mức độ ${s.level} của "${mVar}": hệ số góc = ${formatCoef(s.slope)}, ${formatPValue(s.pValue)} (${sig ? 'có ý nghĩa thống kê' : 'không có ý nghĩa'}).`
                    : `  • At ${s.level} of "${mVar}": slope = ${formatCoef(s.slope)}, ${formatPValue(s.pValue)} (${sig ? 'statistically significant' : 'not significant'}).`
                );
            }
        }
    }

    warnings.push(locale === 'vi'
        ? 'Luôn Mean-center cả biến độc lập (X) và biến điều tiết (W) trước khi tạo biến tích số (X × W) nhằm giảm thiểu hiện tượng đa cộng tuyến không thiết yếu, cũng như để các hiệu ứng chính dễ biện luận hơn (hiệu ứng của biến này khi biến kia ở mức trung bình; Aiken & West, 1991).'
        : 'Mean-center both the predictor (X) and moderator (W) before computing the interaction term (X × W) to reduce non-essential multicollinearity and ensure main effects are interpretable as conditional effects at the mean of the other variable (Aiken & West, 1991).'
    );
    warnings.push(locale === 'vi'
        ? 'Trong mô hình điều tiết, không nhất thiết phải có hiệu ứng chính (main effect) thì hiệu ứng tương tác mới có ý nghĩa. Hãy biện luận hiệu ứng tương tác là kết quả trung tâm nếu mục tiêu là kiểm định sự điều tiết.'
        : 'A significant interaction in regression does not require significant main effects. Report and interpret the interaction term as the primary finding when moderation is the hypothesis.'
    );
    if (interactionP > 0.05) {
        warnings.push(locale === 'vi'
            ? 'Kết quả tương tác không ý nghĩa chưa chắc là không có điều tiết: mẫu không đủ lớn là lý do chính khiến mô hình thiếu quyền lực (power) để tìm ra tương tác thực. Hãy báo cáo ΔR² kèm khoảng tin cậy 90% để thể hiện độ chuẩn xác của ước lượng.'
            : 'A non-significant interaction does not rule out moderation: insufficient statistical power is a common reason for failing to detect true interactions. Report ΔR² and its 90% CI to quantify the precision of the null result.'
        );
    }

    return {
        summary, details, warnings, citations,
        verdict: interactionP < 0.05 ? 'pass' : 'warning',
        apaStatement: interactionP < 0.05
            ? (locale === 'vi'
                ? `Phân tích điều tiết tiết lộ tác động tương tác có ý nghĩa thống kê giữa "${xVar}" và "${mVar}" dự báo cho "${yVar}", B = ${formatCoef(interactionEstimate)}, ${formatPValue(interactionP)}${r2Change != null ? `, ΔR² = ${formatCoef(r2Change)}` : ''}.`
                : `Moderation analysis revealed a statistically significant interaction between "${xVar}" and "${mVar}" predicting "${yVar}", B = ${formatCoef(interactionEstimate)}, ${formatPValue(interactionP)}${r2Change != null ? `, ΔR² = ${formatCoef(r2Change)}` : ''}.`)
            : (locale === 'vi'
                ? `Tương tác giữa "${xVar}" và "${mVar}" trong mô hình dự báo "${yVar}" không đạt mức ý nghĩa thống kê, B = ${formatCoef(interactionEstimate)}, ${formatPValue(interactionP)}.`
                : `The interaction between "${xVar}" and "${mVar}" predicting "${yVar}" was not statistically significant, B = ${formatCoef(interactionEstimate)}, ${formatPValue(interactionP)}.`),
        recommendations: interactionP < 0.05
            ? (locale === 'vi' ? [
                'Thực hiện simple slopes analysis tại mức ±1 SD (và trung bình) của biến điều tiết để mô tả cụ thể về hình thái của tương tác.',
                'Hãy vẽ đồ thị tương tác (interaction plot, ví dụ: 2 đường dự báo của X ở 2 mức của W) cho phần thuyết minh nghiên cứu.',
                'Báo cáo ΔR² là chỉ số đánh giá mức độ tác động chính của hiện tượng điều tiết (Cohen et al., 2003).'
            ] : [
                'Conduct simple slopes analysis at ±1 SD (and mean) of the moderator to characterise the interaction pattern.',
                'Create an interaction plot (predicted Y values across levels of X at different levels of W) for manuscript presentation.',
                'Report ΔR² as the primary effect size for the moderation effect (Cohen et al., 2003).',
            ])
            : (locale === 'vi' ? [
                'Chắc chắn rằng bạn đã Mean-center các biến trước khi tạo tích số để tránh nhiễu do đa cộng tuyến.',
                'Kiểm tra lại xem mô hình có đủ power không — hiệu ứng tương tác thường cần N lớn gấp 4 lần so với hiệu ứng chính để có cùng 1 độ tĩnh (power).',
                'Hãy báo cáo ΔR² dù không ý nghĩa để cung cấp thêm thông tin.'
            ] : [
                'Mean-center X and W before computing the interaction term to reduce non-essential multicollinearity.',
                'Verify the model is adequately powered — interactions typically require 4× the N of main effects for equivalent power.',
                'Report ΔR² and its 90% CI for the interaction term even when non-significant.',
            ]),
    };
}


// ─── CLUSTER ANALYSIS ────────────────────────────────────────────────────────

export function interpretClusterAnalysis(params: {
    method:           string;
    nClusters:        number;
    totalSS:          number;
    withinSS:         number;
    betweenSS:        number;
    silhouetteScore?: number;
    clusterSizes?:    number[];
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const { method, silhouetteScore, clusterSizes } = params;
    const nClusters      = safeNum(params.nClusters, 1);
    const totalSS        = safeNum(params.totalSS);
    const withinSS       = safeNum(params.withinSS);
    const betweenSS      = safeNum(params.betweenSS);

    const varianceExplained = totalSS > 0 ? betweenSS / totalSS : 0;

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Hair, J. F., Black, W. C., Babin, B. J., & Anderson, R. E. (2019). Multivariate data analysis (8th ed.). Cengage Learning.',
        'Rousseeuw, P. J. (1987). Silhouettes: A graphical aid to the interpretation and validation of cluster analysis. Journal of Computational and Applied Mathematics, 20, 53–65. https://doi.org/10.1016/0377-0427(87)90125-7',
        'Everitt, B. S., Landau, S., Leese, M., & Stahl, D. (2011). Cluster analysis (5th ed.). Wiley.',
    ];

    let summary = locale === 'vi'
        ? `Phân tích cụm (Cluster analysis) bằng phương pháp ${method} được áp dụng để xác định các nhóm/phân khúc tự nhiên trong dữ liệu. Mô hình trích xuất ra ${nClusters} cụm. Tổng bình phương giữa các cụm chiếm khoảng ${formatPct(varianceExplained)} sự biến thiên của tổng thể (between-SS = ${formatNum(betweenSS, 1)}, within-SS = ${formatNum(withinSS, 1)}, tổng SS = ${formatNum(totalSS, 1)}), `
        : `${method} cluster analysis was applied to identify naturally occurring subgroups in the data. The analysis identified ${nClusters} cluster${nClusters !== 1 ? 's' : ''}. The between-cluster sum of squares accounted for ${formatPct(varianceExplained)} of the total variance (between-SS = ${formatNum(betweenSS, 1)}, within-SS = ${formatNum(withinSS, 1)}, total SS = ${formatNum(totalSS, 1)}), `;

    summary += varianceExplained >= 0.60
        ? (locale === 'vi' ? 'cho thấy các cụm có độ phân tách và tính liên kết nội bộ rất cao.' : 'indicating well-separated, internally cohesive clusters.')
        : varianceExplained >= 0.50
            ? (locale === 'vi' ? 'cho thấy sự khác biệt khá rõ nét giữa các cụm.' : 'suggesting moderately differentiated clusters.')
            : (locale === 'vi' ? 'cho thấy các cụm chưa tách biệt thực sự tốt — nên xem lại tính hữu dụng thực tiễn của giải pháp này.' : 'suggesting limited cluster separation — solution validity should be verified.');

    details.push(locale === 'vi'
        ? `Phân rã phương sai: between-SS / tổng SS = ${formatPct(varianceExplained)}.`
        : `Variance decomposition: between-SS / total SS = ${formatPct(varianceExplained)}.`
    );
    details.push(locale === 'vi'
        ? `Within-cluster SS (Phương sai nội cụm) = ${formatNum(withinSS, 1)} (${formatPct(withinSS / totalSS)} của tổng thể).`
        : `Within-cluster SS = ${formatNum(withinSS, 1)} (${formatPct(withinSS / totalSS)} of total).`
    );
    details.push(locale === 'vi'
        ? `Between-cluster SS (Phương sai giữa các cụm) = ${formatNum(betweenSS, 1)} (${formatPct(varianceExplained)} của tổng thể).`
        : `Between-cluster SS = ${formatNum(betweenSS, 1)} (${formatPct(varianceExplained)} of total).`
    );

    if (clusterSizes && clusterSizes.length > 0) {
        const total = clusterSizes.reduce((a, b) => a + b, 0);
        details.push(locale === 'vi'
            ? `Thành phần cụm: ` + clusterSizes.map((s, i) => `Cụm ${i + 1}: n = ${s} (${formatPct(s / total)})`).join('; ')
            : `Cluster composition: ` + clusterSizes.map((s, i) => `Cluster ${i + 1}: n = ${s} (${formatPct(s / total)})`).join('; ')
        );
        const minSize = Math.min(...clusterSizes);
        const minPct  = minSize / total;
        if (minPct < 0.05) {
            warnings.push(locale === 'vi'
                ? `Cụm ${clusterSizes.indexOf(minSize) + 1} chỉ chứa n = ${minSize} (${formatPct(minPct)} tổng thể). Những cụm quá bé (< 5% mẫu) có xu hướng chỉ là tập hợp của các dị biệt (outliers) hơn là một đoạn thị trường/cụm thực sự (Hair et al., 2019). Nên cân nhắc xoá bỏ hoặc gộp cụm.`
                : `Cluster ${clusterSizes.indexOf(minSize) + 1} contains only n = ${minSize} (${formatPct(minPct)} of total). Small clusters (< 5% of N) may reflect outlier agglomeration rather than a meaningful subgroup (Hair et al., 2019). Consider merging or removing this cluster.`
            );
        }
    }

    if (silhouetteScore != null) {
        let qualityEn = '';
        let qualityVi = '';
        if (silhouetteScore >= 0.70) {
            qualityEn = 'strong (well-separated clusters)';
            qualityVi = 'mạnh (các cụm phân tách rất tốt)';
        } else if (silhouetteScore >= 0.50) {
            qualityEn = 'reasonable (moderate separation)';
            qualityVi = 'hợp lý (phân tách ở mức vừa phải)';
        } else if (silhouetteScore >= 0.25) {
            qualityEn = 'weak (overlapping structure)';
            qualityVi = 'yếu (có sự chồng chéo giữa các cụm)';
        } else {
            qualityEn = 'absent or artificial structure';
            qualityVi = 'rất kém (cấu trúc không rõ ràng hoặc nhân tạo)';
        }

        details.push(locale === 'vi'
            ? `Điểm Silhouette trung bình = ${formatCoef(silhouetteScore)}: ${qualityVi}. (Thang đo Rousseeuw 1987: > .70 mạnh, .50–.70 hợp lý, .25–.50 yếu, < .25 không có cấu trúc rõ ràng.)`
            : `Average Silhouette Score = ${formatCoef(silhouetteScore)}: ${qualityEn}. (Rousseeuw, 1987 benchmarks: > .70 strong, .50–.70 reasonable, .25–.50 weak, < .25 no structure.)`
        );
        if (silhouetteScore < 0.25) {
            warnings.push(locale === 'vi'
                ? `Điểm Silhouette = ${formatCoef(silhouetteScore)} cảnh báo rằng cấu trúc phân cụm đang quá lỏng lẻo. Dữ liệu có thể không tồn tại các nhóm tự nhiên, hoặc có sự gán nhầm lẫn nghiêm trọng. Hãy xem xét phương pháp hoặc dùng K khác.`
                : `Silhouette Score = ${formatCoef(silhouetteScore)} indicates that the cluster structure is weak or artificial. Observations may be misassigned, or the data may not contain natural clusters. Evaluate alternative k values and consider hierarchical clustering to inspect the dendrogram.`
            );
        }
    }

    if (varianceExplained < 0.50) {
        warnings.push(locale === 'vi'
            ? `Tỷ lệ phương sai giải thích được (${formatPct(varianceExplained)}) thấp hơn 50%. Giải pháp phân cụm này khó tách biệt rõ các đối tượng. Hãy thử lại với số cụm K khác.`
            : `Between-cluster variance explained (${formatPct(varianceExplained)}) is below 50%. The cluster solution may not adequately differentiate subgroups. Try alternative cluster numbers using the elbow criterion or silhouette width maximisation.`
        );
    }

    warnings.push(locale === 'vi'
        ? 'Thuật toán K-Means rất nhạy cảm với việc chia tỉ lệ (scale) cũng như các điểm random khởi tạo (centroids). Luôn chuẩn hóa Z-scores các biến tham gia phân cụm và thử chạy tối ưu K qua chỉ số ch (Calinski-Harabasz) hoặc silhouette.'
        : 'K-Means cluster solutions are sensitive to the initial random centroid selection and variable scaling. Standardise all input variables (z-scores) before clustering, and report results as one of multiple candidate solutions evaluated with internal validity indices (silhouette, CH index).'
    );
    warnings.push(locale === 'vi'
        ? 'Phân tích cụm mang tính chất tìm tòi (exploratory): giải pháp đưa ra cần được xác thực (validate) bằng cách so sánh đặc điểm hồ sơ (profiling) của các cụm trên một nhóm biến độc lập khác.'
        : 'Cluster analysis is exploratory: the derived solution should be validated on a holdout sample or by comparing cluster profiles on theoretically meaningful external criterion variables.'
    );

    details.push(
        `APA 7 reporting: ${method} cluster analysis, k = ${nClusters}, ` +
        `${formatPct(varianceExplained)} between-cluster variance explained` +
        `${silhouetteScore != null ? `, silhouette = ${formatCoef(silhouetteScore)}` : ''}.`
    );

    const clusterVerdict = varianceExplained >= 0.50 && (silhouetteScore == null || silhouetteScore >= 0.25) ? 'pass' : 'warning';

    return {
        summary, details, warnings, citations,
        verdict: clusterVerdict,
        apaStatement: locale === 'vi'
            ? `Phân tích cụm ${method} xác định được ${nClusters} nhóm, giải thích ${(varianceExplained * 100).toFixed(1)}% phương sai tổng thể${silhouetteScore != null ? ` (silhouette = ${formatCoef(silhouetteScore)})` : ''}.`
            : `${method} cluster analysis identified ${nClusters} cluster${nClusters !== 1 ? 's' : ''}, accounting for ${(varianceExplained * 100).toFixed(1)}% of total variance between clusters${silhouetteScore != null ? ` (silhouette = ${formatCoef(silhouetteScore)})` : ''}.`,
        recommendations: locale === 'vi' ? [
            varianceExplained < 0.50
                ? `Phương sai giải thích (${(varianceExplained * 100).toFixed(1)}%) < 50% — hãy thử k = ${nClusters + 1} hoặc k = ${Math.max(2, nClusters - 1)} và so sánh lại.`
                : 'Xác thực lại giải pháp phân cụm bằng cách so sánh (ANOVA/Chi-square) các đặc tính nhân khẩu học hoặc biến ngoại vi của từng cụm.',
            'Bắt buộc chuẩn hoá (z-scores) các biến đưa vào thuật toán phân cụm K-Means.',
            'Chạy k-means qua nhiều mẫu khởi tạo (ví dụ 25 lần) để loại bỏ rủi ro rơi vào cực tiểu cục bộ (local minima).'
        ] : [
            varianceExplained < 0.50
                ? `Between-cluster variance (${(varianceExplained * 100).toFixed(1)}%) is below 50% — try k = ${nClusters + 1} and k = ${Math.max(2, nClusters - 1)} and compare using the elbow criterion and silhouette width.`
                : 'Validate the cluster solution by profiling clusters on theoretically meaningful external variables.',
            'Standardise all clustering variables (z-scores) before analysis to prevent scale-sensitive distortions.',
            'Run k-means with multiple random starts (≥ 25) and select the solution with the lowest total within-cluster SS.',
        ],
    };
}
