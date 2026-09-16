'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Database, Activity, Target, Share2, ArrowRight } from 'lucide-react';
import { getStoredLocale, t, type Locale } from '@/lib/i18n';
import { UnifiedASIGInterpretation } from '@/components/results/shared/UnifiedASIGInterpretation';

interface MediationResultsProps {
    results: any;
    columns: string[];
}

/**
 * Mediation Analysis Results Component - Scientific Academic Style (White & Blue)
 */
export const MediationResults = React.memo(function MediationResults({ results, columns }: MediationResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
    }, []);

    if (!results) return null;

    const sobelP = results.sobelTest?.p ?? 1;
    const significant = sobelP < 0.05;

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-500">
            {/* Model Visual Header */}
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-8 relative overflow-hidden bg-gradient-to-r from-blue-50/20 to-white">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Share2 className="w-20 h-20 text-blue-900" />
                </div>
                <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-4">{t(locale, 'regression.mediation_ui.title')}</h4>
                <div className="flex items-center gap-6 md:gap-12 flex-wrap">
                    <div className="text-xl md:text-2xl font-black text-blue-900 flex items-center gap-3">
                        <span className="bg-white px-4 py-2 rounded-lg border border-blue-100 shadow-sm">{columns[0]}</span>
                        <ArrowRight className="w-6 h-6 text-blue-300" />
                        <span className="bg-white px-4 py-2 rounded-lg border border-blue-500 shadow-md text-blue-600">{columns[1]}</span>
                        <ArrowRight className="w-6 h-6 text-blue-300" />
                        <span className="bg-white px-4 py-2 rounded-lg border border-blue-100 shadow-sm">{columns[2]}</span>
                    </div>
                </div>
            </div>

            {/* Coefficients & Indirect Effect Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Path Coefficients */}
                <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50">
                        <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                             <Activity className="w-4 h-4 text-blue-600" />
                             {t(locale, 'regression.ui.coefficients')}
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center p-3 border-b border-blue-50">
                            <span className="text-sm font-bold text-slate-500">{t(locale, 'regression.mediation_ui.path_a')}:</span>
                            <span className="text-sm font-black text-blue-900 bg-blue-50/50 px-2 py-1 rounded">{results.paths?.a?.est?.toFixed(4)} <span className="text-[10px] text-slate-400 font-mono">(p={results.paths?.a?.p?.toFixed(4)})</span></span>
                        </div>
                        <div className="flex justify-between items-center p-3 border-b border-blue-50">
                            <span className="text-sm font-bold text-slate-500">{t(locale, 'regression.mediation_ui.path_b')}:</span>
                            <span className="text-sm font-black text-blue-900 bg-blue-50/50 px-2 py-1 rounded">{results.paths?.b?.est?.toFixed(4)} <span className="text-[10px] text-slate-400 font-mono">(p={results.paths?.b?.p?.toFixed(4)})</span></span>
                        </div>
                        <div className="flex justify-between items-center p-3 border-b border-blue-50">
                            <span className="text-sm font-bold text-slate-500">{t(locale, 'regression.mediation_ui.path_c')}:</span>
                            <span className="text-sm font-black text-blue-900 bg-blue-50/50 px-2 py-1 rounded">{results.paths?.c_prime?.est?.toFixed(4)} <span className="text-[10px] text-slate-400 font-mono">(p={results.paths?.c_prime?.p?.toFixed(4)})</span></span>
                        </div>
                        <div className="flex justify-between items-center p-3">
                            <span className="text-sm font-bold text-slate-500">{t(locale, 'regression.mediation_ui.path_c_prime')}:</span>
                            <span className="text-sm font-black text-blue-900 bg-blue-50/50 px-2 py-1 rounded">{results.paths?.c?.est?.toFixed(4)} <span className="text-[10px] text-slate-400 font-mono">(p={results.paths?.c?.p?.toFixed(4)})</span></span>
                        </div>
                    </div>
                </div>

                 {/* Indirect Effect & Sobel Test */}
                 <div className="bg-slate-50/50 border border-blue-50 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-blue-50 bg-white/50">
                        <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                             <Target className="w-4 h-4 text-blue-600" />
                             {t(locale, 'regression.mediation_ui.indirect_effect')}
                        </h3>
                    </div>
                    <div className="p-8 flex flex-col justify-center items-center h-full space-y-6">
                        <div className="text-center">
                            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t(locale, 'regression.mediation_ui.estimate')}</span>
                            <div className="text-4xl font-black text-blue-900">{results.effects?.indirect?.toFixed(4)}</div>
                        </div>
                        <div className="w-full h-px bg-blue-100"></div>
                        <div className="grid grid-cols-2 gap-8 w-full">
                            <div className="text-center">
                                <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">{t(locale, 'regression.mediation_ui.z_value')}</span>
                                <div className="text-xl font-bold text-blue-800">{results.sobelTest?.z?.toFixed(3)}</div>
                            </div>
                            <div className="text-center">
                                <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Sig. (p)</span>
                                <div className={`text-xl font-bold ${significant ? 'text-blue-600' : 'text-slate-400'}`}>
                                    {sobelP?.toFixed(4)}
                                </div>
                            </div>
                        </div>
                        <div className={`mt-4 px-4 py-2 rounded-full border text-[10px] uppercase font-black tracking-widest ${significant ? 'bg-blue-900 text-white border-blue-900' : 'bg-slate-200 text-slate-400 border-slate-300'}`}>
                             {significant ? 'Mediation Detected' : 'No Mediation'}
                        </div>
                    </div>
                 </div>
            </div>

            {/* Professional Template Interpretation */}
            <UnifiedASIGInterpretation 
                analysisType="mediation"
                results={{
                    pathA: { estimate: results.paths?.a?.est || 0, pValue: results.paths?.a?.p || 1 },
                    pathB: { estimate: results.paths?.b?.est || 0, pValue: results.paths?.b?.p || 1 },
                    pathC: { estimate: results.paths?.c_prime?.est || 0, pValue: results.paths?.c_prime?.p || 1 },
                    pathCprime: { estimate: results.paths?.c?.est || 0, pValue: results.paths?.c?.p || 1 },
                    indirectEffect: results.effects?.indirect || 0,
                    sobelZ: results.sobelTest?.z || 0,
                    sobelP: results.sobelTest?.p || 1,
                    mediationType: (results.sobelTest?.p || 1) < 0.05 ? 'Partial/Full' : 'No'
                }}
                variableNames={{
                    x: columns[0],
                    m: columns[1],
                    y: columns[2]
                }}
            />

        </div>
    );
});

export default MediationResults;
