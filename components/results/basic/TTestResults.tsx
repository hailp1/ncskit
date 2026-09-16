import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Database, Activity, Info, BarChart } from 'lucide-react';
import { getStoredLocale, t, type Locale } from '@/lib/i18n';
import { UnifiedASIGInterpretation } from '@/components/results/shared/UnifiedASIGInterpretation';
import { ScientificNote } from '../shared/ScientificNote';

interface TTestResultsProps {
    results: any;
    columns?: string[];
    variableNames?: {
        groupVar?: string;
        targetVar?: string;
        group1?: string;
        group2?: string;
    };
}

/**
 * T-Test Results Component - Scientific Academic Style (White & Blue)
 */
export const TTestResults = React.memo(function TTestResults({ results, columns, variableNames }: TTestResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
    }, []);

    if (!results) return null;

    // Robust formatting helper
    const formatNum = (val: any, digits: number = 3) => {
        if (val === null || val === undefined) return 'N/A';
        const num = typeof val === 'number' ? val : parseFloat(String(val));
        return isNaN(num) ? 'N/A' : num.toFixed(digits);
    };

    const pValue = parseFloat(String(results.pValue)) || 0;
    const significant = pValue < 0.05;
    const lP = parseFloat(String(results.leveneP)) || 0.5;
    const leveneSig = lP < 0.05;

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-700">
            {/* Quick Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">t-Statistic</p>
                        <p className="text-2xl font-black text-blue-900">{formatNum(results.tStatistic, 3)}</p>
                    </div>
                </div>
                <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                        <Info className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">p-value</p>
                        <p className={`text-2xl font-black ${significant ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {pValue < 0.001 ? '< .001' : formatNum(pValue, 4)}
                        </p>
                    </div>
                </div>
                <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-lg">
                        <BarChart className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cohen&apos;s d</p>
                        <p className="text-2xl font-black text-indigo-900">{formatNum(results.effectSize, 3)}</p>
                    </div>
                </div>
            </div>

            {/* Main T-Test Table */}
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        {t(locale, 'basic.ttest_ui.ttest_results')}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-slate-700">
                        <thead className="bg-blue-50/50 border-y border-blue-100">
                            <tr>
                                <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase">Test Assumption</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.ttest_ui.t_value')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-center">{t(locale, 'basic.ttest_ui.df')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.ttest_ui.p_value')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.ttest_ui.mean_diff')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                            <tr className="hover:bg-blue-50/30 transition-colors">
                                <td className="py-5 px-6">
                                    <div className="text-sm font-bold text-blue-800">{leveneSig ? "Equal variances not assumed (Welch)" : "Equal variances assumed"}</div>
                                </td>
                                <td className="py-5 px-4 text-sm text-right font-mono">{formatNum(results.tStatistic, 3)}</td>
                                <td className="py-5 px-4 text-sm text-center font-bold">{formatNum(results.df, 2)}</td>
                                 <td className={`py-5 px-4 text-sm text-right font-black ${significant ? 'text-emerald-700 underline underline-offset-4' : 'text-slate-700'}`}>
                                    {formatNum(pValue, 4)} {significant ? ' *' : ''}
                                </td>
                                <td className="py-5 px-4 text-sm text-right font-mono text-slate-800 font-black">{formatNum(results.meanDiff, 3)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Group Statistics Table */}
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                        <BarChart className="w-4 h-4 text-blue-600" />
                        {t(locale, 'basic.ttest_ui.group_stats')}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-slate-700">
                        <thead className="bg-blue-50/50 border-y border-blue-100">
                            <tr>
                                <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase">{t(locale, 'basic.ttest_ui.group')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">Mean</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">Std. Deviation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                            <tr className="hover:bg-blue-50/30">
                                <td className="py-4 px-6 text-sm font-bold text-slate-700">{variableNames?.group1 || 'Group 1'}</td>
                                <td className="py-4 px-4 text-sm text-right font-mono font-bold text-blue-900">{formatNum(results.mean1, 3)}</td>
                                <td className="py-4 px-4 text-sm text-right font-mono">{formatNum(results.sd1, 3)}</td>
                            </tr>
                            <tr className="hover:bg-blue-50/30">
                                <td className="py-4 px-6 text-sm font-bold text-slate-700">{variableNames?.group2 || 'Group 2'}</td>
                                <td className="py-4 px-4 text-sm text-right font-mono font-bold text-blue-900">{formatNum(results.mean2, 3)}</td>
                                <td className="py-4 px-4 text-sm text-right font-mono">{formatNum(results.sd2, 3)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Professional Interpretation */}
            <UnifiedASIGInterpretation 
                analysisType="ttest_independent"
                results={results}
                variableNames={variableNames}
            />

            {/* Assumptions & Levene's Test */}
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                        {t(locale, 'basic.ttest_ui.levene_test')}
                    </h4>
                    <div className={`text-[10px] uppercase font-black px-3 py-1 rounded-lg border ${leveneSig ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-emerald-50 border-emerald-300 text-emerald-700'}`}>
                        {leveneSig ? 'Variances NOT Assume EQUAL' : 'Variances Assume EQUAL (OK)'}
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-sm">
                        <span className="text-slate-600 font-bold mr-2">F-Value:</span>
                        <span className="text-blue-900 font-mono font-bold">{formatNum(results.leveneF, 3)}</span>
                    </div>
                    <div className="text-sm">
                        <span className="text-slate-600 font-bold mr-2">Significance:</span>
                        <span className="text-blue-900 font-mono font-bold">{formatNum(lP, 4)}</span>
                    </div>
                </div>
            </div>

            <ScientificNote
                insight="The independent-samples t-test evaluates whether the population means of a continuous dependent variable differ between two independent groups. Levene's test determines whether to report the equal-variances-assumed (Student's t) or equal-variances-not-assumed (Welch's t) variant — Welch's version is recommended by default (Delacre et al., 2017) as it controls Type I error better under heteroscedasticity. Always report the test statistic, degrees of freedom, exact p-value, mean difference with 95% CI, and Cohen's d as the effect size. When normality is violated (Shapiro-Wilk p < .05), consider the Mann-Whitney U test as a non-parametric alternative."
                citation="Field, 2018; Delacre et al., 2017; Cohen, 1988"
                reference={[
                    "Field, A. (2018). Discovering statistics using IBM SPSS Statistics (5th ed.). SAGE Publications.",
                    "Delacre, M., Lakens, D., & Leys, C. (2017). Why psychologists should by default use Welch's t-test instead of Student's t-test. International Review of Social Psychology, 30(1), 92–101.",
                    "Cohen, J. (1988). Statistical power analysis for the behavioral sciences (2nd ed.). Lawrence Erlbaum Associates.",
                ]}
                thresholds={[
                    { label: 'Small d', value: '.20–.49', status: 'acceptable' },
                    { label: 'Medium d', value: '.50–.79', status: 'acceptable' },
                    { label: 'Large d', value: '≥ .80', status: 'good' },
                    { label: 'Levene p', value: '< .05 → Welch', status: 'warn' },
                ]}
                assumptions={[
                    "Independence of observations — each participant belongs to exactly one group.",
                    "The dependent variable is approximately normally distributed within each group (Shapiro-Wilk; relaxed for n > 30 per group by CLT).",
                    "Homogeneity of variance (Levene's test) — use Welch's correction if violated.",
                    "The dependent variable is measured at the interval or ratio level.",
                ]}
                pitfalls={[
                    "Reporting only p-value without effect size (d) — statistical significance is N-dependent and does not convey practical importance.",
                    "Interpreting a non-significant result as 'no difference' — report 95% CI to bound the plausible range of effects.",
                    "Applying Student's t when Levene's test is significant — always use Welch's t under heteroscedasticity.",
                    "Violating independence by using paired data in an independent-samples framework.",
                ]}
            />
        </div>
    );
});

export default TTestResults;

