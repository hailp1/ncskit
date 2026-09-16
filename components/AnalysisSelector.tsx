'use client';

import React, { useState, useEffect } from 'react';
import { BarChart2, Shield, Network, Users, GitCompare, Layers, TrendingUp, Grid3x3, Activity, ChevronDown, ChevronRight, Star, Binary, FlaskConical, ArrowRightLeft, Target, CircleDot, Shuffle, Search, Bookmark, Rocket, Zap, Eye, AlertCircle, Lock } from 'lucide-react';
import { PointBadge } from '@/components/ui/PointBadge';
import { Locale, t } from '@/lib/i18n';

interface AnalysisSelectorProps {
    onSelect: (step: string) => void;
    onRunAnalysis: (type: string) => void;
    isAnalyzing: boolean;
    mode?: string | null;
    locale: Locale;
}

interface AnalysisOption {
    id: string;
    title: string;
    desc: string;
    icon: any;
    action: 'select' | 'run';
    recommended?: boolean;
    costType?: string;
    disabled?: boolean;
    badge?: string;
}

interface AnalysisCategory {
    id: string;
    name: string;
    description: string;
    icon: any;
    options: AnalysisOption[];
}

export function AnalysisSelector({ onSelect, onRunAnalysis, isAnalyzing, mode, locale }: AnalysisSelectorProps) {
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (mode === '1') {
            setExpandedCategories(['reliability', 'comparison', 'categorical']);
        } else if (mode === '2') {
            setExpandedCategories(['relationship', 'factor', 'pls-sem-advanced', 'clustering']);
        } else {
            setExpandedCategories(['reliability', 'comparison', 'factor', 'pls-sem-advanced']);
        }
    }, [mode]);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
        );
    };

    const categories: AnalysisCategory[] = [
        {
            id: 'reliability',
            name: locale === 'vi' ? 'Thống kê Mô tả & Thang đo' : 'Descriptive & Scale',
            description: locale === 'vi' ? 'Thống kê cơ bản và kiểm định độ tin cậy' : 'Basic stats and scale validation',
            icon: Shield,
            options: [
                { id: 'descriptive-select', title: t(locale, 'analyze.methods.descriptive'), desc: locale === 'vi' ? 'Mean, SD, Min, Max, Median, Độ lệch, Độ nhọn' : 'Mean, SD, Min, Max, Median, Skewness, Kurtosis', icon: BarChart2, action: 'select', costType: 'descriptive' },
                { id: 'cronbach-select', title: t(locale, 'analyze.methods.cronbach'), desc: locale === 'vi' ? 'Độ tin cậy thang đo cổ điển (Cronbach Alpha)' : 'Classic scale reliability (Standard α)', icon: Shield, action: 'select', recommended: true, costType: 'cronbach' },
                { id: 'omega-select', title: t(locale, 'analyze.methods.omega'), desc: locale === 'vi' ? "McDonald's Omega — Sắp ra mắt (WebAssembly pending)" : "McDonald's ω — Coming Soon (WASM pending)", icon: Shield, action: 'select', costType: 'cronbach', disabled: true, badge: 'Coming Soon' },
                { id: 'frequency-select', title: locale === 'vi' ? 'Thống kê nhân khẩu học' : 'Demographics / Frequency', desc: locale === 'vi' ? 'Phân tích tần suất, tỷ lệ % (Giới tính, Thu nhập...)' : 'Frequency and percentage for categorical data', icon: Users, action: 'select', costType: 'descriptive' },
            ]
        },
        {
            id: 'comparison',
            name: locale === 'vi' ? 'So sánh nhóm' : 'Group Comparison',
            description: locale === 'vi' ? 'So sánh giá trị trung bình giữa các đối tượng' : 'Compare means across segments',
            icon: GitCompare,
            options: [
                { id: 'ttest-select', title: t(locale, 'analyze.methods.ttest'), desc: locale === 'vi' ? 'So sánh 2 nhóm độc lập (Independent T-Test)' : 'Independent Samples T-Test (2 groups)', icon: GitCompare, action: 'select', costType: 'ttest-indep' },
                { id: 'ttest-paired-select', title: t(locale, 'analyze.methods.ttest_paired'), desc: locale === 'vi' ? 'So sánh trước-sau hoặc theo cặp (Paired T-Test)' : 'Paired Samples T-Test (before-after)', icon: Users, action: 'select', costType: 'ttest-paired' },
                { id: 'anova-select', title: t(locale, 'analyze.methods.anova'), desc: locale === 'vi' ? 'So sánh từ 3 nhóm trở lên (One-Way ANOVA)' : 'One-Way Analysis of Variance (>2 groups)', icon: Layers, action: 'select', costType: 'anova' },
                { id: 'twoway-anova-select', title: 'Two-Way ANOVA', desc: locale === 'vi' ? 'ANOVA 2 nhân tố có tính đến hiệu ứng tương tác' : 'Factorial Design ANOVA with Interaction', icon: Grid3x3, action: 'select', costType: 'anova' },
                { id: 'mannwhitney-select', title: 'Mann-Whitney U', desc: locale === 'vi' ? 'Kiểm định phi tham số thay thế T-Test' : 'Non-parametric alternative to T-Test', icon: Activity, action: 'select', costType: 'mann-whitney' },
                { id: 'kruskalwallis-select', title: 'Kruskal-Wallis H', desc: locale === 'vi' ? 'Kiểm định phi tham số thay thế ANOVA' : 'Non-parametric alternative to ANOVA', icon: Layers, action: 'select', costType: 'anova' },
                { id: 'wilcoxon-select', title: 'Wilcoxon Rank', desc: locale === 'vi' ? 'So sánh cặp phi tham số (Non-parametric paired)' : 'Non-parametric paired sample test', icon: ArrowRightLeft, action: 'select', costType: 'ttest-paired' },
            ]
        },
        {
            id: 'relationship',
            name: locale === 'vi' ? 'Tương quan & Hồi quy' : 'Correlation & Regression',
            description: locale === 'vi' ? 'Phân tích nhân quả và mối liên hệ' : 'Analyze causality and associations',
            icon: Network,
            options: [
                { id: 'correlation', title: t(locale, 'analyze.methods.correlation'), desc: locale === 'vi' ? 'Hệ số tương quan Pearson/Spearman (R)' : 'Pearson/Spearman Correlation Matrix (R)', icon: Network, action: 'run', costType: 'correlation' },
                { id: 'regression-select', title: t(locale, 'analyze.methods.regression'), desc: locale === 'vi' ? 'Hồi quy tuyến tính bội với kiểm định đa cộng tuyến' : 'Multiple Linear Regression with β and VIF', icon: TrendingUp, action: 'select', costType: 'regression' },
                { id: 'logistic-select', title: 'Logistic Regression', desc: locale === 'vi' ? 'Hồi quy nhị phân dự báo khả năng xảy ra' : 'Binary Logistic for probability prediction', icon: Binary, action: 'select', costType: 'regression' },
                { id: 'mediation-select', title: t(locale, 'analyze.methods.mediation'), desc: locale === 'vi' ? 'Phân tích trung gian (Mediation Analysis)' : 'Pathways through mediator variables', icon: Target, action: 'select', costType: 'regression' },
                { id: 'moderation-select', title: t(locale, 'analyze.methods.moderation'), desc: locale === 'vi' ? 'Phân tích điều tiết (Moderation Analysis)' : 'Interaction effects of moderator variables', icon: Shuffle, action: 'select', costType: 'regression' },
            ]
        },
        {
            id: 'factor',
            name: locale === 'vi' ? 'Nhân tố & SEM' : 'Factor Analysis & SEM',
            description: locale === 'vi' ? 'Khám phá và xác nhận cấu trúc đo lường' : 'Explore and confirm measurement models',
            icon: Layers,
            options: [
                { id: 'efa-select', title: t(locale, 'analyze.methods.efa'), desc: locale === 'vi' ? 'Phân tích nhân tố khám phá (Parallel Analysis)' : 'Exploratory Factor Analysis with Parallel Test', icon: Grid3x3, action: 'select', recommended: true, costType: 'efa' },
                { id: 'cfa-select', title: t(locale, 'analyze.methods.cfa'), desc: locale === 'vi' ? 'Phân tích nhân tố khẳng định (Measurement Model)' : 'Confirmatory Factor Analysis (Validation)', icon: Network, action: 'select', badge: 'Elite', costType: 'cfa' },
                { id: 'cbsem-select', title: t(locale, 'analyze.methods.sem'), desc: locale === 'vi' ? 'Mô hình cấu trúc tuyến tính (Structural Model CB-SEM)' : 'Structural Equation Modeling (High-End CB-SEM)', icon: Layers, action: 'select', badge: 'Elite', costType: 'sem' },
            ]
        },
        {
            id: 'pls-sem-advanced',
            name: locale === 'vi' ? 'SmartPLS / PLS-SEM' : 'Advanced PLS-SEM',
            description: locale === 'vi' ? 'Các thuật toán đánh giá mô hình đo lường và cấu trúc' : 'Advanced evaluations for measurement and structural models',
            icon: Zap,
            options: [
                { id: 'plssem-select', title: 'PLS-SEM Algorithm', desc: locale === 'vi' ? 'Thuật toán chính (Path, R2, f2)' : 'Main algorithm', icon: Network, action: 'select', badge: 'Popular', costType: 'sem' },
                { id: 'bootstrap-select', title: 'Bootstrapping', desc: locale === 'vi' ? 'Kiểm định ý nghĩa thống kê' : 'Significance testing', icon: TrendingUp, action: 'select', costType: 'sem' },
                { id: 'mga-select', title: 'Multi-Group Analysis (MGA)', desc: locale === 'vi' ? 'Phân tích đa nhóm' : 'Multi-group analysis', icon: Users, action: 'select', costType: 'sem' },
                { id: 'ipma-select', title: 'IPMA', desc: locale === 'vi' ? 'Ma trận Tầm quan trọng - Hiệu suất' : 'Importance-Performance Matrix', icon: Target, action: 'select', costType: 'sem' },
                { id: 'blindfolding-select', title: 'Blindfolding (Q²)', desc: locale === 'vi' ? 'Kiểm tra độ liên quan dự đoán' : 'Predictive relevance', icon: Eye, action: 'select', costType: 'sem' },
                { id: 'htmt-select', title: 'HTMT', desc: locale === 'vi' ? 'Đánh giá giá trị phân biệt' : 'Discriminant validity', icon: GitCompare, action: 'select', costType: 'sem' },
                { id: 'vif-select', title: 'Collinearity (VIF)', desc: locale === 'vi' ? 'Kiểm tra đa cộng tuyến' : 'Collinearity statistics', icon: Shield, action: 'select', costType: 'sem' },
                { id: 'cmb-select', title: 'Common Method Bias (CMB)', desc: locale === 'vi' ? 'Kiểm tra phương sai phương pháp chung' : 'Harman\'s Single Factor Test', icon: AlertCircle, action: 'select', costType: 'sem' },
            ]
        },
        {
            id: 'categorical',
            name: locale === 'vi' ? 'Biến định danh' : 'Categorical Analysis',
            description: locale === 'vi' ? 'Xử lý dữ liệu định tính và tần số' : 'Frequency and qualitative data tests',
            icon: Grid3x3,
            options: [
                { id: 'chisq-select', title: t(locale, 'analyze.methods.chisq'), desc: locale === 'vi' ? 'Kiểm định Chi-bình phương (Tính độc lập)' : 'Pearson’s Chi-Square Test for Independence', icon: Grid3x3, action: 'select', costType: 'chisquare' },
                { id: 'fisher-select', title: "Fisher's Exact", desc: locale === 'vi' ? "Fisher Exact — Sắp ra mắt" : "Fisher's Exact — Coming Soon", icon: Grid3x3, action: 'select', costType: 'chisquare', disabled: true, badge: 'Coming Soon' },
            ]
        },
        {
            id: 'clustering',
            name: locale === 'vi' ? 'Phân cụm' : 'Clustering',
            description: locale === 'vi' ? 'Phân đoạn và nhận diện nhóm đặc trưng' : 'Segmentation and pattern recognition',
            icon: CircleDot,
            options: [
                { id: 'cluster-select', title: t(locale, 'analyze.methods.cluster'), desc: locale === 'vi' ? 'Phân cụm K-Means với tối ưu hóa tâm cụm' : 'K-Means clustering / Customer segmentation', icon: CircleDot, action: 'select', costType: 'efa' },
            ]
        }
    ];

    const filteredCategories = categories.map(cat => ({
        ...cat,
        options: cat.options.filter(opt => 
            opt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            opt.desc.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.options.length > 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 1-Click Auto Pilot Banner (Temporarily Disabled) */}
            <button
                disabled={true}
                className="w-full relative overflow-hidden group rounded-3xl p-8 bg-slate-100 border-2 border-slate-200 opacity-70 cursor-not-allowed text-left flex flex-col md:flex-row items-center gap-6"
            >
                <div className="absolute inset-0 opacity-20 mix-blend-overlay"></div>
                
                <div className="w-20 h-20 shrink-0 bg-slate-200 rounded-2xl flex items-center justify-center border border-slate-300">
                    <Rocket className="w-10 h-10 text-slate-400" />
                </div>
                
                <div className="flex-1 z-10 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-200 rounded-full border border-slate-300 mb-3">
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {locale === 'vi' ? 'Đang phát triển (Phase 2)' : 'In Development (Phase 2)'}
                        </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-400 tracking-tight mb-2">
                        {locale === 'vi' ? 'Phân Tích 1-Chạm (Auto Pilot)' : '1-Click Auto Pilot'}
                    </h2>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                        {locale === 'vi' 
                            ? 'Hệ thống tự động gom nhóm thang đo, loại biến rác và chạy toàn bộ quy trình (Cronbach, EFA, SEM) để xuất ra một báo cáo chuẩn luận văn.' 
                            : 'Auto-groups scales, cleans data, and runs the entire pipeline (Cronbach, EFA, SEM) to generate a publication-ready report.'}
                    </p>
                </div>
            </button>

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-900 transition-colors" />
                <input 
                    type="text" 
                    placeholder={locale === 'vi' ? "Tìm kiếm phương pháp phân tích..." : "Search statistical methods..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-white border border-blue-100 rounded-2xl text-blue-900 font-bold text-sm shadow-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-900 outline-none transition-all"
                />
                {searchQuery && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-50 rounded text-[9px] font-black text-blue-900 uppercase">
                        {filteredCategories.reduce((s, c) => s + c.options.length, 0)} results
                    </div>
                )}
            </div>

            {/* Grid Area */}
            <div className="space-y-4 pb-20">
                {filteredCategories.map((cat) => {
                    const isExpanded = expandedCategories.includes(cat.id) || searchQuery.length > 0;
                    const Icon = cat.icon;

                    return (
                        <div key={cat.id} className="bg-white rounded-3xl border border-blue-100 shadow-xl shadow-blue-50/20 overflow-hidden transition-all duration-300">
                            {/* Category Header */}
                            <button 
                                type="button"
                                onClick={() => toggleCategory(cat.id)}
                                data-testid={`category-${cat.id}`}
                                className={`w-full px-8 py-6 flex items-center justify-between transition-all ${isExpanded ? 'bg-blue-900 text-white' : 'bg-transparent text-blue-900 hover:bg-blue-50/50'}`}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-black text-base uppercase tracking-tight">{cat.name}</h3>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-60`}>{cat.description}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-4 transition-all ${isExpanded ? 'bg-white/10' : 'bg-blue-50'} px-4 py-2 rounded-xl`}>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{cat.options.length} methods</span>
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </div>
                            </button>

                            {/* Options Grid */}
                            {isExpanded && (
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                                    {cat.options.map((opt) => {
                                        const OptIcon = opt.icon;
                                        return (
                                            <button
                                                type="button"
                                                key={opt.id}
                                                data-testid={opt.id}
                                                onClick={() => opt.action === 'run' ? onRunAnalysis(opt.id) : onSelect(opt.id)}
                                                disabled={isAnalyzing || opt.disabled}
                                                className={`group relative p-6 bg-white rounded-2xl border-2 transition-all text-left flex flex-col justify-between h-full ${opt.disabled ? 'opacity-40 grayscale pointer-events-none' : 'border-slate-50 hover:border-blue-900 hover:shadow-2xl hover:-translate-y-1'}`}
                                            >
                                                {opt.recommended && (
                                                    <div className="absolute top-4 right-4 text-blue-600/20 group-hover:text-blue-600 transition-colors">
                                                        <Bookmark className="w-5 h-5 fill-current" />
                                                    </div>
                                                )}
                                                {opt.badge && (
                                                    <div className="absolute -top-2 -right-1">
                                                        <span className="px-2 py-0.5 bg-blue-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg border border-white/20">{opt.badge}</span>
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-all shadow-inner">
                                                        <OptIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-blue-900 uppercase tracking-tighter text-sm mb-1 group-hover:text-blue-900">{opt.title}</h4>
                                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-tight">{opt.desc}</p>
                                                    </div>
                                                </div>

                                                {opt.costType && (
                                                    <div className="pt-3 border-t border-slate-50 group-hover:border-blue-50 transition-colors">
                                                        <PointBadge analysisType={opt.costType} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
