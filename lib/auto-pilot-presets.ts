export type PresetId = 'pls-sem' | 'cb-sem' | 'regression' | 'compare' | 'scale' | 'logistic' | 'custom';

export interface AutoPilotPreset {
    id: PresetId;
    name: string;
    icon: string;
    description: string;
    steps: string[];
    references: string;
    requiresPaths: boolean;
    requiresGroups: boolean;
    bootstrapDefault?: number;
    color: string;
    bgColor: string;
    badge?: string;
    available: boolean;
}

export const AUTO_PILOT_PRESETS: AutoPilotPreset[] = [
    {
        id: 'pls-sem',
        name: 'PLS-SEM Standard',
        icon: '🏆',
        description: 'Mô hình phương trình cấu trúc bình phương tối thiểu riêng phần.',
        steps: ['Descriptive', 'Cronbach', 'EFA', 'PLS-SEM', 'Bootstrap', 'Blindfolding'],
        references: 'Hair et al. (2019)',
        requiresPaths: true,
        requiresGroups: true,
        bootstrapDefault: 500,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        badge: 'Phổ biến nhất',
        available: false,
    },
    {
        id: 'cb-sem',
        name: 'CB-SEM (Lavaan)',
        icon: '📐',
        description: 'Mô hình phương trình cấu trúc dựa trên hiệp phương sai.',
        steps: ['Descriptive', 'Cronbach', 'CFA', 'SEM', 'Mediation'],
        references: 'Kline (2015), Hu & Bentler (1999)',
        requiresPaths: true,
        requiresGroups: true,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        available: false,
    },
    {
        id: 'regression',
        name: 'Hồi quy Đa biến',
        icon: '📊',
        description: 'Dự báo biến phụ thuộc liên tục từ nhiều biến độc lập.',
        steps: ['Descriptive', 'Correlation', 'Cronbach', 'Linear Regression'],
        references: 'Cohen et al. (2003)',
        requiresPaths: true, // we use paths to determine DV and IVs (from -> to)
        requiresGroups: true,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        available: false,
    },
    {
        id: 'compare',
        name: 'So sánh Nhóm',
        icon: '🔬',
        description: 'So sánh trung bình giữa 2 hoặc nhiều nhóm.',
        steps: ['Normality', 'T-Test / ANOVA', 'Post-hoc', 'Effect Size'],
        references: 'Cohen (1988)',
        requiresPaths: false,
        requiresGroups: false,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        available: false,
    },
    {
        id: 'scale',
        name: 'Phát triển Thang đo',
        icon: '📝',
        description: 'Xây dựng và kiểm chứng thang đo mới.',
        steps: ['Item Analysis', 'EFA', 'Cronbach', 'CFA'],
        references: 'DeVellis & Thorpe (2021)',
        requiresPaths: false,
        requiresGroups: true,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        available: false,
    },
    {
        id: 'logistic',
        name: 'Logistic Regression',
        icon: '🎲',
        description: 'Dự báo kết quả nhị phân (mua/không mua).',
        steps: ['Descriptive', 'Chi-Square', 'Logistic', 'Classification'],
        references: 'Hosmer & Lemeshow (2013)',
        requiresPaths: true,
        requiresGroups: true,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
        available: false,
    },
    {
        id: 'custom',
        name: 'Tùy chỉnh (Custom)',
        icon: '⚙️',
        description: 'Tự chọn các phương pháp theo nhu cầu.',
        steps: ['User defined'],
        references: 'Tùy chọn',
        requiresPaths: true,
        requiresGroups: true,
        color: 'text-slate-600',
        bgColor: 'bg-slate-50',
        available: false, // Phase 2
    }
];
