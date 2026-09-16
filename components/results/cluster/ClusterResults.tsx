import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Database, FileText, Activity, Users, Box, BarChart } from 'lucide-react';
import { UnifiedASIGInterpretation } from '@/components/results/shared/UnifiedASIGInterpretation';

interface ClusterResultsProps {
    results: any;
    columns: string[];
}

/**
 * Cluster Analysis Results Component - Scientific Academic Style (White & Blue)
 */
export const ClusterResults = React.memo(function ClusterResults({ results, columns }: ClusterResultsProps) {
    if (!results) return null;
    const k = results.k || 3;
    const clusterSizes = results.clusterSizes || results.size || [];
    const centers = results.centers || [];
    const totalN = results.totalN || (clusterSizes.length > 0 ? clusterSizes.reduce((a: number, b: number) => a + b, 0) : (results.clusters?.length || null));
    const betweenSS = results.betweenSS ?? results.betweensSS ?? null;

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-700">
            {/* Quick Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <Box className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clusters (k)</p>
                        <p className="text-2xl font-black text-blue-900">{k}</p>
                    </div>
                </div>
                <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                        <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total N</p>
                        <p className="text-2xl font-black text-emerald-900">{totalN ?? 'N/A'}</p>
                    </div>
                </div>
                <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-lg">
                        <Activity className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Between SS</p>
                        <p className="text-xl font-black text-indigo-900">{betweenSS != null ? betweenSS.toFixed(1) : 'N/A'}</p>
                    </div>
                </div>
                <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-lg">
                        <BarChart className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Within SS</p>
                        <p className="text-xl font-black text-amber-900">{results.totWithinSS?.toFixed(1) || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Cluster Centers Table */}
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        Cluster Centers (Đặc điểm các cụm)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-slate-700">
                        <thead className="bg-blue-50/50 border-y border-blue-100">
                            <tr>
                                <th className="py-4 px-6 text-xs font-black text-blue-900 uppercase min-w-[150px]">Cluster (Size)</th>
                                {columns.map((col, idx) => (
                                    <th key={idx} className="py-4 px-4 text-xs font-black text-blue-900 uppercase text-right border-l border-blue-50 min-w-[120px]">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                            {centers.map((center: number[], cIdx: number) => (
                                <tr key={cIdx} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="py-5 px-6 text-sm font-bold text-slate-900 bg-slate-50/30">
                                        Cluster {cIdx + 1} 
                                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full uppercase tracking-tighter">N={clusterSizes[cIdx]}</span>
                                    </td>
                                    {center.map((val: number, vIdx: number) => (
                                        <td key={vIdx} className="py-5 px-4 text-sm text-right font-mono border-l border-blue-50 text-blue-900 font-medium group-hover:font-black transition-all">
                                            {typeof val === 'number' ? val.toFixed(3) : val}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Professional Template Interpretation */}
            <UnifiedASIGInterpretation 
                analysisType="cluster"
                results={results}
            />
        </div>
    );
});

export default ClusterResults;

