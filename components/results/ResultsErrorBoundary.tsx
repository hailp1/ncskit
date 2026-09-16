'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ResultsErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Results rendering error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-3xl mx-auto mt-8 text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-red-900 mb-2">Không thể hiển thị kết quả</h2>
                    <p className="text-red-700 mb-6 max-w-md mx-auto">
                        Đã có lỗi xảy ra trong quá trình kết xuất giao diện kết quả. Phép tính có thể đã trả về định dạng dữ liệu không như mong đợi.
                    </p>
                    {this.state.error && (
                        <div className="bg-white/60 p-4 rounded-lg text-left overflow-x-auto text-xs text-red-800 font-mono border border-red-100/50">
                            {this.state.error.toString()}
                        </div>
                    )}
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                    >
                        Thử lại
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
