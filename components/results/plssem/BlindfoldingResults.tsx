'use client';

import React from 'react';
import { Eye, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { t, getStoredLocale, type Locale } from '@/lib/i18n';

interface BlindfoldingResultsProps {
    results: {
        omission_distance: number;
        n_omitted: number;
        status: string;
        note: string;
    };
}

export default function BlindfoldingResults({ results }: BlindfoldingResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
    }, []);

    if (!results) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <p className="text-red-800 font-medium">{t(locale, 'asig.plssem.blindfolding.no_results')}</p>
                </div>
            </div>
        );
    }

    const { omission_distance, n_omitted, status, note } = results;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Eye className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">{t(locale, 'asig.plssem.blindfolding.title')}</h2>
                </div>
                <p className="text-teal-100">
                    {t(locale, 'asig.plssem.blindfolding.subtitle')}
                </p>
            </div>

            {/* Status */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                        <p className="font-bold text-green-900">{t(locale, 'asig.plssem.blindfolding.status')} {status}</p>
                        <p className="text-sm text-green-700">{note}</p>
                    </div>
                </div>
            </div>

            {/* Procedure Details */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                    {t(locale, 'asig.plssem.blindfolding.procedure.title')}
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            <h4 className="font-bold text-blue-900">{t(locale, 'asig.plssem.blindfolding.procedure.omission_distance')}</h4>
                        </div>
                        <p className="text-3xl font-bold text-blue-700 mb-1">
                            {omission_distance}
                        </p>
                        <p className="text-xs text-blue-600">
                            {t(locale, 'asig.plssem.blindfolding.procedure.omission_distance_desc')}
                        </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-5 h-5 text-purple-600" />
                            <h4 className="font-bold text-purple-900">{t(locale, 'asig.plssem.blindfolding.procedure.omitted_points')}</h4>
                        </div>
                        <p className="text-3xl font-bold text-purple-700 mb-1">
                            {n_omitted}
                        </p>
                        <p className="text-xs text-purple-600">
                            {t(locale, 'asig.plssem.blindfolding.procedure.omitted_points_desc')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Q² Interpretation Guide */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">
                    📊 {t(locale, 'asig.plssem.blindfolding.guide.title')}
                </h3>
                <div className="space-y-3 text-sm text-blue-800">
                    <div className="bg-white rounded p-3">
                        <p className="font-bold text-green-700 mb-1">✅ {t(locale, 'asig.plssem.blindfolding.guide.q2_positive')}</p>
                        <p>{t(locale, 'asig.plssem.blindfolding.guide.q2_positive_desc')}</p>
                    </div>
                    <div className="bg-white rounded p-3">
                        <p className="font-bold text-yellow-700 mb-1">⚠️ {t(locale, 'asig.plssem.blindfolding.guide.q2_zero')}</p>
                        <p>{t(locale, 'asig.plssem.blindfolding.guide.q2_zero_desc')}</p>
                    </div>
                    <div className="bg-white rounded p-3">
                        <p className="font-bold text-red-700 mb-1">❌ {t(locale, 'asig.plssem.blindfolding.guide.q2_negative')}</p>
                        <p>{t(locale, 'asig.plssem.blindfolding.guide.q2_negative_desc')}</p>
                    </div>
                </div>
            </div>

            {/* Methodology */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-teal-900 mb-3">
                    🔬 {t(locale, 'asig.plssem.blindfolding.methodology.title')}
                </h3>
                <div className="space-y-2 text-sm text-teal-800">
                    <p>{t(locale, 'asig.plssem.blindfolding.methodology.intro')}</p>
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                        <li><strong>{t(locale, 'asig.plssem.blindfolding.methodology.algorithm')}</strong> {t(locale, 'asig.plssem.blindfolding.methodology.algorithm_desc', { distance: omission_distance })}</li>
                        <li><strong>{t(locale, 'asig.plssem.blindfolding.methodology.estimation')}</strong> {t(locale, 'asig.plssem.blindfolding.methodology.estimation_desc')}</li>
                        <li><strong>{t(locale, 'asig.plssem.blindfolding.methodology.prediction')}</strong> {t(locale, 'asig.plssem.blindfolding.methodology.prediction_desc')}</li>
                        <li><strong>{t(locale, 'asig.plssem.blindfolding.methodology.evaluation')}</strong> {t(locale, 'asig.plssem.blindfolding.methodology.evaluation_desc')}</li>
                    </ul>
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-3">
                    💡 {t(locale, 'asig.plssem.blindfolding.recommendation.title')}
                </h3>
                <ul className="space-y-3 text-sm text-purple-800">
                    <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-600" />
                        <span>
                            <strong>{t(locale, 'asig.plssem.blindfolding.recommendation.report_q2')}</strong> {t(locale, 'asig.plssem.blindfolding.recommendation.report_q2_desc')}
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-600" />
                        <span>
                            <strong>{t(locale, 'asig.plssem.blindfolding.recommendation.effect_size')}</strong> {t(locale, 'asig.plssem.blindfolding.recommendation.effect_size_desc')}
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-600" />
                        <span>
                            <strong>{t(locale, 'asig.plssem.blindfolding.recommendation.applicability')}</strong> {t(locale, 'asig.plssem.blindfolding.recommendation.applicability_desc')}
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
