'use client';

import React, { useState } from 'react';
import { AnalysisStep } from '@/types/analysis';
import { Locale, t } from '@/lib/i18n';
import { getAnalysisCost, checkBalance } from '@/lib/ncs-credits';
import { runWithCredits } from '@/lib/analysis-credit-wrapper';
import { runMediationAnalysis, runModerationAnalysis } from '@/lib/webr-wrapper';
import { ChevronLeft, Play, Target, Shuffle, ArrowRight } from 'lucide-react';
import { useAnalysisError } from '@/hooks/useAnalysisError';
import { useWebRGuard } from '@/hooks/useWebRGuard';

interface MediationViewProps {
    step: AnalysisStep;
    data: any[];
    columns: string[];
    allColumns?: string[];
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

export const MediationView: React.FC<MediationViewProps> = ({
    step,
    data = [],
    columns = [],
    allColumns = [],
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
    const varsForFactors = allColumns.length > 0 ? allColumns : columns;
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [mediationVars, setMediationVars] = useState<{ x: string; m: string; y: string }>({ x: '', m: '', y: '' });
    const [moderationVars, setModerationVars] = useState<{ x: string; w: string; y: string }>({ x: '', w: '', y: '' });
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

    const SelectField = ({ id, label, value, onChange, options, disabledVars }: any) => (
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

    if (step === 'mediation-select') {
        const title = "Phân tích Trung gian (Mediation)";
        const subtitle = "Kiểm tra vai trò trung gian của M trong mối quan hệ giữa X và Y theo mô hình Baron & Kenny.";

        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ViewHeader title={title} subtitle={subtitle} icon={Target} />
                
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-8 space-y-8">
                    {/* Visual Model Preview */}
                    <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 border-dashed flex items-center justify-center gap-4 text-blue-900 font-bold">
                         <div className={`px-4 py-2 bg-white rounded shadow-sm border ${mediationVars.x ? 'border-blue-500' : 'border-slate-200 text-slate-300'}`}>{mediationVars.x || 'X'}</div>
                         <ArrowRight className="w-4 h-4 text-blue-300" />
                         <div className={`px-4 py-2 bg-blue-900 text-white rounded shadow shadow-blue-200 border-none ${mediationVars.m ? '' : 'bg-slate-200 text-slate-400'}`}>{mediationVars.m || 'M'}</div>
                         <ArrowRight className="w-4 h-4 text-blue-300" />
                         <div className={`px-4 py-2 bg-white rounded shadow-sm border ${mediationVars.y ? 'border-blue-500' : 'border-slate-200 text-slate-300'}`}>{mediationVars.y || 'Y'}</div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <SelectField 
                            label="Biến độc lập (Independent Variable X)" 
                            value={mediationVars.x} 
                            onChange={(e: any) => setMediationVars({ ...mediationVars, x: e.target.value })}
                            options={varsForFactors}
                            disabledVars={[mediationVars.m, mediationVars.y]}
                        />
                        <SelectField 
                            label="Biến trung gian (Mediator Variable M)" 
                            value={mediationVars.m} 
                            onChange={(e: any) => setMediationVars({ ...mediationVars, m: e.target.value })}
                            options={varsForFactors}
                            disabledVars={[mediationVars.x, mediationVars.y]}
                        />
                        <SelectField 
                            label="Biến phụ thuộc (Outcome Variable Y)" 
                            value={mediationVars.y} 
                            onChange={(e: any) => setMediationVars({ ...mediationVars, y: e.target.value })}
                            options={varsForFactors}
                            disabledVars={[mediationVars.x, mediationVars.m]}
                        />
                    </div>

                    <ActionButton 
                        disabled={isAnalyzing}
                        onClick={() => {
                            if (!mediationVars.x || !mediationVars.m || !mediationVars.y) return showToast('Vui lòng chọn đủ 3 biến X, M, Y', 'error');
                            const cols = [mediationVars.x, mediationVars.m, mediationVars.y];
                            handleAnalysisWrapper(
                                'mediation', 'regression',
                                () => runMediationAnalysis(data.map(row => cols.map(c => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[c]))) as number[][], cols, mediationVars.x, mediationVars.m, mediationVars.y),
                                cols, 'Phân tích Mediation hoàn tất!', `Mediation: ${mediationVars.x}->${mediationVars.m}->${mediationVars.y}`
                            );
                        }}
                    >
                        Chạy Mediation Analysis
                    </ActionButton>
                </div>

                <button type="button" onClick={() => setStep('analyze')} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                    <ChevronLeft className="w-3 h-3" /> Quay lại
                </button>
            </div>
        );
    }

    if (step === 'moderation-select') {
        const title = "Phân tích Điều tiết (Moderation)";
        const subtitle = "Kiểm tra xem biến W có làm thay đổi cường độ hoặc chiều hướng của mối quan hệ X → Y hay không.";

        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ViewHeader title={title} subtitle={subtitle} icon={Shuffle} />
                
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-8 space-y-8">
                    {/* Visual Model Preview */}
                    <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 border-dashed flex flex-col items-center gap-4 text-blue-900 font-bold relative">
                         <div className="absolute top-2 right-4 text-[9px] uppercase tracking-tighter opacity-30 italic">Interaction: X * W</div>
                         <div className="flex items-center gap-8">
                             <div className={`px-4 py-2 bg-white rounded shadow-sm border ${moderationVars.x ? 'border-blue-500' : 'border-slate-200 text-slate-300'}`}>{moderationVars.x || 'X'}</div>
                             <ArrowRight className="w-4 h-4 text-blue-300" />
                             <div className={`px-4 py-2 bg-white rounded shadow-sm border ${moderationVars.y ? 'border-blue-500' : 'border-slate-200 text-slate-300'}`}>{moderationVars.y || 'Y'}</div>
                         </div>
                         <div className="w-px h-6 bg-blue-300"></div>
                         <div className={`px-4 py-2 bg-blue-900 text-white rounded shadow shadow-blue-200 border-none ${moderationVars.w ? '' : 'bg-slate-200 text-slate-400'}`}>{moderationVars.w || 'W'}</div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <SelectField 
                            label="Biến dự báo (Predictor X)" 
                            value={moderationVars.x} 
                            onChange={(e: any) => setModerationVars({ ...moderationVars, x: e.target.value })}
                            options={varsForFactors}
                            disabledVars={[moderationVars.w, moderationVars.y]}
                        />
                        <SelectField 
                            label="Biến điều tiết (Moderator W)" 
                            value={moderationVars.w} 
                            onChange={(e: any) => setModerationVars({ ...moderationVars, w: e.target.value })}
                            options={varsForFactors}
                            disabledVars={[moderationVars.x, moderationVars.y]}
                        />
                        <SelectField 
                            label="Biến phụ thuộc (Dependent Y)" 
                            value={moderationVars.y} 
                            onChange={(e: any) => setModerationVars({ ...moderationVars, y: e.target.value })}
                            options={varsForFactors}
                            disabledVars={[moderationVars.x, moderationVars.w]}
                        />
                    </div>

                    <ActionButton 
                        disabled={isAnalyzing}
                        onClick={() => {
                            if (!moderationVars.x || !moderationVars.w || !moderationVars.y) return showToast('Vui lòng chọn đủ 3 biến X, W, Y', 'error');
                            const cols = [moderationVars.y, moderationVars.x, moderationVars.w];
                            handleAnalysisWrapper(
                                'moderation', 'regression',
                                () => runModerationAnalysis(data.map(row => cols.map(c => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[c]))) as number[][], cols, moderationVars.x, moderationVars.w, moderationVars.y),
                                cols, 'Phân tích Moderation hoàn tất!', `Moderation: ${moderationVars.y} ~ ${moderationVars.x} * ${moderationVars.w}`
                            );
                        }}
                    >
                        Chạy Moderation Analysis
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
