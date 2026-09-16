'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UnifiedASIGInterpretation } from '@/components/results/shared/UnifiedASIGInterpretation';
import { CheckCircle, AlertTriangle, AlertCircle, TrendingUp } from 'lucide-react';
import { getStoredLocale, type Locale } from '@/lib/i18n';

interface VIFResultsProps {
    results: any;
    columns?: string[];
}

/**
 * VIF Check Results Component
 * Displays Variance Inflation Factor for multicollinearity detection
 */
export const VIFResults = React.memo(function VIFResults({
    results,
    columns
}: VIFResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
        const handleLocaleChange = (e: any) => setLocale(e.detail);
        window.addEventListener('localechange', handleLocaleChange);
        return () => window.removeEventListener('localechange', handleLocaleChange);
    }, []);

    const vifValues = results.vif_values || [];
    const variableNames = results.variable_names || columns || [];
    const hasIssues = vifValues.some((v: number) => v >= 5 && v <= 10);
    const severeIssues = vifValues.some((v: number) => v > 10);

    // Categorize variables
    const goodVars = vifValues.filter((v: number) => v < 5).length;
    const acceptableVars = vifValues.filter((v: number) => v >= 5 && v < 10).length;
    const problematicVars = vifValues.filter((v: number) => v >= 10).length;

    const getVIFBadge = (vif: number) => {
        if (vif < 5) {
            return { text: locale === 'vi' ? 'Tốt' : 'Good', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle };
        } else if (vif < 10) {
            return { text: locale === 'vi' ? 'Chấp nhận được' : 'Acceptable', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertTriangle };
        } else {
            return { text: locale === 'vi' ? 'Có vấn đề' : 'Problematic', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle };
        }
    };

    return (
        <div className="space-y-8 font-sans text-gray-900">
            {/* Summary Card */}
            <div className={`rounded-xl p-6 border-2 ${severeIssues ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' : hasIssues ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                            {severeIssues ? (
                                <>
                                    <AlertCircle className="w-7 h-7 text-red-600" />
                                    {locale === 'vi' ? 'Phát hiện Đa cộng tuyến nghiêm trọng' : 'Severe Multicollinearity Detected'}
                                </>
                            ) : hasIssues ? (
                                <>
                                    <AlertTriangle className="w-7 h-7 text-yellow-600" />
                                    {locale === 'vi' ? 'Đa cộng tuyến trung bình' : 'Moderate Multicollinearity'}
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-7 h-7 text-green-600" />
                                    {locale === 'vi' ? 'Không có vấn đề Đa cộng tuyến' : 'No Multicollinearity Issues'}
                                </>
                            )}
                        </h3>
                        <p className="text-sm text-gray-700">
                            {locale === 'vi' ? `Phân tích VIF cho ${vifValues.length} biến độc lập` : `VIF Analysis for ${vifValues.length} independent variables`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Statistics Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>{locale === 'vi' ? 'Tóm tắt VIF' : 'VIF Summary'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-xs text-green-600 mb-1">{locale === 'vi' ? 'Tốt (VIF < 5)' : 'Good (VIF < 5)'}</div>
                            <div className="text-2xl font-bold text-green-700">{goodVars}</div>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="text-xs text-yellow-600 mb-1">{locale === 'vi' ? 'Chấp nhận được (5 ≤ VIF < 10)' : 'Acceptable (5 ≤ VIF < 10)'}</div>
                            <div className="text-2xl font-bold text-yellow-700">{acceptableVars}</div>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-xs text-red-600 mb-1">{locale === 'vi' ? 'Có vấn đề (VIF ≥ 10)' : 'Problematic (VIF ≥ 10)'}</div>
                            <div className="text-2xl font-bold text-red-700">{problematicVars}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* VIF Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{locale === 'vi' ? 'Giá trị VIF theo từng biến' : 'VIF Values by Variable'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="py-3 px-4 font-semibold text-gray-700">{locale === 'vi' ? 'Biến quan sát' : 'Variable'}</th>
                                    <th className="py-3 px-4 font-semibold text-center text-gray-700">{locale === 'vi' ? 'Giá trị VIF' : 'VIF Value'}</th>
                                    <th className="py-3 px-4 font-semibold text-center text-gray-700">{locale === 'vi' ? 'Trạng thái' : 'Status'}</th>
                                    <th className="py-3 px-4 font-semibold text-center text-gray-700">{locale === 'vi' ? 'Độ dung sai (1/VIF)' : 'Tolerance (1/VIF)'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vifValues.map((vif: number, idx: number) => {
                                    const badge = getVIFBadge(vif);
                                    const BadgeIcon = badge.icon;
                                    const tolerance = 1 / vif;

                                    return (
                                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 font-medium text-gray-900">
                                                {variableNames[idx] || `Variable ${idx + 1}`}
                                            </td>
                                            <td className={`py-3 px-4 text-center font-bold text-lg ${vif >= 10 ? 'text-red-600' : vif >= 5 ? 'text-yellow-600' : 'text-green-600'
                                                }`}>
                                                {vif?.toFixed(3)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${badge.color}`}>
                                                    <BadgeIcon className="w-3 h-3" />
                                                    <span className="text-xs font-medium">{badge.text}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center text-gray-600">
                                                {tolerance?.toFixed(3)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Interpretation Guide */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Interpretation Guide
                        </h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li>• <strong>VIF &lt; 5</strong>: <span className="text-green-600 font-bold">Good</span> - No multicollinearity concern</li>
                            <li>• <strong>5 ≤ VIF &lt; 10</strong>: <span className="text-yellow-600 font-bold">Acceptable</span> - Moderate multicollinearity, monitor closely</li>
                            <li>• <strong>VIF ≥ 10</strong>: <span className="text-red-600 font-bold">Problematic</span> - Severe multicollinearity, action required</li>
                            <li className="mt-2 pt-2 border-t border-gray-200">
                                💡 <strong>Tolerance</strong>: Values close to 0 indicate high multicollinearity. Tolerance &lt; 0.1 (VIF &gt; 10) is problematic.
                            </li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Recommendations */}
            {(hasIssues || severeIssues) && (
                <Card className={`border-2 ${severeIssues ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
                    <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${severeIssues ? 'text-red-900' : 'text-yellow-900'}`}>
                            <AlertCircle className="w-5 h-5" />
                            Recommended Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className={`text-sm space-y-2 ${severeIssues ? 'text-red-800' : 'text-yellow-800'}`}>
                            <li>• <strong>Remove highly correlated variables</strong>: Consider dropping one of the variables with VIF &gt; 10</li>
                            <li>• <strong>Combine variables</strong>: Create composite scores or indices for highly correlated variables</li>
                            <li>• <strong>Principal Component Analysis</strong>: Use PCA to reduce dimensionality</li>
                            <li>• <strong>Theoretical justification</strong>: If variables must be included, provide strong theoretical rationale</li>
                            <li>• <strong>Ridge regression</strong>: Consider using regularization methods if multicollinearity persists</li>
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Methodology Note */}
            <Card>
                <CardHeader>
                    <CardTitle>Methodology: Variance Inflation Factor (VIF)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-gray-700 space-y-2">
                        <p>
                            <strong>Method</strong>: VIF measures how much the variance of a regression coefficient is inflated due to multicollinearity with other predictors.
                        </p>
                        <p>
                            <strong>Formula</strong>: VIF<sub>j</sub> = 1 / (1 - R²<sub>j</sub>), where R²<sub>j</sub> is the R² from regressing variable j on all other independent variables.
                        </p>
                        <p>
                            <strong>Tolerance</strong>: The reciprocal of VIF (1/VIF). Values close to 0 indicate high multicollinearity.
                        </p>
                        <p className="text-xs text-gray-500 italic mt-3 pt-3 border-t border-gray-200">
                            Reference: Hair, J. F., Black, W. C., Babin, B. J., & Anderson, R. E. (2019). Multivariate Data Analysis (8th ed.). Cengage Learning.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Template Interpretation */}
            <UnifiedASIGInterpretation
                analysisType="vif"
                results={{
                    vifValues: results.vif_values || results.vifValues || [],
                    variableNames: results.variable_names || results.variableNames || columns || [],
                    threshold: results.threshold || 5,
                }}
            />
        </div>
    );
});

export default VIFResults;
