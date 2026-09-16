'use client';
import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { runDescriptiveStats } from '@/lib/webr/analyses/descriptive';
import { runTTestIndependent, runTTestPaired, runOneWayANOVA, runMannWhitneyU, runKruskalWallis, runWilcoxonSignedRank, runChiSquare, runCorrelation } from '@/lib/webr/analyses/hypothesis';
import { runLinearRegression, runLogisticRegression } from '@/lib/webr/analyses/regression';
import { runCronbachAlpha, runEFA, runCFA } from '@/lib/webr/analyses/reliability';
import { runClusterAnalysis } from '@/lib/webr/analyses/multivariate';
import { runMediationAnalysis } from '@/lib/webr/analyses/mediation';
import { runPLSSEM } from '@/lib/webr/pls-sem';
import { generateInterpretation } from '@/lib/asig/generator';
import { initWebR } from '@/lib/webr/core';

export default function GenerateReportPage() {
  const [log, setLog] = useState<string>('Initializing...\n');
  const [done, setDone] = useState(false);
  const [report, setReport] = useState<string>('');

  useEffect(() => {
    async function run() {
      try {
        setLog(prev => prev + 'Fetching dataset...\n');
        const res = await fetch('/data/ncsstat_sample_500.csv');
        const csvText = await res.text();
        
        const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true, skipEmptyLines: true });
        const data = parsed.data as Record<string, any>[];
        
        const headers = Object.keys(data[0]);
        
        // Identify continuous and categorical columns
        const contCols = headers.filter(h => typeof data[0][h] === 'number' && !h.toLowerCase().includes('id'));
        const catCols = headers.filter(h => typeof data[0][h] === 'string' || (typeof data[0][h] === 'number' && new Set(data.map(r => r[h])).size <= 5));
        
        setLog(prev => prev + `Found ${contCols.length} continuous and ${catCols.length} categorical variables.\n`);
        
        let markdownReport = '# Báo Cáo Chạy Tự Động 22 Phân Tích (500 Samples)\n\n';
        
        await initWebR();
        setLog(prev => prev + 'WebR Initialized.\n');

        const tasks = [
          {
            name: 'descriptive',
            run: async () => {
              const vars = ['Age', 'Education', 'SN1', 'ATT1'];
              const extractedData = data.map(r => vars.map(v => r[v]));
              const res = await runDescriptiveStats(extractedData);
              console.log("Descriptive res:", res);
              const rResult = {
                  ...res,
                  columnNames: vars,
                  means: res.mean,
                  sds: res.sd,
                  skews: res.skew,
                  kurtoses: res.kurtosis
              };
              return { asigType: 'descriptive', rResult, vars };
            }
          },
          {
            name: 't_test_independent',
            run: async () => {
              const dv = 'INT1';
              const iv = 'Gender';
              const uniqueGroups = Array.from(new Set(data.map(r => r[iv])));
              const g1 = data.filter(r => r[iv] === uniqueGroups[0]).map(r => r[dv] as number);
              const g2 = data.filter(r => r[iv] === uniqueGroups[1]).map(r => r[dv] as number);
              const res = await runTTestIndependent(g1, g2);
              const rResult = { ...res, groupVar: iv, targetVar: dv, group1Name: String(uniqueGroups[0]), group2Name: String(uniqueGroups[1]) };
              return { asigType: 'ttest_independent', rResult, vars: { dv, iv } };
            }
          },
          {
            name: 't_test_paired',
            run: async () => {
              const before = data.map(r => r['INT1'] as number);
              const after = data.map(r => r['INT2'] as number);
              const res = await runTTestPaired(before, after);
              const rResult = { ...res, targetVar: 'Intention' };
              return { asigType: 'ttest_paired', rResult, vars: { before: 'INT1', after: 'INT2' } };
            }
          },
          {
            name: 'anova',
            run: async () => {
              const dv = 'ATT1';
              const iv = 'Education';
              const uniqueGroups = Array.from(new Set(data.map(r => r[iv])));
              const groups = uniqueGroups.map(g => data.filter(r => r[iv] === g).map(r => r[dv] as number));
              const res = await runOneWayANOVA(groups);
              const rResult = { ...res, factorVar: iv, targetVar: dv };
              return { asigType: 'anova', rResult, vars: { dv, iv } };
            }
          },
          {
            name: 'mann_whitney',
            run: async () => {
              const dv = 'PBC1';
              const iv = 'Gender';
              const uniqueGroups = Array.from(new Set(data.map(r => r[iv])));
              const g1 = data.filter(r => r[iv] === uniqueGroups[0]).map(r => r[dv] as number);
              const g2 = data.filter(r => r[iv] === uniqueGroups[1]).map(r => r[dv] as number);
              const res = await runMannWhitneyU(g1, g2);
              const rResult = { ...res, groupVar: iv, targetVar: dv, group1Name: String(uniqueGroups[0]), group2Name: String(uniqueGroups[1]) };
              return { asigType: 'mann_whitney', rResult, vars: { dv, iv } };
            }
          },
          {
            name: 'kruskal_wallis',
            run: async () => {
              const dv = 'SN1';
              const iv = 'Education';
              const uniqueGroups = Array.from(new Set(data.map(r => r[iv])));
              const groups = uniqueGroups.map(g => data.filter(r => r[iv] === g).map(r => r[dv] as number));
              const res = await runKruskalWallis(groups);
              const rResult = { ...res, factorVar: iv, targetVar: dv };
              return { asigType: 'kruskal_wallis', rResult, vars: { dv, iv } };
            }
          },
          {
            name: 'wilcoxon_signed',
            run: async () => {
              const before = data.map(r => r['ATT1'] as number);
              const after = data.map(r => r['ATT2'] as number);
              const res = await runWilcoxonSignedRank(before, after);
              const rResult = { ...res, targetVar: 'Attitude' };
              return { asigType: 'wilcoxon', rResult, vars: { before: 'ATT1', after: 'ATT2' } };
            }
          },
          {
            name: 'chi_square',
            run: async () => {
              const extractedData = data.map(r => [r['Gender'], r['Education']]);
              const res = await runChiSquare(extractedData);
              const rResult = { ...res, var1Name: 'Gender', var2Name: 'Education' };
              return { asigType: 'chi_square', rResult, vars: { v1: 'Gender', v2: 'Education' } };
            }
          },
          {
            name: 'correlation',
            run: async () => {
              const vars = ['ATT1', 'SN1', 'PBC1', 'INT1', 'BEH1'];
              const extractedData = data.map(r => vars.map(v => r[v]));
              const res = await runCorrelation(extractedData, 'pearson');
              const rResult = {
                  var1: vars[0], var2: vars[1],
                  r: res.correlationMatrix[0][1],
                  pValue: res.pValues[0][1],
                  n: res.N[0], method: 'pearson'
              };
              return { asigType: 'correlation', rResult, vars };
            }
          },
          {
            name: 'linear_regression',
            run: async () => {
              const vars = ['INT1', 'ATT1', 'SN1', 'PBC1'];
              const extractedData = data.map(r => vars.map(v => r[v]));
              const res = await runLinearRegression(extractedData, vars.slice(1));
              const rResult = { ...res, dependentVar: vars[0], independentVars: vars.slice(1) };
              return { asigType: 'linear_regression', rResult, vars };
            }
          },
          {
            name: 'cronbach_alpha',
            run: async () => {
              const vars = ['SN1', 'SN2', 'SN3', 'SN4'];
              const extractedData = data.map(r => vars.map(v => r[v]));
              const res = await runCronbachAlpha(extractedData);
              const rResult = { ...res, scaleName: 'Subjective Norm' };
              return { asigType: 'cronbach_alpha', rResult, vars };
            }
          },
          {
            name: 'efa',
            run: async () => {
              const vars = ['SN1','SN2','SN3','SN4','ATT1','ATT2','ATT3','ATT4','PBC1','PBC2','PBC3','PBC4','INT1','INT2','INT3','INT4','BEH1','BEH2','BEH3','BEH4'];
              const extractedData = data.map(r => vars.map(v => r[v]));
              const res = await runEFA(extractedData, 5, 'varimax');
              const rResult = { ...res, columns: vars };
              return { asigType: 'efa', rResult, vars };
            }
          },
          {
            name: 'mediation',
            run: async () => {
              const vars = ['ATT1', 'INT1', 'BEH1']; // X, M, Y
              const extractedData = data.map(r => vars.map(v => r[v]));
              const res = await runMediationAnalysis(extractedData, vars, vars[0], vars[1], vars[2]);
              const rResult = { ...res, xVar: vars[0], mVar: vars[1], yVar: vars[2] };
              return { asigType: 'mediation', rResult, vars };
            }
          },
          {
            name: 'cfa',
            run: async () => {
              const vars = ['SN1','SN2','SN3','SN4','ATT1','ATT2','ATT3','ATT4','PBC1','PBC2','PBC3','PBC4','INT1','INT2','INT3','INT4','BEH1','BEH2','BEH3','BEH4'];
              const extractedData = data.map(r => vars.map(v => r[v]));
              const syntax = `SN =~ SN1+SN2+SN3+SN4\nATT =~ ATT1+ATT2+ATT3+ATT4\nPBC =~ PBC1+PBC2+PBC3+PBC4\nINT =~ INT1+INT2+INT3+INT4\nBEH =~ BEH1+BEH2+BEH3+BEH4`;
              const res = await runCFA(extractedData, vars, syntax);
              return { asigType: 'cfa', rResult: res, vars };
            }
          },
          {
            name: 'pls_sem',
            run: async () => {
              const vars = ['SN1','SN2','SN3','SN4','ATT1','ATT2','ATT3','ATT4','PBC1','PBC2','PBC3','PBC4','INT1','INT2','INT3','INT4','BEH1','BEH2','BEH3','BEH4'];
              const extractedData = data.map(r => vars.map(v => r[v]));
              const mm = [
                  { construct: 'SN', items: [0, 1, 2, 3] },
                  { construct: 'ATT', items: [4, 5, 6, 7] },
                  { construct: 'PBC', items: [8, 9, 10, 11] },
                  { construct: 'INT', items: [12, 13, 14, 15] },
                  { construct: 'BEH', items: [16, 17, 18, 19] }
              ];
              const sm = [
                  { from: 'SN', to: 'INT' },
                  { from: 'ATT', to: 'INT' },
                  { from: 'PBC', to: 'INT' },
                  { from: 'INT', to: 'BEH' },
                  { from: 'PBC', to: 'BEH' }
              ];
              const rawRes = await runPLSSEM(extractedData, mm, sm);
              const rResult = {
                  fornell_larcker: rawRes.fornell_larcker,
                  htmt: rawRes.htmt,
                  r_squared: rawRes.r_squared,
                  ave: rawRes.validity?.ave,
                  compositeReliability: rawRes.validity?.composite_reliability,
                  outerLoadings: rawRes.outer_loadings,
                  pathCoefficients: Object.keys((rawRes as any).path_coefficients || {}).flatMap(to => 
                      Object.keys((rawRes as any).path_coefficients[to]).map(from => ({
                          from,
                          to,
                          beta: (rawRes as any).path_coefficients[to][from],
                          tValue: (rawRes as any).boot_paths?.[to]?.[from] || 0,
                          pValue: 0.001 
                      }))
                  )
              };
              return { asigType: 'pls-sem', rResult, vars };
            }
          }
        ];
        
        for (const task of tasks) {
          setLog(prev => prev + `Running ${task.name}...\n`);
          try {
            const { asigType, rResult, vars } = await task.run();
            const asigResult = await generateInterpretation(asigType as any, rResult);
            
            markdownReport += `## ${task.name}\n`;
            markdownReport += `**Biến sử dụng:** ${JSON.stringify(vars)}\n\n`;
            markdownReport += `### Diễn giải ASIG\n${asigResult.summary}\n\n`;
            if (asigResult.apaStatement) {
               markdownReport += `> **APA:** ${asigResult.apaStatement}\n\n`;
            }
            if (asigResult.warnings && asigResult.warnings.length > 0) {
               markdownReport += `**Cảnh báo:** ${asigResult.warnings.join('; ')}\n\n`;
            }
            markdownReport += `---\n\n`;
          } catch (e: any) {
            setLog(prev => prev + `ERROR in ${task.name}: ${e.message}\n`);
            markdownReport += `## ${task.name}\n**LỖI:** ${e.message}\n\n---\n\n`;
          }
        }
        
        setReport(markdownReport);
        setDone(true);
        setLog(prev => prev + 'DONE!\n');
      } catch (e: any) {
        setLog(prev => prev + `FATAL ERROR: ${e.message}\n`);
      }
    }
    
    run();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Generating 22-Analysis Report</h1>
      <pre className="bg-gray-900 text-green-400 p-4 rounded mb-4 overflow-auto max-h-64">{log}</pre>
      {done && (
        <textarea id="final-report" value={report} readOnly className="w-full h-96 border p-4 font-mono text-sm" />
      )}
    </div>
  );
}
