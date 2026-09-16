'use client';

import { useState } from 'react';
import { Play, AlertCircle, Loader2, TrendingUp, Target, Users, Eye, Zap, GitCompare, Shield } from 'lucide-react';
import { runSimpleBootstrapping, runIPMA, runMGA, runSimpleBlindfolding, runPLSSEM, runHarmanCMB, runHTMTMatrix, runVIFCheck } from '@/lib/webr/pls-sem';
import { runCBSEM } from '@/lib/webr/analyses/cb-sem';

type AdvancedMethod = 'bootstrap' | 'ipma' | 'mga' | 'blindfolding' | 'cbsem' | 'cfa' | 'plssem' | 'cmb' | 'htmt' | 'vif';

interface AdvancedMethodViewProps {
    method: AdvancedMethod;
    data: number[][];
    columnNames: string[];
    onBack: () => void;
    setResults: (results: any) => void;
}

export default function AdvancedMethodView({
    method,
    data = [],
    columnNames = [],
    onBack,
    setResults
}: AdvancedMethodViewProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Method-specific state
    const [nBootstrap, setNBootstrap] = useState(5000);
    const [targetIndex, setTargetIndex] = useState(0);
    const [groupVariable, setGroupVariable] = useState<number[]>([]);
    const [omissionDistance, setOmissionDistance] = useState(7);
    const [modelSyntax, setModelSyntax] = useState('');
    const [analysisType, setAnalysisType] = useState<'sem' | 'cfa'>('sem');

    const methodConfig = {
        bootstrap: {
            title: 'Bootstrapping',
            icon: TrendingUp,
            color: 'purple',
            description: 'Kiểm định độ tin cậy thống kê với resampling'
        },
        ipma: {
            title: 'IPMA',
            icon: Target,
            color: 'amber',
            description: 'Importance-Performance Matrix Analysis'
        },
        mga: {
            title: 'Multi-Group Analysis',
            icon: Users,
            color: 'indigo',
            description: 'So sánh giữa các nhóm'
        },
        blindfolding: {
            title: 'Blindfolding',
            icon: Eye,
            color: 'teal',
            description: 'Kiểm tra độ liên quan dự đoán (Q²)'
        },
        cbsem: {
            title: 'CB-SEM (AMOS Style)',
            icon: TrendingUp,
            color: 'indigo',
            description: 'Mô hình cấu trúc hiệp phương sai (Lavaan)'
        },
        cfa: {
            title: 'CFA (Lavaan)',
            icon: Target,
            color: 'blue',
            description: 'Phân tích nhân tố khẳng định'
        },
        plssem: {
            title: 'PLS-SEM Algorithm',
            icon: Zap,
            color: 'green',
            description: 'Thuật toán bình phương tối thiểu riêng phần (seminr)'
        },
        cmb: {
            title: 'Common Method Bias (CMB)',
            icon: AlertCircle,
            color: 'amber',
            description: 'Kiểm tra phương sai phương pháp chung (Harman\'s Single Factor)'
        },
        htmt: {
            title: 'HTMT Ratio',
            icon: GitCompare,
            color: 'indigo',
            description: 'Đánh giá giá trị phân biệt'
        },
        vif: {
            title: 'Collinearity (VIF)',
            icon: Shield,
            color: 'blue',
            description: 'Kiểm tra đa cộng tuyến'
        }
    };

    const config = methodConfig[method];
    const Icon = config.icon;

    const handleRun = async () => {
        setIsRunning(true);
        setError(null);

        try {
            let result;

            switch (method) {
                case 'bootstrap':
                    result = await runSimpleBootstrapping(data, nBootstrap);
                    break;
                case 'ipma':
                    result = await runIPMA(data, targetIndex);
                    break;
                case 'mga':
                    if (groupVariable.length === 0) {
                        throw new Error('Vui lòng nhập biến nhóm');
                    }
                    
                    if (!modelSyntax.trim()) {
                        throw new Error('Vui lòng nhập Model Syntax cho MGA');
                    }

                    // Parse MGA Syntax
                    const measurementModel = [];
                    const structuralModel = [];
                    const lines = modelSyntax.split('\n');
                    
                    for (const line of lines) {
                        const cleanLine = line.split('#')[0].trim();
                        if (!cleanLine) continue;
                        
                        if (cleanLine.includes('=~')) {
                            const [construct, itemsStr] = cleanLine.split('=~').map(s => s.trim());
                            const items = itemsStr.split('+').map(s => s.trim());
                            const itemIndices = items.map(item => columnNames.indexOf(item)).filter(idx => idx !== -1);
                            
                            if (itemIndices.length > 0) {
                                measurementModel.push({ construct, items: itemIndices });
                            }
                        } else if (cleanLine.includes('~') || cleanLine.includes('->')) {
                            let from, to;
                            if (cleanLine.includes('->')) {
                                [from, to] = cleanLine.split('->').map(s => s.trim());
                            } else {
                                [to, from] = cleanLine.split('~').map(s => s.trim()); // Lavaan style: Y ~ X means X -> Y
                            }
                            if (from && to) {
                                structuralModel.push({ from, to });
                            }
                        }
                    }

                    if (measurementModel.length === 0) {
                        throw new Error('Không tìm thấy Measurement Model hợp lệ. Vui lòng kiểm tra lại cú pháp hoặc tên biến.');
                    }
                    
                    result = await runMGA(data, measurementModel, structuralModel, groupVariable);
                    break;
                case 'blindfolding':
                    result = await runSimpleBlindfolding(data, omissionDistance);
                    break;
                case 'cbsem':
                case 'cfa':
                    result = await runCBSEM(data, columnNames, modelSyntax, method === 'cfa' ? 'cfa' : 'sem');
                    break;
                case 'cmb':
                case 'htmt':
                    if (!modelSyntax.trim()) {
                        throw new Error('Vui lòng nhập Model Syntax (nhóm biến) cho kiểm định này');
                    }
                    const parsedMM = [];
                    const mmLines = modelSyntax.split('\n');
                    for (const line of mmLines) {
                        const cleanLine = line.split('#')[0].trim();
                        if (cleanLine.includes('=~')) {
                            const [construct, itemsStr] = cleanLine.split('=~').map(s => s.trim());
                            const items = itemsStr.split('+').map(s => s.trim());
                            const itemIndices = items.map(item => columnNames.indexOf(item)).filter(idx => idx !== -1);
                            if (itemIndices.length > 0) {
                                parsedMM.push({ name: construct, items: itemIndices });
                            }
                        }
                    }
                    if (parsedMM.length === 0) {
                        throw new Error('Không tìm thấy cấu trúc nhóm biến hợp lệ. Hãy khai báo dạng: Construct =~ Var1 + Var2');
                    }
                    if (method === 'cmb') {
                        result = await runHarmanCMB(data, parsedMM);
                    } else {
                        result = await runHTMTMatrix(data, parsedMM);
                    }
                    break;
                case 'vif':
                    result = await runVIFCheck(data, targetIndex);
                    break;
                case 'plssem':
                    if (!modelSyntax.trim()) {
                        throw new Error('Vui lòng nhập Model Syntax cho PLS-SEM');
                    }

                    const measurementModelPls = [];
                    const structuralModelPls = [];
                    const linesPls = modelSyntax.split('\n');
                    
                    for (const line of linesPls) {
                        const cleanLine = line.split('#')[0].trim();
                        if (!cleanLine) continue;
                        
                        if (cleanLine.includes('=~')) {
                            const [construct, itemsStr] = cleanLine.split('=~').map(s => s.trim());
                            const items = itemsStr.split('+').map(s => s.trim());
                            const itemIndices = items.map(item => columnNames.indexOf(item)).filter(idx => idx !== -1);
                            
                            if (itemIndices.length > 0) {
                                measurementModelPls.push({ construct, items: itemIndices });
                            }
                        } else if (cleanLine.includes('~') || cleanLine.includes('->')) {
                            let from, to;
                            if (cleanLine.includes('->')) {
                                [from, to] = cleanLine.split('->').map(s => s.trim());
                            } else {
                                [to, from] = cleanLine.split('~').map(s => s.trim());
                            }
                            if (from && to) {
                                structuralModelPls.push({ from, to });
                            }
                        }
                    }

                    if (measurementModelPls.length === 0) {
                        throw new Error('Không tìm thấy Measurement Model hợp lệ. Vui lòng kiểm tra lại cú pháp hoặc tên biến.');
                    }
                    
                    result = await runPLSSEM(data, measurementModelPls, structuralModelPls);
                    break;
            }

            setResults(result);
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra khi chạy phân tích');
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className={`bg-gradient-to-r from-${config.color}-600 to-${config.color}-700 text-white rounded-lg p-6`}>
                <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">{config.title}</h2>
                </div>
                <p className={`text-${config.color}-100`}>{config.description}</p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-red-800 font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* Method-specific inputs */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Tùy chọn phân tích</h3>

                {method === 'bootstrap' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Số lần Bootstrap (iterations)
                        </label>
                        <input
                            type="number"
                            value={nBootstrap}
                            onChange={(e) => setNBootstrap(parseInt(e.target.value))}
                            min={1000}
                            max={10000}
                            step={1000}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Khuyến nghị: 5000-10000 iterations cho kết quả ổn định
                        </p>
                    </div>
                )}

                {method === 'ipma' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Biến mục tiêu (Target Variable)
                        </label>
                        <select
                            value={targetIndex}
                            onChange={(e) => setTargetIndex(parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                            {columnNames.map((name, idx) => (
                                <option key={idx} value={idx}>
                                    {name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            Chọn biến phụ thuộc để phân tích importance-performance
                        </p>
                    </div>
                )}

                {method === 'mga' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Biến nhóm (Group Variable)
                            </label>
                            <input
                                type="text"
                                placeholder="Ví dụ: 1,1,2,2,1,2,1,2,..."
                                onChange={(e) => {
                                    const values = e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                                    setGroupVariable(values);
                                }}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Nhập các giá trị nhóm (1, 2, 3...) cách nhau bởi dấu phẩy. Số lượng phải bằng số dòng dữ liệu ({data.length})
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Model Syntax (MGA)
                            </label>
                            <textarea
                                value={modelSyntax}
                                onChange={(e) => setModelSyntax(e.target.value)}
                                placeholder={"# Định nghĩa Measurement Model\nF1 =~ x1 + x2\nF2 =~ x3 + x4\n\n# Định nghĩa Structural Model\nF1 -> F2  (hoặc F2 ~ F1)"}
                                rows={6}
                                className="w-full px-4 py-3 font-mono text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                            />
                            <div className="mt-2 text-xs text-slate-500 italic">
                                Sử dụng '=~' cho nhân tố, '-&gt;' (hoặc '~' ngược lại) cho quan hệ nhân quả. Lưu ý: Tên biến (x1, x2) phải khớp chính xác với cột dữ liệu.
                            </div>
                        </div>
                    </>
                )}

                {method === 'blindfolding' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Omission Distance
                        </label>
                        <input
                            type="number"
                            value={omissionDistance}
                            onChange={(e) => setOmissionDistance(parseInt(e.target.value))}
                            min={5}
                            max={10}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Khoảng cách giữa các điểm bị loại bỏ. Khuyến nghị: 5-10
                        </p>
                    </div>
                )}

                {(method === 'cbsem' || method === 'cfa' || method === 'plssem' || method === 'cmb' || method === 'htmt') && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Model Syntax (Lavaan/SmartPLS Style)
                            </label>
                            <textarea
                                value={modelSyntax}
                                onChange={(e) => setModelSyntax(e.target.value)}
                                placeholder={method === 'cfa' 
                                    ? "# Định nghĩa nhân tố (CFA)\nF1 =~ x1 + x2 + x3\nF2 =~ x4 + x5 + x6" 
                                    : "# Định nghĩa cấu trúc (SEM)\nF1 =~ x1 + x2 + x3\nF2 =~ x4 + x5 + x6\nF2 ~ F1 # Hoặc F1 -> F2"}
                                rows={6}
                                className="w-full px-4 py-3 font-mono text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                            />
                            <div className="mt-2 text-xs text-slate-500 italic">
                                Sử dụng '=~' cho nhân tố, '-&gt;' hoặc '~' cho quan hệ nhân quả. Mỗi dòng một câu lệnh.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button type="button"
                    onClick={onBack}
                    disabled={isRunning}
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-50"
                >
                    ← Quay lại
                </button>
                <button type="button"
                    onClick={handleRun}
                    disabled={isRunning}
                    className={`flex-1 px-6 py-3 bg-${config.color}-600 text-white rounded-lg hover:bg-${config.color}-700 font-bold disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                    {isRunning ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Đang chạy...
                        </>
                    ) : (
                        <>
                            <Play className="w-5 h-5" />
                            Chạy phân tích
                        </>
                    )}
                </button>
            </div>

            {/* Info Box */}
            <div className={`bg-${config.color}-50 border border-${config.color}-200 rounded-lg p-4`}>
                <h4 className={`font-bold text-${config.color}-900 mb-2`}>ℹ️ Thông tin</h4>
                <ul className={`text-sm text-${config.color}-800 space-y-1`}>
                    {method === 'bootstrap' && (
                        <>
                            <li>• Bootstrap tạo {nBootstrap.toLocaleString()} mẫu ngẫu nhiên từ dữ liệu gốc</li>
                            <li>• Tính khoảng tin cậy 95% cho các tham số</li>
                            <li>• Kiểm định ý nghĩa thống kê mà không cần giả định phân phối chuẩn</li>
                        </>
                    )}
                    {method === 'ipma' && (
                        <>
                            <li>• Importance: Tầm quan trọng của từng biến đối với biến mục tiêu</li>
                            <li>• Performance: Hiệu suất hiện tại của từng biến</li>
                            <li>• Xác định biến nào cần cải thiện để tối đa hóa hiệu quả</li>
                        </>
                    )}
                    {method === 'mga' && (
                        <>
                            <li>• So sánh giá trị trung bình giữa các nhóm</li>
                            <li>• Kiểm định ANOVA để xác định sự khác biệt có ý nghĩa</li>
                            <li>• Hữu ích để phân tích theo giới tính, độ tuổi, khu vực...</li>
                        </>
                    )}
                    {method === 'blindfolding' && (
                        <>
                            <li>• Loại bỏ một số điểm dữ liệu và dự đoán lại</li>
                            <li>• Tính Q² để đánh giá khả năng dự đoán của mô hình</li>
                            <li>• Q² {'>'} 0 cho thấy mô hình có predictive relevance</li>
                        </>
                    )}
                    {(method === 'cbsem' || method === 'cfa') && (
                        <>
                            <li>• Phân tích dựa trên ma trận hiệp phương sai (Covariance-based)</li>
                            <li>• Cung cấp Fit Indices: CFI, TLI {'>'} 0.90; RMSEA {'<'} 0.08</li>
                            <li>• Xử lý dữ liệu khuyết bằng thuật toán FIML (tiêu chuẩn học thuật)</li>
                        </>
                    )}
                    {method === 'plssem' && (
                        <>
                            <li>• Phân tích thuật toán PLS-SEM (Variance-based SEM) qua thư viện seminr</li>
                            <li>• Đặc biệt hiệu quả với mô hình phức tạp và dự đoán (Prediction)</li>
                            <li>• Cung cấp R², f², hệ số tải, Fornell-Larcker, HTMT, VIF...</li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
}
