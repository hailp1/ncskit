'use client';

import React, { useState } from 'react';
import { AnalysisStep } from '@/types/analysis';
import { Locale, t } from '@/lib/i18n';
import { getAnalysisCost, checkBalance } from '@/lib/ncs-credits';
import { runWithCredits } from '@/lib/analysis-credit-wrapper';
import { runLinearRegression, runLogisticRegression } from '@/lib/webr-wrapper';
import { ChevronLeft, Play, TrendingUp, Binary, Target, Activity } from 'lucide-react';
import { useAnalysisError } from '@/hooks/useAnalysisError';
import { useWebRGuard } from '@/hooks/useWebRGuard';

interface RegressionViewProps {
    step: AnalysisStep;
    data: any[];
    columns: string[];
    user: any;
    setResults: (results: any) => void;
    setStep: (step: AnalysisStep) => void;
    setNcsBalance: React.Dispatch<React.SetStateAction<number>>;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    setRequiredCredits: (amount: number) => void;
    setCurrentAnalysisCost: (amount: number) => void;
    setShowInsufficientCredits: (show: boolean) => void;
    setAnalysisType?: (type: string) => void;
    locale: Locale;
}

export const RegressionView: React.FC<RegressionViewProps> = ({
    step,
    data = [],
    columns = [],
    user,
    setResults,
    setStep,
    setNcsBalance,
    showToast,
    setRequiredCredits,
    setCurrentAnalysisCost,
    setShowInsufficientCredits,
    setAnalysisType,
    locale
}) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [regressionVars, setRegressionVars] = useState<{ y: string; xs: string[] }>({ y: '', xs: [] });
    const [logisticVars, setLogisticVars] = useState<{ y: string; xs: string[] }>({ y: '', xs: [] });
    const handleAnalysisError = useAnalysisError(showToast);
    const checkWebRReady = useWebRGuard(showToast);

    const handleAnalysisWrapper = async (
        analysisKey: string,
        costKey: string,
        action: () => Promise<any>,
        colsToSave: string[],
        successMsg: string,
        logDesc: string
    ) => {
        if (!checkWebRReady()) return;
        setIsAnalyzing(true);
        if (setAnalysisType) setAnalysisType(analysisKey);

        try {
            const result = await runWithCredits(action, {
                user,
                analysisKey,
                costKey,
                logDesc,
                onInsufficientCredits: (cost) => {
                    setRequiredCredits(cost);
                    setCurrentAnalysisCost(cost);
                    setShowInsufficientCredits(true);
                },
                onBalanceUpdate: setNcsBalance,
                onToast: showToast,
            });
            if (result === null) return;
            setResults({ type: analysisKey, data: result, columns: colsToSave });
            setStep('results');
            showToast(successMsg, 'success');
        } catch (err: any) {
            handleAnalysisError(err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const ViewHeader = ({ title, subtitle, icon: Icon }: any) => (
        <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 shadow-sm">
                <Icon className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-blue-900 tracking-tight uppercase">{title}</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium max-w-md">{subtitle}</p>
        </div>
    );

    const ActionButton = ({ onClick, disabled, children }: any) => (
        <button type="button"
            onClick={onClick}
            disabled={disabled}
            className="w-full py-4 bg-blue-900 hover:bg-blue-950 text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 rounded-xl transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
        >
            {isAnalyzing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play className="w-5 h-5" />}
            {children}
        </button>
    );

    if (step === 'regression-select') {
        const title = "Hồi quy Tuyến tính Đa biến";
        const subtitle = "Phân tích mức độ tác động của các biến độc lập (X) lên biến phụ thuộc (Y).";

        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ViewHeader title={title} subtitle={subtitle} icon={TrendingUp} />
                
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-8 space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Biến phụ thuộc (Dependent Variable Y)</label>
                        <select
                            id="dependent-var"
                            className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl text-blue-900 font-bold text-sm focus:ring-2 focus:ring-blue-900 outline-none transition-all shadow-sm"
                            value={regressionVars.y}
                            onChange={(e) => setRegressionVars({ ...regressionVars, y: e.target.value })}
                        >
                            <option value="">-- Chọn biến Y --</option>
                            {columns.map(col => (
                                <option key={col} value={col} disabled={regressionVars.xs.includes(col)}>{col}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Biến độc lập (Independent Variables X)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-4 bg-slate-50/50 rounded-xl border border-blue-50 border-dashed">
                            {columns.map(col => (
                                <label key={col} className={`flex items-center gap-3 p-3 bg-white border border-blue-50 rounded-xl hover:border-blue-300 transition-all cursor-pointer group ${regressionVars.y === col ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={regressionVars.xs.includes(col)}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setRegressionVars(prev => ({
                                                ...prev,
                                                xs: isChecked ? [...prev.xs, col] : prev.xs.filter(x => x !== col)
                                            }));
                                        }}
                                        className="w-5 h-5 rounded border-blue-100 text-blue-900 focus:ring-blue-900"
                                    />
                                    <span className="text-sm font-bold text-blue-900 uppercase tracking-tighter truncate group-hover:text-blue-700">{col}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <ActionButton 
                        disabled={isAnalyzing}
                        onClick={() => {
                            if (!regressionVars.y) return showToast('Vui lòng chọn biến Y', 'error');
                            if (regressionVars.xs.length === 0) return showToast('Vui lòng chọn ít nhất 1 biến X', 'error');
                            const cols = [regressionVars.y, ...regressionVars.xs];
                            handleAnalysisWrapper(
                                'regression', 'regression',
                                () => runLinearRegression(data.map(row => cols.map(c => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[c]))) as number[][], cols),
                                cols, 'Phân tích hoàn tất!', `Regression: Y=${regressionVars.y} (${regressionVars.xs.length} predictors)`
                            );
                        }}
                    >
                        Chạy phân tích Hồi quy
                    </ActionButton>
                </div>

                <button type="button" onClick={() => setStep('analyze')} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                    <ChevronLeft className="w-3 h-3" /> Quay lại
                </button>
            </div>
        );
    }

    if (step === 'logistic-select') {
        const title = t(locale, 'logistic.title');
        const subtitle = t(locale, 'logistic.description');

        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ViewHeader title={title} subtitle={subtitle} icon={Binary} />
                
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-8 space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">{t(locale, 'logistic.dependent_variable')}</label>
                        <select
                            className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl text-blue-900 font-bold text-sm focus:ring-2 focus:ring-blue-900 outline-none shadow-sm"
                            value={logisticVars.y}
                            onChange={(e) => setLogisticVars({ ...logisticVars, y: e.target.value })}
                        >
                            <option value="">{t(locale, 'common.select_variable')}</option>
                            {columns.map(col => (
                                <option key={col} value={col} disabled={logisticVars.xs.includes(col)}>{col}</option>
                            ))}
                        </select>
                        <p className="text-[10px] font-bold text-blue-600/70 tracking-tight mt-2 px-1 italic">*{t(locale, 'logistic.note')}</p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">{t(locale, 'logistic.independent_variables')}</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-4 bg-slate-50/50 rounded-xl border border-blue-50 border-dashed">
                            {columns.map(col => (
                                <label key={col} className={`flex items-center gap-3 p-3 bg-white border border-blue-50 rounded-xl hover:border-blue-300 transition-all cursor-pointer group ${logisticVars.y === col ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={logisticVars.xs.includes(col)}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setLogisticVars(prev => ({
                                                ...prev,
                                                xs: isChecked ? [...prev.xs, col] : prev.xs.filter(x => x !== col)
                                            }));
                                        }}
                                        className="w-5 h-5 rounded border-blue-100 text-blue-900 focus:ring-blue-900"
                                    />
                                    <span className="text-sm font-bold text-blue-900 uppercase tracking-tighter truncate group-hover:text-blue-700">{col}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <ActionButton 
                        disabled={isAnalyzing}
                        onClick={() => {
                            if (!logisticVars.y) return showToast(t(locale, 'logistic.error_y'), 'error');
                            if (logisticVars.xs.length === 0) return showToast(t(locale, 'logistic.error_x'), 'error');
                            const cols = [logisticVars.y, ...logisticVars.xs];
                            handleAnalysisWrapper(
                                'logistic', 'regression',
                                () => runLogisticRegression(data.map(row => cols.map(c => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[c]))) as number[][], cols),
                                cols, 'Phân tích hoàn tất!', `Logistic Regression: Y=${logisticVars.y}`
                            );
                        }}
                    >
                        Chạy Logistic Regression
                    </ActionButton>
                </div>

                <button type="button" onClick={() => setStep('analyze')} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                    <ChevronLeft className="w-3 h-3" /> Quay lại
                </button>
            </div>
        );
    }

    return null;
};
