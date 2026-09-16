import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Database, FileText, BarChart, Info, Activity } from 'lucide-react';
import { getStoredLocale, t, type Locale } from '@/lib/i18n';
import { UnifiedASIGInterpretation } from '@/components/results/shared/UnifiedASIGInterpretation';
import { ScientificNote } from '../shared/ScientificNote';

interface ANOVAResultsProps {
    results: any;
    columns?: string[];
    variableNames?: {
        factorVar?: string;
        targetVar?: string;
    };
}

/**
 * ANOVA Results Component - Scientific Academic Style (White & Blue)
 */
export const ANOVAResults = React.memo(function ANOVAResults({ results, columns, variableNames }: ANOVAResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
    }, []);

    const displayResults = results.data || results;
    if (!displayResults || displayResults.pValue == null) return null;

    const pValue      = typeof displayResults.pValue === 'number' ? displayResults.pValue : 0;
    const significant = pValue < 0.05;
    const fmtP = (p: number) => p < 0.001 ? '< .001' : p.toFixed(3);

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-700">
            {/* Header with quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">F-Statistic</p>
                        <p className="text-2xl font-black text-blue-900">{(displayResults.F || displayResults.fStatistic)?.toFixed(3)}</p>
                    </div>
                </div>
                <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                        <Info className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">p-value</p>
                        <p className={`text-2xl font-black ${significant ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {fmtP(pValue)}
                        </p>
                    </div>
                </div>
                <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-lg">
                        <BarChart className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Eta Squared (η²)</p>
                        <p className="text-2xl font-black text-indigo-900">{(displayResults.etaSquared || 0).toFixed(3)}</p>
                    </div>
                </div>
            </div>

            {/* ANOVA Summary Table */}
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        {t(locale, 'basic.anova_ui.anova_table')}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-slate-700">
                        <thead className="bg-blue-50/50 border-y border-blue-100">
                            <tr>
                                <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase">{t(locale, 'basic.anova_ui.source')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.anova_ui.sum_squares')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-center">{t(locale, 'basic.anova_ui.df')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.anova_ui.mean_square')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.anova_ui.f_value')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.anova_ui.p_value')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                            <tr className="hover:bg-blue-50/30 transition-colors">
                                <td className="py-5 px-6 text-sm font-bold text-blue-800">{t(locale, 'basic.anova_ui.between_groups')}</td>
                                <td className="py-5 px-4 text-sm text-right font-mono">{displayResults.ssBetween?.toFixed(3)}</td>
                                <td className="py-5 px-4 text-sm text-center font-bold">{displayResults.dfBetween}</td>
                                <td className="py-5 px-4 text-sm text-right font-mono">{displayResults.msBetween?.toFixed(3)}</td>
                                 <td className="py-5 px-4 text-sm text-right font-black text-blue-900">{(displayResults.F || displayResults.fStatistic)?.toFixed(3)}</td>
                                <td className={`py-5 px-4 text-sm text-right font-black ${significant ? 'text-emerald-700 underline underline-offset-4' : 'text-slate-700'}`}>
                                    {pValue < 0.001 ? '< .001' : fmtP(pValue)} {significant ? ' *' : ''}
                                </td>
                            </tr>
                             <tr className="hover:bg-blue-50/30 transition-colors">
                                <td className="py-5 px-6 text-sm italic text-slate-800">{t(locale, 'basic.anova_ui.within_groups')}</td>
                                <td className="py-5 px-4 text-sm text-right font-mono text-slate-900">{displayResults.ssWithin?.toFixed(3)}</td>
                                <td className="py-5 px-4 text-sm text-center font-bold text-slate-900">{displayResults.dfWithin}</td>
                                <td className="py-5 px-4 text-sm text-right font-mono text-slate-900">{displayResults.msWithin?.toFixed(3)}</td>
                                <td className="py-5 px-4" colSpan={2}></td>
                            </tr>
                            <tr className="bg-slate-50/80 font-bold border-t border-blue-100">
                                <td className="py-5 px-6 text-sm text-blue-900">{t(locale, 'basic.anova_ui.total')}</td>
                                <td className="py-5 px-4 text-sm text-right font-mono text-blue-900">{(displayResults.ssBetween + displayResults.ssWithin)?.toFixed(3)}</td>
                                <td className="py-5 px-4 text-sm text-center text-blue-900">{(displayResults.dfBetween + displayResults.dfWithin)}</td>
                                <td colSpan={3}></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Group Means Table */}
            {displayResults.groupMeans && displayResults.groupMeans.length > 0 && (
                <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                            <BarChart className="w-4 h-4 text-blue-600" />
                            Group Means & Descriptives
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-slate-700">
                            <thead className="bg-blue-50/50 border-y border-blue-100">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase">Group</th>
                                    <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">Mean</th>
                                    <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                                {displayResults.groupMeans.map((mean: number, idx: number) => (
                                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-4 px-6 text-sm font-bold text-slate-700">
                                            {columns && columns[idx] ? columns[idx] : `Group ${idx + 1}`}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-right font-mono font-bold text-blue-900">{mean.toFixed(3)}</td>
                                        <td className="py-4 px-4 text-sm text-right">
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-blue-500 h-full" 
                                                    style={{ width: `${Math.min(100, (mean / (displayResults.grandMean * 2)) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-blue-50/20 font-black border-t border-blue-100">
                                    <td className="py-4 px-6 text-sm text-blue-900 uppercase">Grand Mean</td>
                                    <td className="py-4 px-4 text-sm text-right font-mono text-blue-900">{displayResults.grandMean?.toFixed(3)}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Post-Hoc Tests (Pairwise Comparisons) */}
            {significant && displayResults.postHoc && displayResults.postHoc.length > 0 && (
                <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500">
                    <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-600" />
                            Post-Hoc Pairwise Comparisons (Tukey HSD / Games-Howell)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-slate-700">
                            <thead className="bg-blue-50/50 border-y border-blue-100">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase">Comparison</th>
                                    <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">Difference</th>
                                    <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">Sig. (p-adj)</th>
                                    <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">Interpretation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                                {displayResults.postHoc.map((comp: any, idx: number) => {
                                    const isSig = comp.pAdj < 0.05;
                                    return (
                                        <tr key={idx} className={`hover:bg-blue-50/30 transition-colors ${isSig ? 'bg-emerald-50/20' : ''}`}>
                                            <td className="py-4 px-6 text-sm font-bold text-slate-700">{comp.comparison}</td>
                                            <td className={`py-4 px-4 text-sm text-right font-mono ${isSig ? 'text-blue-900 font-black' : 'text-slate-600'}`}>
                                                {comp.diff.toFixed(3)}
                                            </td>
                                            <td className={`py-4 px-4 text-sm text-right font-black ${isSig ? 'text-emerald-600 underline' : 'text-slate-400'}`}>
                                                {comp.pAdj < 0.001 ? '< .001' : comp.pAdj.toFixed(4)}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-right font-medium">
                                                {isSig ? (
                                                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] uppercase font-black">Significant</span>
                                                ) : (
                                                    <span className="text-slate-400 text-[10px] uppercase font-medium">n.s.</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {displayResults.postHocWarning && (
                        <div className="p-4 bg-amber-50 text-[10px] text-amber-800 font-bold italic">
                            * {displayResults.postHocWarning}
                        </div>
                    )}
                </div>
            )}

            {/* Professional Template Interpretation */}
            <UnifiedASIGInterpretation 
                analysisType="anova"
                results={displayResults}
                variableNames={{
                    targetVar: columns && columns.length > 0 ? columns[0] : 'Dependent Variable',
                    factorVar: columns && columns.length > 1 ? columns[1] : 'Grouping Variable'
                }}
            />


            {/* Assumptions Check Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-xl border ${displayResults.assumptionCheckP >= 0.05 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                    <h4 className={`text-xs font-black uppercase mb-3 ${displayResults.assumptionCheckP >= 0.05 ? 'text-emerald-800' : 'text-amber-800'}`}>
                        Homogeneity of Variance (Levene&apos;s Test)
                    </h4>
                    <p className="text-sm font-medium text-slate-700">
                        {displayResults.assumptionCheckP >= 0.05 
                            ? `Variances are homogeneous (p = ${displayResults.assumptionCheckP.toFixed(4)}). ANOVA assumption satisfied.`
                            : `Variances are NOT homogeneous (p = ${displayResults.assumptionCheckP.toFixed(4)}). Welch's ANOVA correction applied.`
                        }
                    </p>
                </div>
                <div className={`p-6 rounded-xl border ${displayResults.normalityResidP >= 0.05 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                    <h4 className={`text-xs font-black uppercase mb-3 ${displayResults.normalityResidP >= 0.05 ? 'text-emerald-800' : 'text-amber-800'}`}>
                        Normality of Residuals (Shapiro-Wilk)
                    </h4>
                    <p className="text-sm font-medium text-slate-700">
                        {displayResults.normalityResidP >= 0.05 
                            ? `Residuals are normally distributed (p = ${displayResults.normalityResidP.toFixed(4)}).`
                            : `Residuals violate the normality assumption (p = ${displayResults.normalityResidP.toFixed(4)}).`
                        }
                    </p>
                </div>
            </div>

            <ScientificNote
                insight="One-Way ANOVA partitions total variability in a continuous outcome into between-group and within-group components, testing the omnibus null hypothesis that all population group means are equal (H₀: μ₁ = μ₂ = … = μk). A significant F-test warrants post-hoc pairwise comparisons: Tukey HSD when variances are homogeneous, Games-Howell when Levene's test is significant. Reporting must include F(dfBetween, dfWithin), exact p, and η² or ω² as effect size. Note that η² overestimates the population effect in small samples; ω² provides a less biased estimate (Olejnik & Algina, 2003)."
                citation="Field, 2018; Richardson, 2011; Olejnik & Algina, 2003"
                reference={[
                    "Field, A. (2018). Discovering statistics using IBM SPSS Statistics (5th ed.). SAGE Publications.",
                    "Richardson, J. T. E. (2011). Eta squared and partial eta squared as measures of effect size in educational research. Educational Research Review, 6(2), 135–147.",
                    "Olejnik, S., & Algina, J. (2003). Generalized eta and omega squared statistics: Measures of effect size for some common research designs. Psychological Methods, 8(4), 434–447.",
                ]}
                thresholds={[
                    { label: 'Small η²', value: '.01–.05', status: 'acceptable' },
                    { label: 'Medium η²', value: '.06–.13', status: 'acceptable' },
                    { label: 'Large η²', value: '≥ .14', status: 'good' },
                    { label: 'Levene p', value: '< .05 → Welch', status: 'warn' },
                ]}
                assumptions={[
                    "Independence of observations — no repeated measures or nested design.",
                    "Normality of residuals within each group (Shapiro-Wilk on residuals; robust for n ≥ 15 per group).",
                    "Homogeneity of variance across groups (Levene's test) — use Welch ANOVA if violated.",
                    "The dependent variable is measured at interval/ratio level.",
                ]}
                pitfalls={[
                    "Stopping at the omnibus F-test without post-hoc comparisons when H₀ is rejected — the F-test identifies that at least one pair differs, not which pairs.",
                    "Reporting η² without noting it is a sample-specific, positively biased estimate — prefer ω² for publication.",
                    "Interpreting non-significant F as confirmation of equal means — report equivalence margins or confidence intervals.",
                    "Using ANOVA when group ns are very unequal without checking robustness via Type III SS.",
                ]}
            />
        </div>
    );
});

export default ANOVAResults;

