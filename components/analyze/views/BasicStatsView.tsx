'use client';

import React, { useState } from 'react';
import { Locale, t } from '@/lib/i18n';
import {
    runDescriptiveStats, runTTestIndependent, runTTestPaired, runOneWayANOVA,
    runChiSquare, runMannWhitneyU, runKruskalWallis, runWilcoxonSignedRank
} from '@/lib/webr-wrapper';
import { getAnalysisCost, checkBalance, deductCreditsAtomic } from '@/lib/ncs-credits';
import { logAnalysisUsage } from '@/lib/activity-logger';
import type { DataProfile } from '@/lib/data-profiler';
import { Check, ChevronLeft, Play, BarChart2, Users, Database, AlertCircle } from 'lucide-react';
import { useAnalysisError } from '@/hooks/useAnalysisError';
import { useWebRGuard } from '@/hooks/useWebRGuard';

interface BasicStatsViewProps {
    step: string;
    data: any[];
    columns: string[];
    allColumns: string[];
    profile: DataProfile | null;
    user: any;
    setResults: (results: any) => void;
    setStep: (step: any) => void;
    setNcsBalance: React.Dispatch<React.SetStateAction<number>>;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    setAnalysisType: (type: string) => void;
    setRequiredCredits: (credits: number) => void;
    setCurrentAnalysisCost: (cost: number) => void;
    setShowInsufficientCredits: (show: boolean) => void;
    locale: Locale;
}

const ViewHeader = ({ title, subtitle, icon: Icon }: { title: string, subtitle: string, icon: any }) => (
    <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 shadow-sm">
            <Icon className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-black text-blue-900 tracking-tight uppercase">{title}</h2>
        <p className="text-sm text-slate-500 mt-2 font-medium max-w-md">{subtitle}</p>
    </div>
);

const AssumptionWarning = ({ isParametric }: { isParametric: boolean }) => {
    if (!isParametric) return null;
    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-900">
                <p className="font-bold mb-1">Cảnh báo Tiền đề (Assumption Check)</p>
                <p className="opacity-90 text-[13px] leading-relaxed">
                    Các kiểm định tham số yêu cầu dữ liệu có <b>Phân phối chuẩn (Normality)</b> và <b>Đồng nhất phương sai (Homogeneity of Variance)</b>. Nếu dữ liệu vi phạm, hãy cân nhắc sử dụng phiên bản Phi tham số (Non-parametric) như Mann-Whitney hoặc Kruskal-Wallis.
                </p>
            </div>
        </div>
    );
};

// Shared Checkbox Group
const CheckboxGroup = ({ items, name }: { items: string[], name: string }) => {
    const [selected, setSelected] = useState<string[]>([]);
    return (
    <div className="space-y-4">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Select Variables ({selected.length} selected)</span>
            <div className="flex gap-4">
                <button type="button" onClick={() => setSelected(items)} className="text-blue-600 hover:text-blue-800 transition-colors">Select All</button>
                <button type="button" onClick={() => setSelected([])} className="text-slate-400 hover:text-slate-600 transition-colors">Clear</button>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-4 bg-slate-50/50 rounded-xl border border-blue-50 border-dashed">
            {items.map(item => (
                <label key={item} className="flex items-center gap-3 p-3 bg-white border border-blue-50 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group cursor-pointer">
                    <input 
                        type="checkbox" 
                        name={name} 
                        value={item} 
                        checked={selected.includes(item)}
                        onChange={(e) => {
                            if (e.target.checked) setSelected(prev => [...prev, item]);
                            else setSelected(prev => prev.filter(i => i !== item));
                        }}
                        className="w-5 h-5 rounded border-blue-100 text-blue-900 focus:ring-blue-900 cursor-pointer" 
                    />
                    <span className="text-sm font-bold text-blue-900 uppercase tracking-tighter truncate group-hover:text-blue-700">{item}</span>
                </label>
            ))}
        </div>
    </div>
    );
};

// Shared Select Component
const SelectField = ({ id, label, options }: { id: string, label: string, options: string[] }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">{label}</label>
        <select
            id={id}
            className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl text-blue-900 font-bold text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all outline-none shadow-sm cursor-pointer hover:border-blue-300"
            defaultValue=""
        >
            <option value="" className="text-slate-400 font-normal">-- Select variable --</option>
            {options.map(opt => <option key={opt} value={opt} className="font-bold">{opt}</option>)}
        </select>
    </div>
);

export function BasicStatsView({
    step,
    data = [],
    columns = [],
    allColumns,
    profile,
    user,
    setResults,
    setStep,
    setNcsBalance,
    showToast,
    setAnalysisType,
    setRequiredCredits,
    setCurrentAnalysisCost,
    setShowInsufficientCredits,
    locale
}: BasicStatsViewProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const handleAnalysisError = useAnalysisError(showToast);
    const checkWebRReady = useWebRGuard(showToast);

    const handleAnalysisWrapper = async (
        analysisKey: string,
        costKey: string,
        action: () => Promise<unknown>,
        colsToSave: string[],
        successMsg: string,
        logDesc: string
    ) => {
        // Block if WebR is still loading packages
        if (!checkWebRReady()) return;

        setIsAnalyzing(true);
        setAnalysisType(analysisKey);

        let cost = 0;
        let creditDeducted = false;

        if (user) {
            cost = await getAnalysisCost(costKey);
            const { hasEnough } = await checkBalance(user.id, cost);
            if (!hasEnough) {
                setRequiredCredits(cost);
                setCurrentAnalysisCost(cost);
                setShowInsufficientCredits(true);
                setIsAnalyzing(false);
                return;
            }
            // Deduct BEFORE running analysis — atomic via RPC
            if (cost > 0) {
                const { success, isExempt, newBalance, error: deductError } = await deductCreditsAtomic(user.id, cost, logDesc);
                if (!success) {
                    showToast(deductError || 'Không đủ NCS để thực hiện phân tích', 'error');
                    setIsAnalyzing(false);
                    return;
                }
                creditDeducted = true;
                if (!isExempt) setNcsBalance(newBalance);
            }
        }

        try {
            const result = await action();

            // Credits already deducted — just log usage
            if (user && cost > 0) {
                await logAnalysisUsage(user.id, analysisKey, cost);
            }

            setResults({ type: analysisKey, data: result, columns: colsToSave });
            setStep('results');
            showToast(successMsg, 'success');
        } catch (err: any) {
            // In demo mode (no Supabase), skip refund logic entirely
            showToast(`${t(locale, 'error')}: ` + (err instanceof Error ? err.message : String(err)), 'error');
            handleAnalysisError(err);
        } finally {
            setIsAnalyzing(false);
        }
    };



    // Primary Action Button
    const ActionButton = ({ onClick, disabled, icon: Icon, children, variant = 'blue' }: any) => (
        <button type="button"
            data-testid="run-analysis"
            onClick={onClick}
            disabled={disabled}
            className={`w-full py-4 px-6 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg shadow-blue-100/50 
                ${variant === 'blue' ? 'bg-blue-900 text-white hover:bg-blue-950' : 'bg-slate-200 text-slate-600 hover:bg-slate-300 shadow-none'}
                disabled:opacity-50 disabled:transform-none`}
        >
            {isAnalyzing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (Icon && <Icon className="w-5 h-5" />)}
            {children}
        </button>
    );

    if (step === 'descriptive-select') {
        const title = t(locale, 'analyze.methods.descriptive');
        const subtitle = locale === 'vi' ? 'Thống kê cơ bản (Mean, SD, Min, Max, Median) cho một hoặc nhiều biến số.' : 'Basic statistics for one or more numerical variables.';

        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ViewHeader title={title} subtitle={subtitle} icon={BarChart2} />
                
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-8 space-y-8">
                    <CheckboxGroup items={columns} name="desc-col" />

                    <ActionButton 
                        icon={Play}
                        disabled={isAnalyzing}
                        onClick={() => {
                            console.log('DEBUG: Run Descriptive Statistics button clicked!');
                            const selectedCols = Array.from(document.querySelectorAll('input[name="desc-col"]:checked')).map(cb => (cb as HTMLInputElement).value);
                            console.log('DEBUG: selectedCols:', selectedCols);
                            if (selectedCols.length === 0) return showToast('Vui lòng chọn ít nhất 1 biến', 'error');
                            handleAnalysisWrapper(
                                'descriptive', 'descriptive',
                                () => runDescriptiveStats(data.map(row => selectedCols.map(col => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[col]))) as number[][]),
                                selectedCols, 'Phân tích hoàn tất!', `Descriptive Stats: ${selectedCols.length} variables`
                            );
                        }}
                    >
                        {isAnalyzing ? 'Processing...' : 'Run Descriptive Statistics'}
                    </ActionButton>
                </div>
                
                <button type="button" 
                    onClick={() => setStep('analyze')} 
                    className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                    <ChevronLeft className="w-3 h-3" /> Back to methods
                </button>
            </div>
        );
    }

    if (step === 'ttest-select' || step === 'ttest-paired-select' || step === 'wilcoxon-select') {
        const isPaired = step === 'ttest-paired-select' || step === 'wilcoxon-select';
        const isNonParam = step === 'wilcoxon-select';
        
        let title = "Independent Samples T-Test";
        let subtitle = "So sánh trung bình giữa 2 nhóm độc lập.";
        let icon = Users;

        if (step === 'ttest-paired-select') {
            title = "Paired Samples T-Test";
            subtitle = "So sánh trước-sau trên cùng một nhóm đối tượng.";
        } else if (step === 'wilcoxon-select') {
            title = "Wilcoxon Signed Rank Test";
            subtitle = "Kiểm định phi tham số so sánh cặp (Trước-Sau).";
        }

        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ViewHeader title={title} subtitle={subtitle} icon={icon} />
                
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-8 space-y-6">
                    <AssumptionWarning isParametric={!isNonParam} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectField id="compare-1" label={isPaired ? "Before variable" : "Group A (DV)"} options={columns} />
                        <SelectField id="compare-2" label={isPaired ? "After variable" : "Group B (DV)"} options={columns} />
                    </div>

                    <ActionButton 
                        icon={Play}
                        disabled={isAnalyzing}
                        onClick={() => {
                            const v1 = (document.getElementById('compare-1') as HTMLSelectElement).value;
                            const v2 = (document.getElementById('compare-2') as HTMLSelectElement).value;
                            if (!v1 || !v2) return showToast('Vui lòng chọn cả 2 biến', 'error');
                            if (v1 === v2) return showToast('Vui lòng chọn 2 biến khác nhau', 'error');
                            
                            if (step === 'ttest-select') {
                                handleAnalysisWrapper(
                                    'ttest-indep', 'ttest-indep',
                                    () => runTTestIndependent(data.map(row => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[v1])) as number[], data.map(row => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[v2])) as number[]),
                                    [v1, v2], 'Phân tích hoàn tất!', `T-Test Indep: ${v1} vs ${v2}`
                                );
                            } else if (step === 'ttest-paired-select') {
                                handleAnalysisWrapper(
                                    'ttest-paired', 'ttest-paired',
                                    () => runTTestPaired(data.map(row => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[v1])) as number[], data.map(row => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[v2])) as number[]),
                                    [v1, v2], 'Phân tích hoàn tất!', `T-Test Paired: ${v1} vs ${v2}`
                                );
                            } else {
                                handleAnalysisWrapper(
                                    'wilcoxon', 'wilcoxon',
                                    () => runWilcoxonSignedRank(data.map(row => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[v1])) as number[], data.map(row => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[v2])) as number[]),
                                    [v1, v2], 'Phân tích hoàn tất!', `Wilcoxon: ${v1} vs ${v2}`
                                );
                            }
                        }}
                    >
                        {isAnalyzing ? 'Analyzing...' : `Run ${title}`}
                    </ActionButton>
                </div>
                
                <button type="button" 
                    onClick={() => setStep('analyze')} 
                    className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                    <ChevronLeft className="w-3 h-3" /> Back to methods
                </button>
            </div>
        );
    }

    if (step === 'anova-select' || step === 'kruskalwallis-select') {
        const isNonParam = step === 'kruskalwallis-select';
        const title = isNonParam ? "Kruskal-Wallis H Test" : "One-Way ANOVA";
        const subtitle = isNonParam ? "Kiểm định phi tham số so sánh trung vị giữa nhiều nhóm (≥ 3)." : "So sánh trung bình giữa nhiều nhóm độc lập (≥ 3).";

        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ViewHeader title={title} subtitle={subtitle} icon={Database} />
                
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-8 space-y-6">
                    <AssumptionWarning isParametric={!isNonParam} />
                    <CheckboxGroup items={columns} name="anova-col" />

                    <ActionButton 
                        icon={Play}
                        disabled={isAnalyzing}
                        onClick={() => {
                            const selectedCols = Array.from(document.querySelectorAll('input[name="anova-col"]:checked')).map(cb => (cb as HTMLInputElement).value);
                            if (selectedCols.length < 3) return showToast('Cần ít nhất 3 biến để so sánh', 'error');
                            
                            if (isNonParam) {
                                handleAnalysisWrapper(
                                    'kruskal-wallis', 'kruskal-wallis',
                                    () => runKruskalWallis(selectedCols.map(col => data.map(row => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[col]))) as number[][]),
                                    selectedCols, 'Phân tích hoàn tất!', `Kruskal-Wallis: ${selectedCols.length} groups`
                                );
                            } else {
                                handleAnalysisWrapper(
                                    'anova', 'anova',
                                    () => runOneWayANOVA(selectedCols.map(col => data.map(row => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[col]))) as number[][]),
                                    selectedCols, 'Phân tích hoàn tất!', `ANOVA: ${selectedCols.length} groups`
                                );
                            }
                        }}
                    >
                        {isAnalyzing ? 'Processing...' : `Run ${title}`}
                    </ActionButton>
                </div>
                
                <button type="button" 
                    onClick={() => setStep('analyze')} 
                    className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                    <ChevronLeft className="w-3 h-3" /> Back to methods
                </button>
            </div>
        );
    }

    if (step === 'chisq-select' || step === 'fisher-select') {
        const isFisher = step === 'fisher-select';
        const title = isFisher ? "Fisher's Exact Test" : "Chi-Square Independence Test";
        const subtitle = "Kiểm định mối liên hệ giữa hai biến định tính (Categorical).";

        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ViewHeader title={title} subtitle={subtitle} icon={Database} />
                
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectField id="cate-1" label="Variable A (Row)" options={allColumns} />
                        <SelectField id="cate-2" label="Variable B (Col)" options={allColumns} />
                    </div>

                    <ActionButton 
                        icon={Play}
                        disabled={isAnalyzing}
                        onClick={() => {
                            const v1 = (document.getElementById('cate-1') as HTMLSelectElement).value;
                            const v2 = (document.getElementById('cate-2') as HTMLSelectElement).value;
                            if (!v1 || !v2) return showToast('Vui lòng chọn cả 2 biến', 'error');
                            if (v1 === v2) return showToast('Vui lòng chọn 2 biến khác nhau', 'error');
                            
                            handleAnalysisWrapper(
                                'chisquare', 'chisquare',
                                () => runChiSquare(data.map(row => [row[v1], row[v2]])),
                                [v1, v2], 'Phân tích hoàn tất!', `${isFisher ? 'Fisher' : 'Chi-Square'}: ${v1} vs ${v2}`
                            );
                        }}
                    >
                        {isAnalyzing ? 'Analyzing...' : `Run ${title}`}
                    </ActionButton>
                </div>
                
                <button type="button" 
                    onClick={() => setStep('analyze')} 
                    className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                    <ChevronLeft className="w-3 h-3" /> Back to methods
                </button>
            </div>
        );
    }

    if (step === 'mannwhitney-select') {
        const title = "Mann-Whitney U Test";
        const subtitle = "Kiểm định phi tham số so sánh trung vị giữa 2 nhóm độc lập.";

        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ViewHeader title={title} subtitle={subtitle} icon={Users} />
                
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectField id="mw-1" label="Group A (Ordinal/Scale)" options={columns} />
                        <SelectField id="mw-2" label="Group B (Ordinal/Scale)" options={columns} />
                    </div>

                    <ActionButton 
                        icon={Play}
                        disabled={isAnalyzing}
                        onClick={() => {
                            const v1 = (document.getElementById('mw-1') as HTMLSelectElement).value;
                            const v2 = (document.getElementById('mw-2') as HTMLSelectElement).value;
                            if (!v1 || !v2) return showToast('Vui lòng chọn cả 2 biến', 'error');
                            if (v1 === v2) return showToast('Vui lòng chọn 2 biến khác nhau', 'error');
                            
                            handleAnalysisWrapper(
                                'mann-whitney', 'mann-whitney',
                                () => runMannWhitneyU(data.map(row => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[v1])) as number[], data.map(row => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[v2])) as number[]),
                                [v1, v2], 'Phân tích hoàn tất!', `Mann-Whitney U: ${v1} vs ${v2}`
                            );
                        }}
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Run Mann-Whitney U'}
                    </ActionButton>
                </div>
                
                <button type="button" 
                    onClick={() => setStep('analyze')} 
                    className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                    <ChevronLeft className="w-3 h-3" /> Back to methods
                </button>
            </div>
        );
    }

    if (step === 'frequency-select') {
        const title = locale === 'vi' ? "Thống kê nhân khẩu học" : "Demographic Frequencies";
        const subtitle = locale === 'vi' ? "Tính toán số lượng và tỷ lệ % cho các biến định tính." : "Counts and percentages for categorical variables.";

        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ViewHeader title={title} subtitle={subtitle} icon={Users} />
                
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-8 space-y-8">
                    <CheckboxGroup items={allColumns} name="freq-col" />

                    <ActionButton 
                        icon={Play}
                        disabled={isAnalyzing}
                        onClick={() => {
                            const selectedCols = Array.from(document.querySelectorAll('input[name="freq-col"]:checked')).map(cb => (cb as HTMLInputElement).value);
                            if (selectedCols.length === 0) return showToast('Vui lòng chọn ít nhất 1 biến', 'error');
                            
                            setIsAnalyzing(true);
                            setTimeout(() => {
                                const results: any = {};
                                selectedCols.forEach(col => {
                                    const counts: Record<string, number> = {};
                                    let total = 0;
                                    data.forEach(row => {
                                        const val = String(row[col] ?? '').trim();
                                        if (val !== '') {
                                            counts[val] = (counts[val] || 0) + 1;
                                            total++;
                                        }
                                    });
                                    const sortedCounts: Record<string, number> = {};
                                    Object.keys(counts).sort().forEach(k => sortedCounts[k] = counts[k]);
                                    results[col] = { counts: sortedCounts, total };
                                });
                                setResults({ type: 'frequency', data: results, columns: selectedCols });
                                setAnalysisType('frequency');
                                setStep('results');
                                showToast('Phân tích hoàn tất!', 'success');
                                setIsAnalyzing(false);
                            }, 300);
                        }}
                    >
                        {isAnalyzing ? 'Processing...' : 'Run Frequencies'}
                    </ActionButton>
                </div>
                
                <button type="button" 
                    onClick={() => setStep('analyze')} 
                    className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                    <ChevronLeft className="w-3 h-3" /> Back to methods
                </button>
            </div>
        );
    }

    return null;
}
