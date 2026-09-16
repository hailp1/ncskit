'use client';

import React, { useState } from 'react';
import { AnalysisStep } from '@/types/analysis';
import { Locale, t } from '@/lib/i18n';
import { getAnalysisCost, checkBalance, deductCreditsAtomic } from '@/lib/ncs-credits';
import { logAnalysisUsage } from '@/lib/activity-logger';
import { runCronbachAlpha, runEFA, runCFA, runSEM, runPLSSEM, runBootstrapping, runBlindfolding } from '@/lib/webr-wrapper';
import { SmartGroupSelector } from '@/components/VariableSelector';
import CFASelection from '@/components/CFASelection';
import SEMSelection from '@/components/SEMSelection';
import PLSSEMSelection from '@/components/PLSSEMSelection';
import { ChevronLeft, Play, Shield, Grid3x3, Network, Layers } from 'lucide-react';
import { useAnalysisError } from '@/hooks/useAnalysisError';
import { useWebRGuard } from '@/hooks/useWebRGuard';

interface ReliabilityViewProps {
    step: AnalysisStep;
    data: any[];
    columns: string[];
    allColumns?: string[];
    user: any;
    setResults: (results: any) => void;
    setStep: (step: AnalysisStep) => void;
    setNcsBalance: React.Dispatch<React.SetStateAction<number>>;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    setScaleName: (name: string) => void;
    setMultipleResults: (results: any[]) => void;
    setAnalysisType: (type: string) => void;
    setRequiredCredits: (amount: number) => void;
    setCurrentAnalysisCost: (amount: number) => void;
    setShowInsufficientCredits: (show: boolean) => void;
    locale: Locale;
}

export const ReliabilityView: React.FC<ReliabilityViewProps> = ({
    step,
    data = [],
    columns = [],
    user,
    setResults,
    setStep: setParentStep,
    setNcsBalance,
    showToast,
    setScaleName,
    setMultipleResults,
    setAnalysisType,
    setRequiredCredits,
    setCurrentAnalysisCost,
    setShowInsufficientCredits,
    locale
}) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const handleAnalysisError = useAnalysisError(showToast);
    const checkWebRReady = useWebRGuard(showToast);

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

    // --- Logic for Cronbach/Omega ---

    const runCronbachWithSelection = async (selectedColumns: string[], name: string) => {
        if (selectedColumns.length < 2) {
            showToast('Thang đo cần ít nhất 2 biến cho phân tích độ tin cậy', 'error');
            return;
        }
        if (!checkWebRReady()) return;

        const isOmega = step === 'omega-select';
        const analysisMethod = isOmega ? 'omega' : 'cronbach';

        if (user) {
            const cost = await getAnalysisCost('cronbach');
            const { hasEnough } = await checkBalance(user.id, cost);
            if (!hasEnough) {
                setRequiredCredits(cost);
                setCurrentAnalysisCost(cost);
                setShowInsufficientCredits(true);
                return;
            }
        }

        setIsAnalyzing(true);
        setAnalysisType(analysisMethod);
        setScaleName(name);
        setMultipleResults([]);

        try {
            const selectedData = data.map(row => selectedColumns.map(col => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(typeof v === 'string' ? v.replace(',', '.') : v)) ? null : Number(typeof v === 'string' ? v.replace(',', '.') : v))))(row[col])));

            // Deduct BEFORE running — atomic via RPC (prevents race conditions)
            if (user) {
                const cost = await getAnalysisCost('cronbach');
                const { success, isExempt, newBalance, error: deductError } = await deductCreditsAtomic(user.id, cost, `${isOmega ? 'McDonald Omega' : 'Cronbach Alpha'}: ${name}`);
                if (!success) {
                    showToast(deductError || 'Không đủ NCS để thực hiện phân tích', 'error');
                    setIsAnalyzing(false);
                    return;
                }
                if (!isExempt) setNcsBalance(newBalance);
            }

            const analysisResults = await runCronbachAlpha(selectedData as number[][]);

            if (user) {
                const cost = await getAnalysisCost('cronbach');
                await logAnalysisUsage(user.id, analysisMethod, cost);
            }

            setResults({ type: analysisMethod, data: analysisResults, columns: selectedColumns, scaleName: name });
            setParentStep('results');
            showToast('Phân tích hoàn tất!', 'success');
        } catch (error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const runCronbachBatch = async (groups: { name: string; columns: string[] }[]) => {
        if (!checkWebRReady()) return;
        
        const isOmega = step === 'omega-select';
        const batchMethod = isOmega ? 'omega-batch' : 'cronbach-batch';

        if (user) {
            const singleCost = await getAnalysisCost('cronbach');
            const totalCost = singleCost * groups.length;
            const { hasEnough } = await checkBalance(user.id, totalCost);
            if (!hasEnough) {
                setRequiredCredits(totalCost);
                setCurrentAnalysisCost(totalCost);
                setShowInsufficientCredits(true);
                return;
            }
        }

        setIsAnalyzing(true);
        setAnalysisType(batchMethod);
        setResults(null);
        setMultipleResults([]);

        try {
            // Deduct BEFORE running batch — atomic via RPC
            if (user) {
                const singleCost = await getAnalysisCost('cronbach');
                const totalCost = singleCost * groups.length;
                const { success, isExempt, newBalance, error: deductError } = await deductCreditsAtomic(user.id, totalCost, `Batch ${isOmega ? 'Omega' : 'Cronbach'}: ${groups.length} scales`);
                if (!success) {
                    showToast(deductError || 'Không đủ NCS để thực hiện phân tích', 'error');
                    setIsAnalyzing(false);
                    return;
                }
                if (!isExempt) setNcsBalance(newBalance);
            }

            const allResults = [];
            for (const group of groups) {
                // Detect if data rows are objects (PapaParse header:true) or arrays
                const sampleRow = data[0];
                const isObjectRow = sampleRow && !Array.isArray(sampleRow) && typeof sampleRow === 'object';
                
                // DEBUG: Log to diagnose data structure mismatch
                const dataKeys = isObjectRow ? Object.keys(sampleRow).slice(0, 8) : [];
                console.log('[DEBUG-RELIABILITY] Group:', group.name, 'Columns:', group.columns);
                console.log('[DEBUG-RELIABILITY] isObjectRow:', isObjectRow, 'dataKeys:', dataKeys);
                if (isObjectRow) {
                    console.log('[DEBUG-RELIABILITY] row[col] test:', group.columns.map(c => `${c}=${JSON.stringify(sampleRow[c])}`));
                }

                const groupData = data.map(row => group.columns.map(col => {
                    // Try object key access first, then try trimmed key
                    let v = isObjectRow ? row[col] : undefined;
                    
                    // Fallback: try trimmed/case-insensitive match if direct access fails
                    if (v === undefined && isObjectRow) {
                        const rowKeys = Object.keys(row);
                        const matchKey = rowKeys.find(k => k.trim() === col.trim() || k.trim().toLowerCase() === col.trim().toLowerCase());
                        if (matchKey) v = row[matchKey];
                    }
                    
                    if (v === null || v === undefined || v === '' || v === 'NA') return null;
                    const strVal = typeof v === 'string' ? v.replace(',', '.') : v;
                    const num = Number(strVal);
                    return isNaN(num) ? null : num;
                }));
                
                // Early abort with diagnostic info if ALL data is null
                const nonNullCount = groupData.flat().filter(v => v !== null).length;
                if (nonNullCount === 0) {
                    const diagKeys = isObjectRow ? Object.keys(sampleRow).join(', ') : `array[${(sampleRow as any)?.length}]`;
                    const diagCols = group.columns.join(', ');
                    const testVals = isObjectRow ? group.columns.map(c => `${c}→${JSON.stringify(sampleRow[c])}`).join('; ') : 'N/A';
                    throw new Error(
                        `Dữ liệu nhóm "${group.name}" trích xuất toàn null (0/${groupData.length * group.columns.length} ô hợp lệ). ` +
                        `Data keys: [${diagKeys}]. Columns cần: [${diagCols}]. Test: [${testVals}]`
                    );
                }

                const result = await runCronbachAlpha(groupData as number[][]);
                allResults.push({ scaleName: group.name, columns: group.columns, data: result, type: isOmega ? 'omega' : 'cronbach' });
            }

            if (user) {
                const singleCost = await getAnalysisCost('cronbach');
                const totalCost = singleCost * groups.length;
                await logAnalysisUsage(user.id, batchMethod, totalCost);
            }

            setMultipleResults(allResults);
            setParentStep('results');
            showToast(`Phân tích ${allResults.length} thang đo hoàn thành!`, 'success');
        } catch (error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const runOmegaWithSelection = async (selectedColumns: string[], name: string) => {
        if (selectedColumns.length < 3) {
            showToast('McDonald\'s Omega cần ít nhất 3 biến', 'error');
            return;
        }
        if (!checkWebRReady()) return;

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
        setAnalysisType('omega');
        setScaleName(name);
        setMultipleResults([]);

        try {
            const selectedData = data.map(row => selectedColumns.map(col => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(typeof v === 'string' ? v.replace(',', '.') : v)) ? null : Number(typeof v === 'string' ? v.replace(',', '.') : v))))(row[col])));

            // Deduct BEFORE running — atomic via RPC
            if (user) {
                const cost = await getAnalysisCost('omega');
                const { success, isExempt, newBalance, error: deductError } = await deductCreditsAtomic(user.id, cost, `McDonald's Omega: ${name}`);
                if (!success) {
                    showToast(deductError || 'Không đủ NCS để thực hiện phân tích', 'error');
                    setIsAnalyzing(false);
                    return;
                }
                if (!isExempt) setNcsBalance(newBalance);
            }

            const analysisResults = await runCronbachAlpha(selectedData as number[][]); // Note: Should be runOmega in future, matching current behavior for now

            if (user) {
                const cost = await getAnalysisCost('omega');
                await logAnalysisUsage(user.id, 'omega', cost);
            }

            setResults({ type: 'omega', data: analysisResults, columns: selectedColumns, scaleName: name });
            setParentStep('results');
            showToast('Phân tích Omega hoàn thành!', 'success');
        } catch (error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const runPLSWithSelection = async (measurementModel: any[], structuralModel: any[], options: any) => {
        if (!checkWebRReady()) return;
        setIsAnalyzing(true);
        setAnalysisType('pls-sem');

        try {
            const numericData = data.map(row => columns.map(col => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[col])));
            
            // 1. Initial PLS-SEM
            let results = await runPLSSEM(numericData as number[][], measurementModel, structuralModel);
            
            // 2. Optional Bootstrap
            if (options.useBootstrap) {
                showToast('Đang chạy Bootstrapping (500 samples)...', 'info');
                const bootResults = await runBootstrapping(numericData as number[][], measurementModel, structuralModel, 500);
                results.bootstrapping = {
                    boot_paths: bootResults.boot_paths,
                    boot_loadings: bootResults.boot_loadings,
                    n_bootstrap: 500
                };
            }
            
            // 3. Optional Blindfolding
            if (options.useBlindfolding) {
                showToast('Đang tính toán Q² (Blindfolding)...', 'info');
                const blindResults = await runBlindfolding(numericData as number[][], measurementModel, structuralModel);
                (results as any).q2 = blindResults.q2;
            }

            if (user) {
                const cost = await getAnalysisCost('sem');
                await logAnalysisUsage(user.id, 'pls-sem', cost);
            }

            setResults({ type: 'pls-sem', data: results, columns: columns });
            setParentStep('results');
            showToast('Phân tích PLS-SEM hoàn tất!', 'success');
        } catch (error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- Render ---

    if (step === 'cronbach-select') {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ViewHeader title="Cronbach's Alpha (α)" subtitle="Phân tích độ tin cậy nhất quán nội tại của thang đo. Hệ thống hỗ trợ tự động nhận diện và gom nhóm biến." icon={Shield} />
                
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-2 md:p-6 overflow-hidden">
                    <SmartGroupSelector
                        columns={columns}
                        onAnalyzeGroup={runCronbachWithSelection}
                        onAnalyzeAllGroups={runCronbachBatch}
                        isAnalyzing={isAnalyzing}
                    />
                </div>

                <button type="button" onClick={() => setParentStep('analyze')} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                    <ChevronLeft className="w-3 h-3" /> Quay lại chọn phương pháp
                </button>
            </div>
        );
    }

    if (step === 'omega-select') {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ViewHeader title="McDonald's Omega (ω)" subtitle="Đánh giá độ tin cậy hiện đại, chính xác hơn Cronbach Alpha khi các giả định về sự tuân thủ đơn chiều bị vi phạm." icon={Shield} />

                {/* ⚠️ STUB WARNING — McDonald's Omega not yet fully implemented */}
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 font-black text-lg">⚠️</div>
                    <div>
                        <p className="font-black text-amber-900 text-sm mb-1">Tính năng đang phát triển — Coming Soon</p>
                        <p className="text-amber-800 text-xs font-medium leading-relaxed">
                            McDonald's Omega (ω) yêu cầu thư viện <code className="bg-amber-100 px-1 rounded">psych::omega()</code> hiện chưa tương thích với WebAssembly.
                            Kết quả hiển thị bên dưới là <strong>Cronbach Alpha (α)</strong> — không phải Omega thực.
                            Hãy dùng <strong>Cronbach Alpha</strong> thay thế cho đến khi tính năng này hoàn thiện.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-2 md:p-6 overflow-hidden">
                    <h3 className="text-[10px] font-black uppercase text-blue-900 mb-4 px-2 flex items-center">
                        {isAnalyzing ? 'Processing...' : 'McDonald\'s Omega Reliability'}
                        <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded ml-2 font-black">V1.2-OMEGA</span>
                    </h3>
                    <SmartGroupSelector
                        columns={columns}
                        onAnalyzeGroup={runOmegaWithSelection}
                        onAnalyzeAllGroups={async (groups) => {
                             setIsAnalyzing(true);
                             try {
                                 const allResults = [];
                                 for (const group of groups) {
                                     const result = await runCronbachAlpha(data.map(row => group.columns.map(col => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(typeof v === 'string' ? v.replace(',', '.') : v)) ? null : Number(typeof v === 'string' ? v.replace(',', '.') : v))))(row[col]))) as number[][]);
                                     allResults.push({ scaleName: group.name, columns: group.columns, data: result, type: 'omega' });
                                 }
                                 setMultipleResults(allResults);
                                 setAnalysisType('omega-batch');
                                 setParentStep('results');
                             } catch (e) { handleAnalysisError(e); }
                             finally { setIsAnalyzing(false); }
                        }}
                        isAnalyzing={isAnalyzing}
                        minItemsPerGroup={3}
                        analysisLabel="McDonald's Omega"
                    />
                </div>

                <button type="button" onClick={() => setParentStep('analyze')} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                    <ChevronLeft className="w-3 h-3" /> Quay lại chọn phương pháp
                </button>
            </div>
        );
    }

    if (step === 'efa-select') {
        return (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ViewHeader title="Exploratory Factor Analysis (EFA)" subtitle="Phân tích nhân tố khám phá nhằm rút gọn dữ liệu và xác định cấu trúc các nhân tố tiềm ẩn." icon={Grid3x3} />
                
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-8 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {/* Selector Column */}
                       <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Chọn biến quan sát (indicators)</label>
                            <div className="space-y-4">
                                <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest">
                                    <button type="button" onClick={() => document.querySelectorAll('.efa-checkbox').forEach((cb: any) => cb.checked = true)} className="text-blue-600">Select All</button>
                                    <button type="button" onClick={() => document.querySelectorAll('.efa-checkbox').forEach((cb: any) => cb.checked = false)} className="text-slate-400">Clear</button>
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto p-4 bg-slate-50/50 rounded-xl border border-blue-50 border-dashed">
                                    {columns.map(col => (
                                        <label key={col} className="flex items-center gap-3 p-3 bg-white border border-blue-50 rounded-xl hover:border-blue-300 transition-all cursor-pointer group">
                                            <input type="checkbox" value={col} defaultChecked className="efa-checkbox w-5 h-5 rounded border-blue-100 text-blue-900 focus:ring-blue-900" />
                                            <span className="text-sm font-bold text-blue-900 uppercase tracking-tighter truncate group-hover:text-blue-700">{col}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                       </div>

                       {/* Settings Column */}
                       <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Số nhân tố (Factors)</label>
                                <input id="efa-nfactors" type="number" placeholder="Tự động (Eigenvalue > 1)" className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl text-blue-900 font-bold text-sm focus:ring-2 focus:ring-blue-900 outline-none shadow-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Phép quay (Rotation)</label>
                                <select id="efa-rotation" defaultValue="varimax" className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl text-blue-900 font-bold text-sm focus:ring-2 focus:ring-blue-900 outline-none shadow-sm cursor-pointer">
                                    <option value="none">Không quay (None)</option>
                                    <option value="varimax">Vuông góc (Varimax)</option>
                                    <option value="promax">Xiên (Promax)</option>
                                </select>
                            </div>
                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-[10px] text-blue-800 leading-relaxed font-medium italic">
                                * Gợi ý: Dùng Varimax nếu các nhân tố được kỳ vọng là độc lập. Dùng Promax nếu có tương quan giữa các nhân tố.
                            </div>
                       </div>
                   </div>

                    <ActionButton 
                        disabled={isAnalyzing}
                        onClick={async () => {
                             const selectedCols = Array.from(document.querySelectorAll('.efa-checkbox:checked')).map((cb: any) => cb.value);
                             const nfactors = (document.getElementById('efa-nfactors') as HTMLInputElement).value ? parseInt((document.getElementById('efa-nfactors') as HTMLInputElement).value) : 0;
                             const rotation = (document.getElementById('efa-rotation') as HTMLSelectElement).value;

                             if (selectedCols.length < 3) return showToast('Chọn ít nhất 3 biến', 'error');

                             setIsAnalyzing(true);
                             setAnalysisType('efa');
                             try {
                                 const res = await runEFA(data.map(row => selectedCols.map(c => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[c]))) as number[][], nfactors, rotation);
                                 setResults({ type: 'efa', data: res, columns: selectedCols });
                                 setParentStep('results');
                                 showToast('EFA hoàn tất!', 'success');
                             } catch (e) { handleAnalysisError(e); }
                             finally { setIsAnalyzing(false); }
                        }}
                    >
                        Chạy phân tích EFA
                    </ActionButton>
                </div>

                <button type="button" onClick={() => setParentStep('analyze')} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                    <ChevronLeft className="w-3 h-3" /> Quay lại
                </button>
            </div>
        );
    }

    if (step === 'cfa-select') {
        return (
            <CFASelection
                columns={columns}
                onRunCFA={async (syntax, factors) => {
                    setIsAnalyzing(true);
                    setAnalysisType('cfa');
                    try {
                        const neededCols = Array.from(new Set(factors.flatMap((f: any) => f.indicators)));
                        const result = await runCFA(data.map(row => (neededCols as string[]).map(c => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[c]))) as number[][], neededCols as string[], syntax);
                        
                        if (result.error) {
                            throw new Error(result.error);
                        }

                        setResults({ type: 'cfa', data: result, columns: neededCols });
                        setParentStep('results');
                        showToast('CFA thành công!', 'success');
                    } catch (err) { handleAnalysisError(err); } 
                    finally { setIsAnalyzing(false); }
                }}
                isAnalyzing={isAnalyzing}
                onBack={() => setParentStep('analyze')}
            />
        );
    }

    if (step === 'sem-select') {
        return (
            <SEMSelection
                columns={columns}
                onRunSEM={async (syntax, factors) => {
                    setIsAnalyzing(true);
                    setAnalysisType('sem');
                    try {
                        const neededCols = Array.from(new Set(factors.flatMap((f: any) => f.indicators)));
                        const result = await runSEM(data.map(row => (neededCols as string[]).map(c => ((v) => (v === null || v === undefined || v === '' || v === 'NA' ? null : (isNaN(Number(v)) ? null : Number(v))))(row[c]))) as number[][], neededCols as string[], syntax);
                        
                        if (result.error) {
                            throw new Error(result.error);
                        }
                        
                        setResults({ type: 'sem', data: result, columns: neededCols });
                        setParentStep('results');
                        showToast('SEM thành công!', 'success');
                    } catch (err) { handleAnalysisError(err); } 

                    finally { setIsAnalyzing(false); }
                }}
                isAnalyzing={isAnalyzing}
                onBack={() => setParentStep('analyze')}
            />
        );
    }

    if (step === 'pls-sem-select') {
        return (
            <PLSSEMSelection
                columns={columns}
                onRunPLS={runPLSWithSelection}
                isAnalyzing={isAnalyzing}
                onBack={() => setParentStep('analyze')}
            />
        );
    }

    return null;
};
