'use client';

import React, { useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, FileText, CheckCircle2, LayoutGrid, Info, ShieldCheck } from 'lucide-react';

import { getStoredLocale, t, type Locale } from '@/lib/i18n';
import { UnifiedASIGInterpretation } from '@/components/results/shared/UnifiedASIGInterpretation';
import { ScientificNote } from '../shared/ScientificNote';

interface EFAResultsProps {
    results: any;
    columns: string[];
    onProceedToCFA?: (factors: { name: string; indicators: string[] }[]) => void;
}

/**
 * Exploratory Factor Analysis (EFA) Results Component - Scientific Academic Style (White & Blue)
 */
export const EFAResults = React.memo(function EFAResults({ results, columns, onProceedToCFA }: EFAResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
        const handleLocaleChange = (e: any) => setLocale(e.detail);
        window.addEventListener('localechange', handleLocaleChange);
        return () => window.removeEventListener('localechange', handleLocaleChange);
    }, []);

    const efaData = results.data || results;
    const kmo = efaData.kmo || 0;
    const bartlettP = efaData.bartlettP || efaData.bartlett_p || 1;
    const kmoAcceptable = kmo >= 0.6;
    const bartlettSignificant = bartlettP < 0.05;

    // Extract factor structure for workflow (memoized)
    const suggestedFactors = useMemo(() => {
        if (!efaData.loadings || !Array.isArray(efaData.loadings[0])) return [];

        const factors = [];
        const nFactors = efaData.nFactorsUsed || efaData.loadings[0].length;

        for (let f = 0; f < nFactors; f++) {
            const indicators = columns.filter((col, i) =>
                efaData.loadings[i] && efaData.loadings[i][f] >= 0.5
            );
            if (indicators.length >= 3) {
                factors.push({
                    name: `Factor${f + 1}`,
                    indicators
                });
            }
        }
        return factors;
    }, [efaData.loadings, columns, efaData.nFactorsUsed]);

    const handleProceedToCFA = useCallback(() => {
        if (onProceedToCFA) {
            onProceedToCFA(suggestedFactors);
        }
    }, [onProceedToCFA, suggestedFactors]);

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-500">
            {/* KMO and Bartlett's Test Section */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-white rounded-xl border border-blue-100 shadow-sm p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <TrendingUp className="w-20 h-20 text-blue-900" />
                    </div>
                     <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-4">{t(locale, 'factor.efa_ui.kmo_measure')}</h4>
                    <div className={`text-5xl font-black ${kmoAcceptable ? 'text-blue-900 underline decoration-blue-100 underline-offset-8' : 'text-red-600 ring-2 ring-red-100 rounded-xl px-2'}`}>
                        {kmo.toFixed(3)}
                    </div>
                    <p className={`text-[10px] font-black mt-3 px-3 py-1.5 rounded-full border inline-block uppercase shadow-sm ${kmoAcceptable ? 'bg-blue-900 text-white border-blue-900' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {kmo >= 0.8 ? 'Excellent Adequacy' : kmo >= 0.7 ? 'Good Adequacy' : kmo >= 0.6 ? 'Acceptable' : 'Inadequate'}
                    </p>
                </div>
                <div className="flex-1 bg-white rounded-xl border border-blue-100 shadow-sm p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <CheckCircle2 className="w-20 h-20 text-blue-900" />
                    </div>
                     <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-4">{t(locale, 'factor.efa_ui.bartlett_test')}</h4>
                    <div className={`text-5xl font-black ${bartlettSignificant ? 'text-blue-900 underline decoration-blue-100 underline-offset-8' : 'text-slate-600 font-bold'}`}>
                        {bartlettP < 0.001 ? '< .001' : bartlettP.toFixed(4)}
                    </div>
                    <p className={`text-[10px] font-black mt-3 px-3 py-1.5 rounded-full border inline-block uppercase shadow-sm ${bartlettSignificant ? 'bg-blue-50 text-blue-900 border-blue-300 font-black' : 'bg-slate-100 text-slate-800 border-slate-300'}`}>
                        {bartlettSignificant ? 'Significant (Passed)' : 'Not Significant (Failed)'}
                    </p>
                </div>
            </div>

            {/* Total Variance Explained Table */}
            {efaData.eigenvalues && efaData.eigenvalues.length > 0 && (
                <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-blue-900 uppercase">{t(locale, 'factor.efa_ui.total_variance')}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-slate-700">
                             <thead className="bg-blue-50/50 border-y border-blue-100">
                                <tr>
                                    <th className="py-4 px-6 text-[10px] font-black text-blue-900 uppercase text-center">{t(locale, 'factor.efa_ui.factor')}</th>
                                    <th className="py-4 px-4 text-[10px] font-black text-blue-900 uppercase text-right">{t(locale, 'factor.efa_ui.eigenvalue')}</th>
                                    <th className="py-4 px-4 text-[10px] font-black text-blue-900 uppercase text-right">{t(locale, 'factor.efa_ui.variance_pct')}</th>
                                    <th className="py-4 px-4 text-[10px] font-black text-blue-900 uppercase text-right bg-blue-100/30">{t(locale, 'factor.efa_ui.cumulative_pct')}</th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-blue-50">
                                {(() => {
                                    const totalVar = efaData.eigenvalues.reduce((s:number,v:number)=>s+v, 0);
                                    let cumVar = 0;
                                    return efaData.eigenvalues.slice(0, 10).map((ev: number, i: number) => {
                                        const pct = (ev / totalVar) * 100;
                                        cumVar += pct;
                                        const isExtracted = i < efaData.nFactorsUsed;
                                        return (
                                             <tr key={i} className={`hover:bg-blue-50/20 transition-colors ${isExtracted ? 'bg-blue-50 border-l-4 border-blue-900' : ''}`}>
                                                <td className={`py-4 px-6 text-center font-black ${isExtracted ? 'text-blue-900' : 'text-slate-400'}`}>{i + 1}</td>
                                                <td className={`py-4 px-4 text-sm text-right font-mono font-bold ${isExtracted ? 'text-blue-950' : 'text-slate-600'}`}>{ev.toFixed(3)}</td>
                                                <td className={`py-4 px-4 text-sm text-right font-mono font-bold ${isExtracted ? 'text-blue-950' : 'text-slate-600'}`}>{pct.toFixed(2)}%</td>
                                                <td className={`py-4 px-4 text-sm text-right font-black ${isExtracted ? 'text-blue-900 bg-blue-100/20' : 'text-slate-400'}`}>{cumVar.toFixed(2)}%</td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Rotated Matrix Card */}
             {efaData.loadings && (
                <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                             <LayoutGrid className="w-4 h-4 text-blue-600" />
                             {t(locale, 'factor.efa_ui.pattern_matrix')}
                        </h3>
                         <div className="flex gap-2">
                            <span className="text-[9px] font-black bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase tracking-tighter">Method: {efaData.extractionMethod?.toUpperCase() || 'MINRES'}</span>
                            <span className="text-[9px] font-black bg-blue-900 text-white px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm">Loadings Threshold: 0.5</span>
                         </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-slate-700">
                             <thead className="bg-blue-50/50 border-y border-blue-100">
                                <tr>
                                    <th className="py-4 px-6 text-[10px] font-black text-blue-900 uppercase">Variable Indicators</th>
                                    {Array.isArray(efaData.loadings[0]) && efaData.loadings[0].map((_: any, idx: number) => (
                                        <th key={idx} className="py-4 px-4 text-[10px] font-black text-blue-900 uppercase text-right border-l border-blue-50">Factor {idx + 1}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                                {columns.map((col, rowIdx) => (
                                    <tr key={rowIdx} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-4 px-6 font-bold text-blue-800 italic bg-slate-50/30 border-r border-blue-50">{col}</td>
                                        {Array.isArray(efaData.loadings[rowIdx]) && efaData.loadings[rowIdx].map((val: number, colIdx: number) => {
                                            const isSuppressed = Math.abs(val) < 0.3;
                                            const isStrong = Math.abs(val) >= 0.5;
                                            return (
                                                 <td
                                                    key={colIdx}
                                                    className={`py-4 px-4 text-right border-l border-blue-50 text-sm transition-all ${isStrong ? 'font-black text-blue-900 bg-blue-600/10 scale-[1.02] shadow-sm' : isSuppressed ? 'text-slate-300 opacity-30 select-none' : 'text-blue-900 font-bold font-mono'}`}
                                                >
                                                    {isSuppressed ? '' : (typeof val === 'number' && !isNaN(val) ? val.toFixed(3) : '-')}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Professional Template Interpretation */}
            <UnifiedASIGInterpretation 
                analysisType="efa"
                results={efaData}
            />

            <ScientificNote
                insight="Exploratory Factor Analysis (EFA) identifies the underlying latent structure of a set of observed variables by estimating factor loadings — the correlations between each item and each latent dimension. KMO ≥ .70 (meritorious) and a significant Bartlett's test confirm that the correlation matrix is factorable. Factor retention should be guided by Parallel Analysis rather than the Kaiser criterion (eigenvalue > 1) alone, as the latter tends to over-extract (Zwick & Velicer, 1986). Communalities h² < .40 indicate an item is poorly represented by the factor solution and should be considered for removal. Orthogonal rotation (Varimax) assumes uncorrelated factors; oblique rotation (Promax, Oblimin) is more appropriate when factors are theoretically related."
                citation="Hair et al., 2019; Kaiser, 1974; Zwick & Velicer, 1986"
                reference={[
                    "Hair, J. F., Black, W. C., Babin, B. J., & Anderson, R. E. (2019). Multivariate data analysis (8th ed.). Cengage Learning.",
                    "Kaiser, H. F. (1974). An index of factorial simplicity. Psychometrika, 39(1), 31–36.",
                    "Zwick, W. R., & Velicer, W. F. (1986). Comparison of five rules for determining the number of components to retain. Psychological Bulletin, 99(3), 432–442.",
                ]}
                thresholds={[
                    { label: 'KMO ≥ .90', value: 'Marvelous', status: 'good' },
                    { label: 'KMO ≥ .70', value: 'Meritorious', status: 'good' },
                    { label: 'KMO ≥ .60', value: 'Mediocre', status: 'acceptable' },
                    { label: 'KMO < .60', value: 'Unacceptable', status: 'warn' },
                    { label: 'Loading', value: '≥ .40 to retain item', status: 'acceptable' },
                    { label: 'Variance', value: '≥ 50% cumulative', status: 'acceptable' },
                ]}
                assumptions={[
                    "Variables are measured at interval/ratio level (or ordered categorical with polychoric correlation).",
                    "Adequate sample size: N ≥ 10 per item, minimum N ≥ 100–200; larger N yields more stable factor solutions.",
                    "The correlation matrix contains sufficient shared variance — confirmed by KMO and Bartlett's test.",
                    "The relationship between observed variables and factors is approximately linear.",
                ]}
                pitfalls={[
                    "Using Kaiser criterion (eigenvalue > 1) alone for factor retention — Parallel Analysis is the current empirical standard.",
                    "Accepting cross-loadings > .32 without theoretical justification — they indicate factorial complexity and reduce interpretability.",
                    "Treating EFA factor scores as if they were measured without error in subsequent analyses.",
                    "Not reporting the rotation method and extraction method — both affect loadings and must be disclosed.",
                ]}
            />


            {/* Workflow Step: Proceed to CFA */}
            {suggestedFactors.length > 0 && onProceedToCFA && kmoAcceptable && bartlettSignificant && (
                <div className="bg-blue-900 p-8 rounded-2xl text-white shadow-xl shadow-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-700 p-3 rounded-xl shadow-lg rotate-3">
                            <Info className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black tracking-tight underline underline-offset-4 decoration-blue-500">Mô hình thực tế đã sẵn sàng?</h4>
                            <p className="text-xs text-blue-200 font-bold uppercase tracking-wider mt-1">Sử dụng các nhân tố được khám phá để chạy CFA</p>
                        </div>
                    </div>
                    <button
                        onClick={handleProceedToCFA}
                        className="bg-white text-blue-900 px-8 py-4 rounded-xl font-black flex items-center gap-3 hover:bg-blue-50 transition-all shadow-lg active:scale-95 group"
                    >
                        <span>CHẠY CFA ({suggestedFactors.length} FACTORS)</span>
                        <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            )}
        </div>
    );
});

export default EFAResults;
