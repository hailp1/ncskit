import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getStoredLocale, t, type Locale } from '@/lib/i18n';

export function FrequencyResults({ results, columns }: { results: any; columns: string[] }) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
        const handleLocaleChange = (e: any) => setLocale(e.detail);
        window.addEventListener('localechange', handleLocaleChange);
        return () => window.removeEventListener('localechange', handleLocaleChange);
    }, []);

    if (!results) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {columns.map(col => {
                const item = results[col];
                if (!item) return null;
                
                const { counts, total } = item;
                const keys = Object.keys(counts);

                return (
                    <Card key={col} className="border-blue-100 shadow-md">
                        <CardHeader className="bg-blue-50/50 border-b border-blue-50">
                            <CardTitle className="text-blue-900 text-lg">{t(locale, 'basic.frequency_ui.variable')}: <span className="font-bold">{col}</span></CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="overflow-x-auto rounded-xl border border-blue-100">
                                <table className="w-full text-left border-collapse text-slate-700">
                                    <thead className="bg-blue-50/50 border-b border-blue-100">
                                        <tr>
                                            <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase">{t(locale, 'basic.frequency_ui.category')}</th>
                                            <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.frequency_ui.frequency')}</th>
                                            <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.frequency_ui.percent')}</th>
                                            <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase text-right">{t(locale, 'basic.frequency_ui.cumulative_percent')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-blue-50">
                                        {(() => {
                                            let cum = 0;
                                            return keys.map(k => {
                                                const pct = (counts[k] / total) * 100;
                                                cum += pct;
                                                return (
                                                    <tr key={k} className="hover:bg-blue-50/30 transition-colors">
                                                        <td className="py-4 px-6 text-sm font-bold text-slate-700">{k}</td>
                                                        <td className="py-4 px-6 text-sm text-right font-mono text-blue-900 font-bold">{counts[k]}</td>
                                                        <td className="py-4 px-6 text-sm text-right font-mono text-slate-600">{pct.toFixed(1)}%</td>
                                                        <td className="py-4 px-6 text-sm text-right font-mono text-slate-500 italic">{cum.toFixed(1)}%</td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                        <tr className="bg-blue-50/30 border-t-2 border-blue-200">
                                            <td className="py-4 px-6 text-sm font-black text-slate-900 uppercase">{t(locale, 'basic.frequency_ui.total')}</td>
                                            <td className="py-4 px-6 text-sm text-right font-black font-mono text-blue-900">{total}</td>
                                            <td className="py-4 px-6 text-sm text-right font-black font-mono text-slate-900">100.0%</td>
                                            <td className="py-4 px-6 text-sm text-right font-black font-mono text-slate-900">-</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
