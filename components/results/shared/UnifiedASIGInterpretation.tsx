'use client';

/**
 * UnifiedASIGInterpretation v2 — ASIG output display with 7-layer insight model.
 *
 * New in v2:
 *   • InsightLayer panel: domain benchmarks, practical significance,
 *     publishability signal, Vietnamese thesis writing tip, research implication
 *   • Domain badge: Economics · Management · Marketing
 *   • Collapsible insight sections with distinct visual treatment
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    CheckCircle2, AlertTriangle, XCircle,
    ChevronDown, ChevronUp,
    Copy, Check,
    BookMarked, Lightbulb, FileText, ArrowRight,
    TrendingUp, Globe, BookOpen, Target, Microscope,
} from 'lucide-react';
import { InterpretationResult, generateInterpretation, AnalysisType, InsightLayer } from '@/lib/asig';

interface UnifiedASIGInterpretationProps {
    analysisType: string;
    results: any;
    scaleName?: string;
    variableNames?: Record<string, string>;
    lazy?: boolean;
}

// ── Verdict config ────────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
    pass: {
        label: 'PASSED',
        bg: 'bg-emerald-50 border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: CheckCircle2,
        iconColor: 'text-emerald-600',
        accent: 'border-emerald-500',
        summaryBg: 'bg-emerald-900',
    },
    warning: {
        label: 'ATTENTION NEEDED',
        bg: 'bg-amber-50 border-amber-200',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: AlertTriangle,
        iconColor: 'text-amber-600',
        accent: 'border-amber-500',
        summaryBg: 'bg-amber-900',
    },
    fail: {
        label: 'ACTION REQUIRED',
        bg: 'bg-rose-50 border-rose-200',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        icon: XCircle,
        iconColor: 'text-rose-600',
        accent: 'border-rose-500',
        summaryBg: 'bg-rose-900',
    },
} as const;

// ── Publishability signal colours ─────────────────────────────────────────────

function PublishabilityBadge({ note }: { note: string }) {
    const isStrong    = note.startsWith('✅');
    const isWarn      = note.startsWith('⚠');
    const isFail      = note.startsWith('❌');
    const cls = isStrong
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
        : isWarn
            ? 'bg-amber-100 text-amber-800 border-amber-300'
            : isFail
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-slate-100 text-slate-700 border-slate-200';
    const icon = isStrong ? '✅' : isWarn ? '⚠' : isFail ? '❌' : '📋';
    const text = note.replace(/^[✅⚠❌]\s*/, '');
    return (
        <div className={`inline-flex items-start gap-2 px-3 py-2 rounded-lg border text-xs font-medium leading-relaxed ${cls}`}>
            <span className="shrink-0 mt-0.5">{icon}</span>
            <span>{text}</span>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export function UnifiedASIGInterpretation({
    analysisType,
    results,
    scaleName = 'Scale',
    variableNames = {},
    lazy = false,
}: UnifiedASIGInterpretationProps) {
    const [interpretation, setInterpretation] = useState<InterpretationResult | null>(null);
    const [loading, setLoading]               = useState(false);
    const [error, setError]                   = useState<string | null>(null);
    const [showDetails, setShowDetails]       = useState(true);
    const [showCitations, setShowCitations]   = useState(false);
    const [showInsight, setShowInsight]       = useState(true);
    const [copied, setCopied]                 = useState(false);
    const [copiedAPA, setCopiedAPA]           = useState(false);
    const [locale, setLocale]                 = useState<any>('vi');
    const prevKey = useRef<string>('');

    useEffect(() => {
        const { getStoredLocale } = require('@/lib/i18n');
        setLocale(getStoredLocale());
        const handleLocaleChange = (e: any) => setLocale(e.detail);
        window.addEventListener('localechange', handleLocaleChange);
        return () => window.removeEventListener('localechange', handleLocaleChange);
    }, []);

    const compute = useCallback(() => {
        const effectiveResults = results?.data ?? results;
        if (!effectiveResults) return;

        const key = `${analysisType}::${locale}::${JSON.stringify(effectiveResults)}`;
        if (key === prevKey.current) return;
        prevKey.current = key;

        setLoading(true);
        setError(null);

        try {
            const result = generateInterpretation(
                analysisType as AnalysisType,
                { ...effectiveResults, scaleName, variableNames },
                locale
            );
            setInterpretation(result);
        } catch (err: any) {
            console.error('[ASIG]', err);
            setError(err.message || 'Could not generate interpretation.');
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [analysisType, results, scaleName, variableNames, locale]);

    useEffect(() => {
        if (!lazy) compute();
    }, [compute, lazy]);

    // ── Copy helpers ──────────────────────────────────────────────────────────

    const buildCopyText = () => {
        if (!interpretation) return '';
        const ins = interpretation.insight;
        return [
            '=== ASIG Academic Interpretation (v2) ===',
            `Domain: Economics - Management - Marketing`,
            '',
            interpretation.summary,
            '',
            interpretation.apaStatement ? `APA Statement:\n${interpretation.apaStatement}` : '',
            '',
            interpretation.details.length > 0
                ? `Statistical Details:\n${interpretation.details.map((d: string) => `- ${d}`).join('\n')}`
                : '',
            '',
            interpretation.warnings.length > 0
                ? `Warnings:\n${interpretation.warnings.map((w: string) => `[!] ${w}`).join('\n')}`
                : '',
            '',
            interpretation.recommendations?.length
                ? `Next Steps:\n${interpretation.recommendations.map((rec: string, idx: number) => `${idx + 1}. ${rec}`).join('\n')}`
                : '',
            '',
            ins ? [
                '--- Domain Insight (Economics/Management/Marketing) ---',
                `Benchmark Context: ${ins.benchmarkContext}`,
                `Practical Significance: ${ins.practicalSignificance}`,
                `Publishability: ${ins.publishabilityNote}`,
                `Writing Tip: ${ins.writingTip}`,
                `Research Implication: ${ins.researchImplication}`,
            ].join('\n') : '',
            '',
            interpretation.citations.length > 0
                ? `References:\n${interpretation.citations.join('\n')}`
                : '',
        ].filter(Boolean).join('\n');
    };

    const copyAll = () => {
        navigator.clipboard.writeText(buildCopyText().trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyAPA = () => {
        if (!interpretation?.apaStatement) return;
        navigator.clipboard.writeText(interpretation.apaStatement);
        setCopiedAPA(true);
        setTimeout(() => setCopiedAPA(false), 2000);
    };

    // ── Loading / error states ────────────────────────────────────────────────

    if (lazy && !interpretation && !loading) return null;

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 my-6 flex items-center gap-4">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin shrink-0" />
                <div>
                    <p className="text-sm font-black text-slate-700 uppercase tracking-widest">
                        Generating Academic Interpretation…
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">ASIG v2 · Economics / Management / Marketing</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 my-6 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-rose-800">Interpretation unavailable</p>
                    <p className="text-xs text-rose-600 mt-1">{error}</p>
                    <button onClick={compute} className="mt-2 text-xs font-bold text-rose-700 underline hover:text-rose-900">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!interpretation) return null;

    const verdict = interpretation.verdict ?? 'pass';
    const vc      = VERDICT_CONFIG[verdict as keyof typeof VERDICT_CONFIG];
    const VIcon   = vc.icon;
    const insight: InsightLayer | undefined = interpretation.insight;

    return (
        <div className={`rounded-2xl border-2 ${vc.bg} my-6 overflow-hidden shadow-sm`}>

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/60">
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg bg-white shadow-sm`}>
                        <VIcon className={`w-4 h-4 ${vc.iconColor}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                ASIG v2 · Academic Interpretation
                            </p>
                            {/* Domain badge */}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 text-[9px] font-black uppercase tracking-wider">
                                <Globe className="w-2.5 h-2.5" />
                                Econ · Mgmt · Marketing
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${vc.badge}`}>
                                <VIcon className="w-2.5 h-2.5" />
                                {vc.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">APA 7 · Deterministic · Citable</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={copyAll}
                    title="Copy full interpretation"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm transition-colors"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy All'}
                </button>
            </div>

            <div className="p-5 space-y-4">

                {/* ── Summary ──────────────────────────────────────────────── */}
                <div className={`rounded-xl p-5 ${vc.summaryBg} border-l-4 ${vc.accent} shadow-lg relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <p className="text-white font-bold leading-relaxed text-sm relative z-10">
                        {interpretation.summary}
                    </p>
                </div>

                {/* ── APA Statement ─────────────────────────────────────────── */}
                {interpretation.apaStatement && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    APA Manuscript Statement
                                </span>
                            </div>
                            <button
                                onClick={copyAPA}
                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50"
                            >
                                {copiedAPA ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                {copiedAPA ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <p className="text-sm text-slate-700 italic leading-relaxed font-medium">
                            &ldquo;{interpretation.apaStatement}&rdquo;
                        </p>
                    </div>
                )}

                {/* ── NEW: InsightLayer panel ────────────────────────────────── */}
                {insight && (
                    <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 overflow-hidden">
                        {/* Insight header */}
                        <button
                            onClick={() => setShowInsight(v => !v)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-100/60 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-600 rounded-lg">
                                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-indigo-700">
                                        Domain Insight — Economics · Management · Marketing
                                    </p>
                                    <p className="text-[9px] text-indigo-400 mt-0.5">
                                        Benchmarks · Practical significance · Publishability · Thesis writing tip
                                    </p>
                                </div>
                            </div>
                            {showInsight
                                ? <ChevronUp className="w-4 h-4 text-indigo-500" />
                                : <ChevronDown className="w-4 h-4 text-indigo-500" />}
                        </button>

                        {showInsight && (
                            <div className="px-4 pb-4 space-y-3">

                                {/* Benchmark context */}
                                <div className="rounded-lg bg-white border border-indigo-100 p-3">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <Microscope className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                            Benchmark Context
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                        {insight.benchmarkContext}
                                    </p>
                                </div>

                                {/* Practical significance */}
                                <div className="rounded-lg bg-white border border-indigo-100 p-3">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <Target className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-violet-600">
                                            Practical Significance
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                        {insight.practicalSignificance}
                                    </p>
                                </div>

                                {/* Publishability signal */}
                                <div className="rounded-lg bg-white border border-indigo-100 p-3">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-teal-600">
                                            Publishability Signal
                                        </span>
                                    </div>
                                    <PublishabilityBadge note={insight.publishabilityNote} />
                                </div>

                                {/* Writing tip */}
                                <div className="rounded-lg bg-indigo-900 p-3">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <FileText className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                                            Thesis / Paper Writing Tip
                                        </span>
                                        <span className="ml-1 text-[8px] px-1.5 py-0.5 bg-indigo-700 text-indigo-200 rounded-full font-bold uppercase">
                                            Vietnamese Context
                                        </span>
                                    </div>
                                    <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                                        {insight.writingTip}
                                    </p>
                                </div>

                                {/* Research implication */}
                                <div className="rounded-lg bg-white border border-indigo-100 p-3">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <ArrowRight className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                                            Research Implication
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                        {insight.researchImplication}
                                    </p>
                                </div>

                            </div>
                        )}
                    </div>
                )}

                {/* ── Statistical Details (collapsible) ─────────────────────── */}
                {interpretation.details.length > 0 && (
                    <div>
                        <button
                            onClick={() => setShowDetails(v => !v)}
                            className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 py-1.5"
                        >
                            <span>Statistical Details ({interpretation.details.length})</span>
                            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        {showDetails && (
                            <ul className="space-y-2 mt-1">
                                {interpretation.details.map((d: string, i: number) => (
                                    <li
                                        key={i}
                                        className={`text-xs text-slate-800 bg-white p-3 rounded-xl border-l-4 ${vc.accent} shadow-sm font-medium leading-relaxed`}
                                    >
                                        {d}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* ── Warnings ──────────────────────────────────────────────── */}
                {interpretation.warnings.length > 0 && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                        <div className="flex items-center gap-2 mb-2.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                                Methodological Warnings ({interpretation.warnings.length})
                            </span>
                        </div>
                        <ul className="space-y-2">
                            {interpretation.warnings.map((w: string, i: number) => (
                                <li key={i} className="text-xs text-amber-800 font-medium flex items-start gap-2 leading-relaxed">
                                    <span className="text-amber-500 shrink-0 mt-0.5">▲</span>
                                    {w}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* ── Recommendations ───────────────────────────────────────── */}
                {interpretation.recommendations && interpretation.recommendations.length > 0 && (
                    <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                        <div className="flex items-center gap-2 mb-2.5">
                            <Lightbulb className="w-4 h-4 text-blue-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                                Recommended Next Steps
                            </span>
                        </div>
                        <ol className="space-y-2">
                            {interpretation.recommendations.map((r: string, i: number) => (
                                <li key={i} className="flex items-start gap-2.5 text-xs text-blue-800 font-medium leading-relaxed">
                                    <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-[10px] font-black flex items-center justify-center mt-0.5">
                                        {i + 1}
                                    </span>
                                    <span className="flex items-start gap-1.5">
                                        <ArrowRight className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                                        {r}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {/* ── Citations (collapsible) ───────────────────────────────── */}
                {interpretation.citations.length > 0 && (
                    <div>
                        <button
                            onClick={() => setShowCitations(v => !v)}
                            className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 py-1"
                        >
                            <div className="flex items-center gap-1.5">
                                <BookMarked className="w-3 h-3" />
                                <span>References ({interpretation.citations.length})</span>
                            </div>
                            {showCitations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {showCitations && (
                            <ul className="mt-2 space-y-1.5">
                                {interpretation.citations.map((c: string, i: number) => (
                                    <li
                                        key={i}
                                        className="text-[11px] text-slate-600 italic leading-relaxed border-l-2 border-slate-200 pl-3 py-0.5"
                                    >
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
