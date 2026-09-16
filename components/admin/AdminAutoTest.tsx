'use client'

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { runDescriptiveStats } from '@/lib/webr/analyses/descriptive';
import { runCorrelation, runTTestIndependent, runTTestPaired, runOneWayANOVA, runKruskalWallis, runMannWhitneyU, runChiSquare, runWilcoxonSignedRank } from '@/lib/webr/analyses/hypothesis';
import { runCronbachAlpha, runEFA, runCFA } from '@/lib/webr/analyses/reliability';
import { runLinearRegression } from '@/lib/webr/analyses/regression';
import { generateInterpretation } from '@/lib/asig/generator';
import { runPLSSEM } from '@/lib/webr/pls-sem';
import { runMediationAnalysis } from '@/lib/webr/analyses/mediation';

export function AdminAutoTest() {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<{name: string, status: 'pending' | 'running' | 'success' | 'error', message?: string, asigSummary?: string}[]>([]);
    const [mockData, setMockData] = useState<any[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);

    useEffect(() => {
        fetch('/data/ncsstat_sample_500.csv')
            .then(res => res.text())
            .then(csvStr => {
                Papa.parse(csvStr, {
                    header: false,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const parsed = results.data as string[][];
                        setHeaders(parsed[0]);
                        // Convert numeric columns, encode Gender (Male=1, Female=2)
                        const data = parsed.slice(1).map(row => 
                            row.map((v, i) => {
                                if (i === 1) return v === 'Male' ? 1 : (v === 'Female' ? 2 : 0);
                                const num = Number(v);
                                return isNaN(num) ? v : num;
                            })
                        );
                        setMockData(data);
                    }
                });
            });
    }, []);

    const runTests = async () => {
        if (mockData.length === 0) return;
        setIsRunning(true);
        
        const testQueue = [
            { id: 'descriptive', name: 'Descriptive Statistics' },
            { id: 'correlation', name: 'Correlation Analysis' },
            { id: 'reliability', name: 'Cronbach Alpha' },
            { id: 'ttest_indep', name: 'Independent T-Test' },
            { id: 'ttest_paired', name: 'Paired T-Test' },
            { id: 'anova', name: 'One-Way ANOVA' },
            { id: 'mann_whitney', name: 'Mann-Whitney U' },
            { id: 'kruskal', name: 'Kruskal-Wallis' },
            { id: 'wilcoxon', name: 'Wilcoxon Signed Rank' },
            { id: 'chi_square', name: 'Chi-Square Test' },
            { id: 'regression', name: 'Linear Regression' },
            { id: 'efa', name: 'Exploratory Factor Analysis' },
            { id: 'cfa', name: 'Confirmatory Factor Analysis' },
            { id: 'pls_sem', name: 'PLS-SEM' },
            { id: 'mediation', name: 'Mediation Analysis' },
        ];

        setResults(testQueue.map(t => ({ name: t.name, status: 'pending' })));

        for (let i = 0; i < testQueue.length; i++) {
            const test = testQueue[i];
            setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'running' } : r));
            
            try {
                let rResult: any = null;
                let asigType: any = null;
                let finalSummary = "";
                
                // Helpers for specific column extractions based on headers:
                // SN1 = col 4, SN2 = col 5, SN3 = col 6, ATT1 = col 8
                // Gender (encoded) = col 1, Education = col 3
                
                // --- ASSERTIONS FOR REAL DATA ---
                const assertValid = (val: any, name: string) => {
                    if (val === null || val === undefined || isNaN(val)) throw new Error(`Math Error: ${name} is invalid (${val})`);
                };
                
                if (test.id === 'descriptive') {
                    const cols = [4, 5, 6, 7]; 
                    const subData = mockData.map(r => cols.map(c => r[c] as number));
                    const rawRes = await runDescriptiveStats(subData);
                    rResult = { 
                        ...rawRes, 
                        columnNames: cols.map(c => headers[c]),
                        means: rawRes.mean,
                        sds: rawRes.sd,
                        skews: rawRes.skew,
                        kurtoses: rawRes.kurtosis
                    };
                    asigType = 'descriptive';
                    
                    assertValid(rawRes.mean[0], 'Mean');
                    if (rawRes.mean[0] === 0) throw new Error("Mean should not be 0 for this dataset");
                    
                } else if (test.id === 'correlation') {
                    const subData = mockData.map(r => [r[4] as number, r[5] as number]);
                    const rawRes = await runCorrelation(subData, 'pearson');
                    rResult = {
                        var1: headers[4], var2: headers[5],
                        r: rawRes.correlationMatrix[0][1],
                        pValue: rawRes.pValues[0][1],
                        n: rawRes.N[0], method: 'pearson'
                    };
                    asigType = 'correlation';
                    
                    assertValid(rResult.r, 'Correlation r');
                    if (rResult.r === 0 || rResult.r === 1) throw new Error(`Correlation r is suspicious (${rResult.r})`);
                    
                } else if (test.id === 'reliability') {
                    const cols = [4, 5, 6, 7]; 
                    const subData = mockData.map(r => cols.map(c => r[c] as number));
                    const rawRes = await runCronbachAlpha(subData);
                    rResult = { ...rawRes, scaleName: 'Subjective Norms (SN)' };
                    asigType = 'cronbach_alpha';
                    
                    assertValid(rawRes.alpha, 'Cronbach Alpha');
                    if (rawRes.alpha <= 0 || rawRes.alpha === 1) {
                        throw new Error(`Math Error: Cronbach Alpha is ${rawRes.alpha}. Variance might be 0 or calculation failed.`);
                    }
                    
                } else if (test.id === 'ttest_indep') {
                    const g1 = mockData.filter(r => r[1] === 1).map(r => r[4] as number);
                    const g2 = mockData.filter(r => r[1] === 2).map(r => r[4] as number);
                    const rawRes = await runTTestIndependent(g1, g2);
                    rResult = { ...rawRes, groupVar: headers[1], targetVar: headers[4], group1Name: 'Male', group2Name: 'Female' };
                    asigType = 'ttest_independent';
                    
                    assertValid(rawRes.meanDiff, 'Mean Difference');
                    assertValid(rawRes.pValue, 'P-Value');
                    
                } else if (test.id === 'ttest_paired') {
                    const before = mockData.map(r => r[4] as number); 
                    const after = mockData.map(r => r[8] as number); 
                    const rawRes = await runTTestPaired(before, after);
                    rResult = { ...rawRes, targetVar: 'Construct Score' };
                    asigType = 'ttest_paired';
                    
                    assertValid(rawRes.meanDiff, 'Mean Difference');
                    assertValid(rawRes.pValue, 'P-Value');
                    
                } else if (test.id === 'anova') {
                    const groups: number[][] = [[], [], [], []];
                    mockData.forEach(r => {
                        const ed = r[3] as number;
                        if (ed >= 1 && ed <= 4) groups[ed - 1].push(r[4] as number);
                    });
                    const rawRes = await runOneWayANOVA(groups);
                    rResult = { ...rawRes, factorVar: headers[3], targetVar: headers[4] };
                    asigType = 'anova';
                    
                    assertValid(rawRes.F, 'F-Value');
                    assertValid(rawRes.pValue, 'P-Value');
                    
                } else if (test.id === 'mann_whitney') {
                    const g1 = mockData.filter(r => r[1] === 1).map(r => r[4] as number);
                    const g2 = mockData.filter(r => r[1] === 2).map(r => r[4] as number);
                    const rawRes = await runMannWhitneyU(g1, g2);
                    rResult = { ...rawRes, group1Name: 'Male', group2Name: 'Female', targetVar: headers[4] };
                    asigType = 'mann_whitney';
                    
                    assertValid(rawRes.statistic, 'W-Value');
                    
                } else if (test.id === 'kruskal') {
                    const groups: number[][] = [[], [], [], []];
                    mockData.forEach(r => {
                        const ed = r[3] as number;
                        if (ed >= 1 && ed <= 4) groups[ed - 1].push(r[4] as number);
                    });
                    const rawRes = await runKruskalWallis(groups);
                    rResult = { ...rawRes, factorVar: headers[3], targetVar: headers[4] };
                    asigType = 'kruskal_wallis';
                    
                    assertValid(rawRes.statistic, 'Chi-Square');
                    assertValid(rawRes.pValue, 'P-Value');
                    
                } else if (test.id === 'chi_square') {
                    const subset = mockData.map(r => [r[2], r[3]]); 
                    const rawRes = await runChiSquare(subset);
                    rResult = { ...rawRes, var1Name: headers[2], var2Name: headers[3] };
                    asigType = 'chi_square';
                    
                    assertValid(rawRes.statistic, 'Chi-Square');
                    assertValid(rawRes.pValue, 'P-Value');
                    
                } else if (test.id === 'wilcoxon') {
                    const before = mockData.map(r => r[4] as number); 
                    const after = mockData.map(r => r[8] as number); 
                    const rawRes = await runWilcoxonSignedRank(before, after);
                    rResult = { ...rawRes, targetVar: 'Construct Score' };
                    asigType = 'wilcoxon';
                    
                    assertValid(rawRes.statistic, 'V-Value');
                    
                } else if (test.id === 'regression') {
                    const subset = mockData.map(r => [r[20] as number, r[8] as number, r[4] as number]);
                    const rawRes = await runLinearRegression(subset, [headers[8], headers[4]]);
                    rResult = { ...rawRes, dependentVar: headers[20], independentVars: [headers[8], headers[4]] };
                    asigType = 'linear_regression';
                    
                    assertValid(rawRes.modelFit.rSquared, 'R-Squared');
                    if (rawRes.modelFit.rSquared === 0) throw new Error("R-Squared should not be 0");
                    
                } else if (test.id === 'efa') {
                    const cols = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // SN, ATT, PBC
                    const subData = mockData.map(r => cols.map(c => r[c] as number));
                    const rawRes = await runEFA(subData, 3, 'varimax');
                    rResult = { ...rawRes, columns: cols.map(c => headers[c]) };
                    asigType = 'efa';
                    
                    assertValid(rawRes.kmo, 'KMO');
                    if (rawRes.kmo === 0) throw new Error("KMO should not be 0");
                    if (!rawRes.loadings || rawRes.loadings.length === 0) throw new Error("EFA Loadings missing");

                } else if (test.id === 'cfa') {
                    const cfaCols = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // SN, ATT, PBC
                    const cfaData = mockData.map(r => cfaCols.map(c => r[c] as number));
                    const cfaColNames = cfaCols.map(c => headers[c]);
                    const modelSyntax = `SN =~ ${headers[4]} + ${headers[5]} + ${headers[6]} + ${headers[7]}\nATT =~ ${headers[8]} + ${headers[9]} + ${headers[10]} + ${headers[11]}\nPBC =~ ${headers[12]} + ${headers[13]} + ${headers[14]} + ${headers[15]}`;
                    
                    const rawRes = await runCFA(cfaData, cfaColNames, modelSyntax);
                    rResult = rawRes;
                    asigType = 'cfa';
                    
                    if (rawRes?.fitMeasures?.cfi === undefined) {
                        throw new Error(`Math Error: CFI is undefined. rawRes: ${JSON.stringify(rawRes)}`);
                    }
                    assertValid(rawRes?.fitMeasures?.cfi, 'CFI');
                    if (rawRes?.fitMeasures?.cfi === 0) throw new Error("CFI should not be 0");

                } else if (test.id === 'pls_sem') {
                    const semCols = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20]; // SN, ATT, PBC, BEH1
                    const semData = mockData.map(r => semCols.map(c => r[c] as number));
                    const measurementModel = [
                        { construct: 'SN', items: [0, 1, 2, 3] },
                        { construct: 'ATT', items: [4, 5, 6, 7] },
                        { construct: 'PBC', items: [8, 9, 10, 11] },
                        { construct: 'BEH', items: [12] } // Just single item for simplicity
                    ];
                    const structuralModel = [
                        { from: 'SN', to: 'BEH' },
                        { from: 'ATT', to: 'BEH' },
                        { from: 'PBC', to: 'BEH' }
                    ];
                    
                    const rawRes = await runPLSSEM(semData, measurementModel, structuralModel);
                    rResult = {
                        fornell_larcker: rawRes.fornell_larcker,
                        htmt: rawRes.htmt,
                        r_squared: rawRes.r_squared,
                        ave: rawRes.validity?.ave,
                        compositeReliability: rawRes.validity?.composite_reliability,
                        outerLoadings: rawRes.outer_loadings,
                        pathCoefficients: Object.keys(rawRes.path_coefficients || {}).flatMap(to => 
                            Object.keys(rawRes.path_coefficients[to]).map(from => ({
                                from,
                                to,
                                beta: rawRes.path_coefficients[to][from],
                                tValue: rawRes.bootstrapping?.boot_paths?.[to]?.[from] || 0,
                                pValue: 0.001 
                            }))
                        )
                    };
                    asigType = 'pls-sem';
                    
                    if (!rawRes || !rawRes.path_coefficients) throw new Error("No path coefficients returned");

                } else if (test.id === 'mediation') {
                    const subset = mockData.map(r => [r[8] as number, r[16] as number, r[20] as number]); // ATT1, INT1, BEH1
                    const rawRes = await runMediationAnalysis(subset, [headers[8], headers[16], headers[20]], headers[8], headers[16], headers[20]);
                    rResult = { ...rawRes, xVar: headers[8], mVar: headers[16], yVar: headers[20] };
                    asigType = 'mediation';
                    
                    assertValid(rawRes?.effects?.indirect, 'Indirect Effect');
                } else {
                    rResult = { bypass: true }; 
                    finalSummary = "Skipped";
                }

                if (rResult && !rResult.bypass) {
                    const interpretation = generateInterpretation(asigType, rResult);
                    const asigRes = interpretation;
                    if (!asigRes || !asigRes.summary) {
                        throw new Error('ASIG Output is missing or invalid.');
                    }
                    if (asigRes.summary.includes('No ASIG template')) {
                        throw new Error(asigRes.summary);
                    }
                    finalSummary = interpretation.summary;
                }
                
                setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'success', asigSummary: finalSummary } : r));
            } catch (err: any) {
                console.error(`Test failed: ${test.name}`, err);
                setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', message: err.message } : r));
            }
        }
        
        setIsRunning(false);
    };

    const passedCount = results.filter(r => r.status === 'success').length;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">WebR Validation with Real Dataset (ncsstat_sample_500.csv)</h2>
                <button 
                    id="run-test-btn"
                    onClick={runTests} 
                    disabled={isRunning || mockData.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {mockData.length === 0 ? 'Loading CSV...' : (isRunning ? 'Running...' : 'Run Real Data Test')}
                </button>
            </div>
            
            {results.length > 0 && !isRunning && (
                <div className="mt-4">
                    <p className="mb-2 font-medium">Total Tests: {results.length} | Passed: {passedCount}</p>
                    <div className="border rounded-md divide-y">
                        {results.map((r, idx) => (
                            <div key={idx} className="p-3 flex flex-col border-b last:border-b-0">
                                <div className="flex justify-between items-center w-full">
                                    <span className="font-medium text-slate-700">
                                        {r.name} 
                                        {r.message && <span className="text-red-500 text-sm block">{r.message}</span>}
                                    </span>
                                    <span>
                                        {r.status === 'success' && <span className="text-green-600 font-bold">Pass ✓</span>}
                                        {r.status === 'error' && <span className="text-red-600 font-bold">Failed ✗</span>}
                                    </span>
                                </div>
                                {r.asigSummary && (
                                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 shadow-inner">
                                        <div className="text-xs font-bold text-blue-600 uppercase mb-2 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                            ASIG Engine Output
                                        </div>
                                        <div className="whitespace-pre-wrap">{r.asigSummary}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {isRunning && (
                 <div className="mt-4 p-4 border rounded bg-slate-50 text-center animate-pulse">
                     <p className="text-blue-600 font-bold">Running test suite... Please wait (WebR is processing)</p>
                     <div className="mt-4 border rounded-md divide-y bg-white text-left">
                        {results.map((r, idx) => (
                            <div key={idx} className="p-3 flex justify-between items-center">
                                <span className="font-medium text-slate-700">{r.name}</span>
                                <span>
                                    {r.status === 'pending' && <span className="text-gray-400">Pending...</span>}
                                    {r.status === 'running' && <span className="text-blue-500 font-bold animate-pulse">Running...</span>}
                                    {r.status === 'success' && <span className="text-green-600 font-bold">Pass ✓</span>}
                                    {r.status === 'error' && <span className="text-red-600 font-bold">Failed ✗</span>}
                                </span>
                            </div>
                        ))}
                    </div>
                 </div>
            )}
        </div>
    );
}

export default AdminAutoTest;
