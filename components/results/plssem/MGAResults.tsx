'use client';

import React from 'react';
import { Users, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { t, getStoredLocale, type Locale } from '@/lib/i18n';

interface MGAResultsProps {
    results: {
        group_means: { [key: string]: number };
        p_value: number;
        significant_difference: boolean;
    };
}

export default function MGAResults({ results }: MGAResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
        const handleLocaleChange = (e: any) => setLocale(e.detail);
        window.addEventListener('localechange', handleLocaleChange);
        return () => window.removeEventListener('localechange', handleLocaleChange);
    }, []);
    if (!results) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <p className="text-red-800 font-medium">{t(locale, 'asig.plssem.mga.no_results')}</p>
                </div>
            </div>
        );
    }

    const { group_means, p_value } = results;
    // Calculate significance dynamically instead of relying on backend flag
    const significant_difference = p_value < 0.05;
    
    const groups = Object.keys(group_means || {});
    const means = Object.values(group_means || {});

    // Find highest and lowest
    const maxMean = Math.max(...means);
    const minMean = Math.min(...means);
    const maxGroup = groups[means.indexOf(maxMean)];
    const minGroup = groups[means.indexOf(minMean)];
    const difference = maxMean - minMean;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Users className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">{t(locale, 'asig.plssem.mga.title')}</h2>
                </div>
                <p className="text-indigo-100">
                    {t(locale, 'asig.plssem.mga.subtitle')}
                </p>
            </div>

            {/* Significance Test */}
            <div className={`rounded-lg border p-6 ${significant_difference
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                <div className="flex items-center gap-3 mb-3">
                    {significant_difference ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                    )}
                    <h3 className="text-lg font-bold">
                        {significant_difference
                            ? t(locale, 'asig.plssem.mga.sig_yes')
                            : t(locale, 'asig.plssem.mga.sig_no')}
                    </h3>
                </div>
                <p className="text-sm mb-2">
                    <strong>{t(locale, 'asig.plssem.mga.p_value')}</strong>{' '}
                    <span className={`font-bold ${p_value < 0.05 ? 'text-green-700' : 'text-yellow-700'}`}>
                        {p_value?.toFixed(4)}
                    </span>
                    {' '}({p_value < 0.05 ? t(locale, 'asig.plssem.mga.p_lt_05') : t(locale, 'asig.plssem.mga.p_ge_05')})
                </p>
                <p className="text-sm">
                    {significant_difference
                        ? t(locale, 'asig.plssem.mga.sig_desc_yes')
                        : t(locale, 'asig.plssem.mga.sig_desc_no')}
                </p>
            </div>

            {/* Group Comparison Table */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                    {t(locale, 'asig.plssem.mga.table.title')}
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                                    {t(locale, 'asig.plssem.mga.table.group')}
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-bold text-slate-700">
                                    {t(locale, 'asig.plssem.mga.table.mean')}
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">
                                    {t(locale, 'asig.plssem.mga.table.rank')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((group, idx) => {
                                const mean = group_means[group];
                                const isHighest = mean === maxMean;
                                const isLowest = mean === minMean;

                                return (
                                    <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                            {t(locale, 'asig.plssem.mga.table.group_name', { name: group })}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <span className={`font-bold ${isHighest ? 'text-green-700' :
                                                    isLowest ? 'text-red-700' :
                                                        'text-slate-900'
                                                }`}>
                                                {mean?.toFixed(4)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {isHighest && (
                                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                                                    {t(locale, 'asig.plssem.mga.table.highest')}
                                                </span>
                                            )}
                                            {isLowest && (
                                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                                                    {t(locale, 'asig.plssem.mga.table.lowest')}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Difference Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">
                    📊 {t(locale, 'asig.plssem.mga.summary.title')}
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="text-blue-700 mb-1">{t(locale, 'asig.plssem.mga.summary.highest_group')}</p>
                        <p className="font-bold text-blue-900">{t(locale, 'asig.plssem.mga.summary.group_name', { name: maxGroup })}</p>
                        <p className="text-xs text-blue-600">{typeof maxMean === 'number' ? maxMean.toFixed(4) : '-'}</p>
                    </div>
                    <div>
                        <p className="text-blue-700 mb-1">{t(locale, 'asig.plssem.mga.summary.lowest_group')}</p>
                        <p className="font-bold text-blue-900">{t(locale, 'asig.plssem.mga.summary.group_name', { name: minGroup })}</p>
                        <p className="text-xs text-blue-600">{typeof minMean === 'number' ? minMean.toFixed(4) : '-'}</p>
                    </div>
                    <div>
                        <p className="text-blue-700 mb-1">{t(locale, 'asig.plssem.mga.summary.abs_diff')}</p>
                        <p className="font-bold text-blue-900">{typeof difference === 'number' ? difference.toFixed(4) : '-'}</p>
                        <p className="text-xs text-blue-600">
                            {(minMean != null && minMean !== 0 && typeof difference === 'number')
                                ? t(locale, 'asig.plssem.mga.summary.diff_pct', { pct: ((difference / Math.abs(minMean)) * 100).toFixed(1) })
                                : t(locale, 'asig.plssem.mga.summary.na')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Interpretation */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-3">
                    📖 {t(locale, 'asig.plssem.mga.guide.title')}
                </h3>
                <div className="space-y-3 text-sm text-purple-900">
                    <p>
                        <strong>{t(locale, 'asig.plssem.mga.guide.mga')}</strong> {t(locale, 'asig.plssem.mga.guide.mga_desc')}
                    </p>
                    <p>
                        <strong>{t(locale, 'asig.plssem.mga.guide.sig')}</strong> {t(locale, 'asig.plssem.mga.guide.sig_desc')}
                    </p>
                    <p>
                        <strong>{t(locale, 'asig.plssem.mga.guide.nonsig')}</strong> {t(locale, 'asig.plssem.mga.guide.nonsig_desc')}
                    </p>
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-indigo-900 mb-3">
                    💡 {t(locale, 'asig.plssem.mga.recommendation.title')}
                </h3>
                <ul className="space-y-3 text-sm text-indigo-900">
                    {significant_difference ? (
                        <>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-600" />
                                <span>
                                    <strong>{t(locale, 'asig.plssem.mga.recommendation.implications')}</strong> {t(locale, 'asig.plssem.mga.recommendation.implications_desc')}
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-600" />
                                <span>
                                    <strong>{t(locale, 'asig.plssem.mga.recommendation.advantage', { group: maxGroup })}</strong> {t(locale, 'asig.plssem.mga.recommendation.advantage_desc', { group: maxGroup })}
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-600" />
                                <span>
                                    <strong>{t(locale, 'asig.plssem.mga.recommendation.limitation', { group: minGroup })}</strong> {t(locale, 'asig.plssem.mga.recommendation.limitation_desc', { group: minGroup })}
                                </span>
                            </li>
                        </>
                    ) : (
                        <li className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-600" />
                            <span>
                                <strong>{t(locale, 'asig.plssem.mga.recommendation.pooled')}</strong> {t(locale, 'asig.plssem.mga.recommendation.pooled_desc')}
                            </span>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
