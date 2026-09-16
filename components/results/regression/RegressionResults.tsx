'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Scatter } from 'react-chartjs-2';
import { FileText, TrendingUp, Info } from 'lucide-react';
import { getStoredLocale, t, type Locale } from '../../../lib/i18n';
import { UnifiedASIGInterpretation } from '@/components/results/shared/UnifiedASIGInterpretation';
import { ScientificNote } from '../shared/ScientificNote';

interface RegressionResultsProps {
    results: any;
    columns: string[];
}

const fmt = (val: any, digits = 3) => {
    if (val === undefined || val === null || isNaN(val)) return '-';
    return Number(val).toFixed(digits);
};

const fmtP = (p: number) => {
    if (p === undefined || p === null || isNaN(p)) return '-';
    if (p < 0.001) return '< .001';
    return p.toFixed(3);
};

/**
 * Linear Regression Results Component - Scientific Academic Style (White & Blue)
 */
export const RegressionResults = React.memo(function RegressionResults({ results, columns }: RegressionResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
        const handleLocaleChange = (e: any) => setLocale(e.detail);
        window.addEventListener('localechange', handleLocaleChange);
        return () => window.removeEventListener('localechange', handleLocaleChange);
    }, []);

    const isVi = locale === 'vi';
    const displayResults = results.data || results;
    if (!displayResults || !displayResults.modelFit) return null;

    const { modelFit, coefficients, equation } = displayResults;

    // Derived values for report
    const actualVals = displayResults.chartData?.actual || [];
    const fittedVals = displayResults.chartData?.fitted || [];
    const n = actualVals.length;
    
    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-500">
            {/* Equation Card */}
            <div className="bg-blue-900 p-8 rounded-xl text-white shadow-md border-t-4 border-blue-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp className="w-20 h-20" />
                </div>
                <h4 className="font-black text-xs uppercase tracking-[0.3em] mb-4 opacity-80 flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    {t(locale, 'regression.ui.equation')}
                </h4>
                <div className="text-xl md:text-2xl font-mono font-black break-all leading-relaxed">
                    {equation}
                </div>
            </div>

            {/* Model Summary Table */}
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-blue-900 uppercase">{t(locale, 'regression.ui.model_summary')}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-slate-700">
                        <thead className="bg-blue-50/50 border-y border-blue-100">
                            <tr>
                                <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase">{t(locale, 'regression.ui.model')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-center">{t(locale, 'regression.ui.r')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-center">{t(locale, 'regression.ui.r_square')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-center bg-blue-100/30">{t(locale, 'regression.ui.adj_r_square')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-center">{t(locale, 'regression.ui.std_error')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                            <tr className="hover:bg-blue-50/30 transition-colors">
                                <td className="py-5 px-6 text-sm font-bold text-blue-800">1</td>
                                <td className="py-5 px-4 text-sm text-center font-mono">{fmt(Math.sqrt(modelFit.rSquared))}</td>
                                <td className="py-5 px-4 text-sm text-center font-black decoration-blue-200 underline underline-offset-4">{fmt(modelFit.rSquared)}</td>
                                <td className="py-5 px-4 text-sm text-center font-black text-blue-900">{fmt(modelFit.adjRSquared)}</td>
                                <td className="py-5 px-4 text-sm text-center font-mono text-slate-400">{fmt(modelFit.residualStdError)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ANOVA Table */}
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-blue-900 uppercase">{t(locale, 'regression.ui.anova_table')}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-slate-700">
                        <thead className="bg-blue-50/50 border-y border-blue-100">
                            <tr>
                                <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase">{t(locale, 'regression.ui.source')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'regression.ui.sum_of_squares')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-center">{t(locale, 'regression.ui.df')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'regression.ui.mean_square')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right text-blue-600">{t(locale, 'regression.ui.f')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'regression.ui.sig')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                            <tr className="hover:bg-blue-50/30 transition-colors font-bold text-blue-800 text-sm">
                                <td className="py-5 px-6">{t(locale, 'regression.ui.regression')}</td>
                                <td className="py-5 px-4 text-right font-mono">—</td>
                                <td className="py-5 px-4 text-center font-black">{modelFit.df}</td>
                                <td className="py-5 px-4 text-right font-mono">—</td>
                                <td className="py-5 px-4 text-right font-black text-blue-900">{fmt(modelFit.fStatistic, 2)}</td>
                                <td className={`py-5 px-4 text-right font-black ${modelFit.pValue < 0.05 ? 'text-blue-600 underline underline-offset-4' : 'text-slate-400'}`}>
                                    {fmtP(modelFit.pValue)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Coefficients Table */}
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-blue-900 uppercase">{t(locale, 'regression.ui.coefficients')}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-slate-700">
                        <thead className="bg-blue-50/50 border-y border-blue-100">
                            <tr>
                                <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase border-r border-blue-50">{t(locale, 'regression.ui.model')}</th>
                                <th className="py-4 px-4 text-[10px] font-black uppercase text-center bg-slate-50/50" colSpan={2}>{t(locale, 'regression.ui.unstandardized')}</th>
                                <th className="py-4 px-4 text-[10px] font-black uppercase text-center bg-blue-100/20 border-l border-r border-blue-50">{t(locale, 'regression.ui.standardized')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-center">{t(locale, 'regression.ui.t')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-center">{t(locale, 'regression.ui.sig')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-400 uppercase text-center border-l border-blue-50">{t(locale, 'regression.ui.vif')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                            {coefficients.map((coef: any, idx: number) => {
                                const isIntercept = coef.term === '(Intercept)';
                                const isSig = coef.pValue < 0.05;

                                return (
                                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-5 px-6 font-bold text-blue-800 border-r border-blue-50 italic">
                                            {isIntercept ? t(locale, 'regression.ui.constant') : coef.term.replace(/`/g, '')}
                                        </td>
                                         <td className="py-5 px-4 text-sm text-center font-mono text-slate-800">{fmt(coef.estimate)}</td>
                                        <td className="py-5 px-4 text-sm text-center font-mono text-slate-700 border-r border-blue-50">{fmt(coef.stdError)}</td>
                                        <td className="py-5 px-4 text-sm text-center font-black text-blue-900 bg-blue-50/10 border-r border-blue-50">
                                            {isIntercept ? '' : fmt(coef.stdBeta)}
                                        </td>
                                        <td className="py-5 px-4 text-sm text-center font-mono text-slate-900">{fmt(coef.tValue)}</td>
                                        <td className={`py-5 px-4 text-sm text-center font-black ${isSig ? 'text-blue-900 underline underline-offset-4' : 'text-slate-400'}`}>
                                            {fmtP(coef.pValue)}
                                        </td>
                                        <td className={`py-5 px-4 text-sm text-center font-mono border-l border-blue-50 ${coef.vif >= 10 ? 'text-red-600 bg-red-50' : 'text-blue-900 font-extrabold'}`}>
                                            {isIntercept ? '' : (coef.vif ? fmt(coef.vif) : '-')}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Professional Template Interpretation */}
            <UnifiedASIGInterpretation 
                analysisType="regression"
                results={displayResults}
                variableNames={{
                    dependent: columns[0] || (isVi ? 'Biến phụ thuộc' : 'Dependent variable')
                }}
            />

            <ScientificNote
                insight="Multiple linear regression models the linear relationship between a continuous outcome and two or more predictors, estimating each predictor's unique contribution (B) while holding others constant. Adjusted R² is preferred over R² for reporting explanatory power as it penalises for additional predictors. For each significant predictor, report both B (unstandardized, in original units) and β (standardized, for comparing relative importance). The F-test assesses overall model significance; individual predictors are evaluated via t-statistics. Key assumptions must be evaluated: normality of residuals (Shapiro-Wilk), homoscedasticity (Breusch-Pagan or residual plots), independence (Durbin-Watson ≈ 2), and absence of severe multicollinearity (VIF < 5; Tolerance > 0.20)."
                citation="Cohen et al., 2003; Field, 2018; O'Brien, 2007"
                reference={[
                    "Cohen, J., Cohen, P., West, S. G., & Aiken, L. S. (2003). Applied multiple regression/correlation analysis for the behavioral sciences (3rd ed.). Lawrence Erlbaum Associates.",
                    "Field, A. (2018). Discovering statistics using IBM SPSS Statistics (5th ed.). SAGE Publications.",
                    "O'Brien, R. M. (2007). A caution regarding rules of thumb for variance inflation factors. Quality & Quantity, 41(5), 673–690.",
                ]}
                thresholds={[
                    { label: 'VIF', value: '< 5 preferred / < 10 max', status: 'good' },
                    { label: 'Tolerance', value: '> 0.20', status: 'good' },
                    { label: 'Durbin-Watson', value: '1.5–2.5 (independence)', status: 'acceptable' },
                    { label: 'Small f²', value: '.02 (R² ≈ .02)', status: 'acceptable' },
                    { label: 'Medium f²', value: '.15 (R² ≈ .13)', status: 'acceptable' },
                    { label: 'Large f²', value: '.35 (R² ≈ .26)', status: 'good' },
                ]}
                assumptions={[
                    "Linearity: the relationship between each predictor and outcome is linear — check partial regression plots.",
                    "Independence of residuals: Durbin-Watson statistic near 2.0; critical for time-series or hierarchical data.",
                    "Homoscedasticity: residual variance is constant across fitted values — inspect residual-vs-fitted plot.",
                    "Normality of residuals (not of variables): Shapiro-Wilk on standardized residuals, or P-P plot.",
                    "No severe multicollinearity: VIF < 5 for all predictors; consider ridge regression or PCA if VIF ≥ 10.",
                ]}
                pitfalls={[
                    "Interpreting B without considering the measurement scale — standardized β is needed to compare predictor importance.",
                    "Entering all available predictors without theory-driven selection — capitalization on chance increases with K predictors.",
                    "Ignoring influential observations: Cook's D > 4/N flags potential influence points that may distort coefficients.",
                    "Reporting R² without adjusted R² — R² always increases with additional predictors regardless of true predictive value.",
                ]}
            />
        </div>
    );
});

export default RegressionResults;

