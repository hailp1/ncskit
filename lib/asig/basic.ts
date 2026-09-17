/**
 * ASIG — basic.ts
 * Interpreters: Descriptive Statistics, Correlation, Independent/Paired t-test,
 *               One-Way ANOVA, Two-Way ANOVA, Mann-Whitney U, Kruskal-Wallis,
 *               Wilcoxon Signed Rank, Chi-Square
 *
 * All prose conforms to APA 7th Edition reporting standards.
 * Each interpreter outputs publication-ready narrative with:
 *   - Exact test statistics and effect sizes
 *   - Assumption check summaries
 *   - Methodological context with primary citations
 */

import { formatPValue, formatCoef, formatNum, formatPct, safeNum, InterpretationResult } from './shared';


// ─── DESCRIPTIVE STATISTICS ───────────────────────────────────────────────────

export function interpretDescriptive(params: {
    columnNames: string[];
    means?:      number[];
    sds?:        number[];
    skews?:      number[];
    kurtoses?:   number[];
    mean?:       number[];
    sd?:         number[];
    skew?:       number[];
    kurtosis?:   number[];
    N?:          number[];
    n?:          number[];
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const { columnNames } = params;
    const means = params.means || params.mean || [];
    const sds = params.sds || params.sd || [];
    const skews = params.skews || params.skew || [];
    const kurtoses = params.kurtoses || params.kurtosis || [];
    const N = params.N || params.n || [];

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'George, D., & Mallery, P. (2010). SPSS for Windows step by step: A simple guide and reference (10th ed.). Pearson.',
        'West, S. G., Finch, J. F., & Curran, P. J. (1995). Structural equation models with nonnormal variables: Solutions and recommendations. In R. H. Hoyle (Ed.), Structural equation modeling: Concepts, issues, and applications (pp. 56–75). SAGE.',
        'Hair, J. F., Black, W. C., Babin, B. J., & Anderson, R. E. (2019). Multivariate data analysis (8th ed.). Cengage Learning.',
    ];

    const nonNormal: string[] = [];

    columnNames.forEach((name, i) => {
        const skew = safeNum(skews[i]);
        const kurt = safeNum(kurtoses[i]);
        const skewOk = Math.abs(skew) <= 2;
        const kurtOk = Math.abs(kurt) <= 7;

        let note = `"${name}": M = ${formatNum(means[i])}, SD = ${formatNum(sds[i])}`;
        if (N[i] != null) note += `, N = ${N[i]}`;
        note += locale === 'vi' 
            ? `; Độ xiên (Skewness) = ${formatNum(skew)}, Độ nhọn (Kurtosis) = ${formatNum(kurt)}.`
            : `; Skewness = ${formatNum(skew)}, Kurtosis (excess) = ${formatNum(kurt)}.`;

        if (!skewOk || !kurtOk) {
            nonNormal.push(name);
            const issues: string[] = [];
            if (!skewOk) issues.push(locale === 'vi' ? `|độ xiên| = ${formatNum(Math.abs(skew))} vượt ±2` : `|skewness| = ${formatNum(Math.abs(skew))} exceeds ±2`);
            if (!kurtOk) issues.push(locale === 'vi' ? `|độ nhọn| = ${formatNum(Math.abs(kurt))} vượt ±7` : `|excess kurtosis| = ${formatNum(Math.abs(kurt))} exceeds ±7`);
            warnings.push(
                locale === 'vi'
                    ? `Biến "${name}" có dấu hiệu phân phối không chuẩn: ${issues.join('; ')} (West et al., 1995). Cần xem xét dùng các kiểm định phi tham số hoặc công cụ ước lượng chuẩn mạnh (robust estimators).`
                    : `"${name}" shows signs of non-normality: ${issues.join('; ')} (West et al., 1995). Consider non-parametric alternatives or robust estimators.`
            );
        }

        details.push(note);
    });

    const nVar = columnNames.length;
    let summary = '';
    if (nonNormal.length === 0) {
        summary = locale === 'vi'
            ? `Thống kê mô tả được tính toán cho ${nVar} biến (N = ${N[0]}). Tất cả các biến đều có độ xiên (skewness) nằm trong khoảng ±2 và độ nhọn (kurtosis) trong khoảng ±7 (West et al., 1995; George & Mallery, 2010), cho thấy dữ liệu có phân phối chuẩn đơn biến và phù hợp cho các phân tích tham số.`
            : `Descriptive statistics were computed for ${nVar} variable${nVar > 1 ? 's' : ''} (N = ${N[0]}). All variables demonstrated skewness values within ±2 and excess kurtosis within ±7 (West et al., 1995; George & Mallery, 2010), indicating approximate univariate normality and suitability for parametric analyses.`;
    } else {
        summary = locale === 'vi'
            ? `Thống kê mô tả được tính toán cho ${nVar} biến (N = ${N[0]}). Có ${nonNormal.length}/${nVar} biến (${nonNormal.join(', ')}) có độ lệch hoặc độ nhọn vượt ngưỡng khuyến nghị (|skew| ≤ 2, |kurt| ≤ 7; West et al., 1995), cho thấy dữ liệu vi phạm giả định phân phối chuẩn. Nên cân nhắc dùng phân tích phi tham số hoặc kỹ thuật sai số chuẩn mạnh (robust standard errors) khi xử lý các biến này.`
            : `Descriptive statistics were computed for ${nVar} variable${nVar > 1 ? 's' : ''} (N = ${N[0]}). ${nonNormal.length} of ${nVar} variable${nVar > 1 ? 's' : ''} — ${nonNormal.join(', ')} — exhibited skewness or excess kurtosis values that exceed the commonly recommended thresholds (|skew| ≤ 2, |kurt| ≤ 7; West et al., 1995), suggesting departure from normality. Non-parametric alternatives or robust standard errors should be considered for analyses involving these variables.`;
    }

    return {
        summary, details, warnings, citations,
        verdict: nonNormal.length === 0 ? 'pass' : 'warning',
        apaStatement: locale === 'vi'
            ? `Thống kê mô tả được thực hiện trên ${columnNames.length} biến (N = ${N[0]}). ${nonNormal.length === 0 ? 'Tất cả các biến đều thoả mãn giả định phân phối chuẩn tương đối (|độ xiên| ≤ 2, |độ nhọn| ≤ 7; West et al., 1995).' : `${nonNormal.length} biến cho thấy dấu hiệu vi phạm phân phối chuẩn: ${nonNormal.join(', ')}.`}`
            : `Descriptive statistics were computed for ${columnNames.length} variable${columnNames.length > 1 ? 's' : ''} (N = ${N[0]}). ${nonNormal.length === 0 ? 'All variables met criteria for approximate normality (|skewness| ≤ 2, |kurtosis| ≤ 7; West et al., 1995).' : `${nonNormal.length} variable${nonNormal.length > 1 ? 's showed' : ' showed'} evidence of non-normality: ${nonNormal.join(', ')}.`}`,
        recommendations: nonNormal.length > 0
            ? (locale === 'vi' ? [
                `Cân nhắc sử dụng kiểm định phi tham số (như Mann-Whitney U, Kruskal-Wallis) cho các biến: ${nonNormal.join(', ')}.`,
                'Áp dụng phương pháp Bootstrap hoặc sai số chuẩn vững (robust standard errors) nếu dùng hồi quy tuyến tính.',
                'Kiểm tra biểu đồ Histogram và Q-Q plot để quan sát hình dạng phân phối thực tế của dữ liệu lỗi.'
            ] : [
                `Consider non-parametric alternatives (e.g., Mann-Whitney U, Kruskal-Wallis) for analyses involving ${nonNormal.join(', ')}.`,
                'Apply bootstrap confidence intervals or robust (HC) standard errors for regression-based analyses with non-normal predictors.',
                'Examine histograms and Q-Q plots to characterise the shape of each non-normal distribution.',
            ])
            : (locale === 'vi' ? [
                'Có thể yên tâm tiến hành các kiểm định tham số vì giả định phân phối chuẩn đã được đáp ứng.',
                'Báo cáo các giá trị Trung bình (M), Độ lệch chuẩn (SD), Skewness và Kurtosis vào bảng phụ lục để minh bạch dữ liệu.'
            ] : [
                'Proceed with parametric analyses — normality assumptions appear satisfied.',
                'Report M, SD, skewness, and kurtosis in supplementary tables for transparency.',
            ]),
    };
}


// ─── PEARSON / SPEARMAN / KENDALL CORRELATION ─────────────────────────────────

export function interpretCorrelation(params: {
    var1:    string;
    var2:    string;
    r:       number;
    pValue:  number;
    n?:      number;
    method?: 'pearson' | 'spearman' | 'kendall';
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const { var1, var2, n, method = 'pearson' } = params;
    const r      = safeNum(params.r);
    const pValue = safeNum(params.pValue, 1);

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Cohen, J. (1988). Statistical power analysis for the behavioral sciences (2nd ed.). Lawrence Erlbaum Associates.',
        'Mukaka, M. M. (2012). Statistics corner: A guide to appropriate use of correlation coefficient in medical research. Malawi Medical Journal, 24(3), 69–71.',
    ];

    const methodLabel = locale === 'vi'
        ? (method === 'pearson' ? 'Hệ số tương quan Pearson' : method === 'spearman' ? 'Hệ số tương quan hạng Spearman' : 'Hệ số tương quan hạng Kendall')
        : (method === 'pearson' ? 'Pearson product-moment correlation' : method === 'spearman' ? 'Spearman rank-order correlation' : 'Kendall rank correlation');

    const statSymbol = method === 'pearson' ? 'r' : method === 'spearman' ? 'rs' : 'τ';
    const dfStr = n != null ? `(${n - 2})` : '';
    const nStr  = n != null ? `, N = ${n}` : '';

    const absR    = Math.abs(r);
    const strength = locale === 'vi' 
        ? (absR < 0.10 ? 'không đáng kể' : absR < 0.30 ? 'yếu' : absR < 0.50 ? 'vừa phải' : absR < 0.70 ? 'tương đối mạnh' : 'mạnh')
        : (absR < 0.10 ? 'negligible' : absR < 0.30 ? 'weak' : absR < 0.50 ? 'moderate' : absR < 0.70 ? 'moderately strong' : 'strong');

    let summary = '';

    const direction = r > 0 ? (locale === 'vi' ? 'thuận' : 'positive') : (locale === 'vi' ? 'nghịch' : 'negative');

    if (pValue > 0.05) {
        summary = locale === 'vi'
            ? `Phân tích ${methodLabel} được thực hiện để đánh giá mối liên hệ tuyến tính giữa "${var1}" và "${var2}". Kết quả cho thấy mối liên hệ ${strength} (${statSymbol}${dfStr} = ${formatCoef(r)}${nStr}, ${formatPValue(pValue)}), và không có ý nghĩa thống kê (α = .05). Nên báo cáo khoảng tin cậy 95% để giới hạn phạm vi hiệu ứng thực tế.`
            : `A ${methodLabel} was conducted to examine the linear relationship between "${var1}" and "${var2}." The analysis yielded a ${strength} association (${statSymbol}${dfStr} = ${formatCoef(r)}${nStr}, ${formatPValue(pValue)}), which did not reach statistical significance (α = .05). The 95% confidence interval should be reported alongside this result to bound the plausible range of effects.`;
    } else {
        summary = locale === 'vi'
            ? `Phân tích ${methodLabel} cho thấy có mối tương quan ${direction} ${strength} mang ý nghĩa thống kê giữa "${var1}" và "${var2}" (${statSymbol}${dfStr} = ${formatCoef(r)}${nStr}, ${formatPValue(pValue)}). Kết quả này cho thấy giá trị ${r > 0 ? 'cao hơn' : 'thấp hơn'} của "${var1}" có xu hướng đi kèm với giá trị ${r > 0 ? 'cao hơn' : 'thấp hơn'} của "${var2}". Lưu ý: tương quan có ý nghĩa thống kê không đồng nghĩa với quan hệ nhân quả.`
            : `A ${methodLabel} indicated a statistically significant ${strength} ${direction} association between "${var1}" and "${var2}" (${statSymbol}${dfStr} = ${formatCoef(r)}${nStr}, ${formatPValue(pValue)}). This finding suggests that ${r > 0 ? 'higher' : 'lower'} values of "${var1}" are systematically associated with ${r > 0 ? 'higher' : 'lower'} values of "${var2}." Note that a statistically significant correlation does not establish causality.`;

        const r2 = r * r;
        details.push(locale === 'vi'
            ? `Hệ số xác định: r² = ${formatCoef(r2)} — "${var1}" và "${var2}" giải thích được khoảng ${formatPct(r2)} sự biến thiên của nhau.`
            : `Coefficient of determination: r² = ${formatCoef(r2)} — "${var1}" and "${var2}" share approximately ${formatPct(r2)} of their variance.`
        );
        details.push(locale === 'vi'
            ? `Thang đo kích thước hiệu ứng (Cohen, 1988): Không đáng kể |r| < .10; Yếu .10–.29; Vừa .30–.49; Mạnh ≥ .50.`
            : `Effect size classification (Cohen, 1988): negligible |r| < .10; weak .10–.29; moderate .30–.49; strong ≥ .50.`
        );
    }

    warnings.push(locale === 'vi'
        ? 'Phân tích tương quan chỉ định lượng sự biến thiên cùng chiều/ngược chiều. Hãy quan sát biểu đồ phân tán (scatter plot) để phát hiện các mối quan hệ phi tuyến, phương sai sai số thay đổi (heteroscedasticity), hoặc điểm dị biệt.'
        : 'Correlation quantifies linear co-variation only. Inspect the scatter plot for non-linearity, heteroscedasticity, or influential data points that may distort the coefficient.'
    );
    if (method === 'pearson') {
        warnings.push(locale === 'vi'
            ? 'Hệ số Pearson yêu cầu dữ liệu ở dạng thang đo khoảng (interval) và phân phối xấp xỉ chuẩn biến thiên kép. Nếu dữ liệu dạng thứ bậc, hãy dùng Spearman rs.'
            : 'Pearson r assumes interval-level measurement and approximate bivariate normality. For ordinal data, use Spearman rs or polychoric correlation.'
        );
    }

    const statSymbolFinal = method === 'pearson' ? 'r' : method === 'spearman' ? 'rs' : 'τ';
    
    return {
        summary, details, warnings, citations,
        verdict: pValue < 0.05 ? 'pass' : 'warning',
        apaStatement: pValue < 0.05
            ? (locale === 'vi' 
                ? `Kiểm định tương quan ${method === 'pearson' ? 'Pearson' : method === 'spearman' ? 'Spearman' : 'Kendall'} cho thấy mối tương quan ${direction} ${absR < 0.30 ? 'yếu' : absR < 0.50 ? 'vừa' : 'mạnh'} có ý nghĩa thống kê giữa "${var1}" và "${var2}" (${statSymbolFinal} = ${formatCoef(r)}, ${formatPValue(pValue)}).`
                : `A ${method === 'pearson' ? 'Pearson product-moment' : method === 'spearman' ? 'Spearman rank-order' : 'Kendall rank'} correlation indicated a statistically significant ${Math.abs(r) < 0.30 ? 'weak' : Math.abs(r) < 0.50 ? 'moderate' : 'strong'} ${r > 0 ? 'positive' : 'negative'} association between "${var1}" and "${var2}" (${statSymbolFinal} = ${formatCoef(r)}, ${formatPValue(pValue)}).`)
            : (locale === 'vi'
                ? `Không phát hiện thấy mối tương quan có ý nghĩa thống kê giữa "${var1}" và "${var2}" (${statSymbolFinal} = ${formatCoef(r)}, ${formatPValue(pValue)}).`
                : `No statistically significant correlation was found between "${var1}" and "${var2}" (${statSymbolFinal} = ${formatCoef(r)}, ${formatPValue(pValue)}).`),
        recommendations: pValue < 0.05
            ? (locale === 'vi' ? [
                `Báo cáo r² = ${formatCoef(r * r)} để thể hiện lượng phương sai chung (chồng lấp ${(r * r * 100).toFixed(0)}%).`,
                'Kiểm tra biểu đồ tán xạ để xem có điểm outlier nào làm bóp méo hệ số r hay không.',
                'Nếu muốn kết luận nhân quả, hãy dùng hồi quy tuyến tính hoặc mô hình trung gian.'
            ] : [
                `Report r² = ${formatCoef(r * r)} to communicate shared variance (${(r * r * 100).toFixed(0)}% overlap).`,
                'Inspect the scatter plot for non-linearity or influential points that may distort the correlation coefficient.',
                'If causal inference is intended, consider regression or mediation analysis.',
            ])
            : (locale === 'vi' ? [
                'Báo cáo khoảng tin cậy 95% của r để chỉ ra phạm vi hiệu ứng thực tế.',
                'Kết quả không có ý nghĩa thống kê có thể do cỡ mẫu nhỏ (power thấp) — hãy kiểm tra lại cỡ mẫu.',
                'Sử dụng Spearman rs nếu dữ liệu không thoả mãn phân phối chuẩn hoặc tuyến tính.'
            ] : [
                'Report the 95% CI for the correlation coefficient to convey the range of plausible effects.',
                'A non-significant result may reflect low power — verify adequate sample size for detecting the expected effect.',
                'Consider Spearman rs if normality or linearity cannot be assumed.',
            ]),
    };
}


// ─── INDEPENDENT-SAMPLES T-TEST ───────────────────────────────────────────────

export function interpretTTestIndependent(params: {
    groupVar:   string;
    targetVar:  string;
    group1Name: string;
    group2Name: string;
    mean1:      number;
    sd1:        number;
    mean2:      number;
    sd2:        number;
    t:          number;
    df:         number;
    pValue:     number;
    cohensD?:   number;
    leveneP?:   number;
    shapiroP1?: number;
    shapiroP2?: number;
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const {
        groupVar, targetVar, group1Name, group2Name,
        leveneP, shapiroP1, shapiroP2
    } = params;
    const mean1    = safeNum(params.mean1);
    const sd1      = safeNum(params.sd1);
    const mean2    = safeNum(params.mean2);
    const sd2      = safeNum(params.sd2);
    const t        = safeNum(params.t);
    const df       = safeNum(params.df);
    const pValue   = safeNum(params.pValue, 1);
    const cohensD  = params.cohensD != null ? safeNum(params.cohensD) : params.cohensD;

    const isWelch = leveneP != null && leveneP < 0.05;
    const testName = isWelch 
        ? (locale === 'vi' ? "Kiểm định t-test của Welch" : "Welch's t-test") 
        : (locale === 'vi' ? 'Kiểm định t-test mẫu độc lập' : 'an independent-samples t-test');

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Cohen, J. (1988). Statistical power analysis for the behavioral sciences (2nd ed.). Lawrence Erlbaum Associates.',
        'Delacre, M., Lakens, D., & Leys, C. (2017). Why psychologists should by default use Welch\'s t-test. International Review of Social Psychology, 30(1), 92–101.',
        'Field, A. (2018). Discovering statistics using IBM SPSS Statistics (5th ed.). SAGE Publications.',
    ];

    const meanDiff   = Math.abs(mean1 - mean2);
    const higherGroup = mean1 > mean2 ? group1Name : group2Name;
    const lowerGroup  = mean1 > mean2 ? group2Name : group1Name;
    const mH = Math.max(mean1, mean2);
    const mL = Math.min(mean1, mean2);
    const sdH = mean1 > mean2 ? sd1 : sd2;
    const sdL = mean1 > mean2 ? sd2 : sd1;

    let summary = '';

    if (pValue > 0.05) {
        summary = locale === 'vi'
            ? `${testName} (${isWelch ? 'đã hiệu chỉnh Welch do phương sai không đồng nhất' : 'giả định phương sai đồng nhất'}) được thực hiện để so sánh giá trị trung bình của "${targetVar}" giữa nhóm ${group1Name} (M = ${formatNum(mean1)}, SD = ${formatNum(sd1)}) và nhóm ${group2Name} (M = ${formatNum(mean2)}, SD = ${formatNum(sd2)}). Sự khác biệt giá trị trung bình (ΔM = ${formatNum(meanDiff)}) không có ý nghĩa thống kê ở mức α = .05: t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}. Hãy xem xét khoảng tin cậy 95% của độ lệch trung bình để đánh giá giới hạn của hiệu ứng thực tế.`
            : `${isWelch ? "Welch's t-test" : 'An independent-samples t-test'} (${isWelch ? 'Welch\'s correction applied due to unequal variances' : 'equal variances assumed'}) was conducted to compare "${targetVar}" between the ${group1Name} group (M = ${formatNum(mean1)}, SD = ${formatNum(sd1)}) and the ${group2Name} group (M = ${formatNum(mean2)}, SD = ${formatNum(sd2)}). The difference in means (ΔM = ${formatNum(meanDiff)}) was not statistically significant at α = .05: t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}. Interpret the 95% confidence interval for the mean difference to gauge the range of plausible effects.`;
    } else {
        summary = locale === 'vi'
            ? `${testName} (${isWelch ? 'đã hiệu chỉnh Welch do phương sai không đồng nhất' : 'giả định phương sai đồng nhất'}) cho thấy sự khác biệt có ý nghĩa thống kê về "${targetVar}" giữa nhóm ${group1Name} (M = ${formatNum(mH)}, SD = ${formatNum(sdH)}) và nhóm ${group2Name} (M = ${formatNum(mL)}, SD = ${formatNum(sdL)}), t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}, α = .05. Nhóm ${higherGroup} có điểm số cao hơn đáng kể so với nhóm ${lowerGroup} (ΔM = ${formatNum(meanDiff)}).`
            : `${isWelch ? "Welch's t-test" : 'An independent-samples t-test'} (${isWelch ? 'Welch\'s correction applied due to unequal variances' : 'equal variances assumed'}) revealed a statistically significant difference in "${targetVar}" between the ${group1Name} group (M = ${formatNum(mH)}, SD = ${formatNum(sdH)}) and the ${group2Name} group (M = ${formatNum(mL)}, SD = ${formatNum(sdL)}), t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}, α = .05. The ${higherGroup} group scored significantly higher than the ${lowerGroup} group (ΔM = ${formatNum(meanDiff)}).`;
    }

    // Effect size
    if (cohensD != null) {
        const d = Math.abs(cohensD);
        const label = locale === 'vi'
            ? (d < 0.20 ? 'không đáng kể' : d < 0.50 ? 'nhỏ' : d < 0.80 ? 'trung bình' : 'lớn')
            : (d < 0.20 ? 'negligible' : d < 0.50 ? 'small' : d < 0.80 ? 'medium' : 'large');
        details.push(locale === 'vi'
            ? `Kích thước hiệu ứng (Effect size): Cohen's d = ${formatNum(cohensD)} (Mức độ ${label}; Thang đo Cohen: < .20 không đáng kể, .20–.49 nhỏ, .50–.79 trung bình, ≥ .80 lớn).`
            : `Effect size: Cohen's d = ${formatNum(cohensD)} (${label}; Cohen's benchmarks: negligible < .20, small .20–.49, medium .50–.79, large ≥ .80).`
        );
        if (d < 0.20 && pValue < 0.05) {
            warnings.push(locale === 'vi'
                ? `Mặc dù p < 0.05, nhưng kích thước hiệu ứng rất nhỏ (d = ${formatNum(cohensD)}). Với N lớn, những khác biệt không quan trọng trong thực tế cũng có thể đạt ý nghĩa thống kê; cần cân nhắc mức độ quan trọng thực tiễn.`
                : `The effect size (d = ${formatNum(cohensD)}) is negligible despite statistical significance. With large N, even trivial differences reach significance; practical importance should be evaluated carefully.`
            );
        }
    }

    // Assumption checks
    if (isWelch) {
        warnings.push(locale === 'vi'
            ? `Kiểm định Levene cho thấy các phương sai không đồng nhất (${formatPValue(leveneP!)}). Do đó, T-Test của Welch đã được áp dụng vì nó ổn định hơn khi có phương sai sai số thay đổi (Delacre et al., 2017).`
            : `Levene's Test indicated unequal variances (${formatPValue(leveneP!)}). Welch's t-test was applied, which is robust to heteroscedasticity (Delacre et al., 2017; recommended as the default t-test).`
        );
    }
    if (shapiroP1 != null && shapiroP1 < 0.05) {
        warnings.push(locale === 'vi'
            ? `Nhóm ${group1Name} vi phạm giả định phân phối chuẩn (Shapiro-Wilk, ${formatPValue(shapiroP1)}). Nếu cỡ mẫu quá nhỏ, khuyên dùng kiểm định phi tham số Mann-Whitney U.`
            : `The ${group1Name} group violated the normality assumption (Shapiro-Wilk, ${formatPValue(shapiroP1)}). The Mann-Whitney U test is recommended as a non-parametric alternative when normality cannot be assumed.`
        );
    }
    if (shapiroP2 != null && shapiroP2 < 0.05) {
        warnings.push(locale === 'vi'
            ? `Nhóm ${group2Name} vi phạm giả định phân phối chuẩn (Shapiro-Wilk, ${formatPValue(shapiroP2)}). Cân nhắc dùng Mann-Whitney U làm phương án thay thế vững chắc hơn.`
            : `The ${group2Name} group violated the normality assumption (Shapiro-Wilk, ${formatPValue(shapiroP2)}). Consider the Mann-Whitney U test as a robust alternative.`
        );
    }

    details.push(
        `APA 7 reporting format: t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}${cohensD != null ? `, d = ${formatNum(Math.abs(cohensD))}` : ''}.`
    );

    return {
        summary, details, warnings, citations,
        verdict: pValue < 0.05 ? 'pass' : 'warning',
        apaStatement: pValue < 0.05
            ? (locale === 'vi'
                ? `${testName} cho thấy sự khác biệt có ý nghĩa thống kê đối với "${targetVar}" giữa nhóm ${group1Name} (M = ${formatNum(mean1)}, SD = ${formatNum(sd1)}) và ${group2Name} (M = ${formatNum(mean2)}, SD = ${formatNum(sd2)}), t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}${cohensD != null ? `, d = ${formatNum(Math.abs(cohensD))}` : ''}.`
                : `${isWelch ? "Welch's t-test" : 'An independent-samples t-test'} revealed a statistically significant difference in "${targetVar}" between the ${group1Name} (M = ${formatNum(mean1)}, SD = ${formatNum(sd1)}) and ${group2Name} (M = ${formatNum(mean2)}, SD = ${formatNum(sd2)}) groups, t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}${cohensD != null ? `, d = ${formatNum(Math.abs(cohensD))}` : ''}.`)
            : (locale === 'vi'
                ? `Không phát hiện thấy sự khác biệt có ý nghĩa thống kê về "${targetVar}" giữa nhóm ${group1Name} và nhóm ${group2Name}, t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}.`
                : `No statistically significant difference was found in "${targetVar}" between the ${group1Name} and ${group2Name} groups, t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}.`),
        recommendations: pValue < 0.05
            ? (locale === 'vi' ? [
                cohensD != null && Math.abs(cohensD) < 0.20 ? 'Kích thước hiệu ứng quá nhỏ (d < .20) — hãy đánh giá tầm quan trọng trong thực tiễn trước khi đưa ra kết luận chiến lược.' : 'Báo cáo chỉ số Cohen\'s d cùng với giá trị t để thể hiện mức độ mạnh/yếu của sự khác biệt.',
                'Cân nhắc báo cáo thêm khoảng tin cậy 95% của độ lệch chuẩn trung bình.',
                isWelch ? 'Hiệu chỉnh Welch đã được áp dụng hợp lý — duy trì phương pháp này cho các báo cáo sau.' : 'Sử dụng Levene\'s test để chứng minh các phương sai đồng nhất.'
            ] : [
                cohensD != null && Math.abs(cohensD) < 0.20 ? 'Effect size is negligible (d < .20) despite significance — evaluate practical importance before drawing conclusions.' : 'Report Cohen\'s d alongside the t-statistic for standardised effect magnitude.',
                'Consider reporting 95% CI for the mean difference to quantify practical significance.',
                isWelch ? 'Welch\'s correction was appropriately applied — retain this approach in all future comparisons.' : 'Run Levene\'s test to verify the equal-variance assumption; switch to Welch\'s t-test if p < .05.',
            ])
            : (locale === 'vi' ? [
                'Báo cáo khoảng tin cậy 95% cho sự khác biệt trung bình để làm rõ vùng giới hạn của hiệu ứng.',
                'Kiểm tra lại xem cỡ mẫu có đủ lớn (power) để phát hiện ra sự khác biệt hay không.',
                'Nếu vi phạm phân phối chuẩn, hãy sử dụng Mann-Whitney U test thay thế.'
            ] : [
                'Report the 95% CI for the mean difference to bound the plausible range of the effect.',
                'Verify that the study was adequately powered to detect the expected effect size.',
                'If normality is violated, the Mann-Whitney U test is the appropriate non-parametric alternative.',
            ]),
        insight: {
            benchmarkContext: locale === 'vi' ? 'So sánh với chuẩn nghiên cứu kinh tế học/quản trị kinh doanh.' : 'Comparison against economics/management benchmarks.',
            practicalSignificance: locale === 'vi' 
                ? (cohensD != null && Math.abs(cohensD) < 0.20 
                    ? `Sự khác biệt mang ý nghĩa thống kê nhưng quá nhỏ bé về mặt thực tiễn (d = ${formatNum(Math.abs(cohensD))}). Các nhà quản trị không nên đưa ra quyết định hoặc thay đổi chiến lược dựa trên khác biệt này.`
                    : pValue < 0.05 
                        ? `Khác biệt đáng kể về mặt thực tiễn (d = ${formatNum(Math.abs(cohensD ?? 0))}). Điều này ủng hộ việc thiết kế chiến lược riêng biệt hoặc phân khúc nhóm đối tượng.`
                        : `Sự khác biệt không đáng kể; việc áp dụng cùng một chính sách/chiến lược chung cho cả hai nhóm là hoàn toàn hợp lý và tiết kiệm nguồn lực.`)
                : (cohensD != null && Math.abs(cohensD) < 0.20 
                    ? `The difference is statistically significant but practically negligible (d = ${formatNum(Math.abs(cohensD))}). Managers should not base strategic changes on this difference.`
                    : pValue < 0.05 
                        ? `Practically significant difference (d = ${formatNum(Math.abs(cohensD ?? 0))}). This supports tailored strategies or audience segmentation.`
                        : `Negligible difference; applying a uniform policy or strategy across both groups is reasonable and resource-efficient.`),
            publishabilityNote: pValue < 0.05 ? 'strong' : 'insufficient',
            writingTip: locale === 'vi' ? 'Sử dụng Cohen\'s d để nhấn mạnh ý nghĩa thực tiễn, không chỉ dựa vào p-value.' : 'Report Cohen\'s d to emphasize practical significance alongside the p-value.',
            researchImplication: locale === 'vi' ? 'Kết luận về giả thuyết so sánh trung bình.' : 'Conclusion for mean comparison hypothesis.'
        }
    };
}


// ─── PAIRED-SAMPLES T-TEST ────────────────────────────────────────────────────

export function interpretTTestPaired(params: {
    targetVar:      string;
    meanBefore:     number;
    sdBefore:       number;
    meanAfter:      number;
    sdAfter:        number;
    meanDiff:       number;
    t:              number;
    df:             number;
    pValue:         number;
    cohensD?:       number;
    normalityDiffP?: number;
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const { targetVar, normalityDiffP } = params;
    const meanBefore = safeNum(params.meanBefore);
    const sdBefore   = safeNum(params.sdBefore);
    const meanAfter  = safeNum(params.meanAfter);
    const sdAfter    = safeNum(params.sdAfter);
    const meanDiff   = safeNum(params.meanDiff);
    const t          = safeNum(params.t);
    const df         = safeNum(params.df);
    const pValue     = safeNum(params.pValue, 1);
    const cohensD    = params.cohensD != null ? safeNum(params.cohensD) : params.cohensD;

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Cohen, J. (1988). Statistical power analysis for the behavioral sciences (2nd ed.). Lawrence Erlbaum Associates.',
        'Field, A. (2018). Discovering statistics using IBM SPSS Statistics (5th ed.). SAGE Publications.',
    ];

    const direction = meanDiff > 0 ? (locale === 'vi' ? 'giảm' : 'decreased') : (locale === 'vi' ? 'tăng' : 'increased');

    let summary = '';

    if (pValue > 0.05) {
        summary = locale === 'vi'
            ? `Kiểm định t-test mẫu bắt cặp được thực hiện để đánh giá sự thay đổi của "${targetVar}" qua 2 lần đo lường. Sự khác biệt giữa giá trị trước (M = ${formatNum(meanBefore)}, SD = ${formatNum(sdBefore)}) và sau (M = ${formatNum(meanAfter)}, SD = ${formatNum(sdAfter)}) (ΔM = ${formatNum(Math.abs(meanDiff))}) không đạt ý nghĩa thống kê ở mức α = .05: t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}. Nên báo cáo thêm khoảng tin cậy 95% của độ lệch trung bình để biểu thị độ chính xác của ước lượng.`
            : `A paired-samples t-test was conducted to evaluate change in "${targetVar}" across two related measurement occasions. The mean difference between pre-test (M = ${formatNum(meanBefore)}, SD = ${formatNum(sdBefore)}) and post-test (M = ${formatNum(meanAfter)}, SD = ${formatNum(sdAfter)}) (ΔM = ${formatNum(Math.abs(meanDiff))}) did not reach statistical significance at α = .05: t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}. A 95% CI for the mean difference should be reported to convey the precision of the estimate.`;
    } else {
        summary = locale === 'vi'
            ? `Kiểm định t-test mẫu bắt cặp cho thấy sự thay đổi mang ý nghĩa thống kê đối với "${targetVar}" giữa 2 lần đo lường (α = .05), t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}. Điểm số trung bình đã ${direction} từ thời điểm đầu (M = ${formatNum(meanBefore)}, SD = ${formatNum(sdBefore)}) so với thời điểm sau (M = ${formatNum(meanAfter)}, SD = ${formatNum(sdAfter)}), tương ứng mức khác biệt trung bình là ${formatNum(Math.abs(meanDiff))}.`
            : `A paired-samples t-test indicated a statistically significant change in "${targetVar}" between the two measurement occasions (α = .05), t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}. Mean scores ${direction} from the pre-test (M = ${formatNum(meanBefore)}, SD = ${formatNum(sdBefore)}) to the post-test (M = ${formatNum(meanAfter)}, SD = ${formatNum(sdAfter)}), yielding a mean difference of ${formatNum(Math.abs(meanDiff))}.`;
    }

    if (cohensD != null) {
        const d = Math.abs(cohensD);
        const label = locale === 'vi'
            ? (d < 0.20 ? 'không đáng kể' : d < 0.50 ? 'nhỏ' : d < 0.80 ? 'trung bình' : 'lớn')
            : (d < 0.20 ? 'negligible' : d < 0.50 ? 'small' : d < 0.80 ? 'medium' : 'large');
        details.push(locale === 'vi'
            ? `Kích thước hiệu ứng: Cohen's d = ${formatNum(cohensD)} (Mức độ ${label}). Cohen's d cho mẫu bắt cặp sử dụng độ lệch chuẩn (SD) của các điểm chênh lệch làm chuẩn hoá; Thang đo: < .20 không đáng kể, .20–.49 nhỏ, .50–.79 trung bình, ≥ .80 lớn (Cohen, 1988).`
            : `Effect size: Cohen's d = ${formatNum(cohensD)} (${label} effect). Cohen's d for paired data uses the SD of difference scores as the standardizer; benchmarks: negligible < .20, small .20–.49, medium .50–.79, large ≥ .80 (Cohen, 1988).`
        );
    }

    details.push(
        `APA 7 reporting: t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}${cohensD != null ? `, d = ${formatNum(Math.abs(cohensD))}` : ''}.`
    );

    if (normalityDiffP != null && normalityDiffP > 0 && normalityDiffP < 0.05) {
        warnings.push(locale === 'vi'
            ? `Phân phối của các điểm chênh lệch vi phạm giả định chuẩn (Shapiro-Wilk, ${formatPValue(normalityDiffP)}). Kiểm định Wilcoxon Signed-Rank được khuyên dùng để thay thế (đối với mẫu nhỏ). Tuy nhiên, t-test khá ổn định với vi phạm này nếu N ≥ 30.`
            : `The distribution of difference scores violated normality (Shapiro-Wilk, ${formatPValue(normalityDiffP)}). The Wilcoxon Signed-Rank Test is recommended as a non-parametric alternative. The t-test is robust to moderate non-normality when N ≥ 30.`
        );
    }

    return {
        summary, details, warnings, citations,
        verdict: pValue < 0.05 ? 'pass' : 'warning',
        apaStatement: pValue < 0.05
            ? (locale === 'vi'
                ? `Kiểm định t-test mẫu bắt cặp cho thấy sự thay đổi có ý nghĩa thống kê của "${targetVar}" giữa 2 lần đo, t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}${cohensD != null ? `, d = ${formatNum(Math.abs(cohensD))}` : ''}. Điểm trung bình thay đổi từ M = ${formatNum(meanBefore)}, SD = ${formatNum(sdBefore)} sang M = ${formatNum(meanAfter)}, SD = ${formatNum(sdAfter)}.`
                : `A paired-samples t-test indicated a statistically significant change in "${targetVar}" between the two measurement occasions, t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}${cohensD != null ? `, d = ${formatNum(Math.abs(cohensD))}` : ''}. Mean scores changed from M = ${formatNum(meanBefore)}, SD = ${formatNum(sdBefore)} to M = ${formatNum(meanAfter)}, SD = ${formatNum(sdAfter)}.`)
            : (locale === 'vi'
                ? `Không phát hiện thấy sự thay đổi có ý nghĩa thống kê đối với "${targetVar}" giữa các lần đo, t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}.`
                : `No statistically significant change was found in "${targetVar}" between measurement occasions, t(${formatNum(df, 0)}) = ${formatNum(t)}, ${formatPValue(pValue)}.`),
        recommendations: pValue < 0.05
            ? (locale === 'vi' ? [
                'Báo cáo Cohen\'s d cho dữ liệu bắt cặp nhằm thể hiện mức độ mạnh yếu của sự thay đổi.',
                'Báo cáo khoảng tin cậy 95% của trung bình độ lệch.',
                normalityDiffP != null && normalityDiffP < 0.05
                    ? 'Vi phạm phân phối chuẩn độ chênh lệch — cân nhắc báo cáo kết quả Wilcoxon Signed-Rank song song để chứng minh tính vững chắc của kết quả.'
                    : 'Hãy đảm bảo thiết kế nghiên cứu trước-sau đã kiểm soát tốt các biến ngoại lai (ví dụ hiệu ứng trưởng thành, hiệu ứng làm quen test).'
            ] : [
                'Report Cohen\'s d for paired data to express the standardised magnitude of change.',
                'Report the 95% CI for the mean difference to communicate precision of the estimate.',
                normalityDiffP != null && normalityDiffP < 0.05
                    ? 'Difference scores violated normality — consider reporting Wilcoxon Signed-Rank results alongside for robustness.'
                    : 'Verify that the pre-post design adequately controls for confounds (e.g., maturation, testing effects).',
            ])
            : (locale === 'vi' ? [
                'Báo cáo 95% CI cho độ lệch trung bình; việc giá trị p > 0.05 không đồng nghĩa với không có sự thay đổi thực tế.',
                'Đánh giá lại power của test thống kê — test có thể đang thiếu lực để phát hiện sự thay đổi cỡ nhỏ.',
                'Nếu vi phạm giả định phân phối chuẩn, hãy thử dùng kiểm định Wilcoxon Signed-Rank.'
            ] : [
                'Report the 95% CI for the mean difference; a non-significant p-value does not imply no change.',
                'Evaluate statistical power — the test may be underpowered to detect the expected effect.',
                'If normality of difference scores is violated, the Wilcoxon Signed-Rank Test is the appropriate alternative.',
            ]),
    };
}


// ─── ONE-WAY ANOVA ────────────────────────────────────────────────────────────

export function interpretANOVA(params: {
    factorVar:        string;
    targetVar:        string;
    F:                number;
    dfBetween:        number;
    dfWithin:         number;
    pValue:           number;
    etaSquared?:      number;
    methodUsed?:      string;
    leveneP?:         number;
    normalityResidP?: number;
    postHoc?:         { comparison: string; diff: number; pAdj: number }[];
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const {
        factorVar, targetVar, methodUsed, leveneP, normalityResidP, postHoc
    } = params;
    const F           = safeNum(params.F);
    const dfBetween   = safeNum(params.dfBetween);
    const dfWithin    = safeNum(params.dfWithin);
    const pValue      = safeNum(params.pValue, 1);
    const etaSquared  = params.etaSquared != null ? safeNum(params.etaSquared) : params.etaSquared;

    const isWelch = methodUsed?.toLowerCase().includes('welch') ?? false;

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Cohen, J. (1988). Statistical power analysis for the behavioral sciences (2nd ed.). Lawrence Erlbaum Associates.',
        'Richardson, J. T. E. (2011). Eta squared and partial eta squared as measures of effect size in educational research. Educational Research Review, 6(2), 135–147.',
        'Field, A. (2018). Discovering statistics using IBM SPSS Statistics (5th ed.). SAGE Publications.',
    ];

    let summary = '';

    if (pValue > 0.05) {
        summary = locale === 'vi'
            ? `Phân tích ${isWelch ? 'Welch ANOVA một chiều' : 'ANOVA một chiều'} được thực hiện để kiểm tra xem giá trị của "${targetVar}" có khác biệt giữa các nhóm của "${factorVar}" hay không. Kiểm định tổng thể F không đạt mức ý nghĩa thống kê (α = .05): F(${formatNum(dfBetween, 0)}, ${formatNum(dfWithin, 0)}) = ${formatNum(F)}, ${formatPValue(pValue)}. Giả thuyết null về sự bằng nhau của các trung bình nhóm được giữ lại. Hãy kiểm tra khoảng tin cậy 95% của các nhóm để đánh giá độ lớn thực tế của các khác biệt (nếu có).`
            : `${isWelch ? 'A Welch one-way ANOVA' : 'A one-way ANOVA'} was conducted to examine whether "${targetVar}" differed across levels of "${factorVar}." The omnibus F-test was not statistically significant (α = .05): F(${formatNum(dfBetween, 0)}, ${formatNum(dfWithin, 0)}) = ${formatNum(F)}, ${formatPValue(pValue)}. The null hypothesis of equal population group means was retained. Inspect the 95% CIs on group means to evaluate the practical magnitude of any observed differences.`;
    } else {
        summary = locale === 'vi'
            ? `Phân tích ${isWelch ? 'Welch ANOVA một chiều' : 'ANOVA một chiều'} cho thấy có ảnh hưởng mang ý nghĩa thống kê của "${factorVar}" lên "${targetVar}" (α = .05): F(${formatNum(dfBetween, 0)}, ${formatNum(dfWithin, 0)}) = ${formatNum(F)}, ${formatPValue(pValue)}. Cần thực hiện kiểm định so sánh cặp hậu nghiệm (Post-hoc pairwise comparisons) để xác định chính xác cặp nhóm nào có sự khác biệt — vì kiểm định F tổng quát không chỉ ra được vị trí khác biệt.`
            : `${isWelch ? 'A Welch one-way ANOVA' : 'A one-way ANOVA'} revealed a statistically significant effect of "${factorVar}" on "${targetVar}" (α = .05): F(${formatNum(dfBetween, 0)}, ${formatNum(dfWithin, 0)}) = ${formatNum(F)}, ${formatPValue(pValue)}. Post-hoc pairwise comparisons are required to determine which specific groups differ — an omnibus F does not identify the location of differences.`;

        if (postHoc) {
            const sigPairs = postHoc.filter(p => p.pAdj < 0.05);
            if (sigPairs.length > 0) {
                details.push(locale === 'vi'
                    ? `Phân tích hậu nghiệm (${isWelch ? 'Games-Howell' : 'Tukey HSD'}) đã xác định các cặp có sự khác biệt có ý nghĩa như sau: ${sigPairs.map(p => `${p.comparison} (pₐdⱼ ${p.pAdj < 0.001 ? '< .001' : '= ' + formatCoef(p.pAdj)})`).join('; ')}.`
                    : `Post-hoc comparisons (${isWelch ? 'Games-Howell' : 'Tukey HSD'}) identified the following significantly different pairs: ${sigPairs.map(p => `${p.comparison} (pₐdⱼ ${p.pAdj < 0.001 ? '< .001' : '= ' + formatCoef(p.pAdj)})`).join('; ')}.`
                );
            } else {
                details.push(locale === 'vi'
                    ? `Kiểm định hậu nghiệm không tìm thấy bất kỳ cặp nào khác biệt có ý nghĩa sau khi hiệu chỉnh so sánh đa biến — hiệu ứng tổng thể có thể chỉ phản ánh sự phân tán mẫu chung thay vì một sự tách biệt cặp cụ thể.`
                    : `Post-hoc pairwise comparisons did not identify any significantly different group pairs after adjustment for multiple comparisons — the omnibus effect may reflect overall pattern heterogeneity without specific pair-wise separation.`
                );
            }
        }
    }

    if (etaSquared != null) {
        const label = locale === 'vi'
            ? (etaSquared < 0.01 ? 'không đáng kể' : etaSquared < 0.06 ? 'nhỏ' : etaSquared < 0.14 ? 'trung bình' : 'lớn')
            : (etaSquared < 0.01 ? 'negligible' : etaSquared < 0.06 ? 'small' : etaSquared < 0.14 ? 'medium' : 'large');
        details.push(locale === 'vi'
            ? `Kích thước hiệu ứng: η² = ${formatCoef(etaSquared)} (Mức độ ${label}; Thang đo Cohen, 1988: .01 nhỏ, .06 vừa, .14 lớn). η² thể hiện tỷ lệ phương sai của "${targetVar}" được giải thích bởi yếu tố phân nhóm. Lưu ý: η² có xu hướng thiên lệch tăng (biased) trong mẫu nhỏ; ω² (omega-squared) sẽ cho ước lượng tốt hơn.`
            : `Effect size: η² = ${formatCoef(etaSquared)} (${label}; Cohen, 1988 benchmarks: .01 small, .06 medium, .14 large). η² represents the proportion of total variance in "${targetVar}" attributable to group membership. Note: η² is positively biased in small samples; ω² provides a less biased estimate.`
        );
        if (etaSquared < 0.01 && pValue < 0.05) {
            warnings.push(locale === 'vi'
                ? `η² = ${formatCoef(etaSquared)} là quá nhỏ và không đáng kể mặc dù có ý nghĩa thống kê. Kết quả này nhiều khả năng do cỡ mẫu (N) lớn thúc đẩy thay vì do một hiệu ứng khác biệt thực tế giữa các nhóm.`
                : `η² = ${formatCoef(etaSquared)} is negligible despite statistical significance. The result is likely driven by large N rather than a meaningful group effect.`
            );
        }
    }

    if (isWelch && leveneP != null) {
        warnings.push(locale === 'vi'
            ? `Kiểm định Levene có ý nghĩa (${formatPValue(leveneP)}), cho thấy có hiện tượng phương sai không đồng nhất. Welch's ANOVA đã được tự động áp dụng vì phương pháp này rất bền vững trước vi phạm trên.`
            : `Levene's test was significant (${formatPValue(leveneP)}), indicating heteroscedasticity. Welch's ANOVA was applied; its test statistic is robust to unequal variances.`
        );
    }
    if (normalityResidP != null && normalityResidP < 0.05) {
        warnings.push(locale === 'vi'
            ? `Phần dư (residuals) vi phạm giả định phân phối chuẩn (Shapiro-Wilk, ${formatPValue(normalityResidP)}). ANOVA có khả năng chịu đựng (robust) khá tốt với vi phạm này nếu số lượng mẫu mỗi nhóm ≥ 15; với cỡ mẫu nhỏ hơn, khuyên dùng kiểm định Kruskal-Wallis H.`
            : `Residuals violated normality (Shapiro-Wilk, ${formatPValue(normalityResidP)}). ANOVA is moderately robust to this violation when group sizes are ≥ 15; for smaller groups, the Kruskal-Wallis H test is recommended.`
        );
    }

    details.push(
        `APA 7 reporting format: F(${formatNum(dfBetween, 0)}, ${formatNum(dfWithin, 0)}) = ${formatNum(F)}, ` +
        `${formatPValue(pValue)}${etaSquared != null ? `, η² = ${formatCoef(etaSquared)}` : ''}.`
    );

    return {
        summary, details, warnings, citations,
        verdict: pValue < 0.05 ? 'pass' : 'warning',
        apaStatement: pValue < 0.05
            ? (locale === 'vi'
                ? `Kiểm định ${isWelch ? 'Welch ANOVA' : 'ANOVA một chiều'} cho thấy có ảnh hưởng mang ý nghĩa thống kê của "${factorVar}" lên "${targetVar}", F(${formatNum(dfBetween, 0)}, ${formatNum(dfWithin, 0)}) = ${formatNum(F)}, ${formatPValue(pValue)}${etaSquared != null ? `, η² = ${formatCoef(etaSquared)}` : ''}.`
                : `${isWelch ? 'A Welch one-way ANOVA' : 'A one-way ANOVA'} revealed a statistically significant effect of "${factorVar}" on "${targetVar}", F(${formatNum(dfBetween, 0)}, ${formatNum(dfWithin, 0)}) = ${formatNum(F)}, ${formatPValue(pValue)}${etaSquared != null ? `, η² = ${formatCoef(etaSquared)}` : ''}.`)
            : (locale === 'vi'
                ? `Kiểm định ${isWelch ? 'Welch ANOVA' : 'ANOVA một chiều'} không tìm thấy ảnh hưởng nào có ý nghĩa thống kê của "${factorVar}" lên "${targetVar}", F(${formatNum(dfBetween, 0)}, ${formatNum(dfWithin, 0)}) = ${formatNum(F)}, ${formatPValue(pValue)}.`
                : `${isWelch ? 'A Welch one-way ANOVA' : 'A one-way ANOVA'} found no statistically significant effect of "${factorVar}" on "${targetVar}", F(${formatNum(dfBetween, 0)}, ${formatNum(dfWithin, 0)}) = ${formatNum(F)}, ${formatPValue(pValue)}.`),
        recommendations: pValue < 0.05
            ? (locale === 'vi' ? [
                'Thực hiện kiểm định hậu nghiệm Post-hoc (Tukey HSD nếu phương sai đồng nhất, Games-Howell nếu phương sai khác biệt) để chỉ ra chính xác các cặp nhóm khác nhau.',
                etaSquared != null && etaSquared < 0.06 ? 'Kích thước hiệu ứng khá nhỏ (η² < .06) — hãy cân nhắc xem sự khác biệt này có thực sự quan trọng khi áp dụng thực tiễn hay không.' : 'Báo cáo η² (hoặc ω²) cùng giá trị F để thể hiện độ lớn của ảnh hưởng.',
                'Quan sát biểu đồ giá trị trung bình (means plot) và khoảng tin cậy của các nhóm.'
            ] : [
                'Conduct post-hoc pairwise comparisons (Tukey HSD for equal variances, Games-Howell for unequal) to identify which group pairs differ.',
                etaSquared != null && etaSquared < 0.06
                    ? 'Effect size is small (η² < .06) — evaluate practical significance before drawing applied conclusions.'
                    : 'Report η² or ω² (preferred, less biased) alongside F to convey the magnitude of the group effect.',
                'Inspect group means and CIs to characterise the pattern of differences across levels of the factor.',
            ])
            : (locale === 'vi' ? [
                'Chỉ số F không có ý nghĩa thống kê không loại trừ khả năng có sự khác biệt — hãy kiểm tra lại cỡ mẫu xem có đủ lực (power) hay chưa.',
                'Báo cáo khoảng tin cậy của các trung bình nhóm để minh chứng luận điểm các nhóm tương đương nhau.',
                'Nếu vi phạm giả định đồng nhất phương sai (Levene p < .05), cần chạy lại với Welch\'s ANOVA.'
            ] : [
                'A non-significant omnibus F does not rule out differences — verify adequate statistical power.',
                'Report confidence intervals for group means to support equivalence reasoning if relevant.',
                'If homogeneity of variance is violated (Levene p < .05), re-run with Welch\'s ANOVA.',
            ]),
    };
}


// ─── TWO-WAY ANOVA ────────────────────────────────────────────────────────────

export function interpretTwoWayANOVA(params: {
    factor1:       string;
    factor2:       string;
    targetVar:     string;
    mainEffect1F:  number;
    mainEffect1P:  number;
    mainEffect2F:  number;
    mainEffect2P:  number;
    interactionF:  number;
    interactionP:  number;
    df1:           number;
    df2:           number;
    dfError:       number;
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const { factor1, factor2, targetVar } = params;
    const mainEffect1F = safeNum(params.mainEffect1F);
    const mainEffect1P = safeNum(params.mainEffect1P, 1);
    const mainEffect2F = safeNum(params.mainEffect2F);
    const mainEffect2P = safeNum(params.mainEffect2P, 1);
    const interactionF = safeNum(params.interactionF);
    const interactionP = safeNum(params.interactionP, 1);
    const df1          = safeNum(params.df1);
    const df2          = safeNum(params.df2);
    const dfError      = safeNum(params.dfError);

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Field, A. (2018). Discovering statistics using IBM SPSS Statistics (5th ed.). SAGE Publications.',
        'Cohen, J. (1988). Statistical power analysis for the behavioral sciences (2nd ed.). Lawrence Erlbaum Associates.',
    ];

    const hasInteraction = interactionP < 0.05;
    const hasMain1       = mainEffect1P < 0.05;
    const hasMain2       = mainEffect2P < 0.05;
    const dfInteraction  = df1 * df2;

    let summary = '';

    if (hasInteraction) {
        summary = locale === 'vi'
            ? `Phân tích ANOVA hai chiều (Two-way ANOVA) được thực hiện để kiểm tra tác động của "${factor1}" và "${factor2}" lên "${targetVar}". Kết quả cho thấy có hiệu ứng tương tác (interaction effect) mang ý nghĩa thống kê giữa hai yếu tố này (α = .05): F(${formatNum(dfInteraction, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(interactionF)}, ${formatPValue(interactionP)}. Điều này cho thấy tác động của "${factor1}" lên "${targetVar}" bị phụ thuộc vào nhóm của "${factor2}" (và ngược lại). Khi có sự tương tác đáng kể, không nên diễn giải các hiệu ứng chính (main effects) một cách độc lập — cần tiến hành phân tích tác động đơn (simple effects analysis) để phân rã sự tương tác này.`
            : `A two-way between-subjects ANOVA was conducted to examine the effects of "${factor1}" and "${factor2}" on "${targetVar}." A statistically significant interaction effect was obtained (α = .05): F(${formatNum(dfInteraction, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(interactionF)}, ${formatPValue(interactionP)}. This indicates that the effect of "${factor1}" on "${targetVar}" depends on the level of "${factor2}" (and vice versa). When a significant interaction is present, main effects must not be interpreted in isolation — simple effects analysis (spotlight analysis) is required to fully decompose the interaction.`;
        warnings.push(locale === 'vi'
            ? 'Tương tác có ý nghĩa sẽ phủ quyết các tác động chính: hãy phiên dịch các tác động đơn (tác động của từng yếu tố tại mỗi cấp độ của yếu tố kia) thay vì chỉ nhìn vào các tác động chính.'
            : 'A statistically significant interaction overrides the main effects: interpret simple effects (the effect of each factor at each level of the other factor) rather than main effects alone.'
        );
    } else {
        const mainEffects: string[] = [];
        if (hasMain1) mainEffects.push(`"${factor1}" (F(${formatNum(df1, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(mainEffect1F)}, ${formatPValue(mainEffect1P)})`);
        if (hasMain2) mainEffects.push(`"${factor2}" (F(${formatNum(df2, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(mainEffect2F)}, ${formatPValue(mainEffect2P)})`);

        if (mainEffects.length > 0) {
            summary = locale === 'vi'
                ? `Phân tích ANOVA hai chiều cho thấy không có hiệu ứng tương tác có ý nghĩa thống kê giữa "${factor1}" và "${factor2}" (α = .05): F(${formatNum(dfInteraction, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(interactionF)}, ${formatPValue(interactionP)}. Tuy nhiên, quan sát thấy (các) hiệu ứng chính đáng kể đối với ${mainEffects.join(' và ')}, ngụ ý rằng mỗi yếu tố này có khả năng tác động độc lập lên "${targetVar}". Các hiệu ứng chính lúc này có thể được phiên dịch một cách an toàn vì không bị can thiệp bởi tương tác.`
                : `A two-way between-subjects ANOVA revealed no statistically significant interaction between "${factor1}" and "${factor2}" (α = .05): F(${formatNum(dfInteraction, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(interactionF)}, ${formatPValue(interactionP)}. However, significant main effect${mainEffects.length > 1 ? 's' : ''} were observed for ${mainEffects.join(' and ')}, indicating that each factor independently influences "${targetVar}." Main effects are interpretable in the absence of a significant interaction.`;
        } else {
            summary = locale === 'vi'
                ? `Phân tích ANOVA hai chiều không tìm thấy hiệu ứng tương tác (F(${formatNum(dfInteraction, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(interactionF)}, ${formatPValue(interactionP)}) cũng như không có bất kỳ hiệu ứng chính đáng kể nào của "${factor1}" hay "${factor2}" lên "${targetVar}" (α = .05).`
                : `A two-way between-subjects ANOVA indicated neither a statistically significant interaction (F(${formatNum(dfInteraction, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(interactionF)}, ${formatPValue(interactionP)}) nor significant main effects for "${factor1}" or "${factor2}" on "${targetVar}" (α = .05).`;
        }
    }

    details.push(locale === 'vi'
        ? `Hiệu ứng chính của "${factor1}": F(${formatNum(df1, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(mainEffect1F)}, ${formatPValue(mainEffect1P)}.`
        : `Main effect of "${factor1}": F(${formatNum(df1, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(mainEffect1F)}, ${formatPValue(mainEffect1P)}.`
    );
    details.push(locale === 'vi'
        ? `Hiệu ứng chính của "${factor2}": F(${formatNum(df2, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(mainEffect2F)}, ${formatPValue(mainEffect2P)}.`
        : `Main effect of "${factor2}": F(${formatNum(df2, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(mainEffect2F)}, ${formatPValue(mainEffect2P)}.`
    );
    details.push(locale === 'vi'
        ? `Tương tác (${factor1} × ${factor2}): F(${formatNum(dfInteraction, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(interactionF)}, ${formatPValue(interactionP)}.`
        : `Interaction (${factor1} × ${factor2}): F(${formatNum(dfInteraction, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(interactionF)}, ${formatPValue(interactionP)}.`
    );
    details.push(locale === 'vi'
        ? 'Nên báo cáo Partial η² (ηₚ²) làm thước đo kích thước hiệu ứng (effect size) trong mô hình ANOVA 2 chiều, bởi vì η² thông thường sẽ bị nhiễu do các yếu tố khác trong mô hình (Cohen, 1988).'
        : 'Report partial η² (ηₚ²) as the effect size for each effect in a two-way design, as η² is confounded by other effects in the model (Cohen, 1988).'
    );

    return {
        summary, details, warnings, citations,
        verdict: hasInteraction || hasMain1 || hasMain2 ? 'pass' : 'warning',
        apaStatement: hasInteraction
            ? (locale === 'vi'
                ? `ANOVA hai chiều cho thấy hiệu ứng tương tác có ý nghĩa thống kê giữa "${factor1}" và "${factor2}" lên "${targetVar}", F(${formatNum(dfInteraction, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(interactionF)}, ${formatPValue(interactionP)}.`
                : `A two-way ANOVA revealed a statistically significant interaction between "${factor1}" and "${factor2}" on "${targetVar}", F(${formatNum(dfInteraction, 0)}, ${formatNum(dfError, 0)}) = ${formatNum(interactionF)}, ${formatPValue(interactionP)}.`)
            : hasMain1 || hasMain2
                ? (locale === 'vi'
                    ? `ANOVA hai chiều không tìm thấy hiệu ứng tương tác (p = ${formatPValue(interactionP)}), nhưng phát hiện (các) hiệu ứng chính đáng kể đối với ${[hasMain1 ? `"${factor1}"` : null, hasMain2 ? `"${factor2}"` : null].filter(Boolean).join(' và ')} lên "${targetVar}".`
                    : `A two-way ANOVA found no significant interaction (p = ${formatPValue(interactionP)}), but significant main effect(s) for ${[hasMain1 ? `"${factor1}"` : null, hasMain2 ? `"${factor2}"` : null].filter(Boolean).join(' and ')} on "${targetVar}".`)
                : (locale === 'vi'
                    ? `ANOVA hai chiều không tìm thấy tương tác hay hiệu ứng chính đáng kể nào của "${factor1}" hoặc "${factor2}" lên "${targetVar}".`
                    : `A two-way ANOVA found no statistically significant interaction or main effects for "${factor1}" or "${factor2}" on "${targetVar}".`),
        recommendations: hasInteraction
            ? (locale === 'vi' ? [
                'Phiên dịch tương tác này bằng cách chạy phân tích tác động đơn (Simple effects analysis).',
                'Vẽ đồ thị tương tác (interaction plot) trực quan hóa xu hướng giá trị trung bình qua các nhóm.',
                'Báo cáo Partial η² của thành phần tương tác như là thước đo mức độ ảnh hưởng chính.'
            ] : [
                'Interpret the interaction by conducting simple effects analysis (the effect of each factor at each level of the other).',
                'Plot the cell means (interaction plot) to visualise the pattern of the interaction.',
                'Report partial η² for the interaction term as the primary effect size.',
            ])
            : (locale === 'vi' ? [
                hasMain1 || hasMain2 ? 'Tiến hành phân tích hậu nghiệm (post-hoc) cho các tác động chính để tìm hiểu nhóm con nào đang có sự khác biệt rõ rệt.' : 'Kiểm tra lại xem cỡ mẫu đã đủ lớn chưa (kiểm định tương tác yêu cầu N lớn gấp 4 lần so với kiểm định hiệu ứng chính).',
                'Báo cáo Partial η² cho mỗi hiệu ứng chính để so sánh chéo.',
                'Hãy kiểm tra tính cân bằng của số liệu — các nhóm không bằng nhau có thể làm xô lệch việc phân rã tổng bình phương Type III.'
            ] : [
                hasMain1 || hasMain2 ? 'Conduct post-hoc comparisons for significant main effects to identify specific group differences.' : 'Verify the study is adequately powered to detect interaction effects (interactions require approximately 4× the sample size of main effects).',
                'Report partial η² for each main effect for comparability across studies.',
                'Consider whether the design is balanced — unequal cell sizes can affect Type III SS decomposition.',
            ]),
    };
}


// ─── MANN-WHITNEY U TEST ─────────────────────────────────────────────────────

export function interpretMannWhitney(params: {
    group1Name:     string;
    group2Name:     string;
    targetVar:      string;
    statistic:      number;
    pValue:         number;
    median1:        number;
    median2:        number;
    effectSize?:    number;
    distSimilar?:   boolean;
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const { group1Name, group2Name, targetVar, distSimilar } = params;
    const statistic   = safeNum(params.statistic);
    const pValue      = safeNum(params.pValue, 1);
    const median1     = safeNum(params.median1);
    const median2     = safeNum(params.median2);
    const effectSize  = params.effectSize != null ? safeNum(params.effectSize) : params.effectSize;

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Mann, H. B., & Whitney, D. R. (1947). On a test of whether one of two random variables is stochastically larger than the other. Annals of Mathematical Statistics, 18(1), 50–60. https://doi.org/10.1214/aoms/1177730491',
        'Fritz, C. O., Morris, P. E., & Richler, J. J. (2012). Effect size estimates: Current use, calculations, and interpretation. Journal of Experimental Psychology: General, 141(1), 2–18.',
        'Field, A. (2018). Discovering statistics using IBM SPSS Statistics (5th ed.). SAGE Publications.',
    ];

    const higherGroup = median1 > median2 ? group1Name : group2Name;
    const lowerGroup  = median1 > median2 ? group2Name : group1Name;

    let summary = '';

    if (pValue > 0.05) {
        summary = locale === 'vi'
            ? `Kiểm định Mann-Whitney U được thực hiện như một phương án phi tham số thay thế cho T-Test mẫu độc lập, nhằm so sánh phân phối thứ hạng của "${targetVar}" giữa nhóm ${group1Name} (Mdn = ${formatNum(median1)}) và nhóm ${group2Name} (Mdn = ${formatNum(median2)}). Kiểm định không đạt ý nghĩa thống kê (α = .05): U = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}.`
            : `A Mann-Whitney U test was conducted as a non-parametric alternative to the independent-samples t-test, to compare the rank distribution of "${targetVar}" between the ${group1Name} (Mdn = ${formatNum(median1)}) and ${group2Name} (Mdn = ${formatNum(median2)}) groups. The test did not reach statistical significance (α = .05): U = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}.`;
    } else {
        summary = locale === 'vi'
            ? `Kiểm định Mann-Whitney U cho thấy có sự khác biệt mang ý nghĩa thống kê trong phân phối thứ hạng của "${targetVar}" giữa các nhóm (α = .05): U = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}. Nhóm ${higherGroup} (Mdn = ${formatNum(Math.max(median1, median2))}) có thứ hạng cao hơn đáng kể so với nhóm ${lowerGroup} (Mdn = ${formatNum(Math.min(median1, median2))}).`
            : `A Mann-Whitney U test indicated a statistically significant difference in the rank distribution of "${targetVar}" between groups (α = .05): U = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}. The ${higherGroup} group (Mdn = ${formatNum(Math.max(median1, median2))}) demonstrated significantly higher ranks than the ${lowerGroup} group (Mdn = ${formatNum(Math.min(median1, median2))}).`;
    }

    if (effectSize != null) {
        const r = Math.abs(effectSize);
        const label = locale === 'vi'
            ? (r < 0.10 ? 'không đáng kể' : r < 0.30 ? 'nhỏ' : r < 0.50 ? 'trung bình' : 'lớn')
            : (r < 0.10 ? 'negligible' : r < 0.30 ? 'small' : r < 0.50 ? 'medium' : 'large');
        details.push(locale === 'vi'
            ? `Kích thước hiệu ứng: hệ số tương quan thứ bậc biserial r = ${formatCoef(effectSize)} (Mức độ ${label}). Tính bằng công thức |z| / √N; Thang đo Cohen (1988): < .10 không đáng kể, .10–.29 nhỏ, .30–.49 trung bình, ≥ .50 lớn (Fritz et al., 2012).`
            : `Effect size: rank-biserial correlation r = ${formatCoef(effectSize)} (${label}). Computed as |z| / √N; benchmarks per Cohen (1988): negligible < .10, small .10–.29, medium .30–.49, large ≥ .50 (Fritz et al., 2012).`
        );
    }

    if (distSimilar != null) {
        details.push(locale === 'vi'
            ? (distSimilar ? 'Hình dạng phân phối của hai nhóm tương đồng, do đó có thể so sánh trực tiếp Trung vị (Median).' : 'Hình dạng phân phối của hai nhóm khác nhau, do đó kiểm định đánh giá Hạng trung bình (Mean Rank) thay vì Trung vị.')
            : (distSimilar ? 'The distributions of the two groups are similar; thus, medians can be directly compared.' : 'The distributions of the two groups differ; the test evaluates mean ranks rather than medians.')
        );
    }

    warnings.push(locale === 'vi'
        ? 'Kiểm định Mann-Whitney U đánh giá sự thống trị ngẫu nhiên (xếp hạng thứ bậc), không kiểm định trực tiếp trung vị (medians). Việc dùng trung vị để đại diện chỉ hợp lệ khi hình dạng phân phối của 2 nhóm hoàn toàn giống nhau. Hãy báo cáo trung vị song song với giá trị U để bài viết trực quan hơn.'
        : 'The Mann-Whitney U test evaluates stochastic dominance (rank-ordering), not specifically medians. Medians are valid descriptors only when the distributional shapes of the two groups are identical. Report medians alongside the U statistic for interpretability.'
    );

    details.push(
        `APA 7 reporting: U = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}${effectSize != null ? `, r = ${formatCoef(Math.abs(effectSize))}` : ''}.`
    );

    return {
        summary, details, warnings, citations,
        verdict: pValue < 0.05 ? 'pass' : 'warning',
        apaStatement: pValue < 0.05
            ? (locale === 'vi'
                ? `Kiểm định Mann-Whitney U cho thấy sự khác biệt có ý nghĩa thống kê về "${targetVar}" giữa nhóm ${group1Name} (Mdn = ${formatNum(median1)}) và ${group2Name} (Mdn = ${formatNum(median2)}), U = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}${effectSize != null ? `, r = ${formatCoef(Math.abs(effectSize))}` : ''}.`
                : `A Mann-Whitney U test indicated a statistically significant difference in "${targetVar}" between the ${group1Name} (Mdn = ${formatNum(median1)}) and ${group2Name} (Mdn = ${formatNum(median2)}) groups, U = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}${effectSize != null ? `, r = ${formatCoef(Math.abs(effectSize))}` : ''}.`)
            : (locale === 'vi'
                ? `Kiểm định Mann-Whitney U không tìm thấy sự khác biệt có ý nghĩa thống kê nào về "${targetVar}" giữa nhóm ${group1Name} và ${group2Name}, U = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}.`
                : `A Mann-Whitney U test found no statistically significant difference in "${targetVar}" between the ${group1Name} and ${group2Name} groups, U = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}.`),
        recommendations: pValue < 0.05
            ? (locale === 'vi' ? [
                'Báo cáo hệ số tương quan rank-biserial r như là thước đo kích thước hiệu ứng của Mann-Whitney U.',
                'Báo cáo trung vị (median) và khoảng tứ phân vị (IQR) của các nhóm trong bảng mô tả.',
                'Nếu hình dạng phân phối của 2 nhóm không giống nhau, hãy diễn giải giá trị U theo hướng một nhóm có xu hướng xếp thứ hạng cao hơn nhóm kia (thay vì diễn giải bằng trung vị).'
            ] : [
                'Report rank-biserial correlation r as the effect size for the Mann-Whitney U test.',
                'Report group medians and interquartile ranges as descriptive statistics.',
                'If distributional shapes are not identical between groups, interpret U as a test of stochastic dominance rather than medians.',
            ])
            : (locale === 'vi' ? [
                'Kiểm tra lại cỡ mẫu — các kiểm định phi tham số thường có lực (power) thấp hơn so với kiểm định tham số tương đương.',
                'Báo cáo trung vị và IQR của 2 nhóm để mô tả độ lớn của sự khác biệt quan sát được (dù không có ý nghĩa thống kê).',
                'Nên dùng Independent-Samples T-Test nếu dữ liệu có thể đáp ứng được giả định phân phối chuẩn.'
            ] : [
                'Verify adequate sample size — non-parametric tests have lower power than their parametric equivalents.',
                'Report medians with IQR for both groups to characterise the direction and magnitude of any observed difference.',
                'Consider the independent-samples t-test if normality assumptions can be reasonably met.',
            ]),
    };
}


// ─── KRUSKAL-WALLIS H TEST ────────────────────────────────────────────────────

export function interpretKruskalWallis(params: {
    factorVar:   string;
    targetVar:   string;
    statistic:   number;
    df:          number;
    pValue:      number;
    medians:     number[];
    groupNames?: string[];
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const { factorVar, targetVar, medians, groupNames } = params;
    const statistic = safeNum(params.statistic);
    const df        = safeNum(params.df);
    const pValue    = safeNum(params.pValue, 1);

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Kruskal, W. H., & Wallis, W. A. (1952). Use of ranks in one-criterion variance analysis. Journal of the American Statistical Association, 47(260), 583–621. https://doi.org/10.2307/2280779',
        'Dunn, O. J. (1964). Multiple comparisons using rank sums. Technometrics, 6(3), 241–252.',
        'Tomczak, M., & Tomczak, E. (2014). The need to report effect size estimates revisited. Trends in Sport Sciences, 1(21), 19–25.',
    ];

    let summary = '';

    if (pValue > 0.05) {
        summary = locale === 'vi'
            ? `Kiểm định Kruskal-Wallis H được thực hiện như một phương pháp phi tham số tổng quát để so sánh phân phối thứ hạng của "${targetVar}" giữa các cấp độ của "${factorVar}". Kiểm định không đạt ý nghĩa thống kê (α = .05): H(${df}) = ${formatNum(statistic)}, ${formatPValue(pValue)}, cho thấy không có sự khác biệt đáng kể nào về phân phối thứ bậc giữa các nhóm.`
            : `A Kruskal-Wallis H test was conducted as a non-parametric omnibus test to compare the rank distributions of "${targetVar}" across levels of "${factorVar}." The test did not reach statistical significance (α = .05): H(${df}) = ${formatNum(statistic)}, ${formatPValue(pValue)}, indicating no significant difference in rank distributions across groups.`;
    } else {
        summary = locale === 'vi'
            ? `Kiểm định Kruskal-Wallis H cho thấy có sự khác biệt mang ý nghĩa thống kê trong phân phối thứ hạng của "${targetVar}" giữa các nhóm của "${factorVar}" (α = .05): H(${df}) = ${formatNum(statistic)}, ${formatPValue(pValue)}. Cần thực hiện kiểm định so sánh cặp hậu nghiệm bằng test Dunn với hệ số hiệu chỉnh Bonferroni (hoặc Holm) để xác định chính xác các nhóm có sự khác biệt.`
            : `A Kruskal-Wallis H test revealed a statistically significant difference in the rank distributions of "${targetVar}" across groups of "${factorVar}" (α = .05): H(${df}) = ${formatNum(statistic)}, ${formatPValue(pValue)}. Post-hoc pairwise comparisons using Dunn's test with Bonferroni (or Holm) correction are required to identify which specific group pairs account for the overall difference.`;

        const medStr = medians
            .map((m, i) => `${groupNames?.[i] ?? (locale === 'vi' ? `Nhóm ${i + 1}` : `Group ${i + 1}`)}: Mdn = ${formatNum(m)}`)
            .join('; ');
        details.push(locale === 'vi' ? `Trung vị của các nhóm: ${medStr}.` : `Group medians: ${medStr}.`);
        details.push(locale === 'vi'
            ? `Khuyến nghị hậu nghiệm: Kiểm định Dunn (1964) kèm hiệu chỉnh Bonferroni hoặc Holm cung cấp sự so sánh cặp đáng tin cậy giúp kiểm soát mức sai lầm loại I (familywise error rate).`
            : `Follow-up: Dunn's test (Dunn, 1964) with Bonferroni or Holm correction provides pairwise comparisons that control familywise error rate.`
        );
        warnings.push(locale === 'vi'
            ? 'Hãy báo cáo ε² (epsilon squared) hoặc η²H làm thước đo kích thước hiệu ứng cho Kruskal-Wallis: ε² = H / (N − 1); Thang đo: nhỏ ≈ .01, vừa ≈ .06, lớn ≈ .14 (Tomczak & Tomczak, 2014).'
            : 'Report ε² (epsilon squared) or η²H as the effect size for Kruskal-Wallis: ε² = H / (N − 1); benchmarks: small ≈ .01, medium ≈ .06, large ≈ .14 (Tomczak & Tomczak, 2014).'
        );
    }

    warnings.push(locale === 'vi'
        ? 'Kiểm định Kruskal-Wallis H so sánh sự khác biệt của hạng phân phối chứ không phải so sánh trung vị. Chỉ nên dùng trung vị để mô tả khi hình dạng phân phối của các nhóm tương đồng.'
        : 'The Kruskal-Wallis H test compares rank distributions, not medians per se. Medians are descriptively appropriate when group distributional shapes are similar.'
    );

    details.push(
        `APA 7 reporting: H(${df}) = ${formatNum(statistic)}, ${formatPValue(pValue)}.`
    );

    return {
        summary, details, warnings, citations,
        verdict: pValue < 0.05 ? 'pass' : 'warning',
        apaStatement: pValue < 0.05
            ? (locale === 'vi'
                ? `Kiểm định Kruskal-Wallis H cho thấy có sự khác biệt mang ý nghĩa thống kê đối với "${targetVar}" giữa các nhóm của "${factorVar}", H(${df}) = ${formatNum(statistic)}, ${formatPValue(pValue)}.`
                : `A Kruskal-Wallis H test revealed a statistically significant difference in "${targetVar}" across groups of "${factorVar}", H(${df}) = ${formatNum(statistic)}, ${formatPValue(pValue)}.`)
            : (locale === 'vi'
                ? `Kiểm định Kruskal-Wallis H không phát hiện ra sự khác biệt có ý nghĩa thống kê đối với "${targetVar}" giữa các nhóm của "${factorVar}", H(${df}) = ${formatNum(statistic)}, ${formatPValue(pValue)}.`
                : `A Kruskal-Wallis H test found no statistically significant difference in "${targetVar}" across groups of "${factorVar}", H(${df}) = ${formatNum(statistic)}, ${formatPValue(pValue)}.`),
        recommendations: pValue < 0.05
            ? (locale === 'vi' ? [
                'Tiến hành test hậu nghiệm Dunn (với hiệu chỉnh Bonferroni hoặc Holm) để chỉ ra chính xác các cặp có khác biệt ý nghĩa.',
                'Báo cáo ε² (epsilon squared) = H / (N − 1) để thể hiện mức độ tác động.',
                'Báo cáo trung vị (median) và IQR của mỗi nhóm trong bảng thống kê mô tả.'
            ] : [
                'Conduct Dunn\'s post-hoc test with Bonferroni or Holm correction to identify which group pairs differ significantly.',
                'Report ε² (epsilon squared) = H / (N − 1) as the effect size.',
                'Report median and IQR for each group as the primary descriptive statistics.',
            ])
            : (locale === 'vi' ? [
                'Kiểm tra xem nghiên cứu có đủ quyền lực thống kê (power) để phát hiện sự khác biệt trên một kiểm định phi tham số hay không.',
                'Hãy báo cáo trung vị và IQR để mô tả những sai biệt bề mặt đã quan sát thấy (dù không có ý nghĩa thống kê).',
                'Cân nhắc gộp nhóm hoặc cấu trúc lại biến nếu điều đó mang lại ý nghĩa tốt hơn về logic phân tích.'
            ] : [
                'Verify the study has adequate power to detect group differences with a non-parametric test.',
                'Report group medians and IQRs to characterise observed (though non-significant) differences.',
                'Consider whether collapsing or redefining groups might yield a more powerful test.',
            ]),
    };
}


// ─── WILCOXON SIGNED-RANK TEST ────────────────────────────────────────────────

export function interpretWilcoxonSigned(params: {
    targetVar:   string;
    statistic:   number;
    pValue:      number;
    medianDiff:  number;
    effectSize?: number;
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const { targetVar } = params;
    const statistic   = safeNum(params.statistic);
    const pValue      = safeNum(params.pValue, 1);
    const medianDiff  = safeNum(params.medianDiff);
    const effectSize  = params.effectSize != null ? safeNum(params.effectSize) : params.effectSize;

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Wilcoxon, F. (1945). Individual comparisons by ranking methods. Biometrics Bulletin, 1(6), 80–83.',
        'Fritz, C. O., Morris, P. E., & Richler, J. J. (2012). Effect size estimates: Current use, calculations, and interpretation. Journal of Experimental Psychology: General, 141(1), 2–18.',
        'Field, A. (2018). Discovering statistics using IBM SPSS Statistics (5th ed.). SAGE Publications.',
    ];

    const direction = medianDiff > 0 ? (locale === 'vi' ? 'giảm' : 'decreased') : (locale === 'vi' ? 'tăng' : 'increased');

    let summary = '';

    if (pValue > 0.05) {
        summary = locale === 'vi'
            ? `Kiểm định Wilcoxon Signed-Rank được áp dụng như một phương án phi tham số thay thế cho T-Test bắt cặp, nhằm đánh giá mức độ thay đổi của "${targetVar}" giữa 2 lần đo. Kiểm định không đạt ý nghĩa thống kê (α = .05): W = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}, với sự chênh lệch trung vị ở mức ${formatNum(Math.abs(medianDiff))} (pseudo-median độ lệch).`
            : `A Wilcoxon Signed-Rank Test was conducted as a non-parametric alternative to the paired-samples t-test, to assess change in "${targetVar}" between two related measurement occasions. The test did not reach statistical significance (α = .05): W = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}, with a median difference of ${formatNum(Math.abs(medianDiff))} (pseudo-median of differences).`;
    } else {
        summary = locale === 'vi'
            ? `Kiểm định Wilcoxon Signed-Rank chỉ ra có sự thay đổi mang ý nghĩa thống kê của "${targetVar}" giữa 2 lần đo (α = .05): W = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}. Điểm số ${direction} rõ rệt với khác biệt trung vị là ${formatNum(Math.abs(medianDiff))}.`
            : `A Wilcoxon Signed-Rank Test indicated a statistically significant change in "${targetVar}" between the two measurement occasions (α = .05): W = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}. Scores ${direction} significantly, with a median difference of ${formatNum(Math.abs(medianDiff))}.`;
    }

    if (effectSize != null) {
        const r = Math.abs(effectSize);
        const label = locale === 'vi'
            ? (r < 0.10 ? 'không đáng kể' : r < 0.30 ? 'nhỏ' : r < 0.50 ? 'trung bình' : 'lớn')
            : (r < 0.10 ? 'negligible' : r < 0.30 ? 'small' : r < 0.50 ? 'medium' : 'large');
        details.push(locale === 'vi'
            ? `Kích thước hiệu ứng: r = ${formatCoef(effectSize)} (Mức độ ${label}; tính bằng công thức z / √N). Thang đo: < .10 không đáng kể, .10–.29 nhỏ, .30–.49 trung bình, ≥ .50 lớn (Fritz et al., 2012).`
            : `Effect size: r = ${formatCoef(effectSize)} (${label}; computed as z / √N). Benchmarks: negligible < .10, small .10–.29, medium .30–.49, large ≥ .50 (Fritz et al., 2012).`
        );
    }

    details.push(locale === 'vi'
        ? `Kiểm định Wilcoxon Signed-Rank xếp hạng các giá trị tuyệt đối của độ chênh lệch các cặp và kiểm tra xem tổng thứ hạng âm và dương có khác biệt hệ thống hay không. Nó không yêu cầu biến phụ thuộc phải phân phối chuẩn, chỉ giả định rằng phân phối của các khác biệt là đối xứng xung quanh giá trị 0 dưới giả thuyết H₀.`
        : `The Wilcoxon Signed-Rank Test ranks the absolute values of pair differences and tests whether positive and negative ranks differ systematically. It does not assume normality of the outcome variable, only that the difference scores are symmetrically distributed around zero under H₀.`
    );
    details.push(
        `APA 7 reporting: W = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}${effectSize != null ? `, r = ${formatCoef(Math.abs(effectSize))}` : ''}.`
    );

    warnings.push(locale === 'vi'
        ? 'Hãy báo cáo số lượng đếm của các hạng mục dương, âm, và các cặp bị hòa (tied) để minh bạch hóa bức tranh phân phối hạng mức (theo khuyến nghị chuẩn APA 7).'
        : 'Report the counts of positive, negative, and tied pairs to provide full transparency about the rank distribution (recommended by APA 7).'
    );

    return {
        summary, details, warnings, citations,
        verdict: pValue < 0.05 ? 'pass' : 'warning',
        apaStatement: pValue < 0.05
            ? (locale === 'vi'
                ? `Kiểm định Wilcoxon Signed-Rank cho thấy sự thay đổi có ý nghĩa thống kê về "${targetVar}" giữa hai lần đo bắt cặp, W = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}${effectSize != null ? `, r = ${formatCoef(Math.abs(effectSize))}` : ''}.`
                : `A Wilcoxon Signed-Rank Test indicated a statistically significant change in "${targetVar}" between the two related measurement occasions, W = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}${effectSize != null ? `, r = ${formatCoef(Math.abs(effectSize))}` : ''}.`)
            : (locale === 'vi'
                ? `Kiểm định Wilcoxon Signed-Rank không phát hiện thấy sự thay đổi có ý nghĩa thống kê của "${targetVar}" giữa hai lần đo lường, W = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}.`
                : `A Wilcoxon Signed-Rank Test found no statistically significant change in "${targetVar}" between the two measurement occasions, W = ${formatNum(statistic, 0)}, ${formatPValue(pValue)}.`),
        recommendations: pValue < 0.05
            ? (locale === 'vi' ? [
                'Báo cáo hiệu ứng tác động r = z / √N bên cạnh thống kê W.',
                'Báo cáo khác biệt trung vị (pseudo-median) như là một chỉ báo hiệu ứng mô tả chính.',
                'Cung cấp bảng số lượng hạng dương, âm và hoà (tied) để tuân thủ hoàn toàn APA 7.'
            ] : [
                'Report effect size r = z / √N alongside the W statistic.',
                'Report the median difference (pseudo-median of differences) as the primary effect descriptor.',
                'Report the number of positive, negative, and tied pairs for full APA 7 compliance.',
            ])
            : (locale === 'vi' ? [
                'Đánh giá lại power — kiểm định Wilcoxon thường có lực yếu hơn T-test bắt cặp nếu dữ liệu thực sự tuân theo phân phối chuẩn.',
                'Báo cáo trung vị chênh lệch để diễn giải độ lớn của sự thay đổi đã quan sát (dù không đạt ý nghĩa).',
                'Nên dùng T-test bắt cặp nếu độ lệch cặp dữ liệu đáp ứng giả định chuẩn.'
            ] : [
                'Verify the study has adequate power — Wilcoxon has lower power than the paired t-test when normality holds.',
                'Report the median difference to characterise the magnitude of any observed (non-significant) change.',
                'Consider the paired-samples t-test if the normality assumption of difference scores can be satisfied.',
            ]),
    };
}


// ─── CHI-SQUARE TEST OF INDEPENDENCE ─────────────────────────────────────────

export function interpretChiSquare(params: {
    var1?:         string;
    var2?:         string;
    v1?:           string;
    v2?:           string;
    variable1?:    string;
    variable2?:    string;
    statistic:     number;
    df:            number;
    pValue:        number;
    cramersV:      number;
    fisherPValue?: number | null;
    warning?:      string;
    n?:            number;
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const { fisherPValue, warning, n } = params;
    const var1      = params.var1 || params.v1 || params.variable1 || 'Variable 1';
    const var2      = params.var2 || params.v2 || params.variable2 || 'Variable 2';
    const statistic = safeNum(params.statistic);
    const df        = safeNum(params.df);
    const pValue    = safeNum(params.pValue, 1);
    const cramersV  = safeNum(params.cramersV);

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Cramér, H. (1946). Mathematical methods of statistics. Princeton University Press.',
        'Cohen, J. (1988). Statistical power analysis for the behavioral sciences (2nd ed.). Lawrence Erlbaum Associates.',
        'Agresti, A. (2013). Categorical data analysis (3rd ed.). Wiley.',
    ];

    const nStr = n != null ? `, N = ${n}` : '';
    const label = locale === 'vi'
        ? (cramersV < 0.10 ? 'không đáng kể' : cramersV < 0.30 ? 'yếu' : cramersV < 0.50 ? 'vừa' : 'mạnh')
        : (cramersV < 0.10 ? 'negligible' : cramersV < 0.30 ? 'weak' : cramersV < 0.50 ? 'moderate' : 'strong');

    let summary = '';

    if (pValue > 0.05) {
        summary = locale === 'vi'
            ? `Kiểm định Chi-square độc lập (Pearson's chi-square) được thực hiện để xem xét mối liên hệ giữa biến "${var1}" và "${var2}". Kết quả kiểm định không đạt mức ý nghĩa thống kê (α = .05): χ²(${df}${nStr}) = ${formatNum(statistic)}, ${formatPValue(pValue)}. Dữ liệu phù hợp với giả định rằng hai biến định tính này độc lập với nhau (Cramér's V = ${formatCoef(cramersV)}, biểu thị một sự liên hệ ${label}).`
            : `A Pearson chi-square test of independence was conducted to examine the association between "${var1}" and "${var2}." The test was not statistically significant (α = .05): χ²(${df}${nStr}) = ${formatNum(statistic)}, ${formatPValue(pValue)}. The data are consistent with the assumption of statistical independence between the two categorical variables (Cramér's V = ${formatCoef(cramersV)}, indicating a ${label} association).`;
    } else {
        summary = locale === 'vi'
            ? `Kiểm định Chi-square độc lập cho thấy có mối liên hệ mang ý nghĩa thống kê giữa "${var1}" và "${var2}" (α = .05): χ²(${df}${nStr}) = ${formatNum(statistic)}, ${formatPValue(pValue)}. Mức độ liên hệ này là ${label} (Cramér's V = ${formatCoef(cramersV)}). Nên kiểm tra bảng tần số quan sát (observed) và kỳ vọng (expected) để xem ô nào đóng góp mức sai lệch cao nhất khỏi mô hình độc lập.`
            : `A Pearson chi-square test of independence indicated a statistically significant association between "${var1}" and "${var2}" (α = .05): χ²(${df}${nStr}) = ${formatNum(statistic)}, ${formatPValue(pValue)}. The strength of association was ${label} (Cramér's V = ${formatCoef(cramersV)}). Inspection of the observed and expected frequency tables identifies which cells deviate most from the independence model.`;
        details.push(locale === 'vi'
            ? `Thang đo kích thước hiệu ứng Cramér's V (đối với df = 1): < .10 không đáng kể, .10–.29 yếu, .30–.49 vừa, ≥ .50 mạnh (Cohen, 1988). Với các bảng chéo có df > 1, thang đo này cần được hiệu chỉnh lại.`
            : `Effect size benchmarks for Cramér's V (for df = 1): negligible < .10, weak .10–.29, moderate .30–.49, strong ≥ .50 (Cohen, 1988). For tables with df > 1, adjusted benchmarks apply.`
        );
    }

    if (fisherPValue != null) {
        const fisherSig = fisherPValue < 0.05;
        details.push(locale === 'vi'
            ? `Kiểm định chính xác Fisher (Fisher's Exact Test, áp dụng khi bảng 2×2 hoặc có tần số kỳ vọng < 5): ${formatPValue(fisherPValue)}${fisherSig ? ' — có ý nghĩa thống kê (α = .05)' : ' — không có ý nghĩa thống kê'}.`
            : `Fisher's Exact Test (applied for 2×2 tables or cells with expected frequency < 5): ${formatPValue(fisherPValue)}${fisherSig ? ' — statistically significant (α = .05)' : ' — not statistically significant'}.`
        );
    }

    details.push(
        `APA 7 reporting: χ²(${df}${nStr}) = ${formatNum(statistic)}, ${formatPValue(pValue)}, V = ${formatCoef(cramersV)}.`
    );

    warnings.push(locale === 'vi'
        ? 'Kiểm định Chi-square yêu cầu ít nhất 80% số ô có tần suất kỳ vọng (expected frequencies) ≥ 5 và không ô nào < 1. Nếu vi phạm, hãy sử dụng Kiểm định Chính xác Fisher (cho bảng 2×2) hoặc gộp bớt các phân loại phụ.'
        : 'Chi-square assumes expected cell frequencies ≥ 5 in at least 80% of cells and ≥ 1 in all cells. When this assumption is violated, use Fisher\'s Exact Test (2×2) or collapse rare categories.'
    );
    warnings.push(locale === 'vi'
        ? 'Chi-square chỉ cho biết có sự liên hệ hay không, chứ không chỉ ra hướng đi hay nguyên nhân. Với dữ liệu là phân loại có thứ bậc (ordinal), hãy thử dùng hệ số Goodman-Kruskal gamma hoặc Kendall\'s tau-b để tận dụng sức mạnh của thông tin thứ bậc.'
        : 'Chi-square tests association, not directionality or causality. For ordered categorical data, consider Goodman-Kruskal gamma or Kendall\'s tau-b to leverage the ordinal information.'
    );

    if (warning) {
        warnings.push(warning);
    }

    return {
        summary, details, warnings, citations,
        verdict: pValue < 0.05 ? 'pass' : 'warning',
        apaStatement: pValue < 0.05
            ? (locale === 'vi'
                ? `Kiểm định Pearson chi-square cho thấy sự liên hệ có ý nghĩa thống kê giữa "${var1}" và "${var2}", χ²(${df}${nStr}) = ${formatNum(statistic)}, ${formatPValue(pValue)}, Cramér's V = ${formatCoef(cramersV)}.`
                : `A Pearson chi-square test of independence indicated a statistically significant association between "${var1}" and "${var2}", χ²(${df}${nStr}) = ${formatNum(statistic)}, ${formatPValue(pValue)}, Cramér's V = ${formatCoef(cramersV)}.`)
            : (locale === 'vi'
                ? `Kiểm định Pearson chi-square không phát hiện mối liên hệ có ý nghĩa thống kê nào giữa "${var1}" và "${var2}", χ²(${df}${nStr}) = ${formatNum(statistic)}, ${formatPValue(pValue)}, V = ${formatCoef(cramersV)}.`
                : `A Pearson chi-square test of independence found no statistically significant association between "${var1}" and "${var2}", χ²(${df}${nStr}) = ${formatNum(statistic)}, ${formatPValue(pValue)}, V = ${formatCoef(cramersV)}.`),
        recommendations: pValue < 0.05
            ? (locale === 'vi' ? [
                'Hãy kiểm tra lại bảng phân phối chéo để xem ô nào (cell) có tần số quan sát thực tế chênh lệch xa nhất so với tần số kỳ vọng, nhằm tìm ra bản chất của sự liên hệ.',
                'Báo cáo hệ số Cramér\'s V; nếu là bảng 2×2, hệ số phi (φ) cũng tương đương.',
                'Trường hợp tần số kỳ vọng < 5 quá nhiều, ưu tiên báo cáo kết quả Fisher\'s Exact Test.'
            ] : [
                'Examine the contingency table to identify which cells contribute most to the χ² statistic (largest |observed − expected| cells).',
                'Report Cramér\'s V as the effect size; for 2×2 tables, phi (φ) is equivalent.',
                'If expected cell frequencies < 5, use Fisher\'s Exact Test (2×2) or report results cautiously.',
            ])
            : (locale === 'vi' ? [
                'Bảo đảm tần số kỳ vọng ≥ 5 tại ≥ 80% ô phân phối — nếu không, nên sử dụng Fisher\'s Exact Test.',
                'Chỉ số χ² vô nghĩa không có nghĩa là 2 biến 100% hoàn toàn độc lập; hãy kiểm tra thêm khoảng tin cậy của Cramér\'s V.',
                'Nếu mẫu quá mỏng, hãy thử gom nhóm (collapse categories) để cải thiện độ lực (power).'
            ] : [
                'Verify that expected cell frequency ≥ 5 in ≥ 80% of cells — if not, apply Fisher\'s Exact Test.',
                'A non-significant χ² does not prove independence; report Cramér\'s V with 95% CI to bound the plausible association strength.',
                'Consider collapsing low-frequency categories to increase expected cell counts and test power.',
            ]),
    };
}
