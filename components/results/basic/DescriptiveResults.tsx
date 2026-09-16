import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Database, BarChart3, TrendingUp, Hash, Activity } from 'lucide-react';
import { getStoredLocale, t, type Locale } from '@/lib/i18n';
import { UnifiedASIGInterpretation } from '@/components/results/shared/UnifiedASIGInterpretation';

interface DescriptiveResultsProps {
    results: any;
    columns: string[];
}

const safeToFixed = (val: any, digits: number = 3) => {
    if (val === undefined || val === null || isNaN(Number(val))) return '-';
    return Number(val).toFixed(digits);
};

/**
 * Descriptive Results Component - Scientific Academic Style (White & Blue)
 */
export const DescriptiveResults = React.memo(function DescriptiveResults({ results, columns }: DescriptiveResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
    }, []);

    if (!results || !results.mean) {
        return (
            <div className="p-4 bg-red-50 text-red-900 border border-red-200 rounded-md whitespace-pre-wrap font-mono text-xs">
                DEBUG ERROR DUMP:
                {JSON.stringify(results, null, 2)}
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-700">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Hash className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Vars</span>
                    </div>
                    <p className="text-2xl font-black text-blue-900">{columns.length}</p>
                </div>
                <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg. Mean</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-700">
                        {(results.mean.reduce((a: number, b: number) => a + b, 0) / results.mean.length).toFixed(2)}
                    </p>
                </div>
                <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Max Mean</span>
                    </div>
                    <p className="text-2xl font-black text-indigo-800">
                        {Math.max(...results.mean).toFixed(2)}
                    </p>
                </div>
                <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Database className="w-4 h-4 text-slate-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total N</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{results.N?.[0] || 'N/A'}</p>
                </div>
            </div>

            {/* Main Statistics Table */}
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        {t(locale, 'basic.descriptive_ui.title')}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-slate-700">
                        <thead className="bg-blue-50/50 border-y border-blue-100">
                            <tr>
                                <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase">{t(locale, 'basic.descriptive_ui.variable')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-center">{t(locale, 'basic.descriptive_ui.n')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.descriptive_ui.min')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.descriptive_ui.max')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right bg-blue-100/30">{t(locale, 'basic.descriptive_ui.mean')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.descriptive_ui.sd')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.descriptive_ui.skewness')}</th>
                                <th className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.descriptive_ui.kurtosis')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                            {columns.map((col, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="py-5 px-6 text-sm font-bold text-blue-800">{col}</td>
                                    <td className="py-5 px-4 text-sm text-center font-mono">{(results.N && results.N[idx] !== undefined) ? results.N[idx] : '-'}</td>
                                     <td className="py-5 px-4 text-sm text-right font-mono text-slate-800">{safeToFixed(results.min?.[idx])}</td>
                                    <td className="py-5 px-4 text-sm text-right font-mono text-slate-800">{safeToFixed(results.max?.[idx])}</td>
                                    <td className="py-5 px-4 text-sm text-right font-black text-blue-900 bg-blue-50/20">{safeToFixed(results.mean?.[idx])}</td>
                                    <td className="py-5 px-4 text-sm text-right font-mono text-slate-800">{safeToFixed(results.sd?.[idx])}</td>
                                    <td className={`py-5 px-4 text-sm text-right font-mono italic font-black ${Math.abs(results.skew?.[idx]) > 2 ? 'text-amber-600' : 'text-blue-900/60'}`}>
                                        {safeToFixed(results.skew?.[idx])}
                                    </td>
                                    <td className={`py-5 px-4 text-sm text-right font-mono italic font-black ${Math.abs(results.kurtosis?.[idx]) > 2 ? 'text-amber-600' : 'text-blue-900/60'}`}>
                                        {safeToFixed(results.kurtosis?.[idx])}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Professional Template Interpretation */}
            <UnifiedASIGInterpretation 
                analysisType="descriptive"
                results={{ ...results, columnNames: columns }}
            />
        </div>
    );
});

export default DescriptiveResults;

