'use client';

import React from 'react';
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { t, getStoredLocale, type Locale } from '@/lib/i18n';

interface IPMAResultsProps {
    results: {
        performance: number[];
        importance: number[];
        interpretation: string;
    };
}

export default function IPMAResults({ results }: IPMAResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
    }, []);

    if (!results || !results.performance || !results.importance) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <p className="text-red-800 font-medium">{t(locale, 'asig.plssem.ipma.no_results')}</p>
                </div>
            </div>
        );
    }

    const { performance, importance, interpretation } = results;

    // Combine and categorize
    const ipmaData = performance.map((perf, idx) => ({
        variable: `${t(locale, 'asig.plssem.ipma.table.variable')} ${idx + 1}`,
        performance: perf,
        importance: importance[idx],
        category: categorize(importance[idx], perf)
    }));

    // Sort by importance (descending)
    const sortedData = [...ipmaData].sort((a, b) => b.importance - a.importance);

    function categorize(imp: number, perf: number): string {
        const avgImp = importance.reduce((a, b) => a + b, 0) / importance.length;
        const avgPerf = performance.reduce((a, b) => a + b, 0) / performance.length;

        if (imp > avgImp && perf < avgPerf) return 'priority';
        if (imp > avgImp && perf > avgPerf) return 'maintain';
        if (imp < avgImp && perf < avgPerf) return 'low';
        return 'excess';
    }

    function getCategoryInfo(category: string, currentLocale: Locale) {
        switch (category) {
            case 'priority':
                return {
                    label: t(currentLocale, 'asig.plssem.ipma.categories.priority.label'),
                    color: 'bg-red-100 text-red-800 border-red-200',
                    icon: AlertTriangle,
                    desc: t(currentLocale, 'asig.plssem.ipma.categories.priority.desc')
                };
            case 'maintain':
                return {
                    label: t(currentLocale, 'asig.plssem.ipma.categories.maintain.label'),
                    color: 'bg-green-100 text-green-800 border-green-200',
                    icon: CheckCircle2,
                    desc: t(currentLocale, 'asig.plssem.ipma.categories.maintain.desc')
                };
            case 'excess':
                return {
                    label: t(currentLocale, 'asig.plssem.ipma.categories.excess.label'),
                    color: 'bg-blue-100 text-blue-800 border-blue-200',
                    icon: TrendingUp,
                    desc: t(currentLocale, 'asig.plssem.ipma.categories.excess.desc')
                };
            default:
                return {
                    label: t(currentLocale, 'asig.plssem.ipma.categories.low.label'),
                    color: 'bg-gray-100 text-gray-800 border-gray-200',
                    icon: Target,
                    desc: t(currentLocale, 'asig.plssem.ipma.categories.low.desc')
                };
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Target className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">{t(locale, 'asig.plssem.ipma.title')}</h2>
                </div>
                <p className="text-amber-100">
                    {t(locale, 'asig.plssem.ipma.subtitle')}
                </p>
            </div>

            {/* Interpretation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900 font-medium">
                    💡 {interpretation}
                </p>
            </div>

            {/* IPMA Table */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                    {t(locale, 'asig.plssem.ipma.table.title')}
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                                    {t(locale, 'asig.plssem.ipma.table.variable')}
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-bold text-slate-700">
                                    {t(locale, 'asig.plssem.ipma.table.importance')}
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-bold text-slate-700">
                                    {t(locale, 'asig.plssem.ipma.table.performance')}
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">
                                    {t(locale, 'asig.plssem.ipma.table.classification')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map((item, idx) => {
                                const categoryInfo = getCategoryInfo(item.category, locale);
                                const Icon = categoryInfo.icon;

                                return (
                                    <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                            {item.variable}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <span className="font-bold text-slate-900">
                                                {item.importance.toFixed(3)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <span className="font-bold text-slate-900">
                                                {item.performance.toFixed(3)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${categoryInfo.color} flex items-center gap-1`}>
                                                    <Icon className="w-3 h-3" />
                                                    {categoryInfo.label}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="grid md:grid-cols-2 gap-4">
                {['priority', 'maintain', 'excess', 'low'].map(cat => {
                    const items = ipmaData.filter(item => item.category === cat);
                    const categoryInfo = getCategoryInfo(cat, locale);
                    const Icon = categoryInfo.icon;

                    return (
                        <div key={cat} className={`rounded-lg border p-4 ${categoryInfo.color}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className="w-5 h-5" />
                                <h4 className="font-bold">{categoryInfo.label}</h4>
                            </div>
                            <p className="text-xs mb-2">{categoryInfo.desc}</p>
                            <p className="text-sm font-bold">
                                {items.length} {t(locale, 'asig.plssem.ipma.breakdown.variables')}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Interpretation Guide */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-3">
                    📊 {t(locale, 'asig.plssem.ipma.guide.title')}
                </h3>
                <div className="space-y-3 text-sm text-purple-800">
                    <div>
                        <strong className="text-red-700">🔴 {t(locale, 'asig.plssem.ipma.guide.q1')}</strong>
                        <p>{t(locale, 'asig.plssem.ipma.guide.q1_desc')}</p>
                    </div>
                    <div>
                        <strong className="text-green-700">🟢 {t(locale, 'asig.plssem.ipma.guide.q2')}</strong>
                        <p>{t(locale, 'asig.plssem.ipma.guide.q2_desc')}</p>
                    </div>
                    <div>
                        <strong className="text-blue-700">🔵 {t(locale, 'asig.plssem.ipma.guide.q3')}</strong>
                        <p>{t(locale, 'asig.plssem.ipma.guide.q3_desc')}</p>
                    </div>
                    <div>
                        <strong className="text-gray-700">⚪ {t(locale, 'asig.plssem.ipma.guide.q4')}</strong>
                        <p>{t(locale, 'asig.plssem.ipma.guide.q4_desc')}</p>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-amber-900 mb-3">
                    💡 {t(locale, 'asig.plssem.ipma.recommendation.title')}
                </h3>
                <ul className="space-y-2 text-sm text-amber-800">
                    {sortedData.filter(item => item.category === 'priority').length > 0 && (
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
                            <span>
                                <strong>{t(locale, 'asig.plssem.ipma.recommendation.urgent')}</strong> {t(locale, 'asig.plssem.ipma.recommendation.urgent_desc1')}{' '}
                                <em>{sortedData.filter(item => item.category === 'priority').map(item => item.variable).join(', ')}</em>{' '}
                                {t(locale, 'asig.plssem.ipma.recommendation.urgent_desc2')}
                            </span>
                        </li>
                    )}
                    {sortedData.filter(item => item.category === 'maintain').length > 0 && (
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                            <span>
                                <strong>{t(locale, 'asig.plssem.ipma.recommendation.defensive')}</strong> {t(locale, 'asig.plssem.ipma.recommendation.defensive_desc1')}{' '}
                                <em>{sortedData.filter(item => item.category === 'maintain').map(item => item.variable).join(', ')}</em>{' '}
                                {t(locale, 'asig.plssem.ipma.recommendation.defensive_desc2')}
                            </span>
                        </li>
                    )}
                    <li className="flex items-start gap-2">
                        <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                            {t(locale, 'asig.plssem.ipma.recommendation.report')}
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
