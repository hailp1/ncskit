'use client';

import React, { useMemo, lazy, Suspense, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import SEMPathDiagram from './SEMPathDiagram';
import { Maximize2, Minimize2 } from 'lucide-react';
import { ResultsErrorBoundary } from './results/ResultsErrorBoundary';

// Shared components (eager load - small and frequently used)
import { RSyntaxViewer } from './results/shared/RSyntaxViewer';
import { MultiReliabilitySummary } from './results/reliability/MultiReliabilitySummary';

// Lazy load all analysis components for code splitting
const LoadingSkeleton = lazy(() => import('./results/LoadingSkeleton'));
const TTestResults = lazy(() => import('./results/basic/TTestResults').then(m => ({ default: m.TTestResults })));
const PairedTTestResults = lazy(() => import('./results/basic/PairedTTestResults').then(m => ({ default: m.PairedTTestResults })));
const ANOVAResults = lazy(() => import('./results/basic/ANOVAResults').then(m => ({ default: m.ANOVAResults })));
const TwoWayANOVAResults = lazy(() => import('./results/basic/TwoWayANOVAResults').then(m => ({ default: m.TwoWayANOVAResults })));
const CorrelationResults = lazy(() => import('./results/basic/CorrelationResults').then(m => ({ default: m.CorrelationResults })));
const DescriptiveResults = lazy(() => import('./results/basic/DescriptiveResults').then(m => ({ default: m.DescriptiveResults })));
const FrequencyResults = lazy(() => import('./results/basic/FrequencyResults').then(m => ({ default: m.FrequencyResults })));
const CronbachResults = lazy(() => import('./results/reliability/CronbachResults').then(m => ({ default: m.CronbachResults })));
const EFAResults = lazy(() => import('./results/factor/EFAResults').then(m => ({ default: m.EFAResults })));
const CFAResults = lazy(() => import('./results/factor/CFAResults').then(m => ({ default: m.CFAResults })));
const SEMResults = lazy(() => import('./results/factor/SEMResults').then(m => ({ default: m.SEMResults })));
const RegressionResults = lazy(() => import('./results/regression/RegressionResults').then(m => ({ default: m.RegressionResults })));
const LogisticResults = lazy(() => import('./results/regression/LogisticResults').then(m => ({ default: m.LogisticResults })));
const ModerationResults = lazy(() => import('./results/regression/ModerationResults').then(m => ({ default: m.ModerationResults })));
const MediationResults = lazy(() => import('./results/mediation/MediationResults').then(m => ({ default: m.MediationResults })));
const ChiSquareResults = lazy(() => import('./results/nonparametric/ChiSquareResults').then(m => ({ default: m.ChiSquareResults })));
const MannWhitneyResults = lazy(() => import('./results/nonparametric/MannWhitneyResults').then(m => ({ default: m.MannWhitneyResults })));
const KruskalWallisResults = lazy(() => import('./results/nonparametric/KruskalWallisResults').then(m => ({ default: m.KruskalWallisResults })));
const WilcoxonResults = lazy(() => import('./results/nonparametric/WilcoxonResults').then(m => ({ default: m.WilcoxonResults })));
const ClusterResults = lazy(() => import('./results/cluster/ClusterResults').then(m => ({ default: m.ClusterResults })));
const PLSResults = lazy(() => import('./results/factor/PLSResults').then(m => ({ default: m.PLSResults })));
const AutoPilotReport = lazy(() => import('./results/AutoPilotReport').then(m => ({ default: m.AutoPilotReport })));

// PLS-SEM sub-analysis result components (lazy loaded)
const BootstrapResults    = lazy(() => import('./results/plssem/BootstrapResults'));
const BlindfoldingResults = lazy(() => import('./results/plssem/BlindfoldingResults'));
const MGAResults          = lazy(() => import('./results/plssem/MGAResults'));
const IPMAResults         = lazy(() => import('./results/plssem/IPMAResults'));
const HTMTResults         = lazy(() => import('./results/plssem/HTMTResults').then(m => ({ default: m.HTMTResults })));
const VIFResults          = lazy(() => import('./results/plssem/VIFResults').then(m => ({ default: m.VIFResults })));
const OutlierResults      = lazy(() => import('./results/plssem/OutlierResults').then(m => ({ default: m.OutlierResults })));
const OmegaResults        = lazy(() => import('./results/plssem/OmegaResults').then(m => ({ default: m.OmegaResults })));
const CMBResults          = lazy(() => import('./results/plssem/CMBResults'));


interface ResultsDisplayProps {
    results: any;
    analysisType: string;
    onProceedToEFA?: (goodItems: string[]) => void;
    onProceedToCFA?: (factors: { name: string; indicators: string[] }[]) => void;
    onProceedToSEM?: (factors: { name: string; indicators: string[] }[]) => void;
    columns?: string[];
    userProfile?: any;
    scaleName?: string;
    multipleResults?: any[];
}

export function ResultsDisplay({
    results,
    analysisType,
    onProceedToEFA,
    onProceedToCFA,
    onProceedToSEM,
    userProfile,
    columns,
    scaleName,
    multipleResults
}: ResultsDisplayProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Prevent body scroll when fullscreen
    useEffect(() => {
        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isFullscreen]);

    console.log("DEBUG: ResultsDisplay rendered.", {
        multipleResultsLength: multipleResults?.length,
        hasResultsProp: !!results,
        analysisType
    });

    const display = useMemo(() => {
        console.log("DEBUG: ResultsDisplay useMemo triggered.", { multipleResults, results, analysisType });
        
        const isReliability = analysisType === 'cronbach' || analysisType === 'omega' || 
                              analysisType === 'cronbach-batch' || analysisType === 'omega-batch';

        if (isReliability && (results || (multipleResults && multipleResults.length > 0))) {
            console.log("DEBUG: Rendering Reliability Results with separated Table and ASIG sections.");
            
            // Normalize single and batch results into an array
            let relResults: any[] = [];
            if (analysisType === 'cronbach-batch' || analysisType === 'omega-batch') {
                relResults = multipleResults || [];
            } else {
                relResults = [{ 
                    type: analysisType, 
                    data: results.data || results, 
                    columns: results.columns || columns, 
                    scaleName: scaleName || 'Thang đo' 
                }];
            }

            if (relResults.length > 0) {
                return (
                    <div className="space-y-8">
                        <MultiReliabilitySummary multipleResults={relResults} />
                        
                        {/* Tables Group - Only Tables */}
                        <div className="space-y-8">
                            {relResults.map((res, idx) => {
                                if (res.type === 'cronbach' || res.type === 'omega') {
                                    return (
                                        <div key={`table-${idx}`} className="relative">
                                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-100 rounded-full" />
                                            <CronbachResults 
                                                results={res.data || res} 
                                                columns={res.columns} 
                                                scaleName={res.scaleName} 
                                                analysisType={res.type} 
                                                hideASIG={true}
                                            />
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>

                        {/* ASIG Group - Only Explanations */}
                        <div className="space-y-8 pt-10 mt-10 border-t-2 border-dashed border-slate-200">
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-black text-blue-900 uppercase tracking-tight">Diễn Giải Tự Động (ASIG AI)</h3>
                                <p className="text-slate-500 text-sm mt-2">Dưới đây là phần diễn giải học thuật cho từng thang đo.</p>
                            </div>
                            {relResults.map((res, idx) => {
                                if (res.type === 'cronbach' || res.type === 'omega') {
                                    return (
                                        <div key={`asig-${idx}`} className="relative">
                                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-500 rounded-full" />
                                            <CronbachResults 
                                                results={res.data || res} 
                                                columns={res.columns} 
                                                scaleName={res.scaleName} 
                                                analysisType={res.type} 
                                                onProceedToEFA={onProceedToEFA}
                                                hideTables={true}
                                            />
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                );
            }
        }

        console.log("DEBUG: hasMultiDisplay is false.", { results });
        if (!results) {
            return (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                    <p className="mt-4 text-gray-500 text-sm">Đang tải kết quả...</p>
                </div>
            );
        }

        // Automatically unwrap `data` if it was wrapped by setResults({ type, data, columns })
        const analysisData = results.data || results;
        const analysisColumns = results.columns || columns || [];

        switch (analysisType) {
            case 'ttest-indep':
                return <TTestResults results={analysisData} columns={analysisColumns} />;
            case 'ttest-paired':
                return <PairedTTestResults results={analysisData} columns={analysisColumns} />;
            case 'anova':
                return <ANOVAResults results={analysisData} columns={analysisColumns} />;
            case 'correlation':
                return <CorrelationResults results={analysisData} columns={analysisColumns} />;
            case 'regression':
                return <RegressionResults results={analysisData} columns={analysisColumns} />;
            case 'cronbach':
            case 'omega':
                return <CronbachResults results={analysisData} columns={analysisColumns} onProceedToEFA={onProceedToEFA} scaleName={scaleName} analysisType={analysisType} />;
            case 'efa':
                return <EFAResults results={analysisData} columns={analysisColumns} onProceedToCFA={onProceedToCFA} />;
            case 'cfa':
                return <CFAResults results={analysisData} onProceedToSEM={onProceedToSEM} />;
            case 'sem':
                return <SEMResults results={analysisData} />;
            case 'mann-whitney':
                return <MannWhitneyResults results={analysisData} columns={analysisColumns} />;
            case 'kruskal-wallis':
                return <KruskalWallisResults results={analysisData} columns={analysisColumns} />;
            case 'frequency':
                return <FrequencyResults results={analysisData} columns={analysisColumns} />;
            case 'wilcoxon':
                return <WilcoxonResults results={analysisData} columns={analysisColumns} />;
            case 'chisquare':
                return <ChiSquareResults results={analysisData} columns={analysisColumns} />;

            case 'descriptive':
                return <DescriptiveResults results={analysisData} columns={analysisColumns} />;
            case 'moderation':
                return <ModerationResults results={analysisData} columns={analysisColumns} />;
            case 'mediation':
                return <MediationResults results={analysisData} columns={analysisColumns} />;
            case 'logistic':
                return <LogisticResults results={analysisData} columns={analysisColumns} />;
            case 'twoway-anova':
                return <TwoWayANOVAResults results={analysisData} columns={analysisColumns} />;
            case 'cluster':
                return <ClusterResults results={analysisData} columns={analysisColumns} />;
            case 'pls-sem':
                return <PLSResults results={analysisData} columns={analysisColumns} />;
            // ── PLS-SEM sub-analyses ────────────────────────────────────────────
            case 'bootstrap':
                return <BootstrapResults results={analysisData} />;
            case 'blindfolding':
                return <BlindfoldingResults results={analysisData} />;
            case 'mga':
                return <MGAResults results={analysisData} />;
            case 'ipma':
                return <IPMAResults results={analysisData} />;
            case 'htmt':
                return <HTMTResults results={analysisData} />;
            case 'vif':
                return <VIFResults results={analysisData} columns={analysisColumns} />;
            case 'cmb':
                return <CMBResults results={analysisData} columns={analysisColumns} />;
            case 'outlier':
                return <OutlierResults results={analysisData} columns={analysisColumns} />;
            case 'omega-detail':
                return <OmegaResults results={analysisData} columns={analysisColumns} scaleName={scaleName} />;
            case 'auto-pilot':
                return <AutoPilotReport results={analysisData} columns={analysisColumns} />;
            default:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Analysis Logic Not Found</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="text-xs bg-slate-100 p-2 rounded">
                                {JSON.stringify(analysisData, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                );
        }
    }, [results, multipleResults, analysisType, onProceedToEFA, onProceedToCFA, onProceedToSEM, columns, scaleName]);

    return (
        <div 
            id="analysis-results-container" 
            className={`space-y-6 md:space-y-8 ${isFullscreen ? 'fixed inset-0 z-[100] bg-slate-50 p-3 md:p-6 overflow-y-auto w-full h-full' : ''}`}
        >
            {/* Contextual Header for Fullscreen Mode */}
            {isFullscreen ? (
                <div className="flex justify-between items-center sticky top-0 bg-slate-50/95 backdrop-blur-sm pb-4 pt-2 z-10 border-b border-slate-200 mb-6">
                    <div className="flex flex-col">
                        <h2 className="text-sm md:text-lg font-black text-blue-900 uppercase tracking-tight">Kết quả chi tiết</h2>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">NCSKit Academic Engine</span>
                    </div>
                    <button 
                        onClick={() => setIsFullscreen(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-lg font-bold text-xs md:text-sm active:scale-95 transition-all"
                    >
                        <Minimize2 className="w-4 h-4" /> Đóng
                    </button>
                </div>
            ) : (
                <div className="flex justify-end mb-[-1.5rem] md:mb-[-1rem]">
                    <button 
                        onClick={() => setIsFullscreen(true)}
                        className="flex items-center gap-2 px-4 py-2 md:px-3 md:py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl shadow-sm hover:bg-blue-100 font-bold text-xs relative z-10 transition-all active:scale-95"
                        title="Hiển thị full bảng"
                    >
                        <Maximize2 className="w-4 h-4" /> Xem toàn màn hình
                    </button>
                </div>
            )}
            <ResultsErrorBoundary>
                <Suspense fallback={<LoadingSkeleton />}>
                    {display}
                </Suspense>
            </ResultsErrorBoundary>

            {/* R Syntax Viewer - Researcher Only */}
            {results?.rCode && (
                <RSyntaxViewer code={results.rCode} userProfile={userProfile} />
            )}
        </div>
    );
}
