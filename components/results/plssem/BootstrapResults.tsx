'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { t, getStoredLocale, type Locale } from '@/lib/i18n';

interface BootstrapResultsProps {
    results: {
        n_bootstrap: number;
        ci_lower: number[];
        ci_upper: number[];
        status: string;
    };
}

export default function BootstrapResults({ results }: BootstrapResultsProps) {
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
                    <p className="text-red-800 font-medium">{t(locale, 'asig.plssem.bootstrap.no_results')}</p>
                </div>
            </div>
        );
    }

    const { n_bootstrap, ci_lower, ci_upper, status } = results;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">{t(locale, 'asig.plssem.bootstrap.title')}</h2>
                </div>
                <p className="text-purple-100">
                    {t(locale, 'asig.plssem.bootstrap.subtitle', { iterations: n_bootstrap?.toLocaleString() })}
                </p>
            </div>

            {/* Status */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                        <p className="font-bold text-green-900">{t(locale, 'asig.plssem.bootstrap.status')}: {status}</p>
                        <p className="text-sm text-green-700">
                            {t(locale, 'asig.plssem.bootstrap.status_complete', { iterations: n_bootstrap?.toLocaleString() })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Confidence Intervals */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-slate-900">
                        {t(locale, 'asig.plssem.bootstrap.ci_title')}
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                                    {t(locale, 'asig.plssem.bootstrap.table.variable')}
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-bold text-slate-700">
                                    {t(locale, 'asig.plssem.bootstrap.table.ci_lower')}
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-bold text-slate-700">
                                    {t(locale, 'asig.plssem.bootstrap.table.ci_upper')}
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-bold text-slate-700">
                                    {t(locale, 'asig.plssem.bootstrap.table.ci_width')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(ci_lower || []).map((lower, idx) => {
                                const upper = ci_upper?.[idx];
                                const lowerNum = typeof lower === 'number' ? lower : null;
                                const upperNum = typeof upper === 'number' ? upper : null;
                                const width = lowerNum != null && upperNum != null ? upperNum - lowerNum : null;
                                const isNarrow = width != null && width < 0.5;

                                return (
                                    <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                            {t(locale, 'asig.plssem.bootstrap.table.variable_num', { num: idx + 1 })}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-slate-700">
                                            {lowerNum != null ? lowerNum.toFixed(4) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-slate-700">
                                            {upperNum != null ? upperNum.toFixed(4) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${isNarrow
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {width != null ? width.toFixed(4) : '-'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Interpretation Guide */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">
                    📊 {t(locale, 'asig.plssem.bootstrap.guide.title')}
                </h3>
                <div className="space-y-3 text-sm text-blue-900">
                    <p>
                        <strong>{t(locale, 'asig.plssem.bootstrap.guide.ci')}</strong> {t(locale, 'asig.plssem.bootstrap.guide.ci_desc')}
                    </p>
                    <p>
                        <strong>{t(locale, 'asig.plssem.bootstrap.guide.sig')}</strong> {t(locale, 'asig.plssem.bootstrap.guide.sig_desc')}
                    </p>
                    <p>
                        <strong>{t(locale, 'asig.plssem.bootstrap.guide.power')}</strong> {t(locale, 'asig.plssem.bootstrap.guide.power_desc', { iterations: n_bootstrap?.toLocaleString() })}
                    </p>
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-3">
                    💡 {t(locale, 'asig.plssem.bootstrap.recommendation.title')}
                </h3>
                <ul className="space-y-3 text-sm text-purple-900">
                    <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-600" />
                        <span>
                            <strong>{t(locale, 'asig.plssem.bootstrap.recommendation.report')}</strong> {t(locale, 'asig.plssem.bootstrap.recommendation.report_desc')}
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-600" />
                        <span>
                            <strong>{t(locale, 'asig.plssem.bootstrap.recommendation.width')}</strong> {t(locale, 'asig.plssem.bootstrap.recommendation.width_desc')}
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-600" />
                        <span>
                            <strong>{t(locale, 'asig.plssem.bootstrap.recommendation.hypothesis')}</strong> {t(locale, 'asig.plssem.bootstrap.recommendation.hypothesis_desc')}
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
