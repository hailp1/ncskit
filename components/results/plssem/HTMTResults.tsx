'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UnifiedASIGInterpretation } from '@/components/results/shared/UnifiedASIGInterpretation';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { t, getStoredLocale, type Locale } from '@/lib/i18n';

interface HTMTResultsProps {
    results: any;
    factorStructure?: { name: string; items: number[] }[];
}

/**
 * HTMT Matrix Results Component
 * Displays Heterotrait-Monotrait Ratio for discriminant validity
 */
export const HTMTResults = React.memo(function HTMTResults({
    results,
    factorStructure
}: HTMTResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
    }, []);

    const factorNames = results.construct_names || results.factor_names || factorStructure?.map(f => f.name) || [];
    const n = factorNames.length;
    
    let htmtMatrix = results.htmt_matrix || [];
    
    // Normalize htmtMatrix to 2D array if it's flattened or malformed (WebR serialization quirk)
    if (n > 0 && (!Array.isArray(htmtMatrix[0]) || htmtMatrix[0] === null)) {
        const flatValues = results.htmt_values || htmtMatrix;
        if (flatValues && flatValues.length >= n) {
            htmtMatrix = [];
            for (let i = 0; i < n; i++) {
                const row = [];
                for (let j = 0; j < n; j++) {
                    // R's as.vector() serializes in column-major order usually.
                    // But if we just got a flat matrix, it might be row-major or column-major depending on how WebR did it.
                    // Let's assume row-major if it's just the fallback htmtMatrix, column-major if htmt_values.
                    if (results.htmt_values) {
                        row.push(flatValues[j * n + i]);
                    } else {
                        row.push(flatValues[i * n + j]);
                    }
                }
                htmtMatrix.push(row);
            }
        }
    }

    const threshold = results.threshold || 0.85;
    
    // Compute hasIssues dynamically based on the matrix and threshold
    let computedHasIssues = false;
    if (htmtMatrix && htmtMatrix.length > 0) {
        for (let r = 0; r < htmtMatrix.length; r++) {
            const row = htmtMatrix[r] || [];
            for (let c = 0; c < row.length; c++) {
                // HTMT > threshold means violation
                if (r !== c && row[c] !== null && row[c] !== undefined && row[c] >= threshold) {
                    computedHasIssues = true;
                    break;
                }
            }
            if (computedHasIssues) break;
        }
    }
    // Always use computed value since backend logic might be flawed in this version
    const hasIssues = computedHasIssues;

    return (
        <div className="space-y-8 font-sans text-gray-900 ">
            {/* Summary Card */}
            <div className={`rounded-xl p-6 border-2 ${hasIssues ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200 ' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 '}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                            {hasIssues ? (
                                <>
                                    <AlertCircle className="w-7 h-7 text-red-600" />
                                    {t(locale, 'asig.plssem.htmt.summary.issues')}
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-7 h-7 text-green-600" />
                                    {t(locale, 'asig.plssem.htmt.summary.good')}
                                </>
                            )}
                        </h3>
                        <p className="text-sm text-gray-700 ">
                            {t(locale, 'asig.plssem.htmt.summary.threshold')} {threshold} ({threshold === 0.85 ? t(locale, 'asig.plssem.htmt.summary.strict') : t(locale, 'asig.plssem.htmt.summary.lenient')})
                        </p>
                    </div>
                </div>
            </div>

            {/* HTMT Matrix Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t(locale, 'asig.plssem.htmt.matrix_title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50 ">
                                    <th className="py-3 px-4 font-semibold text-gray-700 ">{t(locale, 'asig.plssem.htmt.table.factor')}</th>
                                    {factorNames.map((name: string, idx: number) => (
                                        <th key={idx} className="py-3 px-4 font-semibold text-center text-gray-700 ">
                                            {name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {htmtMatrix.map((row: number[] | null, rowIdx: number) => (
                                    <tr key={rowIdx} className="border-b border-gray-100 ">
                                        <td className="py-3 px-4 font-medium text-gray-900 ">
                                            {factorNames[rowIdx]}
                                        </td>
                                        {(row || []).map((value: number, colIdx: number) => {
                                            const isAboveThreshold = value > threshold;
                                            const isDiagonal = rowIdx === colIdx;

                                            return (
                                                <td
                                                    key={colIdx}
                                                    className={`py-3 px-4 text-center ${isDiagonal
                                                        ? 'bg-gray-100 text-gray-400 '
                                                        : isAboveThreshold
                                                            ? 'bg-red-100 text-red-700 font-bold'
                                                            : 'text-gray-600 '
                                                        }`}
                                                >
                                                    {isDiagonal || value === null || value === undefined ? '-' : value.toFixed(3)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Legend */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            {t(locale, 'asig.plssem.htmt.guide.title')}
                        </h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li>• <strong>HTMT &lt; {threshold}</strong>: {t(locale, 'asig.plssem.htmt.guide.below')}</li>
                            <li>• <strong>HTMT ≥ {threshold}</strong>: <span className="text-red-600 font-bold">{t(locale, 'asig.plssem.htmt.guide.above')}</span> - {t(locale, 'asig.plssem.htmt.guide.above_desc')}</li>
                            <li className="mt-2 pt-2 border-t border-gray-200 ">
                                💡 <strong>{t(locale, 'asig.plssem.htmt.guide.red_cells')}</strong> {t(locale, 'asig.plssem.htmt.guide.red_cells_desc')}
                            </li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Issues Card */}
            {hasIssues && (
                <Card className="border-2 border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-900 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            {t(locale, 'asig.plssem.htmt.actions.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-sm text-red-800 space-y-2">
                            <li>• <strong>{t(locale, 'asig.plssem.htmt.actions.review')}</strong> {t(locale, 'asig.plssem.htmt.actions.review_desc')}</li>
                            <li>• <strong>{t(locale, 'asig.plssem.htmt.actions.remove')}</strong> {t(locale, 'asig.plssem.htmt.actions.remove_desc')}</li>
                            <li>• <strong>{t(locale, 'asig.plssem.htmt.actions.merge')}</strong> {t(locale, 'asig.plssem.htmt.actions.merge_desc')}</li>
                            <li>• <strong>{t(locale, 'asig.plssem.htmt.actions.alternative')}</strong> {t(locale, 'asig.plssem.htmt.actions.alternative_desc')}</li>
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Methodology Note */}
            <Card>
                <CardHeader>
                    <CardTitle>{t(locale, 'asig.plssem.htmt.methodology.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-gray-700 space-y-2">
                        <p>
                            <strong>{t(locale, 'asig.plssem.htmt.methodology.method')}</strong>: {t(locale, 'asig.plssem.htmt.methodology.method_desc')}
                        </p>
                        <p>
                            <strong>{t(locale, 'asig.plssem.htmt.methodology.threshold')}</strong>: {threshold === 0.85 ? t(locale, 'asig.plssem.htmt.methodology.strict_desc') : t(locale, 'asig.plssem.htmt.methodology.lenient_desc')}
                        </p>
                        <p className="text-xs text-gray-500 italic mt-3 pt-3 border-t border-gray-200">
                            Reference: Henseler, J., Ringle, C. M., & Sarstedt, M. (2015). A new criterion for assessing discriminant validity in variance-based structural equation modeling. Journal of the Academy of Marketing Science, 43(1), 115-135.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* ASIG Interpretation */}
            <UnifiedASIGInterpretation
                analysisType="htmt"
                results={{
                    htmtMatrix: results.htmt_matrix || results.htmtMatrix || [],
                    factorNames: results.factor_names || results.factorNames || [],
                    threshold: results.threshold || 0.85,
                }}
            />
        </div>
    );
});

export default HTMTResults;
