'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Database, Activity, Target, Share2 } from 'lucide-react';
import { getStoredLocale, t, type Locale } from '@/lib/i18n';
import { UnifiedASIGInterpretation } from '@/components/results/shared/UnifiedASIGInterpretation';

interface ModerationResultsProps {
    results: any;
    columns: string[];
}

/**
 * Moderation Analysis Results Component - Scientific Academic Style (White & Blue)
 */
export const ModerationResults = React.memo(function ModerationResults({ results, columns }: ModerationResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
        const handleLocaleChange = (e: any) => setLocale(e.detail);
        window.addEventListener('localechange', handleLocaleChange);
        return () => window.removeEventListener('localechange', handleLocaleChange);
    }, []);

    if (!results) return null;

    const interactionP = results.interactionP;
    const significant = interactionP < 0.05;

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-500">
            {/* Model Equation Card */}
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-8 relative overflow-hidden bg-gradient-to-r from-blue-50/20 to-white">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Share2 className="w-20 h-20 text-blue-900" />
                </div>
                <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-4">{t(locale, 'regression.moderation_ui.title')}</h4>
                <div className="text-lg md:text-xl font-mono font-black text-blue-900 break-all leading-relaxed bg-white/50 p-4 rounded-lg border border-blue-50 border-dashed">
                    {columns[0]} = b₀ + b₁({columns[1]}) + b₂({columns[2]}) + b₃({columns[1]} × {columns[2]})
                </div>
            </div>

            {/* Coefficients Table */}
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        {t(locale, 'regression.moderation_ui.coefficients')}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-slate-700 font-sans">
                        <thead className="bg-blue-50/50 border-y border-blue-100">
                            <tr>
                                <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase">{t(locale, 'regression.moderation_ui.term')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'regression.moderation_ui.estimate')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'regression.moderation_ui.std_error')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'regression.moderation_ui.t_value')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right bg-blue-100/30">{t(locale, 'regression.moderation_ui.p_value')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                            <tr className="hover:bg-blue-50/10 transition-colors">
                                <td className="py-5 px-6 italic text-slate-400 font-bold">(Intercept)</td>
                                <td className="py-5 px-4 text-sm text-right font-mono">{results.interceptEst?.toFixed(4)}</td>
                                <td className="py-5 px-4 text-sm text-right font-mono">{results.interceptSE?.toFixed(4)}</td>
                                <td className="py-5 px-4 text-sm text-right font-mono">{results.interceptT?.toFixed(3)}</td>
                                <td className="py-5 px-4 text-sm text-right font-mono">{results.interceptP?.toFixed(4)}</td>
                            </tr>
                            <tr className="hover:bg-blue-50/10 transition-colors">
                                <td className="py-5 px-6 font-bold text-blue-800">{columns[1]} (X)</td>
                                <td className="py-5 px-4 text-sm text-right font-bold text-blue-600">{results.xEst?.toFixed(4)}</td>
                                <td className="py-5 px-4 text-sm text-right font-mono text-slate-400">{results.xSE?.toFixed(4)}</td>
                                <td className="py-5 px-4 text-sm text-right font-mono text-slate-400">{results.xT?.toFixed(3)}</td>
                                <td className="py-5 px-4 text-sm text-right font-black text-blue-900">{results.xP?.toFixed(4)}</td>
                            </tr>
                            <tr className="hover:bg-blue-50/10 transition-colors">
                                <td className="py-5 px-6 font-bold text-blue-800">{columns[2]} (W)</td>
                                <td className="py-5 px-4 text-sm text-right font-bold text-blue-600">{results.wEst?.toFixed(4)}</td>
                                <td className="py-5 px-4 text-sm text-right font-mono text-slate-400">{results.wSE?.toFixed(4)}</td>
                                <td className="py-5 px-4 text-sm text-right font-mono text-slate-400">{results.wT?.toFixed(3)}</td>
                                <td className="py-5 px-4 text-sm text-right font-black text-blue-900">{results.wP?.toFixed(4)}</td>
                            </tr>
                            <tr className={`hover:bg-blue-50/10 transition-colors ${significant ? 'bg-blue-50/50' : 'opacity-80'}`}>
                                <td className="py-5 px-6 font-black text-blue-900 uppercase">Interaction ({columns[1]} × {columns[2]})</td>
                                <td className="py-5 px-4 text-sm text-right font-black text-blue-900">{results.interactionEst?.toFixed(4)}</td>
                                <td className="py-5 px-4 text-sm text-right font-mono text-slate-400">{results.interactionSE?.toFixed(4)}</td>
                                <td className="py-5 px-4 text-sm text-right font-mono text-slate-400">{results.interactionT?.toFixed(3)}</td>
                                <td className={`py-5 px-4 text-sm text-right font-black ${significant ? 'text-blue-600 underline underline-offset-8' : 'text-slate-400'}`}>
                                    {interactionP?.toFixed(4)} {significant ? ' (Sig.)' : ''}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Model Fit Summary */}
            <div className="bg-slate-50/50 border border-blue-50 p-8 rounded-xl flex items-center justify-around">
                <div className="text-center">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">R-Squared</span>
                    <span className="font-black text-3xl text-blue-900">{results.rSquared?.toFixed(4)}</span>
                </div>
                <div className="h-10 w-px bg-blue-100"></div>
                <div className="text-center">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Adjusted R²</span>
                    <span className="font-black text-3xl text-blue-900">{results.rSquaredAdj?.toFixed(4)}</span>
                </div>
            </div>

            {/* Professional Template Interpretation */}
            <UnifiedASIGInterpretation 
                analysisType="moderation"
                results={results}
                variableNames={{
                    x: columns[1],
                    m: columns[2],
                    y: columns[0]
                }}
            />

        </div>
    );
});

export default ModerationResults;
