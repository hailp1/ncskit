'use client';

import React, { useState, useEffect } from 'react';
import { Target, Layers, Play, Rocket, AlertTriangle, CheckCircle2, ChevronLeft, ArrowRight, Lock } from 'lucide-react';
import { runEFA, runPLSSEM, runCronbachAlpha, runBootstrapping, runBlindfolding, runLavaanAnalysis, runLinearRegression, runCorrelation, runTTestIndependent, runOneWayANOVA, runLogisticRegression } from '@/lib/webr-wrapper';
import { AUTO_PILOT_PRESETS, PresetId, AutoPilotPreset } from '@/lib/auto-pilot-presets';
import { AutoPilotPresetSelector } from './autopilot/AutoPilotPresetSelector';
import { AutoPilotConfigPanel } from './autopilot/AutoPilotConfigPanel';
import { AutoPilotProgress } from './autopilot/AutoPilotProgress';

interface AutoPilotViewProps {
    step: string;
    data: any[];
    columns: string[];
    allColumns: string[];
    user: any;
    setResults: (res: any) => void;
    setStep: (step: any) => void;
    setNcsBalance: (balance: number) => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    setAnalysisType: (type: string) => void;
    setRequiredCredits: (c: number) => void;
    setCurrentAnalysisCost: (c: number) => void;
    setShowInsufficientCredits: (show: boolean) => void;
    locale: string;
}

interface VariableGroup {
    name: string;
    columns: string[];
    selected: boolean;
}

function extractPrefix(colName: string): string {
    const match = colName.match(/^([A-Za-z]+)/);
    return match ? match[1].toUpperCase() : colName.substring(0, 2).toUpperCase();
}

function autoGroupColumns(columns: string[]): VariableGroup[] {
    const groupMap: Record<string, string[]> = {};
    columns.forEach(col => {
        const prefix = extractPrefix(col);
        if (!groupMap[prefix]) groupMap[prefix] = [];
        groupMap[prefix].push(col);
    });
    return Object.entries(groupMap)
        .filter(([_, cols]) => cols.length >= 2)
        .map(([name, cols]) => ({ name, columns: cols, selected: true }));
}

export function AutoPilotView({
    data = [],
    columns = [],
    setResults,
    setStep,
    showToast,
    setAnalysisType,
    locale
}: AutoPilotViewProps) {
    const [groups, setGroups] = useState<VariableGroup[]>([]);
    const [paths, setPaths] = useState<{from: string, to: string}[]>([]);
    const [newPathFrom, setNewPathFrom] = useState<string>('');
    const [newPathTo, setNewPathTo] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [bootstrapSamples, setBootstrapSamples] = useState<number>(10);
    const [selectedPreset, setSelectedPreset] = useState<AutoPilotPreset | null>(null);
    const [categoricalCols, setCategoricalCols] = useState<string[]>([]);
    const [compareGroupVar, setCompareGroupVar] = useState<string>('');
    const [compareTestVars, setCompareTestVars] = useState<string[]>([]);

    useEffect(() => {
        // Filter out completely non-numeric columns (like Names, IDs)
        const numericCols = columns.filter(col => {
            const hasNumeric = data.some(row => {
                const val = row[col];
                return val !== null && val !== undefined && val !== '' && val !== 'NA' && !isNaN(Number(val));
            });
            return hasNumeric;
        });

        const autoGroups = autoGroupColumns(numericCols);
        setGroups(autoGroups);
        if (autoGroups.length > 1) {
            // Auto guess initial paths: all others -> last one
            const dv = autoGroups[autoGroups.length - 1].name;
            const ivs = autoGroups.slice(0, -1).map(g => g.name);
            setPaths(ivs.map(iv => ({ from: iv, to: dv })));
        }
        
        // Find categorical columns (small number of unique values)
        const catCols = columns.filter(col => {
            const uniqueVals = new Set(data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== ''));
            return uniqueVals.size > 1 && uniqueVals.size <= 10; // at least 2 distinct values, max 10
        });
        setCategoricalCols(catCols);
    }, [columns, data]);

    const handleAddPath = () => {
        if (!newPathFrom || !newPathTo) {
            showToast('Vui lòng chọn cả hai biến', 'error');
            return;
        }
        if (newPathFrom === newPathTo) {
            showToast('Biến tác động và bị tác động không thể trùng nhau', 'error');
            return;
        }
        if (paths.some(p => p.from === newPathFrom && p.to === newPathTo)) {
            showToast('Đường dẫn này đã tồn tại', 'error');
            return;
        }
        setPaths([...paths, { from: newPathFrom, to: newPathTo }]);
        setNewPathFrom('');
        setNewPathTo('');
    };

    const handleRemovePath = (index: number) => {
        setPaths(paths.filter((_, i) => i !== index));
    };

    const handleRunAutoPilot = async () => {
        if (!selectedPreset) return;
        
        if (selectedPreset.requiresPaths && paths.length === 0) {
            showToast('Vui lòng thêm ít nhất 1 giả thuyết (đường dẫn)', 'error');
            return;
        }

        let activeGroups: VariableGroup[] = [];
        if (selectedPreset.id === 'compare') {
            activeGroups = compareTestVars.map(c => groups.find(g => g.name === c)).filter(Boolean) as VariableGroup[];
            if (!compareGroupVar || activeGroups.length === 0) {
                showToast('Vui lòng chọn biến phân nhóm và ít nhất 1 nhóm biến định lượng', 'error');
                return;
            }
        } else if (selectedPreset.id === 'scale') {
            activeGroups = [...groups];
            if (activeGroups.length < 2) {
                showToast('Cần ít nhất 2 nhóm biến để phân tích thang đo', 'error');
                return;
            }
        } else {
            const uniqueConstructs = Array.from(new Set(paths.flatMap(p => [p.from, p.to])));
            activeGroups = uniqueConstructs.map(c => groups.find(g => g.name === c)).filter(Boolean) as VariableGroup[];
            if (activeGroups.length < 2) {
                showToast('Cần ít nhất 2 nhóm biến để chạy mô hình', 'error');
                return;
            }
        }

        setIsAnalyzing(true);
        setAnalysisType('auto-pilot');
        try {
            // Chuẩn hóa dữ liệu: Xử lý chuỗi có dấu phẩy (comma decimals) và NA
            const numericData = data.map(row => columns.map(col => {
                const val = row[col];
                if (val === null || val === undefined || val === '' || val === 'NA') return null;
                const strVal = typeof val === 'string' ? val.replace(',', '.') : val;
                const num = Number(strVal);
                return isNaN(num) ? null : num;
            }));
            const fullReport: any = {
                model: {
                    paths: paths,
                    constructs: activeGroups.map(g => g.name)
                },
                cronbach: {},
                efa: null,
                sem: null
            };

            if (selectedPreset.id === 'pls-sem') {
                // 1. Reliability
                setStatusText('Đang kiểm tra độ tin cậy thang đo (Cronbach Alpha)...');
                setProgress(20);
                for (const group of activeGroups) {
                    const groupIndices = group.columns.map(c => columns.indexOf(c));
                    const groupData = numericData.map(row => groupIndices.map(idx => row[idx]));
                    const res = await runCronbachAlpha(groupData as number[][]);
                    fullReport.cronbach[group.name] = { columns: group.columns, data: res };
                }

                // 2. EFA
                setStatusText('Đang chạy phân tích nhân tố khám phá (EFA)...');
                setProgress(50);
                const allItems = activeGroups.flatMap(g => g.columns);
                const efaIndices = allItems.map(c => columns.indexOf(c));
                const efaData = numericData.map(row => efaIndices.map(idx => row[idx]));
                const expectedFactors = activeGroups.length;
                const efaRes = await runEFA(efaData as number[][], expectedFactors, 'oblimin', 'minres');
                fullReport.efa = { columns: allItems, data: efaRes };

                // 3. SEM
                setStatusText('Đang chạy mô hình cấu trúc tuyến tính (PLS-SEM)...');
                setProgress(70);
                const measurementModel = activeGroups.map(g => ({ 
                    construct: g.name, 
                    items: g.columns.map(c => columns.indexOf(c)) 
                }));
                const structuralModel = paths;
                
                const semRes = await runPLSSEM(numericData as number[][], measurementModel, structuralModel);
                fullReport.sem = semRes;

                // 4. Bootstrapping
                setStatusText(`Đang chạy Bootstrapping (${bootstrapSamples} mẫu) để lấy P-Values...`);
                setProgress(80);
                const bootRes = await runBootstrapping(numericData as number[][], measurementModel, structuralModel, bootstrapSamples);
                if (fullReport.sem) {
                    fullReport.sem.bootstrapping = bootRes;
                }

                // 5. Blindfolding
                setStatusText('Đang chạy Blindfolding để lấy mức độ liên quan dự đoán (Q²)...');
                setProgress(95);
                try {
                    const blindfoldingRes = await runBlindfolding(numericData as number[][], measurementModel, structuralModel);
                    if (fullReport.sem && blindfoldingRes && blindfoldingRes.q2) {
                        let q2Data = blindfoldingRes.q2;
                        if (q2Data && typeof q2Data === 'object' && q2Data['Q²_predict'] && typeof q2Data['Q²_predict'] === 'object') {
                            fullReport.sem.q2 = q2Data['Q²_predict'];
                        } else if (q2Data && typeof q2Data === 'object' && q2Data['Q²_predict']) {
                            fullReport.sem.q2 = q2Data;
                        } else {
                            fullReport.sem.q2 = q2Data["Q2"] || q2Data["Q²"] || q2Data; 
                        }
                    }
                } catch (err: any) {
                    console.warn("Blindfolding error (non-fatal):", err);
                }
            } 
            else if (selectedPreset.id === 'cb-sem') {
                // 1. Reliability
                setStatusText('Đang kiểm tra độ tin cậy thang đo (Cronbach Alpha)...');
                setProgress(20);
                for (const group of activeGroups) {
                    const groupIndices = group.columns.map(c => columns.indexOf(c));
                    const groupData = numericData.map(row => groupIndices.map(idx => row[idx]));
                    const res = await runCronbachAlpha(groupData as number[][]);
                    fullReport.cronbach[group.name] = { columns: group.columns, data: res };
                }

                // 2. CFA
                setStatusText('Đang chạy Phân tích nhân tố khẳng định (CFA)...');
                setProgress(50);
                const cfaModel = activeGroups.map(g => `${g.name} =~ ${g.columns.join(' + ')}`).join('\n');
                const cfaCols = activeGroups.flatMap(g => g.columns);
                const cfaIndices = cfaCols.map(c => columns.indexOf(c));
                const cfaData = numericData.map(row => cfaIndices.map(idx => row[idx]));
                const cfaRes = await runLavaanAnalysis(cfaData as number[][], cfaCols, cfaModel);
                fullReport.cfa = cfaRes;

                // 3. SEM
                setStatusText('Đang chạy Mô hình cấu trúc (CB-SEM)...');
                setProgress(80);
                const semModelLines = [...activeGroups.map(g => `${g.name} =~ ${g.columns.join(' + ')}`)];
                paths.forEach(p => { semModelLines.push(`${p.to} ~ ${p.from}`); });
                const semModel = semModelLines.join('\n');
                const semRes = await runLavaanAnalysis(cfaData as number[][], cfaCols, semModel);
                fullReport.sem = semRes;
            }
            else if (selectedPreset.id === 'regression') {
                // 1. Reliability
                setStatusText('Đang kiểm tra độ tin cậy thang đo (Cronbach Alpha)...');
                setProgress(20);
                for (const group of activeGroups) {
                    const groupIndices = group.columns.map(c => columns.indexOf(c));
                    const groupData = numericData.map(row => groupIndices.map(idx => row[idx]));
                    const res = await runCronbachAlpha(groupData as number[][]);
                    fullReport.cronbach[group.name] = { columns: group.columns, data: res };
                }
                
                // 2. Correlation
                setStatusText('Đang tính toán biến đại diện và Tương quan (Correlation)...');
                setProgress(50);
                const constructScores: Record<string, number[]> = {};
                for (const group of activeGroups) {
                    const groupIndices = group.columns.map(c => columns.indexOf(c));
                    constructScores[group.name] = numericData.map(row => {
                        const vals = groupIndices.map(idx => row[idx]).filter(v => v !== null) as number[];
                        if (vals.length === 0) return 0;
                        return vals.reduce((a, b) => a + b, 0) / vals.length;
                    });
                }
                const constructNames = Object.keys(constructScores);
                const constructData = [];
                for (let i = 0; i < numericData.length; i++) {
                    const row = constructNames.map(name => constructScores[name][i]);
                    constructData.push(row);
                }
                
                const corRes = await runCorrelation(constructData as number[][]);
                fullReport.correlation = {
                    matrix: corRes.correlationMatrix,
                    pValues: corRes.pValues,
                    constructs: constructNames
                };

                // 3. Linear Regression
                setStatusText('Đang chạy Hồi quy đa biến (Linear Regression)...');
                setProgress(80);
                fullReport.regression = [];
                
                const targetVars = Array.from(new Set(paths.map(p => p.to)));
                for (const dv of targetVars) {
                    const ivs = paths.filter(p => p.to === dv).map(p => p.from);
                    if (ivs.length === 0) continue;
                    
                    const regVars = [dv, ...ivs];
                    const regIndices = regVars.map(v => constructNames.indexOf(v));
                    const regData = constructData.map(row => regIndices.map(idx => row[idx]));
                    
                    const regRes = await runLinearRegression(regData as number[][], regVars);
                    fullReport.regression.push({
                        dependent: dv,
                        independents: ivs,
                        result: regRes
                    });
                }
            }
            else if (selectedPreset.id === 'scale') {
                // 1. Reliability
                setStatusText('Đang kiểm tra độ tin cậy thang đo (Cronbach Alpha)...');
                setProgress(20);
                for (const group of activeGroups) {
                    const groupIndices = group.columns.map(c => columns.indexOf(c));
                    const groupData = numericData.map(row => groupIndices.map(idx => row[idx]));
                    const res = await runCronbachAlpha(groupData as number[][]);
                    fullReport.cronbach[group.name] = { columns: group.columns, data: res };
                }

                // 2. EFA
                setStatusText('Đang chạy phân tích nhân tố khám phá (EFA)...');
                setProgress(50);
                const allItems = activeGroups.flatMap(g => g.columns);
                const efaIndices = allItems.map(c => columns.indexOf(c));
                const efaData = numericData.map(row => efaIndices.map(idx => row[idx]));
                const expectedFactors = activeGroups.length;
                const efaRes = await runEFA(efaData as number[][], expectedFactors, 'oblimin', 'minres');
                fullReport.efa = { columns: allItems, data: efaRes };

                // 3. CFA
                setStatusText('Đang chạy Phân tích nhân tố khẳng định (CFA)...');
                setProgress(80);
                const cfaModel = activeGroups.map(g => `${g.name} =~ ${g.columns.join(' + ')}`).join('\n');
                const cfaCols = activeGroups.flatMap(g => g.columns);
                const cfaIndices = cfaCols.map(c => columns.indexOf(c));
                const cfaData = numericData.map(row => cfaIndices.map(idx => row[idx]));
                const cfaRes = await runLavaanAnalysis(cfaData as number[][], cfaCols, cfaModel);
                fullReport.cfa = cfaRes;
            }
            else if (selectedPreset.id === 'compare') {
                setStatusText('Đang xử lý dữ liệu biến phân nhóm...');
                setProgress(20);
                
                const groupVals = data.map(row => row[compareGroupVar]);
                const uniqueGroups = Array.from(new Set(groupVals.filter(v => v !== null && v !== undefined && v !== '')));
                
                if (uniqueGroups.length < 2) {
                    throw new Error('Biến phân nhóm phải có ít nhất 2 nhóm khác biệt.');
                }

                const constructScores: Record<string, number[]> = {};
                for (const group of activeGroups) {
                    const groupIndices = group.columns.map(c => columns.indexOf(c));
                    constructScores[group.name] = numericData.map(row => {
                        const vals = groupIndices.map(idx => row[idx]).filter(v => v !== null) as number[];
                        if (vals.length === 0) return NaN;
                        return vals.reduce((a, b) => a + b, 0) / vals.length;
                    });
                }
                
                fullReport.compare = [];
                setStatusText('Đang chạy kiểm định So sánh Trung bình...');
                setProgress(50);
                
                const isTTest = uniqueGroups.length === 2;
                
                for (const testVar of compareTestVars) {
                    const scores = constructScores[testVar];
                    
                    if (isTTest) {
                        const g1 = uniqueGroups[0];
                        const g2 = uniqueGroups[1];
                        const g1Scores = scores.filter((s, i) => groupVals[i] === g1 && !isNaN(s));
                        const g2Scores = scores.filter((s, i) => groupVals[i] === g2 && !isNaN(s));
                        
                        const tRes = await runTTestIndependent(g1Scores, g2Scores);
                        fullReport.compare.push({
                            testVar,
                            type: 't-test',
                            groups: [g1, g2],
                            result: tRes
                        });
                    } else {
                        const groupArrays: number[][] = uniqueGroups.map(g => 
                            scores.filter((s, i) => groupVals[i] === g && !isNaN(s))
                        );
                        const aRes = await runOneWayANOVA(groupArrays);
                        fullReport.compare.push({
                            testVar,
                            type: 'anova',
                            groups: uniqueGroups,
                            result: aRes
                        });
                    }
                }
                setProgress(90);
            }
            else if (selectedPreset.id === 'logistic') {
                setStatusText('Đang chuẩn bị dữ liệu cho Logistic Regression...');
                setProgress(20);
                
                const constructScores: Record<string, number[]> = {};
                for (const group of activeGroups) {
                    const groupIndices = group.columns.map(c => columns.indexOf(c));
                    constructScores[group.name] = numericData.map(row => {
                        const vals = groupIndices.map(idx => row[idx]).filter(v => v !== null) as number[];
                        if (vals.length === 0) return 0;
                        return vals.reduce((a, b) => a + b, 0) / vals.length;
                    });
                }
                const constructNames = Object.keys(constructScores);
                const constructData = [];
                for (let i = 0; i < numericData.length; i++) {
                    const row = constructNames.map(name => constructScores[name][i]);
                    constructData.push(row);
                }

                setStatusText('Đang chạy Logistic Regression...');
                setProgress(50);
                fullReport.logistic = [];
                
                const targetVars = Array.from(new Set(paths.map(p => p.to)));
                for (const dv of targetVars) {
                    const ivs = paths.filter(p => p.to === dv).map(p => p.from);
                    if (ivs.length === 0) continue;
                    
                    const dvIdx = constructNames.indexOf(dv);
                    const dvScores = constructData.map(r => r[dvIdx]);
                    const uniqueDV = Array.from(new Set(dvScores.filter(v => v !== null && !isNaN(v))));
                    
                    if (uniqueDV.length !== 2) {
                        throw new Error(`Biến phụ thuộc '${dv}' không phải là nhị phân (chỉ có 2 giá trị). Logistic Regression bắt buộc dùng biến nhị phân.`);
                    }
                    
                    const minVal = Math.min(...uniqueDV);
                    const mappedData = constructData.map(r => {
                        const newR = [...r];
                        newR[dvIdx] = newR[dvIdx] === minVal ? 0 : 1;
                        return newR;
                    });
                    
                    const regVars = [dv, ...ivs];
                    const regIndices = regVars.map(v => constructNames.indexOf(v));
                    const regData = mappedData.map(row => regIndices.map(idx => row[idx]));
                    
                    const logRes = await runLogisticRegression(regData as number[][], regVars);
                    fullReport.logistic.push({
                        dependent: dv,
                        independents: ivs,
                        result: logRes
                    });
                }
            }

            setProgress(100);
            setStatusText('Hoàn tất! Đang kết xuất báo cáo...');
            
            setResults({
                type: 'auto-pilot',
                data: fullReport,
                columns: columns
            });
            
            setTimeout(() => {
                setStep('results');
                showToast('Chạy Auto Pilot thành công!', 'success');
            }, 500);

        } catch (error: any) {
            console.error(error);
            showToast('Lỗi khi chạy Auto Pilot: ' + error.message, 'error');
            setIsAnalyzing(false);
        }
    };


    if (!selectedPreset) {
        return <AutoPilotPresetSelector onSelect={(preset) => {
            setSelectedPreset(preset);
            if (preset.bootstrapDefault) setBootstrapSamples(preset.bootstrapDefault);
        }} />;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isAnalyzing && <AutoPilotProgress progress={progress} statusText={statusText} />}
            
            <button type="button" 
                onClick={() => setSelectedPreset(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
            >
                <ChevronLeft className="w-4 h-4" /> Quay lại danh sách kịch bản
            </button>

            <div className="text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl ${selectedPreset.bgColor} ${selectedPreset.color} shadow-xl mb-6 text-4xl`}>
                    {selectedPreset.icon}
                </div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-4">
                    {selectedPreset.name}
                </h2>
                <p className="text-slate-500 max-w-2xl mx-auto">
                    {selectedPreset.description}
                </p>
            </div>

            <AutoPilotConfigPanel 
                preset={selectedPreset}
                groups={groups}
                paths={paths}
                newPathFrom={newPathFrom}
                newPathTo={newPathTo}
                setNewPathFrom={setNewPathFrom}
                setNewPathTo={setNewPathTo}
                handleAddPath={handleAddPath}
                handleRemovePath={handleRemovePath}
                bootstrapSamples={bootstrapSamples}
                setBootstrapSamples={setBootstrapSamples}
                categoricalCols={categoricalCols}
                compareGroupVar={compareGroupVar}
                setCompareGroupVar={setCompareGroupVar}
                compareTestVars={compareTestVars}
                setCompareTestVars={setCompareTestVars}
            />

            <div className="bg-white rounded-3xl border border-blue-100 shadow-xl p-8 mt-8">
                <button type="button"
                    onClick={handleRunAutoPilot}
                    disabled={
                        isAnalyzing || 
                        (selectedPreset.requiresPaths && paths.length === 0) ||
                        (selectedPreset.id === 'compare' && (!compareGroupVar || compareTestVars.length === 0))
                    }
                    className={`w-full relative overflow-hidden group text-white p-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl transition-all ${isAnalyzing ? 'bg-slate-400' : 'bg-gradient-to-r from-blue-900 to-indigo-900 hover:shadow-blue-900/40 hover:-translate-y-1 active:scale-95'} disabled:opacity-50 disabled:pointer-events-none`}
                >
                    <div className="flex items-center justify-center gap-3">
                        <Rocket className="w-6 h-6 group-hover:animate-bounce" />
                        Bắt đầu Phân tích Toàn diện
                    </div>
                </button>
                
                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    {bootstrapSamples >= 1000 ? 'Bootstrap 1000 mẫu — có thể mất 3-10 phút' : bootstrapSamples >= 500 ? 'Có thể mất 1-5 phút tùy cấu hình' : 'Có thể mất 15-60 giây'}
                </div>
            </div>
        </div>
    );
}
