'use client';

import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, AlertTriangle, CheckSquare, Gauge, Info } from 'lucide-react';

interface ThresholdItem {
    label: string;
    value: string;
    status: 'good' | 'acceptable' | 'warn';
}

interface ScientificNoteProps {
    insight: string;
    citation: string;
    reference: string | string[];
    assumptions?: string[];
    thresholds?: ThresholdItem[];
    pitfalls?: string[];
}

export function ScientificNote({
    insight,
    citation,
    reference,
    assumptions,
    thresholds,
    pitfalls,
}: ScientificNoteProps) {
    const [expanded, setExpanded] = useState(false);
    const refs = Array.isArray(reference) ? reference : [reference];
    const hasExtra = !!(assumptions?.length || thresholds?.length || pitfalls?.length);

    const statusColor = (s: ThresholdItem['status']) =>
        s === 'good' ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
        : s === 'acceptable' ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-rose-100 text-rose-800 border-rose-200';

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl my-6 shadow-sm overflow-hidden">
            {/* Header row */}
            <div className="flex items-start gap-3 p-5">
                <div className="p-2 bg-slate-200 rounded-lg shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-slate-700 " />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                        Methodological Context &amp; Reporting Guidance
                    </p>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">
                        {insight}
                    </p>
                </div>
            </div>

            {/* Thresholds strip — always visible if present */}
            {thresholds && thresholds.length > 0 && (
                <div className="px-5 pb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                        <Gauge className="w-3 h-3" /> Key Decision Thresholds
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {thresholds.map((t, i) => (
                            <span
                                key={i}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusColor(t.status)}`}
                            >
                                <span className="opacity-70">{t.label}:</span>
                                <span>{t.value}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Expandable section */}
            {hasExtra && (
                <>
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="w-full flex items-center justify-between px-5 py-2.5 bg-slate-100 hover:bg-slate-200 transition-colors text-[10px] font-black uppercase tracking-widest text-slate-500 "
                    >
                        <span>Assumptions &amp; Reporting Details</span>
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {expanded && (
                        <div className="px-5 py-4 space-y-4 border-t border-slate-200 bg-white ">
                            {/* Assumptions */}
                            {assumptions && assumptions.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                                        <CheckSquare className="w-3 h-3" /> Assumptions to Verify
                                    </p>
                                    <ul className="space-y-1.5">
                                        {assumptions.map((a, i) => (
                                            <li key={i} className="text-xs text-slate-700 flex items-start gap-2 font-medium">
                                                <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                                                {a}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Common pitfalls */}
                            {pitfalls && pitfalls.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 flex items-center gap-1.5">
                                        <AlertTriangle className="w-3 h-3" /> Common Reporting Pitfalls
                                    </p>
                                    <ul className="space-y-1.5">
                                        {pitfalls.map((p, i) => (
                                            <li key={i} className="text-xs text-amber-800 flex items-start gap-2 font-medium bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 ">
                                                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-amber-500 " />
                                                {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* References footer */}
            <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 ">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Info className="w-3 h-3" /> References ({citation})
                </p>
                <div className="space-y-0.5">
                    {refs.map((r, i) => (
                        <p key={i} className="text-[11px] text-slate-600 italic leading-relaxed">{r}</p>
                    ))}
                </div>
            </div>
        </div>
    );
}
