'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Database, Activity } from 'lucide-react';
import { getStoredLocale, t, type Locale } from '@/lib/i18n';
import { UnifiedASIGInterpretation } from '@/components/results/shared/UnifiedASIGInterpretation';

interface TwoWayANOVAResultsProps {
    results: any;
    columns: string[];
}

/**
 * Two-Way ANOVA Results Component - Scientific Academic Style (White & Blue)
 */
export const TwoWayANOVAResults = React.memo(function TwoWayANOVAResults({ results, columns }: TwoWayANOVAResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
    }, []);

    const displayResults = results.data || results;
    if (!displayResults || !displayResults.table) return null;

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-500">
            {/* White-Blue Academic Table */}
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        {t(locale, 'basic.twoway_anova_ui.title')}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-slate-700">
                        <thead className="bg-blue-50/50 border-y border-blue-100">
                            <tr>
                                <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase">{t(locale, 'basic.twoway_anova_ui.factor')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-center">{t(locale, 'basic.twoway_anova_ui.df')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.twoway_anova_ui.sum_squares')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.twoway_anova_ui.mean_square')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right text-blue-600">{t(locale, 'basic.twoway_anova_ui.f_value')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.twoway_anova_ui.p_value')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">Partial η²</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                            {displayResults.table.map((row: any, idx: number) => {
                                const isResiduals = row.source.toLowerCase().includes('residuals') || row.source.toLowerCase().includes('sai so');
                                const isSignificant = row.p < 0.05 && !isResiduals;
                                const isInteraction = row.source.toLowerCase().includes('tuong tac') || row.source.includes(':');

                                return (
                                    <tr key={idx} className={`hover:bg-blue-50/30 transition-colors ${isInteraction && row.p < 0.05 ? 'bg-amber-50/30' : ''} ${isResiduals ? 'bg-slate-50 text-slate-400 italic' : ''}`}>
                                        <td className={`py-5 px-6 text-sm ${isResiduals ? '' : isInteraction ? 'font-black text-blue-900 italic' : 'font-bold text-blue-800'}`}>
                                            {row.source}
                                        </td>
                                        <td className="py-5 px-4 text-sm text-center font-bold">{row.df}</td>
                                        <td className="py-5 px-4 text-sm text-right font-mono">{row.ss?.toFixed(3)}</td>
                                        <td className="py-5 px-4 text-sm text-right font-mono text-slate-600">
                                            {!isResiduals && row.df > 0 ? (row.ss / row.df).toFixed(3) : row.ms?.toFixed(3) || ''}
                                        </td>
                                        <td className="py-5 px-4 text-sm text-right font-black text-blue-900">
                                            {!isResiduals ? row.f?.toFixed(3) : ''}
                                        </td>
                                        <td className={`py-5 px-4 text-sm text-right font-black ${isSignificant ? 'text-blue-600 underline underline-offset-4' : 'text-slate-400'}`}>
                                            {!isResiduals ? (row.p < 0.001 ? '< .001' : row.p?.toFixed(3)) : ''}
                                        </td>
                                        <td className="py-5 px-4 text-sm text-right font-mono text-slate-500">
                                            {!isResiduals ? row.etaPartial?.toFixed(3) : ''}
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
                analysisType="two_way_anova"
                results={displayResults}
                variableNames={{
                    targetVar: columns[0] || 'Dependent Variable',
                    factor1: columns[1] || 'Factor 1',
                    factor2: columns[2] || 'Factor 2'
                }}
            />
        </div>

    );
});

export default TwoWayANOVAResults;

