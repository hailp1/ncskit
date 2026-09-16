'use client';

import React, { useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getStoredLocale, t, type Locale } from '@/lib/i18n';
import { UnifiedASIGInterpretation } from '@/components/results/shared/UnifiedASIGInterpretation';
import { ScientificNote } from '../shared/ScientificNote';

interface CFAResultsProps {
    results: any;
    onProceedToSEM?: (factors: { name: string; indicators: string[] }[]) => void;
}

/**
 * Confirmatory Factor Analysis (CFA) Results Component
 * Displays model fit indices, factor loadings, and covariances
 */
export const CFAResults = React.memo(function CFAResults({ results, onProceedToSEM }: CFAResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
    }, []);

    if (!results) return null;
    const { fitMeasures, estimates } = results;

    const loadings = estimates.filter((e: any) => e.op === '=~');
    const covariances = estimates.filter((e: any) => e.op === '~~' && e.lhs !== e.rhs);

    // Extract factor structure for SEM (memoized)
    const factors = useMemo(() => {
        const factorMap: Record<string, string[]> = {};
        loadings.forEach((est: any) => {
            if (!factorMap[est.lhs]) factorMap[est.lhs] = [];
            factorMap[est.lhs].push(est.rhs);
        });
        return Object.entries(factorMap).map(([name, indicators]) => ({ name, indicators }));
    }, [loadings]);

    const fitGood = useMemo(() =>
        fitMeasures.cfi >= 0.9 && fitMeasures.rmsea <= 0.08,
        [fitMeasures.cfi, fitMeasures.rmsea]
    );

    const handleProceedToSEM = useCallback(() => {
        if (onProceedToSEM) {
            onProceedToSEM(factors);
        }
    }, [onProceedToSEM, factors]);

    // Helper to color fit indices
    const getFitColor = (val: number, type: 'high' | 'low') => {
        const isGood = type === 'high' ? val >= 0.9 : val <= 0.08;
        const isAcceptable = type === 'high' ? val >= 0.8 : val <= 0.10;
        
        if (isGood) return 'text-emerald-600 ';
        if (isAcceptable) return 'text-amber-600 ';
        return 'text-rose-600 ';
    };

    return (
        <div className="space-y-8 font-sans">
            {/* 1. Model Fit Summary */}
            <Card className="border-slate-200 shadow-md overflow-hidden">
                <CardHeader className="border-b bg-slate-50/50 pb-4">
                    <CardTitle className="text-slate-900 flex items-center gap-2 font-black">
                        {t(locale, 'factor.cfa_ui.model_fit')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-indigo-200">
                            <div className="text-[10px] font-black uppercase text-slate-600 mb-2 tracking-widest">Chi-square / df</div>
                            <div className="text-2xl font-black text-slate-900 ">
                                {(fitMeasures.chisq / fitMeasures.df).toFixed(3)}
                             </div>
                            <div className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-tighter">p = {fitMeasures.pvalue.toFixed(3)}</div>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-indigo-200">
                            <div className="text-[10px] font-black uppercase text-slate-600 mb-2 tracking-widest">CFI</div>
                            <div className={`text-2xl font-black ${getFitColor(fitMeasures.cfi, 'high')}`}>
                                {fitMeasures.cfi.toFixed(3)}
                            </div>
                            <div className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-tighter">CFI &gt; 0.9 (Good)</div>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-indigo-200">
                            <div className="text-[10px] font-black uppercase text-slate-600 mb-2 tracking-widest">TLI</div>
                            <div className={`text-2xl font-black ${getFitColor(fitMeasures.tli, 'high')}`}>
                                {fitMeasures.tli.toFixed(3)}
                            </div>
                            <div className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-tighter">TLI &gt; 0.9 (Good)</div>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-indigo-200">
                            <div className="text-[10px] font-black uppercase text-slate-600 mb-2 tracking-widest">RMSEA</div>
                            <div className={`text-2xl font-black ${getFitColor(fitMeasures.rmsea, 'low')}`}>
                                {fitMeasures.rmsea.toFixed(3)}
                            </div>
                            <div className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-tighter">RMSEA &lt; 0.08 (Good)</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Factor Loadings Table */}
            <Card className="border-slate-200 shadow-md overflow-hidden">
                <CardHeader className="border-b bg-slate-50/50 pb-4">
                    <CardTitle className="text-slate-900 font-black">{t(locale, 'factor.cfa_ui.factor_loadings')}</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pt-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-950 ">
                                    <th className="py-4 px-6 text-left font-black uppercase tracking-widest text-[10px] border-b-2 border-slate-300 ">{t(locale, 'factor.cfa_ui.latent_var')}</th>
                                    <th className="py-4 px-6 text-center border-b-2 border-slate-300 "></th>
                                    <th className="py-4 px-6 text-left font-black uppercase tracking-widest text-[10px] border-b-2 border-slate-300 ">{t(locale, 'factor.cfa_ui.observed_var')}</th>
                                    <th className="py-4 px-6 text-right font-black uppercase tracking-widest text-[10px] border-l border-slate-200 border-b-2 border-slate-300 whitespace-nowrap">{t(locale, 'factor.cfa_ui.estimate')}</th>
                                    <th className="py-4 px-6 text-right font-black uppercase tracking-widest text-[10px] border-l border-slate-200 border-b-2 border-slate-300 whitespace-nowrap">{t(locale, 'factor.cfa_ui.std_estimate')}</th>
                                    <th className="py-4 px-6 text-right font-black uppercase tracking-widest text-[10px] border-l border-slate-200 border-b-2 border-slate-300 whitespace-nowrap">{t(locale, 'factor.cfa_ui.p_value')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadings.map((est: any, idx: number) => (
                                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6 font-black text-slate-900 ">{est.lhs}</td>
                                        <td className="py-4 px-6 text-center text-slate-300 ">
                                            <span className="text-xl">→</span>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-slate-700 ">{est.rhs}</td>
                                        <td className="py-4 px-6 text-right border-l border-slate-200 font-medium">{est.est.toFixed(3)}</td>
                                        <td className={`py-4 px-6 text-right border-l border-slate-200 font-black ${est.std > 0.5 ? 'text-indigo-600 bg-indigo-50/10 ' : 'text-slate-800 '}`}>
                                            {est.std.toFixed(3)}
                                        </td>
                                        <td className="py-4 px-6 text-right border-l border-slate-200 ">
                                            {est.pvalue < 0.001 ? <span className="text-emerald-600 font-black uppercase text-[10px] tracking-tighter">{'< .001 ***'}</span> : <span className="font-bold">{est.pvalue.toFixed(3)}</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Covariances (Optional) */}
            {covariances.length > 0 && (
                <Card className="border-slate-200 shadow-md overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50 pb-4">
                        <CardTitle className="text-slate-900 font-black">{t(locale, 'factor.cfa_ui.covariances')}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pt-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-950 ">
                                        <th className="py-4 px-6 text-left font-black uppercase tracking-widest text-[10px] border-b-2 border-slate-300 ">{t(locale, 'factor.cfa_ui.correlation')}</th>
                                        <th className="py-4 px-6 text-right font-black uppercase tracking-widest text-[10px] border-l border-slate-200 border-b-2 border-slate-300 whitespace-nowrap">{t(locale, 'factor.cfa_ui.estimate')}</th>
                                        <th className="py-4 px-6 text-right font-black uppercase tracking-widest text-[10px] border-l border-slate-200 border-b-2 border-slate-300 whitespace-nowrap">{t(locale, 'factor.cfa_ui.std_estimate')}</th>
                                        <th className="py-4 px-6 text-right font-black uppercase tracking-widest text-[10px] border-l border-slate-200 border-b-2 border-slate-300 whitespace-nowrap">{t(locale, 'factor.cfa_ui.p_value')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {covariances.map((est: any, idx: number) => (
                                        <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 font-black text-slate-900 bg-slate-50/30 ">
                                                {est.lhs} <span className="mx-3 text-slate-300 ">⟷</span> {est.rhs}
                                            </td>
                                            <td className="py-4 px-6 text-right border-l border-slate-200 font-medium text-slate-900 ">{est.est.toFixed(3)}</td>
                                            <td className="py-4 px-6 text-right border-l border-slate-200 font-black text-indigo-600 ">
                                                {est.std.toFixed(3)}
                                            </td>
                                            <td className="py-4 px-6 text-right border-l border-slate-200 ">
                                                {est.pvalue < 0.001 ? <span className="text-emerald-600 font-black uppercase text-[10px] tracking-tighter">{'< .001 ***'}</span> : <span className="font-bold text-slate-900 ">{est.pvalue.toFixed(3)}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Professional Template Interpretation */}
            <UnifiedASIGInterpretation 
                analysisType="cfa"
                results={results}
            />

            <ScientificNote
                insight="Confirmatory Factor Analysis (CFA) tests whether a theoretically specified measurement model — in which observed indicators load on pre-defined latent constructs — is consistent with the observed covariance matrix. Model fit is evaluated using a battery of indices rather than any single criterion: CFI and TLI ≥ .95 indicate close fit (Hu & Bentler, 1999); RMSEA ≤ .06 with a 90% CI upper bound < .08 is preferable; SRMR ≤ .08 indicates acceptable average residual. The chi-square statistic is highly sensitive to N and should not be used as the sole fit criterion. Modification indices (MI > 10) may suggest correlated residuals between items sharing method variance, but post-hoc modifications must be theoretically justified and cross-validated."
                citation="Hu & Bentler, 1999; Kline, 2016; Brown, 2015"
                reference={[
                    "Hu, L., & Bentler, P. M. (1999). Cutoff criteria for fit indexes in covariance structure analysis. Structural Equation Modeling, 6(1), 1–55. https://doi.org/10.1080/10705519909540118",
                    "Kline, R. B. (2016). Principles and practice of structural equation modeling (4th ed.). Guilford Press.",
                    "Brown, T. A. (2015). Confirmatory factor analysis for applied research (2nd ed.). Guilford Press.",
                ]}
                thresholds={[
                    { label: 'CFI / TLI', value: '≥ .95 close / ≥ .90 acceptable', status: 'good' },
                    { label: 'RMSEA', value: '≤ .06 close / ≤ .08 acceptable', status: 'good' },
                    { label: 'SRMR', value: '≤ .08', status: 'good' },
                    { label: 'χ²/df', value: '≤ 3.0 acceptable / ≤ 2.0 good', status: 'acceptable' },
                    { label: 'Loading', value: '≥ .50 (≥ .70 preferred)', status: 'acceptable' },
                ]}
                assumptions={[
                    "Multivariate normality of indicators — assess with Mardia's coefficient; use MLR or WLSMV estimator if violated.",
                    "Adequate sample size: rule of thumb N ≥ 200, or N:parameter ratio ≥ 10:1.",
                    "The factor structure is correctly specified — under-specification causes fit inflation, over-specification causes model-data fit paradoxes.",
                    "No severe multivariate outliers — Mahalanobis D² with p < .001 cutoff.",
                ]}
                pitfalls={[
                    "Relying solely on chi-square for fit evaluation — it is almost always significant for N > 200 regardless of substantive fit.",
                    "Accepting a model with CFI ≥ .90 and RMSEA ≤ .08 as 'good fit' — these are acceptable thresholds, not excellent.",
                    "Adding correlated residuals based on MI without theoretical justification — this capitalizes on chance and inflates fit artificially.",
                    "Ignoring AVE and CR: a well-fitting CFA model still requires convergent validity evidence (AVE ≥ .50, CR ≥ .70).",
                ]}
            />

            {/* Workflow: Next Step Button */}

            {factors.length > 0 && onProceedToSEM && fitGood && (
                <div className="bg-gradient-to-tr from-indigo-600 to-violet-700 p-8 rounded-2xl shadow-xl shadow-indigo-200 text-white relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                    
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="flex-shrink-0 w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white text-4xl shadow-2xl border border-white/30 rotate-3 group-hover:rotate-0 transition-transform">
                            🎯
                        </div>
                        <div className="flex-1">
                            <div className="inline-block px-3 py-1 bg-indigo-500/50 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-white/20">
                                Model Quality Confirmed (Xác thực)
                            </div>
                            <h4 className="font-black mb-2 text-2xl tracking-tighter">CFA ĐẠT CHUẨN - TIẾN TỚI SEM</h4>
                            <p className="text-white/80 text-sm mb-6 leading-relaxed max-w-2xl font-medium">
                                Mô hình CFA ổn định (CFI ≥ 0.9, RMSEA ≤ 0.08). 
                                Bạn có thể tiến hành xây dựng <strong>SEM (Structural Equation Modeling)</strong> để kiểm định giả thuyết nghiên cứu.
                            </p>
                            <button
                                onClick={handleProceedToSEM}
                                className="px-8 py-4 bg-white text-indigo-700 hover:bg-slate-50 font-black rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 transform hover:-translate-y-1 active:scale-95"
                            >
                                <span>XÂY DỰNG SEM ({factors.length} NHÂN TỐ)</span>
                                <span className="text-2xl">→</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default CFAResults;
