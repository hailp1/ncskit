'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Layers, Activity } from 'lucide-react';
import { getStoredLocale, t, type Locale } from '@/lib/i18n';
import { UnifiedASIGInterpretation } from '@/components/results/shared/UnifiedASIGInterpretation';
import { ScientificNote } from '../shared/ScientificNote';

interface CorrelationResultsProps {
    results: any;
    columns: string[];
}

/**
 * Correlation Matrix Results Component - Scientific Academic Style (White & Blue)
 */
export const CorrelationResults = React.memo(function CorrelationResults({ results, columns }: CorrelationResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
    }, []);

    const matrix = results.correlationMatrix;
    const pValues = results.pValues;
    
    if (!matrix || !columns) return null;

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-500">
            {/* White-Blue Academic Table */}
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600 " />
                        {t(locale, 'basic.correlation_ui.title')}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-slate-700 ">
                        <thead className="bg-blue-50/50 border-y border-blue-100 ">
                            <tr>
                                <th colSpan={2} className="py-4 px-6 text-xs font-black text-blue-900 uppercase">{t(locale, 'basic.correlation_ui.variable')}</th>
                                {columns.map((col, idx) => (
                                    <th key={idx} className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-center border-l border-blue-50 min-w-[100px]">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50 ">
                            {matrix.map((row: number[], rowIdx: number) => (
                                <React.Fragment key={rowIdx}>
                                    {/* Pearson Correlation Row */}
                                    <tr className="hover:bg-blue-50/30 transition-colors group">
                                        <td rowSpan={pValues ? 2 : 1} className="py-5 px-6 font-bold text-blue-800 border-r border-blue-50 bg-slate-50/30 ">
                                            {columns[rowIdx]}
                                        </td>
                                        <td className="py-4 px-4 font-black text-blue-900 border-r border-blue-50 text-[10px] uppercase bg-slate-50/20 ">
                                            {t(locale, 'basic.correlation_ui.correlation')}
                                        </td>
                                        {row.map((value: number, colIdx: number) => {
                                            const isSelf = rowIdx === colIdx;
                                            const pVal = pValues ? pValues[rowIdx][colIdx] : null;
                                            let stars = '';
                                            if (!isSelf && pVal !== null) {
                                                if (pVal < 0.01) stars = '**';
                                                else if (pVal < 0.05) stars = '*';
                                            }

                                            // Subdued Heatmap style for academic feel
                                            const absVal = Math.abs(value);
                                            const bgOpacity = isSelf ? 'bg-slate-50 ' : 
                                                              absVal >= 0.7 ? 'bg-blue-100/40 text-blue-900 ' :
                                                              absVal >= 0.5 ? 'bg-blue-50/40 text-blue-800 ' : 'bg-transparent';

                                            return (
                                                <td key={colIdx} className={`py-4 px-4 text-sm text-center border-l border-blue-50 font-mono transition-colors ${bgOpacity} ${isSelf ? 'text-slate-300 ' : 'text-blue-950 font-black'}`}>
                                                    {isSelf ? '1' : value.toFixed(3)}{stars}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    {/* Sig. (2-tailed) Row */}
                                    {pValues && (
                                        <tr className="hover:bg-blue-50/30 transition-colors border-b border-blue-50/50 ">
                                            <td className="py-2 px-4 font-black text-slate-800 border-r border-blue-50 text-[10px] uppercase bg-slate-50/20 ">
                                                Sig.<br/><span className="italic font-normal lowercase">(2-tailed)</span>
                                            </td>
                                            {row.map((_, colIdx: number) => {
                                                const isSelf = rowIdx === colIdx;
                                                const pVal = pValues[rowIdx][colIdx];
                                                return (
                                                    <td key={colIdx} className={`py-2 px-4 text-center border-l border-blue-50 text-[10px] font-mono ${isSelf ? '' : pVal < 0.05 ? 'text-blue-900 font-black underline' : 'text-slate-600 '}`}>
                                                        {isSelf ? '' : (pVal < 0.001 ? '<.001' : pVal.toFixed(3))}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Professional Template Interpretation for the primary relationship */}
            {columns.length >= 2 && (
                <UnifiedASIGInterpretation 
                    analysisType="correlation"
                    results={{
                        r: matrix[0][1],
                        pValue: pValues ? pValues[0][1] : 1,
                        method: 'pearson'
                    }}
                    variableNames={{
                        var1: columns[0],
                        var2: columns[1]
                    }}
                />
            )}

            <ScientificNote
                insight="The Pearson product-moment correlation coefficient (r) quantifies the strength and direction of the linear relationship between two continuous variables. r ranges from −1 (perfect negative) to +1 (perfect perfect), with 0 indicating no linear association. Spearman's rs is the appropriate alternative when data are ordinal or when normality is violated. Always report r alongside its p-value, sample size N, and 95% CI, and interpret the effect size using Cohen's (1988) benchmarks. Note that statistical significance does not imply practical importance, and r² conveys the proportion of shared variance — a more informative effect-size metric for applied research."
                citation="Cohen, 1988; Mukaka, 2012"
                reference={[
                    "Cohen, J. (1988). Statistical power analysis for the behavioral sciences (2nd ed.). Lawrence Erlbaum Associates.",
                    "Mukaka, M. M. (2012). Statistics corner: A guide to appropriate use of correlation coefficient in medical research. Malawi Medical Journal, 24(3), 69–71."
                ]}
                thresholds={[
                    { label: 'Small', value: '|r| = .10–.29', status: 'acceptable' },
                    { label: 'Medium', value: '|r| = .30–.49', status: 'acceptable' },
                    { label: 'Large', value: '|r| ≥ .50', status: 'good' },
                    { label: 'α level', value: 'p < .05', status: 'good' },
                ]}
                assumptions={[
                    "Both variables are measured at the interval or ratio level (Pearson); ordinal data require Spearman's rs.",
                    "The relationship is approximately linear — inspect scatter plots before reporting r.",
                    "No severe multivariate outliers, which can inflate or deflate r substantially.",
                    "For inferential use, at least one variable should be approximately normally distributed (N ≥ 30 mitigates this via CLT).",
                ]}
                pitfalls={[
                    "Reporting r without N or CI — effect sizes are meaningless without sample context.",
                    "Confusing correlation with causation: r quantifies co-variation, not directional causality.",
                    "Ignoring restriction of range: a truncated sample artificially reduces r.",
                    "Using Pearson r on ordinal Likert items without justification — use Spearman or polychoric r instead.",
                ]}
            />
        </div>
    );
});

export default CorrelationResults;

