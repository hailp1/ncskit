/**
 * ASIG — factor.ts
 * Interpreters: Cronbach's Alpha / McDonald's Omega, EFA, CFA
 *
 * All prose conforms to APA 7th Edition reporting standards.
 * Outputs publication-ready narrative for psychometric and factor-analytic results.
 */

import { formatPValue, formatCoef, formatNum, formatPct, safeNum, InterpretationResult } from './shared';


// ─── RELIABILITY ANALYSIS (Cronbach α / McDonald's ω) ────────────────────────

export function interpretCronbachAlpha(params: {
    scaleName:       string;
    nItems:          number;
    alpha:           number;
    omega?:          number;
    badItems?:       string[];
    isOmegaPrimary?: boolean;
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const { scaleName, nItems, badItems, isOmegaPrimary } = params;
    const alpha  = safeNum(params.alpha);
    const omega  = params.omega != null ? safeNum(params.omega) : params.omega;

    const primaryCoef = isOmegaPrimary && omega != null ? omega : alpha;
    const primaryStr  = formatCoef(primaryCoef);
    const primaryName = isOmegaPrimary && omega != null
        ? "McDonald's Omega (ω)"
        : "Cronbach's Alpha (α)";
    const alphaStr    = formatCoef(alpha);
    const omegaStr    = omega != null ? formatCoef(omega) : '';

    const details:   string[] = [];
    const warnings:  string[] = [];

    // Build citations depending on mode
    const citations: string[] = isOmegaPrimary
        ? [
            'Hayes, A. F., & Coutts, J. J. (2020). Use omega rather than Cronbach\'s alpha for estimating reliability. Communication Methods and Measures, 14(1), 1–24. https://doi.org/10.1080/19312458.2020.1718629',
            'Nunnally, J. C., & Bernstein, I. H. (1994). Psychometric theory (3rd ed.). McGraw-Hill.',
            'Sijtsma, K. (2009). On the use, the misuse, and the very limited usefulness of Cronbach\'s alpha. Psychometrika, 74(1), 107–120. https://doi.org/10.1007/s11336-008-9101-0',
          ]
        : [
            'Nunnally, J. C., & Bernstein, I. H. (1994). Psychometric theory (3rd ed.). McGraw-Hill.',
            'Sijtsma, K. (2009). On the use, the misuse, and the very limited usefulness of Cronbach\'s alpha. Psychometrika, 74(1), 107–120. https://doi.org/10.1007/s11336-008-9101-0',
            'Hair, J. F., Black, W. C., Babin, B. J., & Anderson, R. E. (2019). Multivariate data analysis (8th ed.). Cengage Learning.',
          ];

    // Build summary with full methodological context
    let summary = '';
    if (primaryCoef >= 0.90) {
        summary = locale === 'vi'
            ? `Phân tích độ tin cậy cho thang đo "${scaleName}" (${nItems} biến quan sát) đạt ${primaryName} = ${primaryStr}, cho thấy độ tin cậy nhất quán nội tại ở mức xuất sắc, vượt xa ngưỡng tối thiểu .70 (Nunnally & Bernstein, 1994). Thang đo thể hiện cấu trúc đo lường rất chặt chẽ, hoàn toàn phù hợp để sử dụng trong các nghiên cứu kiểm định.`
            : `Reliability analysis of the "${scaleName}" scale (${nItems} items) yielded ${primaryName} = ${primaryStr}, indicating excellent internal consistency well above the conventional threshold of .70 (Nunnally & Bernstein, 1994). The scale demonstrates strong psychometric cohesion and is suitable for confirmatory research and hypothesis testing.`;
    } else if (primaryCoef >= 0.80) {
        summary = locale === 'vi'
            ? `Phân tích độ tin cậy cho thang đo "${scaleName}" (${nItems} biến quan sát) đạt ${primaryName} = ${primaryStr}, cho thấy độ tin cậy nhất quán nội tại ở mức tốt và vượt ngưỡng .70 (Nunnally & Bernstein, 1994). Thang đo phù hợp để sử dụng cho các nghiên cứu kiểm định giả thuyết.`
            : `Reliability analysis of the "${scaleName}" scale (${nItems} items) yielded ${primaryName} = ${primaryStr}, indicating good internal consistency exceeding the conventional threshold of .70 (Nunnally & Bernstein, 1994). The scale is suitable for confirmatory research contexts.`;
    } else if (primaryCoef >= 0.70) {
        summary = locale === 'vi'
            ? `Phân tích độ tin cậy cho thang đo "${scaleName}" (${nItems} biến quan sát) đạt ${primaryName} = ${primaryStr}, đáp ứng ngưỡng tối thiểu .70 (Nunnally & Bernstein, 1994). Thang đo có độ tin cậy nhất quán nội tại ở mức khá, đủ điều kiện đưa vào nghiên cứu, dù giá trị ≥ .80 thường được kỳ vọng hơn cho các bài báo khoa học.`
            : `Reliability analysis of the "${scaleName}" scale (${nItems} items) yielded ${primaryName} = ${primaryStr}, which meets the widely accepted minimum threshold of .70 (Nunnally & Bernstein, 1994). The scale demonstrates adequate internal consistency for research use, though values ≥ .80 are preferable for published research.`;
    } else if (primaryCoef >= 0.60) {
        summary = locale === 'vi'
            ? `Phân tích độ tin cậy cho thang đo "${scaleName}" (${nItems} biến quan sát) đạt ${primaryName} = ${primaryStr}. Mặc dù dưới ngưỡng tối ưu .70 (Nunnally & Bernstein, 1994), giá trị này vẫn nằm trong vùng chấp nhận được (.60–.70) cho các nghiên cứu khám phá (Hair et al., 2019). Tuy nhiên, khuyến nghị nên tinh chỉnh lại thang đo trước khi sử dụng cho kiểm định. Hãy xem xét các hệ số tương quan biến-tổng (item-total) để loại bỏ các biến kém chất lượng.`
            : `Reliability analysis of the "${scaleName}" scale (${nItems} items) yielded ${primaryName} = ${primaryStr}. Although this value falls below the conventional threshold of .70 (Nunnally & Bernstein, 1994), it remains within the acceptable range (.60–.70) for exploratory research (Hair et al., 2019). Scale refinement is recommended before confirmatory use. Examine item-total statistics to identify underperforming items.`;
        citations.push('Hair, J. F., Black, W. C., Babin, B. J., & Anderson, R. E. (2019). Multivariate data analysis (8th ed.). Cengage Learning.');
        warnings.push(locale === 'vi'
            ? `${primaryName} = ${primaryStr} (nằm trong vùng .60–.70) chỉ chấp nhận được cho nghiên cứu khám phá. Nghiên cứu kiểm định đòi hỏi α / ω ≥ .70. Vui lòng kiểm tra lại sự tương quan của từng biến và cân nhắc loại các biến có CITC < .30.`
            : `${primaryName} = ${primaryStr} (.60–.70 range) is acceptable for exploratory research only. Confirmatory use or hypothesis testing requires α / ω ≥ .70. Review item-total correlations and consider removing items with CITC < .30.`
        );
    } else {
        summary = locale === 'vi'
            ? `Phân tích độ tin cậy cho thang đo "${scaleName}" (${nItems} biến quan sát) đạt ${primaryName} = ${primaryStr}, rơi xuống dưới mức tiêu chuẩn tối thiểu .60 (Nunnally & Bernstein, 1994; Hair et al., 2019). Thang đo không đủ độ tin cậy nội tại để đưa vào phân tích. Bắt buộc phải điều chỉnh lại toàn bộ nội dung đo lường trước khi thực hiện các phép suy luận thống kê khác.`
            : `Reliability analysis of the "${scaleName}" scale (${nItems} items) yielded ${primaryName} = ${primaryStr}, which falls below the minimum acceptable threshold of .60 (Nunnally & Bernstein, 1994; Hair et al., 2019). The scale does not demonstrate sufficient internal consistency for research use. Substantial item revision or scale reconceptualisation is strongly recommended before proceeding with any inferential analyses.`;
        warnings.push(locale === 'vi'
            ? `${primaryName} = ${primaryStr} quá thấp (< .60). Thang đo này tuyệt đối không nên được sử dụng. Hãy rà soát lại định tính nội dung câu hỏi và làm lại khảo sát thử nghiệm trước khi thu thập thêm dữ liệu.`
            : `${primaryName} = ${primaryStr} is critically low (< .60). This scale should not be used for statistical inference until revised. Consider qualitative review of item content and re-piloting before further data collection.`
        );
    }

    // Supplementary coefficient
    if (isOmegaPrimary && omega != null) {
        summary += locale === 'vi'
            ? ` McDonald's Omega được chọn làm chỉ số độ tin cậy chính do nó không ép buộc giả định tau-equivalence (tức là không bắt các biến phải có hệ số tải bằng nhau), vì vậy nó đánh giá chính xác và ít thiên lệch hơn so với Cronbach's Alpha trong hầu hết các thang đo tâm lý học thực tế.`
            : ` McDonald's Omega was selected as the primary reliability index because it does not assume tau-equivalence (equal factor loadings), making it a more appropriate and generally less biased estimator than Cronbach's Alpha for most psychometric scales.`;
        details.push(locale === 'vi'
            ? `Chỉ số tham khảo Cronbach's Alpha (α) = ${alphaStr} (dùng để đối chiếu).`
            : `Reference Cronbach's Alpha (α) = ${alphaStr} (reported for comparison).`
        );
        details.push(locale === 'vi'
            ? `Độ chênh lệch giữa ω (${omegaStr}) và α (${alphaStr}) chỉ ra ${Math.abs(primaryCoef - alpha) < 0.02 ? 'sự khác biệt không đáng kể so với giả định tau-equivalence — các biến quan sát có hệ số tải gần tương đương nhau.' : 'sự vi phạm rõ rệt giả định tau-equivalence — các biến có hệ số tải khác biệt lớn, việc dùng ω là hoàn toàn hợp lý.'}`
            : `The difference between ω (${omegaStr}) and α (${alphaStr}) indicates ${Math.abs(primaryCoef - alpha) < 0.02 ? 'minimal departure from tau-equivalence — items have approximately equal factor loadings.' : 'meaningful departure from tau-equivalence — items differ in their factor loadings, supporting the use of ω.'}`
        );
    } else if (!isOmegaPrimary && omega != null && omega > 0) {
        details.push(locale === 'vi'
            ? `Chỉ số bổ sung McDonald's Omega (ω) = ${omegaStr}. Độ chênh lệch ω − α = ${formatCoef(omega - alpha)} phản ánh ${Math.abs(omega - alpha) < 0.02 ? 'đặc tính tau-equivalence gần đúng.' : 'sự vi phạm tau-equivalence; ω đang cung cấp độ tin cậy chuẩn xác hơn so với α cho thang đo này.'}`
            : `Supplementary McDonald's Omega (ω) = ${omegaStr}. The difference ω − α = ${formatCoef(omega - alpha)} indicates ${Math.abs(omega - alpha) < 0.02 ? 'approximate tau-equivalence.' : 'non-tau-equivalence; ω provides a less biased reliability estimate for this scale.'}`
        );
    }

    // Problematic items
    if (badItems && badItems.length > 0) {
        warnings.push(locale === 'vi'
            ? `(Các) biến có hệ số tương quan biến-tổng (CITC) dưới .30: ${badItems.join(', ')}. Các biến này đóng góp lượng phương sai chung rất thấp cho toàn thang đo và cần được xem xét kĩ về nội dung hoặc bị loại bỏ để gia tăng α / ω.`
            : `Item(s) with corrected item-total correlation (CITC) below .30: ${badItems.join(', ')}. These items contribute negligible shared variance to the scale and should be reviewed for content relevance and considered for removal or revision. Removing poor items typically increases α / ω.`
        );
    }

    details.push(locale === 'vi'
        ? 'Tiêu chuẩn đánh giá (Nunnally & Bernstein, 1994): < .60: Không thể chấp nhận; .60–.69: Chỉ dành cho nghiên cứu khám phá; .70–.79: Khá/Đạt yêu cầu; .80–.89: Tốt; ≥ .90: Xuất sắc.'
        : `Internal consistency benchmarks (Nunnally & Bernstein, 1994): < .60 inadequate; .60–.69 exploratory only; .70–.79 adequate; .80–.89 good; ≥ .90 excellent.`
    );
    details.push(
        `APA 7 reporting: "${scaleName}" (${nItems} items), ${primaryName} = ${primaryStr}` +
        `${omega != null && !isOmegaPrimary ? `, ω = ${omegaStr}` : ''}.`
    );

    return {
        summary, details, warnings, citations,
        verdict: primaryCoef >= 0.70 ? 'pass' : primaryCoef >= 0.60 ? 'warning' : 'fail',
        apaStatement: locale === 'vi'
            ? `Kiểm định độ tin cậy thang đo "${scaleName}" (${nItems} biến) đạt ${primaryName} = ${primaryStr}${omega != null && !isOmegaPrimary ? `, ω = ${omegaStr}` : ''}, cho thấy độ tin cậy nhất quán nội tại ${primaryCoef >= 0.90 ? 'xuất sắc' : primaryCoef >= 0.80 ? 'tốt' : primaryCoef >= 0.70 ? 'khá' : primaryCoef >= 0.60 ? 'vừa đủ' : 'không đủ'}.`
            : `Reliability analysis of the "${scaleName}" scale (${nItems} items) yielded ${primaryName} = ${primaryStr}${omega != null && !isOmegaPrimary ? `, ω = ${omegaStr}` : ''}, indicating ${primaryCoef >= 0.90 ? 'excellent' : primaryCoef >= 0.80 ? 'good' : primaryCoef >= 0.70 ? 'adequate' : primaryCoef >= 0.60 ? 'borderline' : 'insufficient'} internal consistency.`,
        recommendations: primaryCoef >= 0.70
            ? (locale === 'vi' ? [
                'Báo cáo cả α và ω nếu có thể tính được — ω luôn là hệ số tối ưu hơn cho các thang đo có hệ số tải biến thiên lệch (không bằng nhau).',
                'Nên đưa kết quả Tương quan biến - tổng (CITC) vào phần Phụ lục của bài nghiên cứu để dễ dàng kiểm chứng.',
                badItems && badItems.length > 0 ? `Kiểm tra các biến có CITC < .30 (${badItems.join(', ')}) — nếu loại bỏ có thể sẽ cải thiện độ tin cậy thêm.` : 'Kiểm tra ma trận CITC; bất kỳ biến nào có CITC < .30 nên được xem xét thận trọng.'
            ] : [
                'Report both α and ω when both are computed — ω is the preferred index for scales with unequal loadings.',
                'Include item-total statistics (CITC) in supplementary materials for replication.',
                badItems && badItems.length > 0
                    ? `Review items with CITC < .30 (${badItems.join(', ')}) — removing these may improve reliability.`
                    : 'Examine the corrected item-total correlation (CITC) matrix; items with CITC < .30 should be reviewed.',
            ])
            : (locale === 'vi' ? [
                'Thực hiện Phân tích Item (Item Analysis): tìm và loại các biến có CITC < .30 để cải thiện độ tin cậy chung của thang đo.',
                'Kiểm tra lại cách hành văn của các biến quan sát xem có gây mơ hồ, hỏi 2 ý trong 1 câu (double-barrelling) hoặc đi lệch so với định nghĩa khái niệm hay không.',
                'Nên thu thập thêm dữ liệu hoặc thực hiện pilot test lại các biến quan sát trước khi đưa vào CFA/SEM.'
            ] : [
                'Conduct item analysis: identify and remove items with CITC < .30 to improve reliability.',
                'Review item wording for ambiguity, double-barrelling, or poor relevance to the construct.',
                'Consider collecting additional data or piloting revised items before confirmatory analysis.',
            ]),
    };
}


// ─── EXPLORATORY FACTOR ANALYSIS ─────────────────────────────────────────────

export function interpretEFA(params: {
    kmo?:            number;
    bartlettP?:      number;
    bartlett?:       { p_value: number };
    nFactors?:       number;
    nFactorsUsed?:   number;
    factorMethod?:   string;
    rotationMethod?: string;
    rotation?:       string;
    totalVariance?:  number;
    variance?:       { total_variance_explained: number };
    communalities?:  { item: string; value: number }[];
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const factorMethod = params.factorMethod || 'minres';
    const rotationMethod = params.rotationMethod || params.rotation;
    const communalities = params.communalities;
    const kmo           = safeNum(params.kmo);
    const bartlettP     = safeNum(params.bartlettP ?? params.bartlett?.p_value, 1);
    const nFactors      = safeNum(params.nFactors ?? params.nFactorsUsed, 1);
    const totalVariance = params.totalVariance ?? (params.variance?.total_variance_explained ? params.variance.total_variance_explained / 100 : undefined);

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Kaiser, H. F. (1974). An index of factorial simplicity. Psychometrika, 39(1), 31–36.',
        'Zwick, W. R., & Velicer, W. F. (1986). Comparison of five rules for determining the number of components to retain. Psychological Bulletin, 99(3), 432–442.',
        'Hair, J. F., Black, W. C., Babin, B. J., & Anderson, R. E. (2019). Multivariate data analysis (8th ed.). Cengage Learning.',
        'Fabrigar, L. R., Wegener, D. T., MacCallum, R. C., & Strahan, E. J. (1999). Evaluating the use of exploratory factor analysis in psychological research. Psychological Methods, 4(3), 272–299.',
    ];

    // KMO classification per Kaiser (1974)
    let kmoLabelEn = '';
    let kmoLabelVi = '';
    if      (kmo >= 0.90) { kmoLabelEn = 'marvellous'; kmoLabelVi = 'tuyệt vời'; }
    else if (kmo >= 0.80) { kmoLabelEn = 'meritorious'; kmoLabelVi = 'rất tốt'; }
    else if (kmo >= 0.70) { kmoLabelEn = 'middling'; kmoLabelVi = 'khá'; }
    else if (kmo >= 0.60) { kmoLabelEn = 'mediocre'; kmoLabelVi = 'trung bình'; }
    else if (kmo >= 0.50) { kmoLabelEn = 'miserable'; kmoLabelVi = 'kém'; }
    else                  { kmoLabelEn = 'unacceptable'; kmoLabelVi = 'không thể chấp nhận'; }

    const kmoLabel = locale === 'vi' ? kmoLabelVi : kmoLabelEn;

    if (kmo < 0.60) {
        warnings.push(locale === 'vi'
            ? `KMO = ${formatCoef(kmo)} (${kmoLabel}) rơi xuống dưới mức tiêu chuẩn tối thiểu .60 (Kaiser, 1974). Hệ số tương quan giữa các biến quá yếu để có thể trích xuất nhân tố một cách tin cậy. Bạn cần phải xem xét lại quy trình thu thập dữ liệu và nội dung thang đo.`
            : `KMO = ${formatCoef(kmo)} (${kmoLabel}) falls below the recommended minimum of .60 (Kaiser, 1974). The inter-item correlations are insufficient for reliable factor extraction. Data collection procedures and item quality should be reviewed before re-analysing.`
        );
    } else if (kmo < 0.70) {
        warnings.push(locale === 'vi'
            ? `KMO = ${formatCoef(kmo)} (${kmoLabel}) nằm trong khoảng .60 đến .70. Kết quả phân tích nhân tố ở mức độ này nên được diễn giải thận trọng và cần được xác thực lại bằng một mẫu độc lập.`
            : `KMO = ${formatCoef(kmo)} (${kmoLabel}) is between .60 and .70. Factor solutions at this adequacy level should be interpreted with caution and validated in an independent sample.`
        );
    }

    const bartlettSig = bartlettP < 0.05
        ? (locale === 'vi' ? `có ý nghĩa thống kê (${formatPValue(bartlettP)})` : `statistically significant (${formatPValue(bartlettP)})`)
        : (locale === 'vi' ? `không đạt ý nghĩa thống kê (${formatPValue(bartlettP)})` : `not statistically significant (${formatPValue(bartlettP)})`);

    const extractionLabel = locale === 'vi'
        ? (factorMethod === 'parallel'
            ? 'Phân tích song song (Parallel Analysis - Tiêu chuẩn tối ưu hiện nay; Zwick & Velicer, 1986)'
            : factorMethod === 'map'
                ? 'Minimum Average Partial (MAP; Velicer, 1976)'
                : 'Tiêu chuẩn Kaiser (eigenvalue > 1; Kaiser, 1974; lưu ý: tiêu chuẩn này thường có xu hướng trích xuất thừa nhân tố)')
        : (factorMethod === 'parallel'
            ? 'Parallel Analysis (the recommended retention criterion; Zwick & Velicer, 1986)'
            : factorMethod === 'map'
                ? 'Minimum Average Partial (MAP; Velicer, 1976)'
                : 'Kaiser criterion (eigenvalue > 1; Kaiser, 1974; note: this criterion tends to over-extract)');

    const rotationContext = rotationMethod
        ? (rotationMethod.toLowerCase().includes('varimax') || rotationMethod.toLowerCase().includes('equamax')
            ? (locale === 'vi' ? `phép xoay vuông góc ${rotationMethod} (giả định các nhân tố độc lập)` : `${rotationMethod} orthogonal rotation (assumes uncorrelated factors)`)
            : (locale === 'vi' ? `phép xoay xiên ${rotationMethod} (cho phép các nhân tố tương quan; phù hợp khi lý thuyết chỉ ra các cấu trúc có liên hệ với nhau)` : `${rotationMethod} oblique rotation (allows factor intercorrelations; appropriate when factors are theoretically related)`))
        : (locale === 'vi' ? 'không sử dụng phép xoay' : 'no rotation applied');

    let summary = locale === 'vi'
        ? `Trước khi tiến hành Phân tích nhân tố khám phá (EFA), sự phù hợp của ma trận tương quan đã được kiểm tra. Chỉ số Kaiser-Meyer-Olkin (KMO) đo lường mức độ thích hợp của mẫu đạt KMO = ${formatCoef(kmo)} (${kmoLabel}; Kaiser, 1974). Kiểm định Bartlett về tính cầu (Sphericity) ${bartlettSig}, ${bartlettP < 0.05 ? 'xác nhận rằng ma trận tương quan khác biệt đáng kể so với ma trận đồng nhất, hoàn toàn đủ điều kiện để phân tích nhân tố.' : 'cho thấy ma trận không phù hợp — bạn không nên tin cậy vào kết quả phân tích nhân tố này.'} Phân tích EFA được thực thi với phương pháp ${extractionLabel}, trích xuất ra ${nFactors} nhân tố cùng ${rotationContext}.`
        : `Prior to conducting Exploratory Factor Analysis (EFA), the suitability of the correlation matrix was evaluated. The Kaiser-Meyer-Olkin (KMO) measure of sampling adequacy yielded KMO = ${formatCoef(kmo)} (${kmoLabel}; Kaiser, 1974). Bartlett's Test of Sphericity was ${bartlettSig}, ${bartlettP < 0.05 ? 'confirming that the correlation matrix is sufficiently non-identity for factor analysis.' : 'failing to confirm factorability — factor analysis results should not be trusted.'} EFA was conducted using ${extractionLabel}, retaining ${nFactors} factor${nFactors !== 1 ? 's' : ''} with ${rotationContext}.`;

    details.push(locale === 'vi' ? `Tiêu chuẩn giữ lại nhân tố: ${extractionLabel}.` : `Factor retention criterion: ${extractionLabel}.`);
    if (rotationMethod) details.push(locale === 'vi' ? `Phép xoay: ${rotationContext}.` : `Rotation applied: ${rotationContext}.`);
    details.push(locale === 'vi' ? `Số nhân tố trích xuất: ${nFactors}.` : `Factors retained: ${nFactors}.`);

    if (totalVariance != null) {
        const varPct = formatPct(totalVariance);
        details.push(locale === 'vi'
            ? `Tổng phương sai trích (TVE) bởi cấu trúc ${nFactors} nhân tố: ${varPct}. ${totalVariance >= 0.60 ? 'Mức này vượt qua ngưỡng khuyến nghị thông thường (60%) trong các nghiên cứu khoa học xã hội (Hair et al., 2019).' : totalVariance >= 0.50 ? 'Mức này đáp ứng ngưỡng tối thiểu (50%) (Hair et al., 2019), tuy nhiên phương sai trích xuất cao hơn sẽ tốt hơn.' : 'Giá trị này thấp hơn chuẩn tối thiểu 50% — cần cân nhắc bổ sung biến quan sát hoặc tăng số nhân tố.'}`
            : `Total variance explained by the ${nFactors}-factor solution: ${varPct}. ${totalVariance >= 0.60 ? 'This exceeds the commonly recommended threshold of 60% for social science research (Hair et al., 2019).' : totalVariance >= 0.50 ? 'This meets the minimum 50% threshold (Hair et al., 2019), though higher variance extraction is preferable.' : 'This falls below the recommended threshold of 50% — consider revising the item pool or retaining additional factors.'}`
        );
        if (totalVariance < 0.50) {
            warnings.push(locale === 'vi'
                ? `Tổng phương sai giải thích được (${varPct}) thấp hơn 50% (Hair et al., 2019). Cấu trúc nhân tố này chưa phản ánh đủ phương sai của các biến. Bạn nên mở rộng danh sách biến khảo sát hoặc xem lại định nghĩa các cấu trúc khái niệm.`
                : `Total variance explained (${varPct}) is below 50% (Hair et al., 2019). The factor solution may not adequately capture the construct domain. Consider expanding the item pool or reviewing construct definitions.`
            );
        }
    }

    if (communalities) {
        const lowItems = communalities.filter(c => c.value < 0.40);
        if (lowItems.length > 0) {
            warnings.push(locale === 'vi'
                ? `Các biến quan sát sau đây có hệ số chung (Communalities, h²) dưới .40, nghĩa là nhân tố không đại diện đủ tốt cho biến đó: ${lowItems.map(c => `${c.item} (h² = ${formatCoef(c.value)})`).join(', ')}. Các biến có h² < .40 nên được điều chỉnh hoặc loại bỏ hoàn toàn (Hair et al., 2019; Fabrigar et al., 1999).`
                : `The following item(s) have communalities (h²) below .40, indicating poor representation by the factor structure: ${lowItems.map(c => `${c.item} (h² = ${formatCoef(c.value)})`).join(', ')}. Items with h² < .40 should be revised or removed (Hair et al., 2019; Fabrigar et al., 1999).`
            );
        }
    }

    details.push(locale === 'vi'
        ? 'Mức hệ số tải tối thiểu (Factor Loading) thường yêu cầu: ≥ .40 (Hair et al., 2019); nhưng nếu mẫu N < 200 thì nên lấy ≥ .50.'
        : `Minimum loading for factor assignment: ≥ .40 (Hair et al., 2019); ≥ .50 preferred for sample sizes N < 200.`
    );
    details.push(locale === 'vi'
        ? 'Cross-loadings (các biến tải mạnh ≥ .32 lên từ 2 nhân tố trở lên) sẽ phá vỡ cấu trúc "simple structure" (cấu trúc đơn giản) và phải được kiểm tra cực kì cẩn thận (Tabachnick & Fidell, 2019).'
        : `Cross-loadings (items loading ≥ .32 on two or more factors) compromise simple structure and should be examined carefully (Tabachnick & Fidell, 2019).`
    );
    warnings.push(locale === 'vi'
        ? 'EFA chỉ là phân tích mang tính khám phá: cấu trúc nhân tố thu được BẮT BUỘC phải được xác thực lại bằng Phân tích nhân tố khẳng định (CFA) trên một tập mẫu khác trước khi xem như là một thang đo chính thức.'
        : 'EFA is exploratory: the derived factor structure should be replicated in an independent sample via CFA before being treated as the definitive measurement model.'
    );

    const efaVerdict = kmo >= 0.70 && bartlettP < 0.05 && (totalVariance == null || totalVariance >= 0.50) ? 'pass' : kmo >= 0.60 && bartlettP < 0.05 ? 'warning' : 'fail';

    return {
        summary, details, warnings, citations,
        verdict: efaVerdict,
        apaStatement: locale === 'vi'
            ? `Kiểm định EFA sử dụng phương pháp trích xuất ${factorMethod}${rotationMethod ? ` với phép xoay ${rotationMethod}` : ''} đã được tiến hành. KMO = ${formatCoef(kmo)}, kiểm định Bartlett ${formatPValue(bartlettP)}. Cấu trúc ${nFactors} nhân tố được giữ lại${totalVariance != null ? `, giải thích ${(totalVariance * 100).toFixed(1)}% phương sai` : ''}.`
            : `An EFA using ${factorMethod} extraction${rotationMethod ? ` with ${rotationMethod} rotation` : ''} was conducted. KMO = ${formatCoef(kmo)}, Bartlett's ${formatPValue(bartlettP)}. A ${nFactors}-factor solution was retained${totalVariance != null ? `, explaining ${(totalVariance * 100).toFixed(1)}% of total variance` : ''}.`,
        recommendations: locale === 'vi' ? [
            kmo < 0.70 ? 'KMO dưới .70 — nên cân nhắc nâng cao chất lượng câu hỏi, tăng quy mô mẫu, hoặc xóa bỏ các câu hỏi rời rạc không tương quan.' : 'KMO thỏa mãn điều kiện — hãy tiến hành EFA và xem xét tính ổn định của các nhân tố.',
            `Sử dụng Phân tích song song (Parallel Analysis) thay vì tiêu chuẩn Kaiser (eigenvalue > 1) để xác định chính xác nhất số lượng nhân tố cần giữ lại.`,
            totalVariance != null && totalVariance < 0.60 ? `Tổng phương sai giải thích được (${(totalVariance * 100).toFixed(1)}%) đang dưới 60% — hãy cân nhắc tăng thêm 1 nhân tố hoặc mở rộng thang đo.` : 'Luôn kiểm định chéo (cross-validate) bằng CFA trên tập mẫu thử (hold-out sample) để chứng minh tính vững chắc của kết quả EFA.'
        ] : [
            kmo < 0.70
                ? 'KMO is below .70 — consider improving items, increasing sample size, or removing items that do not correlate well with the rest.'
                : 'KMO is satisfactory — proceed with EFA and verify factor solution stability.',
            `Use parallel analysis (not Kaiser's eigenvalue > 1 criterion) to determine the optimal number of factors to retain.`,
            totalVariance != null && totalVariance < 0.60
                ? `Total variance explained (${(totalVariance * 100).toFixed(1)}%) is below 60% — consider retaining an additional factor or expanding the item pool.`
                : 'Replicate the EFA factor solution in a new sample via CFA before treating it as the definitive measurement model.',
        ],
    };
}


// ─── CONFIRMATORY FACTOR ANALYSIS ────────────────────────────────────────────

export function interpretCFA(params: {
    chi2?:          number;
    df?:            number;
    pValue?:        number;
    cfi?:           number;
    tli?:           number;
    rmsea?:         number;
    rmseaCILower?:  number;
    rmseaCIUpper?:  number;
    srmr?:          number;
    fitMeasures?:   any;
}, locale: 'en' | 'vi' = 'en'): InterpretationResult {
    const fm = params.fitMeasures || params;
    const rmseaCILower = params.rmseaCILower ?? fm.rmsea_ci_lower;
    const rmseaCIUpper = params.rmseaCIUpper ?? fm.rmsea_ci_upper;
    const chi2   = safeNum(params.chi2 ?? fm.chisq);
    const df     = safeNum(params.df ?? fm.df);
    const pValue = safeNum(params.pValue ?? fm.pvalue, 1);
    const cfi    = safeNum(params.cfi ?? fm.cfi);
    const tli    = safeNum(params.tli ?? fm.tli);
    const rmsea  = safeNum(params.rmsea ?? fm.rmsea);
    const srmr   = safeNum(params.srmr ?? fm.srmr);

    const details:   string[] = [];
    const warnings:  string[] = [];
    const citations: string[] = [
        'Hu, L., & Bentler, P. M. (1999). Cutoff criteria for fit indexes in covariance structure analysis. Structural Equation Modeling, 6(1), 1–55. https://doi.org/10.1080/10705519909540118',
        'Kline, R. B. (2016). Principles and practice of structural equation modeling (4th ed.). Guilford Press.',
        'Brown, T. A. (2015). Confirmatory factor analysis for applied research (2nd ed.). Guilford Press.',
        'McNeish, D., & Wolf, M. G. (2023). Dynamic fit index cutoffs for confirmatory factor analysis models. Psychological Methods, 28(1), 61–88.',
    ];

    // ── Evaluate fit indices ──────────────────────────────────────────────────
    const cfiBad   = cfi  < 0.90;
    const tliBad   = tli  < 0.90;
    const rmseaBad = rmsea > 0.08;
    const srmrBad  = srmr  > 0.08;
    const cfiFine   = cfi  >= 0.95;
    const tliFine   = tli  >= 0.95;
    const rmseaFine = rmsea <= 0.06;
    const srmrFine  = srmr  <= 0.06;
    const nBad  = [cfiBad, tliBad, rmseaBad, srmrBad].filter(Boolean).length;
    const nFine = [cfiFine, tliFine, rmseaFine, srmrFine].filter(Boolean).length;

    let fitVerdictEn = '';
    let fitVerdictVi = '';
    if      (nBad === 0 && nFine >= 3) { fitVerdictEn = 'excellent fit'; fitVerdictVi = 'rất tuyệt vời'; }
    else if (nBad === 0 && nFine >= 1) { fitVerdictEn = 'good fit'; fitVerdictVi = 'tốt'; }
    else if (nBad === 0)               { fitVerdictEn = 'acceptable fit'; fitVerdictVi = 'chấp nhận được'; }
    else if (nBad === 1)               { fitVerdictEn = 'marginally acceptable fit'; fitVerdictVi = 'tạm chấp nhận được'; }
    else if (nBad === 2)               { fitVerdictEn = 'poor fit'; fitVerdictVi = 'kém'; }
    else                               { fitVerdictEn = 'unacceptable fit'; fitVerdictVi = 'rất tệ, không thể chấp nhận'; }

    const fitVerdict = locale === 'vi' ? fitVerdictVi : fitVerdictEn;

    // χ² / df ratio
    const chiRatio = df > 0 ? chi2 / df : null;
    const chiRatioVerdict = chiRatio == null ? ''
        : chiRatio <= 2.0 ? (locale === 'vi' ? ' (tốt; ≤ 2.0)' : ' (good; ≤ 2.0)')
        : chiRatio <= 3.0 ? (locale === 'vi' ? ' (chấp nhận được; ≤ 3.0)' : ' (acceptable; ≤ 3.0)')
        : chiRatio <= 5.0 ? (locale === 'vi' ? ' (nghi ngờ; 3.0–5.0)' : ' (questionable; 3.0–5.0)')
        : (locale === 'vi' ? ' (kém; > 5.0)' : ' (poor; > 5.0)');

    const rmseaCI = (rmseaCILower != null && rmseaCIUpper != null)
        ? ` [90% CI: ${formatCoef(rmseaCILower)}, ${formatCoef(rmseaCIUpper)}]`
        : '';

    let summary = locale === 'vi'
        ? `Phân tích nhân tố khẳng định (CFA) được thực hiện để đánh giá độ khít của mô hình đo lường. Tổng hợp các chỉ số độ khít cho thấy mô hình ở mức độ ${fitVerdict}: CFI = ${formatCoef(cfi)}, TLI = ${formatCoef(tli)}, RMSEA = ${formatCoef(rmsea)}${rmseaCI}, SRMR = ${formatCoef(srmr)} (Hu & Bentler, 1999; Kline, 2016). `
        : `Confirmatory Factor Analysis (CFA) was conducted to evaluate the pre-specified measurement model. The overall pattern of model fit indices indicated ${fitVerdict}: CFI = ${formatCoef(cfi)}, TLI = ${formatCoef(tli)}, RMSEA = ${formatCoef(rmsea)}${rmseaCI}, SRMR = ${formatCoef(srmr)} (Hu & Bentler, 1999; Kline, 2016). `;

    summary += nBad === 0
        ? (locale === 'vi' ? 'Tất cả các chỉ số đều vượt ngưỡng tiêu chuẩn, ủng hộ sự phù hợp xuất sắc của cấu trúc đo lường.' : 'All reported fit indices satisfy recommended thresholds, supporting the adequacy of the measurement model.')
        : (locale === 'vi' ? 'Một số chỉ số phản ánh sự thiếu khít giữa mô hình và dữ liệu thực tế; cần xem xét điều chỉnh (re-specification) lại mô hình (xem phần Cảnh báo).' : 'One or more fit indices suggest model-data misfit; model re-specification may be warranted (see warnings).');

    // Detailed fit index lines
    details.push(
        `χ²(${df}) = ${formatNum(chi2)}, ${formatPValue(pValue)}` +
        `${chiRatio != null ? `; χ²/df = ${formatNum(chiRatio)}${chiRatioVerdict}` : ''}. ` +
        (locale === 'vi'
            ? `Lưu ý: χ² rất nhạy với cỡ mẫu lớn (thường significant khi N > ~200 dù mô hình thực tế khá khít); nên coi đây là 1 trong nhiều tiêu chí (Kline, 2016).`
            : `Note: χ² is sensitive to sample size (significant for N > ~200 even with good fit); use it as one of multiple criteria (Kline, 2016).`)
    );
    details.push(
        `CFI = ${formatCoef(cfi)} ` +
        (locale === 'vi'
            ? `(${cfiFine ? 'xuất sắc ≥ .95' : cfiBad ? 'dưới mức tối thiểu .90' : 'đạt yêu cầu .90–.94'}; ngưỡng: ≥ .95 khít tốt, ≥ .90 chấp nhận được; Hu & Bentler, 1999).`
            : `(${cfiFine ? 'excellent ≥ .95' : cfiBad ? 'below minimum .90' : 'acceptable .90–.94'}; threshold: ≥ .95 close fit, ≥ .90 acceptable; Hu & Bentler, 1999).`)
    );
    details.push(
        `TLI = ${formatCoef(tli)} ` +
        (locale === 'vi'
            ? `(${tliFine ? 'xuất sắc ≥ .95' : tliBad ? 'dưới mức tối thiểu .90' : 'đạt yêu cầu .90–.94'}; ngưỡng: ≥ .95 khít tốt, ≥ .90 chấp nhận được).`
            : `(${tliFine ? 'excellent ≥ .95' : tliBad ? 'below minimum .90' : 'acceptable .90–.94'}; threshold: ≥ .95 close fit, ≥ .90 acceptable).`)
    );
    details.push(
        `RMSEA = ${formatCoef(rmsea)}${rmseaCI} ` +
        (locale === 'vi'
            ? `(${rmseaFine ? 'xuất sắc ≤ .06' : rmseaBad ? 'vượt quá .08' : 'đạt yêu cầu .06–.08'}; ngưỡng: ≤ .06 khít tốt, ≤ .08 chấp nhận được; giới hạn trên của 90% CI nên < .08).`
            : `(${rmseaFine ? 'excellent ≤ .06' : rmseaBad ? 'exceeds .08 limit' : 'acceptable .06–.08'}; threshold: ≤ .06 close fit, ≤ .08 acceptable; 90% CI upper bound < .08 preferred).`)
    );
    details.push(
        `SRMR = ${formatCoef(srmr)} ` +
        (locale === 'vi'
            ? `(${srmrFine ? 'xuất sắc ≤ .06' : srmrBad ? 'vượt quá .08' : 'đạt yêu cầu .06–.08'}; ngưỡng: ≤ .08).`
            : `(${srmrFine ? 'excellent ≤ .06' : srmrBad ? 'exceeds .08 limit' : 'acceptable .06–.08'}; threshold: ≤ .08; represents average absolute standardised residual).`)
    );

    if (pValue < 0.05 && nBad === 0) {
        details.push(locale === 'vi'
            ? `Chi-bình phương (χ²) mang ý nghĩa thống kê (${formatPValue(pValue)}) phần lớn là do sự nhạy cảm với cỡ mẫu lớn thay vì mô hình sai lệch — bằng chứng là các chỉ số độ khít độc lập khác (CFI, TLI, RMSEA, SRMR) đều cho kết quả tốt.`
            : `The significant χ² (${formatPValue(pValue)}) likely reflects large sample size sensitivity rather than substantive misfit — the incremental fit indices (CFI, TLI, RMSEA, SRMR) all indicate acceptable or better fit.`
        );
    } else if (pValue > 0.05) {
        details.push(locale === 'vi'
            ? `Chi-bình phương (χ²) không có ý nghĩa thống kê (${formatPValue(pValue)}) cho thấy cấu trúc hiệp phương sai của mô hình rất sát với dữ liệu quan sát. Tuy vậy, cần cẩn trọng nếu mẫu (N) nhỏ, vì điều này làm giảm power của kiểm định.`
            : `The non-significant χ² (${formatPValue(pValue)}) suggests the model covariance structure closely approximates the observed matrix; however, interpret with caution as this may reflect low statistical power (small N or df).`
        );
    }

    // Specific warnings for failing indices
    if (cfiBad)   warnings.push(locale === 'vi' ? `CFI = ${formatCoef(cfi)} thấp hơn .90 (Hu & Bentler, 1999). Bạn nên xem xét lại hệ thống chỉ số điều chỉnh (Modification Indices - MI) và lý thuyết để tái lập cấu trúc đo lường.` : `CFI = ${formatCoef(cfi)} is below .90 (Hu & Bentler, 1999). Model re-specification guided by theoretical reasoning and modification indices is recommended.`);
    if (tliBad)   warnings.push(locale === 'vi' ? `TLI = ${formatCoef(tli)} thấp hơn .90. Chỉ số TLI phạt rất nặng các mô hình quá phức tạp; hãy thử tinh gọn lại số chiều hoặc biến đo lường.` : `TLI = ${formatCoef(tli)} is below .90. TLI penalises model complexity; consider whether the model is over-parameterised.`);
    if (rmseaBad) warnings.push(locale === 'vi' ? `RMSEA = ${formatCoef(rmsea)} vượt ngưỡng giới hạn .08 (Hu & Bentler, 1999). Hãy xem xét kỹ các MI và thử giải phóng tự do phần dư cov (correlated residuals) đối với các biến dùng chung phương pháp đo.` : `RMSEA = ${formatCoef(rmsea)} exceeds the .08 upper limit (Hu & Bentler, 1999). Inspect modification indices and consider freeing theoretically justified parameters (e.g., correlated residuals for same-method items).`);
    if (srmrBad)  warnings.push(locale === 'vi' ? `SRMR = ${formatCoef(srmr)} lớn hơn .08, cho thấy có sự sai lệch hệ thống trong phương sai dư thừa. Hãy xem ma trận phần dư (residual correlation) để tìm ra điểm bất cập.` : `SRMR = ${formatCoef(srmr)} exceeds .08, indicating systematic residual covariance misfit. Examine the residual correlation matrix for patterns.`);

    if (nBad > 0) {
        warnings.push(locale === 'vi'
            ? 'Cảnh báo quan trọng: Việc điều chỉnh mô hình (VD: thêm hiệp phương sai phần dư dựa hoàn toàn vào Modification Indices) sẽ làm tăng giả tạo độ khít và KHÔNG được chấp nhận nếu thiếu lập luận lý thuyết vững chắc. Luôn kiểm định lại bằng tập dữ liệu khác.'
            : 'Important: post-hoc model modifications (e.g., adding correlated residuals based solely on MIs) inflate fit and should not be applied without theoretical justification. Cross-validate any modified model.'
        );
    }

    details.push(locale === 'vi'
        ? 'Ngoài độ khít tổng thể, CFA phải đáp ứng tính Độ độ giá trị hội tụ (Convergent Validity: AVE ≥ .50) và Độ độ giá trị phân biệt (Discriminant Validity: HTMT < .85 hoặc Fornell-Larcker) (Brown, 2015).'
        : 'Beyond fit indices, convergent validity (AVE ≥ .50) and discriminant validity (HTMT < .85 or Fornell-Larcker criterion) should be assessed to fully evaluate the measurement model (Brown, 2015).'
    );

    const cfaVerdict = nBad === 0 ? 'pass' : nBad <= 1 ? 'warning' : 'fail';
    const rmseaCIStr = (rmseaCILower != null && rmseaCIUpper != null)
        ? ` [90% CI: ${formatCoef(rmseaCILower)}, ${formatCoef(rmseaCIUpper)}]`
        : '';

    return {
        summary, details, warnings, citations,
        verdict: cfaVerdict,
        apaStatement: locale === 'vi'
            ? `Kết quả CFA chỉ ra mô hình có độ khít ${fitVerdict}: CFI = ${formatCoef(cfi)}, TLI = ${formatCoef(tli)}, RMSEA = ${formatCoef(rmsea)}${rmseaCIStr}, SRMR = ${formatCoef(srmr)}, χ²(${df}) = ${formatNum(chi2)}, ${formatPValue(pValue)} (Hu & Bentler, 1999).`
            : `CFA results indicated ${fitVerdict}: CFI = ${formatCoef(cfi)}, TLI = ${formatCoef(tli)}, RMSEA = ${formatCoef(rmsea)}${rmseaCIStr}, SRMR = ${formatCoef(srmr)}, χ²(${df}) = ${formatNum(chi2)}, ${formatPValue(pValue)} (Hu & Bentler, 1999).`,
        recommendations: nBad === 0
            ? (locale === 'vi' ? [
                'Báo cáo đầy đủ 4 chỉ số (CFI, TLI, RMSEA với 90% CI, SRMR) vào bài nghiên cứu để có tính thuyết phục toàn diện.',
                'Thực hiện thêm đánh giá Độ độ giá trị hội tụ (AVE ≥ .50) và Độ độ giá trị phân biệt (HTMT < .85).',
                'Nên kèm theo chỉ số Độ tin cậy (Cronbach α, McDonald ω) của từng cấu trúc nhân tố nằm bên cạnh kết quả CFA.'
            ] : [
                'Report all four fit indices (CFI, TLI, RMSEA with 90% CI, SRMR) in the manuscript for comprehensive evaluation.',
                'Assess convergent validity (AVE ≥ .50) and discriminant validity (HTMT < .85) to complete measurement model evaluation.',
                'Consider reporting reliability (Cronbach α or McDonald ω) for each factor alongside the CFA fit.',
            ])
            : (locale === 'vi' ? [
                nBad >= 2 ? 'Nhiều chỉ số không đạt chuẩn — cần sử dụng Modification Indices (MI) để tìm xem các biến quan sát nào có phần dư tương quan lớn nhất và loại bỏ/nối (nếu phù hợp lý thuyết).' : 'Có một chỉ số không đạt — xem xét MI cho việc sắp xếp lại một số câu hỏi khảo sát trong cùng nhóm.',
                'Nếu đã tinh chỉnh mô hình, cần phải thực hiện cross-validation ở tập mẫu độc lập để tránh Overfitting.',
                'Cân nhắc dùng mô hình phương trình cấu trúc Bayes (BSEM) hoặc ESEM nếu CFA chuẩn (simple-structure) liên tục từ chối mô hình thực tế.'
            ] : [
                nBad >= 2
                    ? 'Multiple fit indices are below threshold — inspect modification indices (MI) for the largest residual covariances and consider theoretically justified model re-specifications.'
                    : 'One fit index is marginal — examine modification indices for potential item reassignments or correlated residuals within the same scale.',
                'Cross-validate any re-specified model in an independent sample to prevent overfitting.',
                'Consider Bayesian SEM or ESEM as alternatives if the simple-structure CFA consistently shows poor fit.',
            ]),
    };
}
