'use client';

import React, { useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, Activity, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { getStoredLocale, t, type Locale } from '../../../lib/i18n';
import { UnifiedASIGInterpretation } from '@/components/results/shared/UnifiedASIGInterpretation';
import { ScientificNote } from '../shared/ScientificNote';

interface CronbachResultsProps {
    results: any;
    columns?: string[];
    onProceedToEFA?: (goodItems: string[]) => void;
    scaleName?: string;
    analysisType?: string;
    hideASIG?: boolean;
    hideTables?: boolean;
}

/**
 * Cronbach's Alpha Reliability Results Component - Scientific Academic Style (White & Blue)
 */
export const CronbachResults = React.memo(function CronbachResults({
    results,
    columns,
    onProceedToEFA,
    scaleName,
    analysisType,
    hideASIG = false,
    hideTables = false
}: CronbachResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
    }, []);

    const isOmega = analysisType === 'omega';
    const alpha = isOmega 
        ? parseFloat(String(results.omega || results.alpha || results.rawAlpha || 0)) || 0
        : parseFloat(String(results.alpha || results.rawAlpha || 0)) || 0;
    const nItems = results.nItems || 'N/A';
    const itemTotalStats = results.itemTotalStats || [];
    
    // Robust formatting helper to prevent .toFixed errors
    const formatNum = (val: any, digits: number = 3) => {
        if (val === null || val === undefined) return 'N/A';
        const num = typeof val === 'number' ? val : parseFloat(String(val));
        return isNaN(num) ? 'N/A' : num.toFixed(digits);
    };

    // Extract good items for workflow (memoized)
    const goodItems = useMemo(() =>
        itemTotalStats
            .filter((item: any) => parseFloat(String(item.correctedItemTotalCorrelation)) >= 0.3)
            .map((item: any, idx: number) => columns?.[idx] || item.itemName),
        [itemTotalStats, columns]
    );

    const handleProceedToEFA = useCallback(() => {
        if (onProceedToEFA) {
            onProceedToEFA(goodItems);
        }
    }, [onProceedToEFA, goodItems]);

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-500">
            {isOmega && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm mb-6">
                    <p className="text-sm font-bold text-amber-900">
                        Lưu ý / Note: True McDonald's ω requires SEM-based factor analysis which is currently unavailable in the browser environment. The value displayed is Cronbach's α computed via the same item covariance formula.
                    </p>
                </div>
            )}

            {/* Reliability Summary Table */}
            {!hideTables && (
                <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-600" />
                            {isOmega ? 'McDonald\'s Omega Reliability' : 'Cronbach\'s Alpha Reliability Statistics'}
                            {scaleName && <span className="text-sm font-black text-blue-800 ml-2 border-l border-blue-200 pl-2">{scaleName}</span>}
                            <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded ml-2 font-black">V1.2-OMEGA</span>
                        </h3>
                    </div>
                    <div className="p-8 flex items-center justify-around bg-gradient-to-r from-white to-blue-50/30">
                        <div className="text-center">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isOmega ? 'Omega' : 'Alpha'} Coefficient</div>
                            <div className={`text-5xl font-black ${alpha >= 0.7 ? 'text-blue-900' : 'text-slate-400'}`}>
                                {formatNum(alpha, 3)}
                            </div>
                            <div className={`text-[10px] font-black mt-2 uppercase px-3 py-1 rounded-full border ${alpha >= 0.7 ? 'bg-blue-900 text-white border-blue-900' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                {alpha >= 0.8 ? 'Very High' : alpha >= 0.7 ? 'Acceptable' : alpha >= 0.6 ? 'Questionable' : 'Poor'}
                            </div>
                        </div>
                        <div className="h-16 w-px bg-blue-100"></div>
                        <div className="text-center">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items Tracked</div>
                            <div className="text-5xl font-black text-blue-900">
                                {nItems}
                            </div>
                            <div className="text-[10px] font-black mt-2 uppercase text-slate-400 tracking-tighter">Number of Items in Scale</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Item-Total Statistics Table */}
            {!hideTables && itemTotalStats.length > 0 && (
                <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">Item-Total Statistics</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-slate-700">
                            <thead className="bg-blue-50/50 border-y border-blue-100">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase">Variable</th>
                                    <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">Scale Mean if Item Deleted</th>
                                    <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">Scale Variance if Item Deleted</th>
                                    <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right bg-blue-100/30">Corrected Item-Total Correlation</th>
                                    <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">Cronbach&apos;s a if Item Deleted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                                {itemTotalStats.map((item: any, idx: number) => {
                                    const corr = parseFloat(String(item.correctedItemTotalCorrelation)) || 0;
                                    const devAlpha = parseFloat(String(item.alphaIfItemDeleted)) || 0;
                                    const isLow = corr < 0.3;
                                    const isKiller = devAlpha > alpha;
                                    
                                    return (
                                        <tr key={idx} className={`hover:bg-blue-50/30 transition-colors ${isLow ? 'bg-red-50/30' : ''}`}>
                                             <td className="py-4 px-6 text-sm font-bold text-blue-800">{columns?.[idx] || item.itemName}</td>
                                            <td className="py-4 px-4 text-sm text-right font-mono text-slate-800">{formatNum(item.scaleMeanIfDeleted)}</td>
                                            <td className="py-4 px-4 text-sm text-right font-mono text-slate-800">{formatNum(item.scaleVarianceIfDeleted)}</td>
                                            <td className={`py-4 px-4 text-sm text-right font-black ${isLow ? 'text-red-700 underline underline-offset-4 decoration-red-400 font-extrabold ring-1 ring-red-100 rounded-lg' : 'text-blue-950 bg-blue-50/20 font-black'}`}>
                                                {formatNum(item.correctedItemTotalCorrelation)}
                                            </td>
                                            <td className={`py-4 px-4 text-sm text-right font-black ${isKiller ? 'text-amber-700 font-extrabold' : 'text-slate-800 font-bold'}`}>
                                                {formatNum(item.alphaIfItemDeleted)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Professional Template Interpretation */}
            {!hideASIG && (
                <>
                    <UnifiedASIGInterpretation 
                        analysisType={isOmega ? 'omega' : 'cronbach'}
                        results={results}
                        scaleName={scaleName}
                    />

                    <ScientificNote
                        insight={isOmega
                            ? "McDonald\u2019s Omega (\u03c9) provides a more accurate and theoretically defensible reliability estimate than Cronbach\u2019s \u03b1 when item factor loadings are heterogeneous (violation of tau-equivalence). Unlike \u03b1, \u03c9 does not assume equal factor loadings and is therefore appropriate for most psychometric scales encountered in social science research (Hayes & Coutts, 2020). \u03c9 \u2265 .70 indicates adequate internal consistency; \u03c9 \u2265 .80 is preferred for published research. Report alongside Cronbach\u2019s \u03b1 for comparison, and examine corrected item-total correlations (CITC \u2265 .30) to identify items that should be revised or removed."
                            : "Cronbach\u2019s Alpha (\u03b1) is the most widely reported index of internal consistency reliability, estimating the proportion of scale variance attributable to the common factor. Despite its ubiquity, \u03b1 is a lower bound of reliability that assumes tau-equivalence (equal factor loadings) \u2014 an assumption rarely met in practice. When loadings differ substantially across items, \u03b1 underestimates true reliability and McDonald\u2019s \u03c9 should be preferred. Items with CITC < .30 contribute negligible shared variance and should be revised or deleted before confirmatory use of the scale. \u03b1 should always be reported alongside \u03c9 and N items for full transparency (Nunnally & Bernstein, 1994)."}
                        citation={isOmega ? "Hayes & Coutts, 2020; Revelle & Zinbarg, 2009" : "Nunnally & Bernstein, 1994; Sijtsma, 2009"}
                        reference={isOmega ? [
                            "Hayes, A. F., & Coutts, J. J. (2020). Use omega rather than Cronbach\u2019s alpha for estimating reliability. Communication Methods and Measures, 14(1), 1\u201324. https://doi.org/10.1080/19312458.2020.1718629",
                            "Revelle, W., & Zinbarg, R. E. (2009). Coefficients alpha, beta, omega, and the glb: Comments on Sijtsma. Psychometrika, 74(1), 145\u2013154."
                        ] : [
                            "Nunnally, J. C., & Bernstein, I. H. (1994). Psychometric theory (3rd ed.). McGraw-Hill.",
                            "Sijtsma, K. (2009). On the use, the misuse, and the very limited usefulness of Cronbach\u2019s alpha. Psychometrika, 74(1), 107\u2013120. https://doi.org/10.1007/s11336-008-9101-0"
                        ]}
                        thresholds={[
                            { label: "\u03b1 / \u03c9 Adequate", value: "\u2265 .70", status: "acceptable" as const },
                            { label: "\u03b1 / \u03c9 Good", value: "\u2265 .80", status: "good" as const },
                            { label: "\u03b1 / \u03c9 Excellent", value: "\u2265 .90", status: "good" as const },
                            { label: "CITC", value: "\u2265 .30 to retain item", status: "acceptable" as const },
                            { label: "\u03b1 Exploratory", value: ".60\u2013.69 acceptable", status: "acceptable" as const },
                        ]}
                        assumptions={[
                            "Items are measured on a common scale (e.g., Likert 1\u20135) and intended to reflect a single latent construct (unidimensionality).",
                            "All items should be scored in the same direction \u2014 reverse-score negatively worded items before computing \u03b1.",
                            "Sample size \u2265 100 for stable \u03b1 estimates; report 95% CI for \u03b1 when N < 300.",
                            "Unidimensionality should be verified via EFA or CFA before interpreting \u03b1 as a reliability index.",
                        ]}
                        pitfalls={[
                            "Accepting \u03b1 \u2265 .70 as proof of reliability without checking CITC \u2014 a high \u03b1 with low CITC items indicates item redundancy, not reliability.",
                            "Using \u03b1 as a validity index: internal consistency and construct validity are distinct properties.",
                            "Reporting \u03b1 = .70 as sufficient for confirmatory research \u2014 published psychometric scales for hypothesis testing typically require \u03b1 \u2265 .80.",
                            "Ignoring the number of items: \u03b1 increases mechanically as k increases \u2014 a 10-item scale with low inter-item r can still achieve \u03b1 = .70.",
                        ]}
                    />
                    {/* Workflow Step: Proceed to EFA */}
                    {goodItems.length >= 3 && onProceedToEFA && (
                        <div className="bg-blue-900 p-8 rounded-2xl text-white shadow-xl shadow-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-700 p-3 rounded-xl shadow-lg">
                                    <CheckCircle2 className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black tracking-tight">Ready to Proceed?</h4>
                                    <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Scale reliability confirmed</p>
                                </div>
                            </div>
                            <button
                                onClick={handleProceedToEFA}
                                className="bg-white text-blue-900 px-8 py-4 rounded-xl font-black flex items-center gap-3 hover:bg-blue-50 transition-all shadow-lg active:scale-95 group"
                            >
                                <span>RUN EFA ({goodItems.length} QUALIFYING ITEMS)</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
});

export default CronbachResults;
