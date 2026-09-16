'use client';

import React from 'react';
import { AnalysisStep } from '@/types/analysis';
import { Locale, t } from '@/lib/i18n';
import { FileUpload } from '@/components/FileUpload';
import { DataProfiler } from '@/components/DataProfiler';
import { AnalysisSelector } from '@/components/AnalysisSelector';
import { WebRLoadingProgress } from '@/components/WebRLoadingProgress';
import { ResultsDisplay } from '@/components/ResultsDisplay';

// Import Views
import { BasicStatsView } from '@/components/analyze/views/BasicStatsView';
import { MultivariateView } from '@/components/analyze/views/MultivariateView';
import { MediationView } from '@/components/analyze/views/MediationView';
import { ReliabilityView } from '@/components/analyze/views/ReliabilityView';
import { RegressionView } from '@/components/analyze/views/RegressionView';
import AdvancedMethodView from '@/components/analyze/views/AdvancedMethodView';
import { PLSSEMView } from '@/components/analyze/views/PLSSEMView';
import { AutoPilotView } from '@/components/analyze/views/AutoPilotView';

interface AnalyzeStepRendererProps {
    step: AnalysisStep;
    data: any[];
    profile: any;
    locale: Locale;
    user: any;
    isAnalyzing: boolean;
    analysisProgress: number;
    results: any;
    multipleResults: any[];
    setMultipleResults: (results: any[]) => void;
    analysisType: string;
    previousAnalysis: any;
    ncsBalance: number;
    mode: string | null;
    getNumericColumns: () => string[];
    getAllColumns: () => string[];
    handleDataLoaded: (data: any[], filename: string) => void;
    setStep: (step: AnalysisStep) => void;
    runAnalysis: (type: string) => Promise<void>;
    setResults: (results: any) => void;
    setNcsBalance: React.Dispatch<React.SetStateAction<number>>;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    setAnalysisType: (type: string) => void;
    setRequiredCredits: (credits: number) => void;
    setCurrentAnalysisCost: (cost: number) => void;
    setShowInsufficientCredits: (show: boolean) => void;
    setPreviousAnalysis: (data: any) => void;
    isDemo?: boolean;
}

export function AnalyzeStepRenderer(props: AnalyzeStepRendererProps) {
    const { step, locale, profile, data, getNumericColumns, getAllColumns, user, setResults, setStep, setNcsBalance, showToast, setAnalysisType, setRequiredCredits, setCurrentAnalysisCost, setShowInsufficientCredits, isAnalyzing, isDemo, setMultipleResults } = props;

    if (step === 'upload') {
        return (
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">{t(locale, 'analyze.upload.title')}</h2>
                    <p className="text-gray-600">{t(locale, 'analyze.upload.desc')}</p>
                </div>
                <FileUpload onDataLoaded={props.handleDataLoaded} locale={locale} isDemo={isDemo} />
            </div>
        );
    }

    if (step === 'profile' && profile) {
        return (
            <div className="space-y-6">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-blue-900 mb-3 uppercase tracking-tight">{t(locale, 'analyze.profile.title')}</h2>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-80">{t(locale, 'analyze.profile.desc')}</p>
                </div>
                <DataProfiler profile={profile} onProceed={() => setStep('analyze')} locale={locale} />
            </div>
        );
    }

    if (step === 'analyze') {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-blue-900 mb-3 uppercase tracking-tight">{t(locale, 'analyze.selector.title')}</h2>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-80">{t(locale, 'analyze.selector.desc')}</p>
                </div>
                <WebRLoadingProgress compact={false} hideWhenReady={true} />
                <AnalysisSelector
                    onSelect={(s) => setStep(s as AnalysisStep)}
                    onRunAnalysis={props.runAnalysis}
                    isAnalyzing={isAnalyzing}
                    mode={props.mode}
                    locale={locale}
                />
                {isAnalyzing && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                        <p className="mt-4 text-gray-600">{t(locale, 'analyze.common.analyzing')}</p>
                    </div>
                )}
            </div>
        );
    }

    const basicStatsViews = ['descriptive-select', 'frequency-select', 'ttest-select', 'ttest-paired-select', 'anova-select', 'chisq-select', 'fisher-select', 'mannwhitney-select', 'kruskalwallis-select', 'wilcoxon-select'];
    if (basicStatsViews.includes(step)) {
        return <BasicStatsView {...props} columns={getNumericColumns()} allColumns={getAllColumns()} />;
    }

    const multivariateViews = ['cluster-select', 'twoway-anova-select'];
    if (multivariateViews.includes(step)) {
        return <MultivariateView {...props} columns={getNumericColumns()} allColumns={getAllColumns()} />;
    }

    if (['mediation-select', 'moderation-select'].includes(step)) {
        return <MediationView {...props} columns={getNumericColumns()} allColumns={getAllColumns()} />;
    }

    if (['cronbach-select', 'omega-select', 'efa-select', 'cfa-select', 'cbsem-select', 'sem-select', 'plssem-select'].includes(step)) {
        return (
            <ReliabilityView
                {...(props as any)}
                columns={getNumericColumns()}
            />
        );
    }

    if (['regression-select', 'logistic-select', 'mediation-select', 'moderation-select'].includes(step)) {
        return <RegressionView {...(props as any)} columns={getNumericColumns()} />;
    }

    const plssemViews = ['bootstrap-select', 'htmt-select', 'vif-select', 'cmb-select', 'mga-select', 'ipma-select', 'blindfolding-select'];
    if (plssemViews.includes(step)) {
        return <PLSSEMView {...(props as any)} method={step.replace('-select', '') as any} columns={getNumericColumns()} />;
    }

    if (step === 'auto-pilot') {
        return <AutoPilotView {...props} columns={getNumericColumns()} allColumns={getAllColumns()} />;
    }

    if (step === 'results') {
        console.log("DEBUG: AnalyzeStepRenderer step is results.", { 
            hasResultsProp: !!props.results, 
            multipleResultsLength: props.multipleResults?.length 
        });
        
        return (
            <ResultsDisplay
                results={props.results}
                multipleResults={props.multipleResults}
                analysisType={props.analysisType}
            />
        );
    }

    return null;
}
