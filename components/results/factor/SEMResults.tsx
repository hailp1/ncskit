'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SEMPathDiagram from '@/components/SEMPathDiagram';
import { ScientificNote } from '../shared/ScientificNote';

interface SEMResultsProps {
    results: any;
}

/**
 * Structural Equation Modeling (SEM) Results Component
 * Displays path diagram, fit indices, structural paths, and measurement model
 */
export const SEMResults = React.memo(function SEMResults({ results }: SEMResultsProps) {
    if (!results) return null;
    const { fitMeasures, estimates } = results;

    // Filter estimates
    const structuralPaths = estimates.filter((e: any) => e.op === '~');
    const loadings = estimates.filter((e: any) => e.op === '=~');
    const covariances = estimates.filter((e: any) => e.op === '~~' && e.lhs !== e.rhs);

    // Prepare data for diagram
    const diagramFactors = useMemo(() => {
        const factorMap: Record<string, string[]> = {};
        loadings.forEach((est: any) => {
            if (!factorMap[est.lhs]) factorMap[est.lhs] = [];
            factorMap[est.lhs].push(est.rhs);
        });
        return Object.entries(factorMap).map(([name, indicators]) => ({ name, indicators }));
    }, [loadings]);

    const diagramPaths = useMemo(() =>
        structuralPaths.map((p: any) => ({
            from: p.rhs,
            to: p.lhs,
            beta: p.std || p.est,
            pvalue: p.pvalue || 0
        })),
        [structuralPaths]
    );

    const diagramLoadings = useMemo(() =>
        loadings.map((l: any) => ({
            factor: l.lhs,
            indicator: l.rhs,
            loading: l.std || l.est
        })),
        [loadings]
    );

    // Helper to color fit indices (same as CFA)
    const getFitColor = (val: number, type: 'high' | 'low') => {
        const isGood = type === 'high' ? val >= 0.9 : val <= 0.08;
        const isAcceptable = type === 'high' ? val >= 0.8 : val <= 0.10;
        
        if (isGood) return 'text-emerald-600 ';
        if (isAcceptable) return 'text-amber-600 ';
        return 'text-rose-600 ';
    };

    return (
        <div className="space-y-8 font-sans">
            {/* 0. SEM Path Diagram */}
            {diagramFactors.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-violet-700">SEM Path Diagram</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SEMPathDiagram
                            factors={diagramFactors}
                            structuralPaths={diagramPaths}
                            factorLoadings={diagramLoadings}
                        />
                    </CardContent>
                </Card>
            )}

            {/* 1. Model Fit Summary */}
            <Card className="border-slate-200 shadow-md overflow-hidden">
                <CardHeader className="border-b bg-slate-50/50 pb-4">
                    <CardTitle className="text-slate-900 flex items-center gap-2 font-black">
                        Phù hợp mô hình (SEM Fit)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-violet-200">
                            <div className="text-[10px] font-black uppercase text-slate-600 mb-2 tracking-widest">Chi-square / df</div>
                            <div className="text-2xl font-black text-slate-900 ">
                                {(fitMeasures.chisq / fitMeasures.df).toFixed(3)}
                            </div>
                            <div className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-tighter">p = {fitMeasures.pvalue.toFixed(3)}</div>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-violet-200">
                            <div className="text-[10px] font-black uppercase text-slate-600 mb-2 tracking-widest">CFI</div>
                            <div className={`text-2xl font-black ${getFitColor(fitMeasures.cfi, 'high')}`}>
                                {fitMeasures.cfi.toFixed(3)}
                            </div>
                            <div className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-tighter">CFI &gt; 0.9 (Good)</div>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-violet-200">
                            <div className="text-[10px] font-black uppercase text-slate-600 mb-2 tracking-widest">TLI</div>
                            <div className={`text-2xl font-black ${getFitColor(fitMeasures.tli, 'high')}`}>
                                {fitMeasures.tli.toFixed(3)}
                            </div>
                            <div className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-tighter">TLI &gt; 0.9 (Good)</div>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-violet-200">
                            <div className="text-[10px] font-black uppercase text-slate-600 mb-2 tracking-widest">RMSEA</div>
                            <div className={`text-2xl font-black ${getFitColor(fitMeasures.rmsea, 'low')}`}>
                                {fitMeasures.rmsea.toFixed(3)}
                            </div>
                            <div className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-tighter">RMSEA &lt; 0.08 (Good)</div>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-violet-200">
                            <div className="text-[10px] font-black uppercase text-slate-600 mb-2 tracking-widest">GFI</div>
                            <div className={`text-2xl font-black ${getFitColor(fitMeasures.gfi || 0, 'high')}`}>
                                {(fitMeasures.gfi || 0).toFixed(3)}
                            </div>
                            <div className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-tighter">GFI &gt; 0.9 (Good)</div>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-violet-200">
                            <div className="text-[10px] font-black uppercase text-slate-600 mb-2 tracking-widest">AGFI</div>
                            <div className={`text-2xl font-black ${getFitColor(fitMeasures.agfi || 0, 'high')}`}>
                                {(fitMeasures.agfi || 0).toFixed(3)}
                            </div>
                            <div className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-tighter">AGFI &gt; 0.8 (Good)</div>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-violet-200">
                            <div className="text-[10px] font-black uppercase text-slate-600 mb-2 tracking-widest">NFI</div>
                            <div className={`text-2xl font-black ${getFitColor(fitMeasures.nfi || 0, 'high')}`}>
                                {(fitMeasures.nfi || 0).toFixed(3)}
                            </div>
                            <div className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-tighter">NFI &gt; 0.9 (Good)</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Structural Paths (Regressions) */}
            {structuralPaths.length > 0 && (
                <Card className="border-slate-200 shadow-md overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50 pb-4">
                        <CardTitle className="text-slate-900 font-black">Structural Paths (Kiểm định giả thuyết)</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pt-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-950 ">
                                        <th className="py-4 px-6 text-left font-black uppercase tracking-widest text-[10px] border-b-2 border-slate-300 ">Tác động lên (DV)</th>
                                        <th className="py-4 px-6 text-center border-b-2 border-slate-300 "></th>
                                        <th className="py-4 px-6 text-left font-black uppercase tracking-widest text-[10px] border-b-2 border-slate-300 ">Nguyên nhân (IV)</th>
                                        <th className="py-4 px-6 text-right font-black uppercase tracking-widest text-[10px] border-l border-slate-200 border-b-2 border-slate-300 whitespace-nowrap">Beta</th>
                                        <th className="py-4 px-6 text-right font-black uppercase tracking-widest text-[10px] border-l border-slate-200 border-b-2 border-slate-300 whitespace-nowrap">P-value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {structuralPaths.map((est: any, idx: number) => (
                                        <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 font-black text-indigo-700 ">{est.lhs}</td>
                                            <td className="py-4 px-6 text-center text-slate-300 ">
                                                <span className="text-xl">⟵</span>
                                            </td>
                                            <td className="py-4 px-6 font-bold text-slate-700 ">{est.rhs}</td>
                                            <td className={`py-4 px-6 text-right border-l border-slate-200 font-black ${est.pvalue < 0.05 ? 'text-slate-900 bg-emerald-50/10 ' : 'text-slate-400'}`}>
                                                {est.std.toFixed(3)}
                                            </td>
                                            <td className="py-4 px-6 text-right border-l border-slate-200 ">
                                                {est.pvalue < 0.001 ? <span className="text-emerald-600 font-black uppercase text-[10px] tracking-tighter">{'< .001 ***'}</span> : <span className={`font-bold ${est.pvalue < 0.05 ? 'text-slate-900 ' : 'text-slate-400'}`}>{est.pvalue.toFixed(3)}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 3. Measurement Model (Loadings) */}
            {loadings.length > 0 && (
                <Card className="border-slate-200 shadow-md overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50 pb-4">
                        <CardTitle className="text-slate-900 font-black">Measurement Model (Mô hình đo lường)</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pt-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-950 ">
                                        <th className="py-4 px-6 text-left font-black uppercase tracking-widest text-[10px] border-b-2 border-slate-300 ">Nhân tố (Latent)</th>
                                        <th className="py-4 px-6 text-center border-b-2 border-slate-300 "></th>
                                        <th className="py-4 px-6 text-left font-black uppercase tracking-widest text-[10px] border-b-2 border-slate-300 ">Biến quan sát</th>
                                        <th className="py-4 px-6 text-right font-black uppercase tracking-widest text-[10px] border-l border-slate-200 border-b-2 border-slate-300 whitespace-nowrap">Std. Est</th>
                                        <th className="py-4 px-6 text-right font-black uppercase tracking-widest text-[10px] border-l border-slate-200 border-b-2 border-slate-300 whitespace-nowrap">P-value</th>
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
                                            <td className={`py-4 px-6 text-right border-l border-slate-200 font-black ${est.std > 0.5 ? 'text-indigo-600 bg-indigo-50/10 ' : 'text-slate-800 '}`}>
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

            <ScientificNote
                insight="Covariance-Based SEM (CB-SEM) simultaneously estimates a measurement model (CFA) and a structural model (path relationships among latent constructs), minimizing the discrepancy between the model-implied and observed covariance matrices. CB-SEM is theory-confirmatory by design: it tests a pre-specified causal structure against the data. Full reporting requires both measurement model fit indices (CFI, TLI, RMSEA, SRMR) and structural model results (standardized path coefficients β, SE, z-statistics, 95% CI, and p-values). Indirect effects (mediation) require bootstrapping. The chi-square difference test (Δχ², Δdf) is used for nested model comparison. CB-SEM assumes multivariate normality — MLR (Satorra-Bentler) or WLSMV estimators should be used when this assumption is violated."
                citation="Kline, 2016; Byrne, 2016; Hu & Bentler, 1999"
                reference={[
                    "Kline, R. B. (2016). Principles and practice of structural equation modeling (4th ed.). Guilford Press.",
                    "Byrne, B. M. (2016). Structural equation modeling with AMOS (3rd ed.). Routledge.",
                    "Hu, L., & Bentler, P. M. (1999). Cutoff criteria for fit indexes in covariance structure analysis. Structural Equation Modeling, 6(1), 1–55. https://doi.org/10.1080/10705519909540118",
                ]}
                thresholds={[
                    { label: 'CFI / TLI', value: '≥ .95 close / ≥ .90 acceptable', status: 'good' },
                    { label: 'RMSEA', value: '≤ .06 close / ≤ .08 acceptable', status: 'good' },
                    { label: 'SRMR', value: '≤ .08', status: 'good' },
                    { label: 'Path β', value: '|β| ≥ .10 small / ≥ .30 med', status: 'acceptable' },
                ]}
                assumptions={[
                    "Multivariate normality of observed indicators — test with Mardia's multivariate kurtosis; use MLR if violated.",
                    "Adequate sample size: N ≥ 200 as a guideline; power analysis via Monte Carlo simulation for complex models.",
                    "The model is identified: degrees of freedom ≥ 0; over-identified models (df > 0) are preferred.",
                    "Measurement invariance across groups must be established before interpreting between-group structural differences.",
                ]}
                pitfalls={[
                    "Reporting only standardized β without unstandardized B — the latter is needed for replication and meta-analysis.",
                    "Modifying the model post-hoc using MI without cross-validation on an independent sample.",
                    "Conflating statistical significance with practical significance: a significant path with β = .05 has negligible explanatory value.",
                    "Not distinguishing CB-SEM (covariance-based) from PLS-SEM (variance-based) — they answer different research questions and should not be used interchangeably.",
                ]}
            />
        </div>
    );
});

export default SEMResults;
