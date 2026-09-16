'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Database, Activity, Target, TrendingUp, Info } from 'lucide-react';
import { getStoredLocale, t, type Locale } from '@/lib/i18n';
import { UnifiedASIGInterpretation } from '@/components/results/shared/UnifiedASIGInterpretation';
import { ScientificNote } from '../shared/ScientificNote';

interface LogisticResultsProps {
    results: any;
    columns: string[];
}

/**
 * Logistic Regression Results Component - Scientific Academic Style (White & Blue)
 */
export const LogisticResults = React.memo(function LogisticResults({ results, columns }: LogisticResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
    }, []);

    const displayResults = results.data || results;
    if (!displayResults) return null;

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-500">
            {/* Coefficients Table */}
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        {t(locale, 'regression.logistic_ui.coefficients')}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-slate-700">
                        <thead className="bg-blue-50/50 border-y border-blue-100">
                            <tr>
                                <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase">{t(locale, 'regression.logistic_ui.block')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'regression.logistic_ui.estimate')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right text-blue-600">{t(locale, 'regression.logistic_ui.odds_ratio')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right text-blue-900">{t(locale, 'regression.logistic_ui.wald')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'regression.logistic_ui.p_value')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                            {displayResults.coefficients?.map((coeff: any, idx: number) => {
                                const sig = coeff.pValue < 0.05;
                                return (
                                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-5 px-6 text-sm font-bold text-blue-800 italic">{coeff.term}</td>
                                        <td className="py-5 px-4 text-sm text-right font-mono text-slate-500">{coeff.estimate?.toFixed(4)}</td>
                                        <td className="py-5 px-4 text-sm text-right font-black text-blue-900 bg-blue-50/20">{coeff.oddsRatio?.toFixed(4)}</td>
                                        <td className="py-5 px-4 text-sm text-right font-mono text-slate-500">{coeff.zValue?.toFixed(3)}</td>
                                        <td className={`py-5 px-4 text-sm text-right font-black ${sig ? 'text-blue-600 underline underline-offset-4' : 'text-slate-400'}`}>
                                            {coeff.pValue < 0.001 ? '<.001' : coeff.pValue?.toFixed(4)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Model Fit & Confusion Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50/50 border border-blue-50 p-8 rounded-xl shadow-sm relative overflow-hidden">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6 border-b border-blue-50 pb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        {t(locale, 'regression.logistic_ui.model_fit')}
                    </h4>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-blue-50/50 pb-4">
                            <span className="text-sm font-bold text-slate-400">{t(locale, 'regression.logistic_ui.accuracy')}:</span>
                            <span className="font-black text-3xl text-blue-900">{(displayResults.modelFit?.accuracy * 100)?.toFixed(2)}%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white rounded-lg border border-blue-50 shadow-sm text-center">
                                <span className="block text-[10px] font-black text-slate-400 uppercase">{t(locale, 'regression.logistic_ui.pseudo_r2')}</span>
                                <span className="font-bold text-blue-900">{displayResults.modelFit?.pseudoR2?.toFixed(4)}</span>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-blue-50 shadow-sm text-center">
                                <span className="block text-[10px] font-black text-slate-400 uppercase">AIC</span>
                                <span className="font-bold text-blue-900">{displayResults.modelFit?.aic?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-blue-100 p-8 rounded-xl shadow-sm">
                    <h4 className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-6 border-b border-blue-50 pb-2">{t(locale, 'regression.logistic_ui.classification')}</h4>
                    {displayResults.confusionMatrix && (
                        <div className="grid grid-cols-2 gap-2 text-center text-sm font-mono p-4 bg-slate-50/50 rounded-xl border border-dashed border-blue-100">
                            <div className="p-3 bg-white rounded border border-blue-50 flex flex-col justify-center">
                                <div className="text-[9px] uppercase text-slate-400 mb-1">True Negative</div>
                                <div className="font-black text-blue-900 text-xl">{displayResults.confusionMatrix.tn}</div>
                            </div>
                            <div className="p-3 bg-white rounded border border-blue-100 flex flex-col justify-center">
                                <div className="text-[9px] uppercase text-slate-400 mb-1">False Positive</div>
                                <div className="font-black text-slate-300 text-xl">{displayResults.confusionMatrix.fp}</div>
                            </div>
                            <div className="p-3 bg-white rounded border border-blue-100 flex flex-col justify-center">
                                <div className="text-[9px] uppercase text-slate-400 mb-1">False Negative</div>
                                <div className="font-black text-slate-300 text-xl">{displayResults.confusionMatrix.fn}</div>
                            </div>
                            <div className="p-3 bg-white rounded border border-blue-50 flex flex-col justify-center">
                                <div className="text-[9px] uppercase text-slate-400 mb-1">True Positive</div>
                                <div className="font-black text-blue-900 text-xl">{displayResults.confusionMatrix.tp}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Professional Template Interpretation */}
            <UnifiedASIGInterpretation 
                analysisType="logistic"
                results={displayResults}
                variableNames={{
                    dependent: columns[0] || (locale === 'vi' ? 'Biến phụ thuộc' : 'Dependent variable')
                }}
            />

            <ScientificNote
                insight="Binary logistic regression estimates the log-odds of a dichotomous outcome as a linear function of one or more predictors. Coefficients (b) are interpreted as log-odds and exponentiated to yield Odds Ratios (OR): OR > 1 indicates increased odds; OR < 1 indicates decreased odds per one-unit predictor increase. Always report OR with 95% CI — an OR is meaningless without its interval. Model fit is assessed via the Hosmer-Lemeshow goodness-of-fit test (non-significant p desirable), McFadden's pseudo-R² (not equivalent to OLS R²), AUC-ROC ≥ .70 for acceptable discrimination, and the omnibus chi-square likelihood ratio test. Classification accuracy should be supplemented with sensitivity and specificity."
                citation="Hosmer et al., 2013; McFadden, 1979; Harrell, 2015"
                reference={[
                    "Hosmer, D. W., Lemeshow, S., & Sturdivant, R. X. (2013). Applied logistic regression (3rd ed.). Wiley. https://doi.org/10.1002/9781118548387",
                    "McFadden, D. (1979). Quantitative methods for analyzing travel behaviour of individuals. In D. Hensher & P. Stopher (Eds.), Behavioural travel modelling (pp. 279–318). Croom Helm.",
                    "Harrell, F. E. (2015). Regression modeling strategies (2nd ed.). Springer.",
                ]}
                thresholds={[
                    { label: 'AUC', value: '.70–.79 acceptable', status: 'acceptable' },
                    { label: 'AUC', value: '.80–.89 excellent', status: 'good' },
                    { label: 'McFadden R²', value: '.10–.20 adequate', status: 'acceptable' },
                    { label: 'McFadden R²', value: '≥ .20 good', status: 'good' },
                    { label: 'H-L p', value: '> .05 (good fit)', status: 'good' },
                ]}
                assumptions={[
                    "The outcome variable is dichotomous (0/1); for multinomial outcomes use multinomial logistic regression.",
                    "Independence of observations — logistic regression is sensitive to clustered or repeated-measures data.",
                    "No severe multicollinearity among predictors (VIF < 5).",
                    "Adequate cell frequencies: avoid complete separation or near-separation, which causes coefficient inflation.",
                    "Events-per-variable (EPV) ≥ 10 for stable estimates — low EPV increases overfitting risk.",
                ]}
                pitfalls={[
                    "Reporting only classification accuracy: a model that predicts all cases as the majority class can achieve high accuracy but zero utility.",
                    "Interpreting OR without CI — a wide CI indicates uncertainty that the point estimate conceals.",
                    "Applying logistic regression when the rare-events correction (Firth's penalized likelihood) is warranted (outcome rate < 5%).",
                    "Confusing pseudo-R² with OLS R² — values of .10–.20 for McFadden R² are equivalent to much higher OLS R² and indicate reasonable fit.",
                ]}
            />
        </div>

    );
});

export default LogisticResults;
