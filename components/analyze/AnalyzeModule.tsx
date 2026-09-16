'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAnalysisSession } from '@/hooks/useAnalysisSession';
import { Toast } from '@/components/ui/Toast';
import { Shield } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnalysisToolbar from '@/components/analyze/AnalysisToolbar';
import SaveProjectModal from '@/components/analyze/SaveProjectModal';
import { DemographicSurvey } from '@/components/feedback/DemographicSurvey';
import { ApplicabilitySurvey } from '@/components/feedback/ApplicabilitySurvey';
import { t } from '@/lib/i18n';
import { AnalysisStep } from '@/types/analysis';

// Extracted Hooks & Components
import { useAnalyzeLifecycle } from '@/app/analyze/hooks/useAnalyzeLifecycle';
import { useAnalysisRunner } from '@/app/analyze/hooks/useAnalysisRunner';
import { AnalyzeStepRenderer } from '@/app/analyze/components/AnalyzeStepRenderer';
import { usePageVisibility } from '@/hooks/usePageVisibility';

interface AnalyzeModuleProps {
    isDemo?: boolean;
}

export function AnalyzeModule({ isDemo = false }: AnalyzeModuleProps) {
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode');

    // Demo mode: no user, no credits
    const effectiveUser = null;

    const {
        isPrivateMode, setIsPrivateMode,
        clearSession,
        step, setStep,
        data, setData,
        filename, setFilename,
        profile, setProfile,
        analysisType, setAnalysisType,
        results, setResults,
        multipleResults, setMultipleResults,
    } = useAnalysisSession();

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [showDemographics, setShowDemographics] = useState(false);
    const [showApplicability, setShowApplicability] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [previousAnalysis, setPreviousAnalysis] = useState<any | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        if (type === 'error') console.error(`TOAST ERROR: ${message}`);
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const {
        loading,
        showRestoreBanner,
        handleRestore,
        discardSaved,
        locale,
        getNumericColumns
    } = useAnalyzeLifecycle({
        data, step, setStep, profile, setProfile, filename, results, analysisType, isPrivateMode,
        setNcsBalance: () => {}, setToast: showToast, setShowDemographics, isDemo
    });

    const getAllColumns = () => profile ? Object.keys(profile.columnStats) : [];

    const { isAnalyzing, setIsAnalyzing, analysisProgress, runAnalysis } = useAnalysisRunner({
        data, getNumericColumns, user: effectiveUser, setStep, setAnalysisType,
        setRequiredCredits: () => {}, setCurrentAnalysisCost: () => {},
        setShowInsufficientCredits: () => {}, setNcsBalance: () => {},
        setResults, setToast: showToast,
        handleAnalysisError: (err: any) => {
            const msg = err.message || String(err);
            console.error('Analysis Error:', err);
            showToast(`Lỗi: ${msg.substring(0, 100)}...`, 'error');
        }
    });

    const isVisible = usePageVisibility();
    React.useEffect(() => {
        if (!isVisible && isAnalyzing) {
            showToast('Hệ thống R đang chạy. Việc chuyển Tab có thể làm trình duyệt đóng băng tiến trình. Vui lòng quay lại Tab này!', 'error');
        }
    }, [isVisible, isAnalyzing]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
                    <p className="mt-4 text-slate-600 font-medium">{t(locale as any, 'analyze.common.loading')}...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header />

            {/* Open-access banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center py-2 text-sm font-bold shadow-md relative z-50 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                OPEN DEMO — Không yêu cầu đăng nhập. Giới hạn: tối đa 300 dòng, 50 cột.
            </div>

            {/* Restore Workspace Banner */}
            {showRestoreBanner && (
                <div className="bg-amber-50 border-b border-amber-200 py-3 px-4 shadow-sm z-40">
                    <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-4 h-4 text-amber-600" />
                            </div>
                            <p className="text-sm font-medium text-amber-900">
                                {t(locale as any, 'analyze.common.restore_found') || 'Tìm thấy dữ liệu đang làm việc'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={discardSaved} className="px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 rounded-md transition-colors">
                                {t(locale as any, 'analyze.common.discard') || 'Bỏ qua'}
                            </button>
                            <button type="button"
                                onClick={() => handleRestore(setData, setFilename, setStep, setResults, setAnalysisType)}
                                className="px-4 py-1.5 text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 rounded-md shadow-sm transition-colors"
                            >
                                {t(locale as any, 'analyze.common.restore') || 'Khôi phục'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1">
                <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
                    <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {t(locale as any, 'analyze.common.workspace')}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {filename ? `${t(locale as any, 'analyze.common.working_file')}: ${filename}` : t(locale as any, 'analyze.common.no_file')}
                            </p>
                        </div>
                        <AnalysisToolbar
                            isPrivateMode={isPrivateMode}
                            setIsPrivateMode={setIsPrivateMode}
                            clearSession={() => {
                                clearSession();
                                showToast(locale === 'vi' ? 'Đã dọn dẹp phiên làm việc' : 'Session cleared', 'info');
                            }}
                            filename={filename}
                            onSave={() => setIsSaveModalOpen(true)}
                            locale={locale as any}
                        />
                    </div>
                </div>

                <div className="bg-blue-50/50 border-b border-blue-100 py-1">
                    <div className="container mx-auto px-6 flex items-center justify-center gap-2 text-[11px] text-blue-600/80">
                        <Shield className="w-3 h-3" />
                        <span className="font-semibold">{t(locale as any, 'analyze.common.security_label')}:</span>
                        <span>{t(locale as any, 'analyze.common.security')}</span>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="container mx-auto px-2 md:px-6 py-4 md:py-8 overflow-x-auto no-scrollbar">
                    <div className="flex items-center justify-center gap-2 md:gap-4 mb-2 md:mb-8 min-w-max px-4">
                        {['upload', 'profile', 'analyze', 'results'].map((s, idx) => {
                            const stepOrder = ['upload', 'profile', 'analyze', 'results'];
                            const getMainStep = (current: string) => {
                                if (stepOrder.includes(current)) return current;
                                if (current.endsWith('-select')) return 'analyze';
                                return current;
                            };
                            const effectiveStep = getMainStep(step);
                            const currentIdx = stepOrder.indexOf(effectiveStep);
                            const isCompleted = currentIdx > idx;
                            const isCurrent = effectiveStep === s;
                            const isClickable = isCompleted || isCurrent;

                            return (
                                <div key={s} className="flex items-center">
                                    <button
                                        type="button"
                                        data-testid={`step-${s}`}
                                        onClick={() => {
                                            if (isClickable) {
                                                if (s === 'analyze' && step.endsWith('-select')) {
                                                    setStep('analyze' as any);
                                                } else {
                                                    setStep(s as AnalysisStep);
                                                }
                                            }
                                        }}
                                        disabled={!isClickable}
                                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-[10px] md:text-xs transition-all shadow-sm
                                            ${isCurrent ? 'bg-blue-900 text-white ring-4 ring-blue-100 scale-110' :
                                                isCompleted ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-110' :
                                                    'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}
                                            ${isClickable ? 'cursor-pointer hover:shadow-xl' : ''}`}
                                    >
                                        {idx + 1}
                                    </button>
                                    {idx < 3 && (
                                        <div className={`w-8 md:w-16 h-1 rounded-full transition-colors ${currentIdx > idx ? 'bg-blue-600' : 'bg-slate-200'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="py-8">
                        <AnalyzeStepRenderer
                            step={step}
                            data={data}
                            profile={profile}
                            locale={locale as any}
                            user={effectiveUser}
                            isAnalyzing={isAnalyzing}
                            analysisProgress={analysisProgress}
                            results={results}
                            multipleResults={multipleResults}
                            setMultipleResults={setMultipleResults}
                            analysisType={analysisType}
                            previousAnalysis={previousAnalysis}
                            ncsBalance={0}
                            mode={mode}
                            getNumericColumns={getNumericColumns}
                            getAllColumns={getAllColumns}
                            handleDataLoaded={(data: any[], filename: string) => {
                                setData(data);
                                setFilename(filename);
                                // CRITICAL: Reset stale profile & results from previous file
                                // Without this, getNumericColumns() returns column names from
                                // a previously loaded file, causing column-name mismatches
                                setProfile(null);
                                setResults(null);
                                setMultipleResults([]);
                                setStep('profile');
                                showToast(locale === 'vi' ? 'Đã tải dữ liệu thành công' : 'Data loaded successfully', 'success');
                            }}
                            setStep={setStep}
                            runAnalysis={runAnalysis}
                            setResults={setResults}
                            setNcsBalance={() => {}}
                            showToast={showToast}
                            setAnalysisType={setAnalysisType}
                            setRequiredCredits={() => {}}
                            setCurrentAnalysisCost={() => {}}
                            setShowInsufficientCredits={() => {}}
                            setPreviousAnalysis={setPreviousAnalysis}
                            isDemo={isDemo}
                        />
                    </div>
                </div>
            </div>

            <Footer />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <SaveProjectModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                data={data}
                results={results}
                analysisType={analysisType}
                step={step}
                locale={locale as any}
            />

            {showDemographics && (
                <DemographicSurvey
                    isOpen={showDemographics}
                    onComplete={() => setShowDemographics(false)}
                />
            )}

            {showApplicability && (
                <ApplicabilitySurvey
                    isOpen={showApplicability}
                    onComplete={() => setShowApplicability(false)}
                    onCancel={() => setShowApplicability(false)}
                />
            )}
        </div>
    );
}
