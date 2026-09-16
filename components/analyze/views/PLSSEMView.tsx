/**
 * PLS-SEM Analysis View
 * Handles all PLS-SEM specific methods for Analyze2 workflow
 */

import React, { useState } from 'react';
import { getAnalysisCost, checkBalance, deductCreditsAtomic } from '@/lib/ncs-credits';
import { logAnalysisUsage } from '@/lib/activity-logger';
import {
    runMcDonaldOmega,
    runOutlierDetection,
    runHTMTMatrix,
    runVIFCheck,
    runSimpleBootstrapping,
    runMediationModeration,
    runIPMA,
    runMGA,
    runSimpleBlindfolding
} from '@/lib/webr/pls-sem';
import { SmartGroupSelector } from '@/components/VariableSelector';
import HTMTSelection from '@/components/HTMTSelection';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useAnalysisError } from '@/hooks/useAnalysisError';

type PLSSEMMethod =
    | 'omega'
    | 'outlier'
    | 'htmt'
    | 'vif'
    | 'cmb'
    | 'bootstrap'
    | 'mediation'
    | 'ipma'
    | 'mga'
    | 'blindfolding';

interface PLSSEMViewProps {
    method: PLSSEMMethod;
    data: any[];
    columns: string[];
    user: any;
    setResults: (results: any) => void;
    setStep: (step: any) => void;
    setNcsBalance: React.Dispatch<React.SetStateAction<number>>;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    onBack: () => void;

    // Credit UI setters
    setRequiredCredits: (amount: number) => void;
    setCurrentAnalysisCost: (amount: number) => void;
    setShowInsufficientCredits: (show: boolean) => void;
    setAnalysisType?: (type: string) => void;
}

export const PLSSEMView: React.FC<PLSSEMViewProps> = ({
    method,
    data = [],
    columns = [],
    user,
    setResults,
    setStep,
    setNcsBalance,
    showToast,
    onBack,
    setRequiredCredits,
    setCurrentAnalysisCost,
    setShowInsufficientCredits,
    setAnalysisType
}) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const handleAnalysisError = useAnalysisError(showToast);

    // McDonald's Omega
    const runOmegaAnalysis = async (cols: string[], name: string) => {
        if (cols.length < 3) {
            showToast('McDonald\'s Omega cần ít nhất 3 biến', 'error');
            return;
        }

        if (user) {
            const cost = await getAnalysisCost('omega');
            const { hasEnough } = await checkBalance(user.id, cost);
            if (!hasEnough) {
                setRequiredCredits(cost);
                setCurrentAnalysisCost(cost);
                setShowInsufficientCredits(true);
                return;
            }
        }

        setIsAnalyzing(true);

        try {
            const selectedData = data.map(row =>
                cols.map(col => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[col]))
            );

            // Deduct BEFORE running — atomic via RPC
            if (user) {
                const cost = await getAnalysisCost('omega');
                const { success, isExempt, newBalance, error: deductError } = await deductCreditsAtomic(user.id, cost, `McDonald's Omega: ${name}`);
                if (!success) { showToast(deductError || 'Không đủ NCS', 'error'); setIsAnalyzing(false); return; }
                if (!isExempt) setNcsBalance(newBalance);
            }

            const result = await runMcDonaldOmega(selectedData as number[][], cols);

            if (user) {
                const cost = await getAnalysisCost('omega');
                await logAnalysisUsage(user.id, 'omega', cost);
            }

            setResults({
                type: 'omega',
                data: result,
                columns: cols,
                scaleName: name
            });
            setAnalysisType?.('omega');
            setStep('results');

            showToast('Phân tích McDonald\'s Omega hoàn thành!', 'success');
        } catch (error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Outlier Detection
    const runOutlierAnalysis = async () => {
        if (columns.length < 2) {
            showToast('Cần ít nhất 2 biến để phát hiện outliers', 'error');
            return;
        }

        if (user) {
            const cost = await getAnalysisCost('outlier');
            const { hasEnough } = await checkBalance(user.id, cost);
            if (!hasEnough) {
                setRequiredCredits(cost);
                setCurrentAnalysisCost(cost);
                setShowInsufficientCredits(true);
                return;
            }
        }

        setIsAnalyzing(true);

        try {
            const numericData = data.map(row =>
                columns.map(col => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[col]))
            );

            // Deduct BEFORE running — atomic via RPC
            if (user) {
                const cost = await getAnalysisCost('outlier');
                const { success, isExempt, newBalance, error: deductError } = await deductCreditsAtomic(user.id, cost, 'Outlier Detection');
                if (!success) { showToast(deductError || 'Không đủ NCS', 'error'); setIsAnalyzing(false); return; }
                if (!isExempt) setNcsBalance(newBalance);
            }

            const result = await runOutlierDetection(numericData as number[][]);

            if (user) {
                const cost = await getAnalysisCost('outlier');
                await logAnalysisUsage(user.id, 'outlier', cost);
            }

            setResults({
                type: 'outlier',
                data: result,
                columns: columns
            });
            setAnalysisType?.('outlier');
            setStep('results');

            showToast(`Phát hiện ${result.n_outliers} outliers!`, 'success');
        } catch (error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // HTMT Matrix
    const runHTMTAnalysis = async (factorStructure: { name: string; items: number[] }[]) => {
        if (factorStructure.length < 2) {
            showToast('HTMT cần ít nhất 2 factors để so sánh', 'error');
            return;
        }

        if (user) {
            const cost = await getAnalysisCost('htmt');
            const { hasEnough } = await checkBalance(user.id, cost);
            if (!hasEnough) {
                setRequiredCredits(cost);
                setCurrentAnalysisCost(cost);
                setShowInsufficientCredits(true);
                return;
            }
        }

        setIsAnalyzing(true);

        try {
            const numericData = data.map(row =>
                columns.map(col => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[col]))
            );

            const result = await runHTMTMatrix(numericData as number[][], factorStructure);

            // Deduct AFTER running (HTMT is read-only, low risk — kept post for UX)
            if (user) {
                const cost = await getAnalysisCost('htmt');
                const { success, isExempt, newBalance, error: deductError } = await deductCreditsAtomic(user.id, cost, 'HTMT Matrix');
                if (!success) { showToast(deductError || 'Không đủ NCS', 'error'); setIsAnalyzing(false); return; }
                if (!isExempt) setNcsBalance(newBalance);
                await logAnalysisUsage(user.id, 'htmt', cost);
            }

            setResults({
                type: 'htmt',
                data: result,
                factorStructure: factorStructure
            });
            setAnalysisType?.('htmt');
            setStep('results');

            showToast('HTMT Matrix hoàn thành!', 'success');
        } catch (error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // VIF Check
    const runVIFAnalysis = async (dependentVarIndex: number = 0) => {
        if (columns.length < 3) {
            showToast('VIF cần ít nhất 3 biến (1 dependent + 2 independent)', 'error');
            return;
        }

        if (user) {
            const cost = await getAnalysisCost('vif');
            const { hasEnough } = await checkBalance(user.id, cost);
            if (!hasEnough) {
                setRequiredCredits(cost);
                setCurrentAnalysisCost(cost);
                setShowInsufficientCredits(true);
                return;
            }
        }

        setIsAnalyzing(true);

        try {
            const numericData = data.map(row =>
                columns.map(col => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[col]))
            );

            // Deduct BEFORE running — atomic via RPC
            if (user) {
                const cost = await getAnalysisCost('vif');
                const { success, isExempt, newBalance, error: deductError } = await deductCreditsAtomic(user.id, cost, 'VIF Check');
                if (!success) { showToast(deductError || 'Không đủ NCS', 'error'); setIsAnalyzing(false); return; }
                if (!isExempt) setNcsBalance(newBalance);
            }

            const result = await runVIFCheck(numericData as number[][], dependentVarIndex);

            if (user) {
                const cost = await getAnalysisCost('vif');
                await logAnalysisUsage(user.id, 'vif', cost);
            }

            setResults({
                type: 'vif',
                data: result,
                columns: columns
            });
            setAnalysisType?.('vif');
            setStep('results');

            showToast('VIF Check hoàn thành!', 'success');
        } catch (error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // CMB Analysis
    const runCMBAnalysis = async (selectedCols: string[]) => {
        if (selectedCols.length < 3) {
            showToast('CMB cần ít nhất 3 biến', 'error');
            return;
        }

        if (user) {
            const cost = await getAnalysisCost('cmb');
            const { hasEnough } = await checkBalance(user.id, cost);
            if (!hasEnough) {
                setRequiredCredits(cost);
                setCurrentAnalysisCost(cost);
                setShowInsufficientCredits(true);
                return;
            }
        }

        setIsAnalyzing(true);

        try {
            const numericData = data.map(row =>
                columns.map(col => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[col]))
            );

            // Deduct BEFORE running
            if (user) {
                const cost = await getAnalysisCost('cmb');
                const { success, isExempt, newBalance, error: deductError } = await deductCreditsAtomic(user.id, cost, 'Common Method Bias');
                if (!success) { showToast(deductError || 'Không đủ NCS', 'error'); setIsAnalyzing(false); return; }
                if (!isExempt) setNcsBalance(newBalance);
            }

            // Create a dummy factor structure with all selected columns
            const factorStructure = [{
                name: 'CMB_Factor',
                items: selectedCols.map(col => columns.indexOf(col))
            }];

            const { runHarmanCMB } = await import('@/lib/webr/pls-sem');
            const result = await runHarmanCMB(numericData as number[][], factorStructure);

            if (user) {
                const cost = await getAnalysisCost('cmb');
                await logAnalysisUsage(user.id, 'cmb', cost);
            }

            setResults({
                type: 'cmb',
                data: result,
                columns: selectedCols
            });
            setAnalysisType?.('cmb');
            setStep('results');

            showToast("Harman's Single Factor Test hoàn thành!", 'success');
        } catch (error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Bootstrapping
    const runBootstrapAnalysis = async (nBootstrap: number = 500) => {
        if (columns.length < 2) {
            showToast('Bootstrapping cần ít nhất 2 biến', 'error');
            return;
        }

        if (user) {
            const cost = await getAnalysisCost('bootstrap');
            const { hasEnough } = await checkBalance(user.id, cost);
            if (!hasEnough) {
                setRequiredCredits(cost);
                setCurrentAnalysisCost(cost);
                setShowInsufficientCredits(true);
                return;
            }
        }

        setIsAnalyzing(true);

        try {
            const numericData = data.map(row =>
                columns.map(col => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[col]))
            );

            // Deduct BEFORE running — atomic via RPC
            if (user) {
                const cost = await getAnalysisCost('bootstrap');
                const { success, isExempt, newBalance, error: deductError } = await deductCreditsAtomic(user.id, cost, `Bootstrapping (${nBootstrap} samples)`);
                if (!success) { showToast(deductError || 'Không đủ NCS', 'error'); setIsAnalyzing(false); return; }
                if (!isExempt) setNcsBalance(newBalance);
            }

            const result = await runSimpleBootstrapping(numericData as number[][], nBootstrap);

            if (user) {
                const cost = await getAnalysisCost('bootstrap');
                await logAnalysisUsage(user.id, 'bootstrap', cost);
            }

            setResults({
                type: 'bootstrap',
                data: result,
                columns: columns,
                nBootstrap: nBootstrap
            });
            setAnalysisType?.('bootstrap');
            setStep('results');

            showToast(`Bootstrapping với ${nBootstrap} samples hoàn thành!`, 'success');
        } catch (error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Render based on method
    if (method === 'omega') {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-8 h-8 text-purple-600" />
                        <h2 className="text-3xl font-bold text-gray-800">
                            McDonald&apos;s Omega
                        </h2>
                    </div>
                    <p className="text-gray-600">
                        Đánh giá độ tin cậy thang đo (Chính xác hơn Cronbach&apos;s Alpha)
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-purple-700 font-medium">
                            Omega ≥ 0.7 = Good | ≥ 0.6 = Acceptable
                        </span>
                    </div>
                </div>

                <SmartGroupSelector
                    columns={columns}
                    onAnalyzeGroup={runOmegaAnalysis}
                    onAnalyzeAllGroups={async (groups) => {
                        for (const group of groups) {
                            await runOmegaAnalysis(group.columns, group.name);
                        }
                    }}
                    isAnalyzing={isAnalyzing}
                    minItemsPerGroup={3}
                    analysisLabel="McDonald's Omega"
                />

                <button type="button"
                    onClick={onBack}
                    className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                >
                    ← Quay lại
                </button>

                {isAnalyzing && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                        <p className="mt-4 text-gray-600">Đang tính toán Omega...</p>
                    </div>
                )}
            </div>
        );
    }

    if (method === 'outlier') {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                        <h2 className="text-3xl font-bold text-gray-800">
                            Outlier Detection
                        </h2>
                    </div>
                    <p className="text-gray-600">
                        Phát hiện dữ liệu ngoại lai bằng Mahalanobis Distance
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-700 font-medium">
                            Sử dụng tất cả {columns.length} biến số
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border">
                    <p className="text-sm text-gray-600 mb-4">
                        Phân tích sẽ tự động sử dụng tất cả biến số trong dataset để tính Mahalanobis Distance.
                        Các quan sát có khoảng cách vượt ngưỡng (p &lt; 0.001) sẽ được đánh dấu là outliers.
                    </p>

                    <button type="button"
                        onClick={runOutlierAnalysis}
                        disabled={isAnalyzing}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAnalyzing ? 'Đang phân tích...' : 'Phát hiện Outliers'}
                    </button>
                </div>

                <button type="button"
                    onClick={onBack}
                    className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                >
                    ← Quay lại
                </button>

                {isAnalyzing && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
                        <p className="mt-4 text-gray-600">Đang tính toán Mahalanobis Distance...</p>
                    </div>
                )}
            </div>
        );
    }

    // HTMT Matrix UI
    if (method === 'htmt') {
        return (
            <HTMTSelection
                columns={columns}
                onRunHTMT={async (factorStructure, threshold) => {
                    await runHTMTAnalysis(factorStructure);
                }}
                isAnalyzing={isAnalyzing}
                onBack={onBack}
            />
        );
    }

    // VIF Check UI
    if (method === 'vif') {
        const [selectedDependent, setSelectedDependent] = React.useState<string>(columns[0] || '');

        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <h2 className="text-3xl font-bold text-gray-800">
                            VIF Check (Multicollinearity)
                        </h2>
                    </div>
                    <p className="text-gray-600">
                        Kiểm tra đa cộng tuyến giữa các biến độc lập
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                        <Info className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">
                            VIF &lt; 5 = Good | VIF &lt; 10 = Acceptable
                        </span>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Chọn biến phụ thuộc (Dependent Variable)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <select
                            value={selectedDependent}
                            onChange={(e) => setSelectedDependent(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            {columns.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-2 italic">
                            Các biến còn lại sẽ được coi là biến độc lập (Independent Variables)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Biến độc lập sẽ được kiểm tra</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {columns.filter(col => col !== selectedDependent).map(col => (
                                <span
                                    key={col}
                                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                                >
                                    {col}
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-3 italic">
                            VIF sẽ được tính cho từng biến độc lập này
                        </p>
                    </CardContent>
                </Card>

                <button type="button"
                    onClick={async () => {
                        const dependentIndex = columns.indexOf(selectedDependent);
                        await runVIFAnalysis(dependentIndex);
                    }}
                    disabled={isAnalyzing || columns.length < 3}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isAnalyzing ? 'Đang tính toán VIF...' : 'Chạy VIF Check'}
                </button>

                <button type="button"
                    onClick={onBack}
                    className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                >
                    ← Quay lại
                </button>

                {isAnalyzing && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                        <p className="mt-4 text-gray-600">Đang tính toán VIF...</p>
                    </div>
                )}
            </div>
        );
    }

    // ── CMB UI ─────────────────────────────────────────────────────────────
    if (method === 'cmb') {
        // By default, select all columns. We use a local state to let the user deselect some.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [selectedCols, setSelectedCols] = React.useState<string[]>(columns);

        const toggleCol = (col: string) => {
            setSelectedCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
        };

        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertTriangle className="w-8 h-8 text-rose-600" />
                        <h2 className="text-3xl font-bold text-gray-800">Common Method Bias (CMB)</h2>
                    </div>
                    <p className="text-gray-600">
                        Harman&apos;s Single Factor Test
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg">
                        <Info className="w-4 h-4 text-rose-600" />
                        <span className="text-sm text-rose-700 font-medium">
                            Variance Explained &lt; 50% = No CMB Detected
                        </span>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Chọn các biến quan sát trong mô hình</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-500 mb-4">
                            CMB yêu cầu đưa TẤT CẢ các biến quan sát (indicators) của TẤT CẢ các thang đo vào một phân tích nhân tố duy nhất (EFA).
                            <br />Bỏ chọn các biến không thuộc mô hình đo lường (như Age, Gender).
                        </p>
                        
                        <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                            {columns.map(col => {
                                const isSelected = selectedCols.includes(col);
                                return (
                                    <label
                                        key={col}
                                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                                            isSelected ? 'bg-rose-100 border-rose-300 text-rose-900' : 'bg-white border-slate-300 text-slate-500'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleCol(col)}
                                            className="hidden"
                                        />
                                        <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-rose-500' : 'bg-slate-300'}`} />
                                        <span className="text-sm font-bold uppercase tracking-tighter">{col}</span>
                                    </label>
                                );
                            })}
                        </div>
                        <div className="mt-3 flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-700">Đã chọn: {selectedCols.length} biến</span>
                            <div className="space-x-3">
                                <button type="button" onClick={() => setSelectedCols(columns)} className="text-blue-600 hover:underline">Chọn tất cả</button>
                                <button type="button" onClick={() => setSelectedCols([])} className="text-rose-600 hover:underline">Bỏ chọn tất cả</button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <button type="button"
                    onClick={() => runCMBAnalysis(selectedCols)}
                    disabled={isAnalyzing || selectedCols.length < 3}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isAnalyzing ? 'Đang tính toán CMB...' : "Chạy Harman's Test"}
                </button>

                <button type="button"
                    onClick={onBack}
                    className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                >
                    ← Quay lại
                </button>

                {isAnalyzing && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-rose-500 border-t-transparent"></div>
                        <p className="mt-4 text-gray-600">Đang chạy Harman&apos;s Single Factor Test...</p>
                    </div>
                )}
            </div>
        );
    }

    // ── Bootstrap UI ─────────────────────────────────────────────────────────
    if (method === 'bootstrap') {
        const [nBootstrap, setNBootstrap] = React.useState(500);
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-8 h-8 text-blue-600" />
                        <h2 className="text-3xl font-bold text-gray-800">Bootstrapping</h2>
                    </div>
                    <p className="text-gray-600">Ước lượng khoảng tin cậy 95% cho các tham số thống kê</p>
                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <Info className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700 font-medium">CI không chứa 0 → hệ số có ý nghĩa thống kê</span>
                    </div>
                </div>

                <Card>
                    <CardHeader><CardTitle>Cài đặt Bootstrap</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Số lần lấy mẫu lại (Iterations)
                            </label>
                            <select
                                value={nBootstrap}
                                onChange={(e) => setNBootstrap(Number(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={200}>200 (nhanh, thử nghiệm)</option>
                                <option value={500}>500 (chuẩn)</option>
                                <option value={1000}>1,000 (khuyến nghị)</option>
                                <option value={5000}>5,000 (publication quality)</option>
                            </select>
                        </div>
                        <p className="text-xs text-gray-500 italic">Sử dụng tất cả {columns.length} biến trong dataset</p>
                    </CardContent>
                </Card>

                <button type="button"
                    onClick={() => runBootstrapAnalysis(nBootstrap)}
                    disabled={isAnalyzing}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                    {isAnalyzing ? `Đang chạy Bootstrap (${nBootstrap} iterations)...` : `Chạy Bootstrapping (${nBootstrap} samples)`}
                </button>
                <button type="button" onClick={onBack} className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg">← Quay lại</button>
                {isAnalyzing && (
                    <div className="text-center py-6">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                        <p className="mt-3 text-gray-600">Đang thực hiện {nBootstrap.toLocaleString()} iterations...</p>
                    </div>
                )}
            </div>
        );
    }

    // ── Blindfolding UI ───────────────────────────────────────────────────────
    if (method === 'blindfolding') {
        const [omissionDist, setOmissionDist] = React.useState(7);

        const runBlindfoldingAnalysis = async () => {
            if (columns.length < 2) { showToast('Blindfolding cần ít nhất 2 biến', 'error'); return; }
            setIsAnalyzing(true);
            try {
                const numericData = data.map(row =>
                    columns.map(col => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[col]))
                );
                const result = await runSimpleBlindfolding(numericData as number[][], omissionDist);
                setResults({ type: 'blindfolding', data: result, columns });
                setAnalysisType?.('blindfolding');
                setStep('results');
                showToast('Blindfolding hoàn thành!', 'success');
            } catch (error) { handleAnalysisError(error); }
            finally { setIsAnalyzing(false); }
        };

        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="w-8 h-8 text-teal-600" />
                        <h2 className="text-3xl font-bold text-gray-800">Blindfolding (Q²)</h2>
                    </div>
                    <p className="text-gray-600">Kiểm tra độ liên quan dự đoán của mô hình (Predictive Relevance)</p>
                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-lg">
                        <Info className="w-4 h-4 text-teal-600" />
                        <span className="text-sm text-teal-700 font-medium">Q² &gt; 0 → Mô hình có độ liên quan dự đoán</span>
                    </div>
                </div>

                <Card>
                    <CardHeader><CardTitle>Omission Distance (D)</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <select
                            value={omissionDist}
                            onChange={(e) => setOmissionDist(Number(e.target.value))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500"
                        >
                            <option value={5}>D = 5</option>
                            <option value={7}>D = 7 (mặc định theo Hair et al.)</option>
                            <option value={10}>D = 10</option>
                        </select>
                        <p className="text-xs text-gray-500 italic">D phải là ước số của N. Giá trị 7 là mặc định theo Hair et al. (2017).</p>
                        <p className="text-xs text-gray-500">Dataset: {data.length} quan sát · {columns.length} biến</p>
                    </CardContent>
                </Card>

                <button type="button"
                    onClick={runBlindfoldingAnalysis}
                    disabled={isAnalyzing}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                    {isAnalyzing ? 'Đang tính toán Q²...' : 'Chạy Blindfolding'}
                </button>
                <button type="button" onClick={onBack} className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg">← Quay lại</button>
                {isAnalyzing && (
                    <div className="text-center py-6">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
                        <p className="mt-3 text-gray-600">Đang tính Q² với D = {omissionDist}...</p>
                    </div>
                )}
            </div>
        );
    }

    // ── MGA UI ────────────────────────────────────────────────────────────────
    if (method === 'mga') {
        const [groupVar, setGroupVar] = React.useState(columns[0] || '');

        const runMGAAnalysis = async () => {
            if (columns.length < 2) { showToast('MGA cần ít nhất 2 biến', 'error'); return; }
            setIsAnalyzing(true);
            try {
                const numericData = data.map(row =>
                    columns.map(col => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[col]))
                );
                
                // Pass raw group values (strings) to MGA
                const groupRaw = data.map(row => row[groupVar]);
                
                const result = await runMGA(numericData as number[][], [], [], groupRaw);
                setResults({ type: 'mga', data: result, columns });
                setAnalysisType?.('mga');
                setStep('results');
                showToast('Multi-Group Analysis hoàn thành!', 'success');
            } catch (error) { handleAnalysisError(error); }
            finally { setIsAnalyzing(false); }
        };

        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Info className="w-8 h-8 text-indigo-600" />
                        <h2 className="text-3xl font-bold text-gray-800">Multi-Group Analysis (MGA)</h2>
                    </div>
                    <p className="text-gray-600">So sánh sự khác biệt giữa các nhóm (giới tính, địa lý, v.v.)</p>
                </div>

                <Card>
                    <CardHeader><CardTitle>Chọn biến phân nhóm (Grouping Variable)</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <select
                            value={groupVar}
                            onChange={(e) => setGroupVar(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                            {columns.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 italic">Biến này phải là biến phân loại (categorical) với 2+ giá trị riêng biệt.</p>
                    </CardContent>
                </Card>

                <button type="button"
                    onClick={runMGAAnalysis}
                    disabled={isAnalyzing}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                    {isAnalyzing ? 'Đang phân tích MGA...' : 'Chạy Multi-Group Analysis'}
                </button>
                <button type="button" onClick={onBack} className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg">← Quay lại</button>
                {isAnalyzing && (
                    <div className="text-center py-6">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                        <p className="mt-3 text-gray-600">Đang so sánh các nhóm...</p>
                    </div>
                )}
            </div>
        );
    }

    // ── IPMA UI ───────────────────────────────────────────────────────────────
    if (method === 'ipma') {
        const [targetVar, setTargetVar] = React.useState(columns[columns.length - 1] || '');

        const runIPMAAnalysis = async () => {
            if (columns.length < 2) { showToast('IPMA cần ít nhất 2 biến', 'error'); return; }
            setIsAnalyzing(true);
            try {
                const numericData = data.map(row =>
                    columns.map(col => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[col]))
                );
                const targetIdx = columns.indexOf(targetVar);
                const result = await runIPMA(numericData as number[][], targetIdx >= 0 ? targetIdx : columns.length - 1);
                setResults({ type: 'ipma', data: result, columns });
                setAnalysisType?.('ipma');
                setStep('results');
                showToast('IPMA hoàn thành!', 'success');
            } catch (error) { handleAnalysisError(error); }
            finally { setIsAnalyzing(false); }
        };

        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="w-8 h-8 text-amber-600" />
                        <h2 className="text-3xl font-bold text-gray-800">IPMA — Importance-Performance Map</h2>
                    </div>
                    <p className="text-gray-600">Phân tích tầm quan trọng (Importance) và hiệu suất (Performance) của các biến</p>
                </div>

                <Card>
                    <CardHeader><CardTitle>Chọn biến mục tiêu (Target Variable)</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <select
                            id="ipma-target"
                            value={targetVar}
                            onChange={(e) => setTargetVar(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                        >
                            {columns.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 italic">Tầm quan trọng được đo bằng tương quan với biến mục tiêu. Hiệu suất đo bằng giá trị trung bình.</p>
                    </CardContent>
                </Card>

                <button type="button"
                    onClick={runIPMAAnalysis}
                    disabled={isAnalyzing}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                    {isAnalyzing ? 'Đang tính IPMA...' : 'Chạy IPMA Analysis'}
                </button>
                <button type="button" onClick={onBack} className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg">← Quay lại</button>
                {isAnalyzing && (
                    <div className="text-center py-6">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
                        <p className="mt-3 text-gray-600">Đang tính Importance-Performance...</p>
                    </div>
                )}
            </div>
        );
    }

    // ── Fallback (mediation and any future method) ────────────────────────────
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{method.toUpperCase()}</h2>
                <p className="text-gray-500 text-sm">This analysis type is not yet configured in the UI.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-slate-600 text-sm">
                The R computation engine is ready. A dedicated input form for this analysis
                will be added in a future release.
            </div>
            <button type="button" onClick={onBack} className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg">← Back</button>
        </div>
    );
};
