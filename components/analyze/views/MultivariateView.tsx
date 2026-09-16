'use client';

import React, { useState } from 'react';
import { AnalysisStep } from '@/types/analysis';
import { Locale, t } from '@/lib/i18n';
import { getAnalysisCost, checkBalance } from '@/lib/ncs-credits';
import { runWithCredits } from '@/lib/analysis-credit-wrapper';
import { runClusterAnalysis, runTwoWayANOVA } from '@/lib/webr-wrapper';
import { ChevronLeft, Play, CircleDot, Grid3x3, Layers, Target } from 'lucide-react';
import { useAnalysisError } from '@/hooks/useAnalysisError';
import { useWebRGuard } from '@/hooks/useWebRGuard';

interface MultivariateViewProps {
    step: AnalysisStep;
    data: any[];
    columns: string[];
    allColumns?: string[];
    user: any;
    profile: any;
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

export const MultivariateView: React.FC<MultivariateViewProps> = ({
    step,
    data = [],
    columns = [],
    allColumns = [],
    user,
    profile,
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
    const varsForFactors = allColumns.length > 0 ? allColumns : columns;
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [clusterVars, setClusterVars] = useState<{ k: number; variables: string[] }>({ k: 3, variables: [] });
    const [twoWayAnovaVars, setTwoWayAnovaVars] = useState<{ y: string; factor1: string; factor2: string }>({ y: '', factor1: '', factor2: '' });
    const handleAnalysisError = useAnalysisError(showToast);

    const handleAnalysisWrapper = async (
        analysisKey: string,
        costKey: string,
        action: () => Promise<any>,
        colsToSave: string[],
        successMsg: string,
        logDesc: string
    ) => {
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
            if (result === null) return; // Insufficient credits or deduction failed
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

    const SelectField = ({ id, label, value, onChange, options, disabledVars = [] }: any) => (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">{label}</label>
            <select
                className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl text-blue-900 font-bold text-sm focus:ring-2 focus:ring-blue-900 outline-none transition-all shadow-sm"
                value={value}
                onChange={onChange}
            >
                <option value="">-- Chọn biến --</option>
                {options.map((col: string) => (
                    <option key={col} value={col} disabled={disabledVars.includes(col)}>{col}</option>
                ))}
            </select>
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

    if (step === 'cluster-select') {
        const title = "Phân tích Cụm (Cluster Analysis)";
        const subtitle = "Phân đoạn đối tượng quan sát thành các nhóm dựa trên sự tương đồng về đặc điểm.";

        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ViewHeader title={title} subtitle={subtitle} icon={CircleDot} />
                
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-8 space-y-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <span>Chọn biến phân cụm ({clusterVars.variables.length} selected)</span>
                             <div className="flex gap-4">
                                <button type="button" onClick={() => setClusterVars(prev => ({ ...prev, variables: columns }))} className="text-blue-600">Select All</button>
                                <button type="button" onClick={() => setClusterVars(prev => ({ ...prev, variables: [] }))} className="text-slate-400">Clear</button>
                             </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-4 bg-slate-50/50 rounded-xl border border-blue-50 border-dashed">
                            {columns.map(col => (
                                <label key={col} className="flex items-center gap-3 p-3 bg-white border border-blue-50 rounded-xl hover:border-blue-300 transition-all cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={clusterVars.variables.includes(col)}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setClusterVars(prev => ({
                                                ...prev,
                                                variables: isChecked ? [...prev.variables, col] : prev.variables.filter(v => v !== col)
                                            }));
                                        }}
                                        className="w-5 h-5 rounded border-blue-100 text-blue-900 focus:ring-blue-900"
                                    />
                                    <span className="text-sm font-bold text-blue-900 uppercase tracking-tighter truncate group-hover:text-blue-700">{col}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Số cụm dự kiến (k clusters)</label>
                        <input
                            type="number"
                            min="2"
                            max="10"
                            value={clusterVars.k}
                            onChange={(e) => setClusterVars({ ...clusterVars, k: Number(e.target.value) || 3 })}
                            className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl text-blue-900 font-bold text-sm focus:ring-2 focus:ring-blue-900 outline-none shadow-sm"
                        />
                        <p className="text-[10px] text-slate-400 font-medium italic mt-2">* Thông thường dùng k = 2 đến 5 để đảm bảo tính diễn giải của hồ sơ đặc trưng khách hàng/đối tượng.</p>
                    </div>

                    <ActionButton 
                        disabled={isAnalyzing}
                        onClick={() => {
                            if (clusterVars.variables.length < 2) return showToast('Chọn ít nhất 2 biến cho phân cụm', 'error');
                            const cols = clusterVars.variables;
                            handleAnalysisWrapper(
                                'cluster', 'regression',
                                () => runClusterAnalysis(data.map(row => cols.map(c => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[c]))) as number[][], clusterVars.k, 'kmeans', cols),
                                cols, 'Phân tích Cluster hoàn tất!', `Cluster Analysis (k=${clusterVars.k})`
                            );
                        }}
                    >
                        Chạy phân tích Cluster
                    </ActionButton>
                </div>

                <button type="button" onClick={() => setStep('analyze')} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                    <ChevronLeft className="w-3 h-3" /> Quay lại chọn phương pháp
                </button>
            </div>
        );
    }

    if (step === 'twoway-anova-select') {
        const title = "Two-Way ANOVA";
        const subtitle = "Phân tích so sánh trung bình (Y) theo 2 tác nhân phân loại đồng thời và xem xét hiệu ứng tương tác.";

        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ViewHeader title={title} subtitle={subtitle} icon={Grid3x3} />
                
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-8 space-y-8">
                    <SelectField 
                         label="Biến phụ thuộc (Dependent Variable Y)" 
                         value={twoWayAnovaVars.y} 
                         onChange={(e: any) => setTwoWayAnovaVars({ ...twoWayAnovaVars, y: e.target.value })}
                         options={columns}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectField 
                            label="Nhân tố 1 (Factor A)" 
                            value={twoWayAnovaVars.factor1} 
                            onChange={(e: any) => setTwoWayAnovaVars(prev => ({ ...prev, factor1: e.target.value }))}
                            options={varsForFactors}
                            disabledVars={[twoWayAnovaVars.factor2]}
                        />
                        <SelectField 
                            label="Nhân tố 2 (Factor B)" 
                            value={twoWayAnovaVars.factor2} 
                            onChange={(e: any) => setTwoWayAnovaVars(prev => ({ ...prev, factor2: e.target.value }))}
                            options={varsForFactors}
                            disabledVars={[twoWayAnovaVars.factor1]}
                        />
                    </div>

                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 text-[10px] text-blue-800 leading-relaxed font-medium italic">
                        * Gợi ý: Các nhân tố nên có số lượng nhóm vừa phải (VD: Giới tính, Nhóm tuổi, Khu vực) để kết quả kiểm định tương tác có ý nghĩa thực tiễn.
                    </div>

                    <ActionButton 
                        disabled={isAnalyzing}
                        onClick={() => {
                            if (!twoWayAnovaVars.y || !twoWayAnovaVars.factor1 || !twoWayAnovaVars.factor2) return showToast('Cần chọn đủ 3 biến', 'error');
                            const yData = data.map(row => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[twoWayAnovaVars.y])) as number[];
                            const f1Data = data.map(row => String(row[twoWayAnovaVars.factor1]));
                            const f2Data = data.map(row => String(row[twoWayAnovaVars.factor2]));

                            handleAnalysisWrapper(
                                'twoway-anova', 'anova',
                                () => runTwoWayANOVA(yData, f1Data, f2Data, twoWayAnovaVars.factor1, twoWayAnovaVars.factor2, twoWayAnovaVars.y),
                                [twoWayAnovaVars.y, twoWayAnovaVars.factor1, twoWayAnovaVars.factor2], 'Phân tích hoàn tất!', `Two-Way ANOVA: ${twoWayAnovaVars.y}`
                            );
                        }}
                    >
                        Chạy Two-Way ANOVA
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
