import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ScientificNote } from '../shared/ScientificNote';
import { getStoredLocale, type Locale } from '@/lib/i18n';

interface CMBResultsProps {
    results: {
        variance_explained: number;
        has_cmb: boolean;
        total_items: number;
    };
    columns?: string[];
}

export default function CMBResults({ results, columns }: CMBResultsProps) {
    const [locale, setLocale] = React.useState<Locale>('vi');

    React.useEffect(() => {
        setLocale(getStoredLocale());
    }, []);

    const isError = results?.variance_explained === 0;

    if (!results || isError) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-red-600" />
                <p className="text-red-800 font-medium text-sm">
                    {locale === 'vi' 
                        ? 'Không thể tính toán CMB. Có thể bạn đã chọn quá ít biến hoặc dữ liệu không phù hợp (hằng số, quá nhiều missing values).'
                        : 'Cannot calculate CMB. You may have selected too few indicators or the data is inappropriate (constants, too many missing values).'}
                </p>
            </div>
        );
    }

    // Always dynamically evaluate instead of trusting backend flag
    const hasCMB = results.variance_explained > 50;

    return (
        <div className="space-y-6 pb-10 animate-in fade-in duration-700">
            {/* Main Result Card */}
            <Card className={`border-2 shadow-sm ${hasCMB ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-black uppercase flex items-center gap-3">
                        {hasCMB ? (
                            <>
                                <AlertCircle className="w-6 h-6 text-rose-600" />
                                <span className="text-rose-800">
                                    {locale === 'vi' ? 'Cảnh báo Phương sai phương pháp chung (CMB)' : 'Common Method Bias (CMB) Warning'}
                                </span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                <span className="text-emerald-800">
                                    {locale === 'vi' ? 'Không có vấn đề Phương sai phương pháp chung' : 'No Common Method Bias Issue Detected'}
                                </span>
                            </>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                {locale === 'vi' ? 'Variance Explained (Phương sai trích)' : 'Variance Explained'}
                            </p>
                            <p className={`text-3xl font-black ${hasCMB ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {results.variance_explained.toFixed(2)}%
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                {locale === 'vi' ? 'Số lượng biến (Indicators)' : 'Number of Indicators'}
                            </p>
                            <p className="text-3xl font-black text-slate-700">
                                {results.total_items || (columns ? columns.length : 'N/A')}
                            </p>
                        </div>
                    </div>
                    
                    <p className="mt-4 text-sm font-medium text-slate-700 leading-relaxed">
                        {locale === 'vi' ? (
                            <>
                                Phân tích Harman&apos;s Single Factor Test (Podsakoff et al., 2003) cho thấy một nhân tố duy nhất giải thích{' '}
                                <span className="font-bold">{results.variance_explained.toFixed(2)}%</span> phương sai của toàn bộ {results.total_items} biến quan sát. 
                                Do giá trị này <span className="font-bold">{hasCMB ? 'lớn hơn' : 'nhỏ hơn'}</span> ngưỡng 50%, 
                                {hasCMB ? ' dữ liệu CÓ THỂ bị ảnh hưởng bởi phương sai phương pháp chung.' : ' dữ liệu KHÔNG bị ảnh hưởng nghiêm trọng bởi phương sai phương pháp chung.'}
                            </>
                        ) : (
                            <>
                                Harman&apos;s Single Factor Test (Podsakoff et al., 2003) reveals that a single factor explains{' '}
                                <span className="font-bold">{results.variance_explained.toFixed(2)}%</span> of the variance for all {results.total_items} indicators. 
                                Since this value is <span className="font-bold">{hasCMB ? 'greater than' : 'less than'}</span> the 50% threshold, 
                                {hasCMB ? ' the data MAY BE affected by common method bias.' : ' the data is NOT severely affected by common method bias.'}
                            </>
                        )}
                    </p>
                </CardContent>
            </Card>

            {/* Scientific Note */}
            <ScientificNote 
                insight={locale === 'vi' 
                    ? "Common Method Bias (CMB) xảy ra khi phương sai đo lường được quy cho phương pháp đo lường (như bảng hỏi tự đánh giá, cùng một thời điểm thu thập) hơn là do các biến độc lập thực sự ảnh hưởng đến biến phụ thuộc. Theo Harman's single factor test, nếu một nhân tố duy nhất giải thích hơn 50% tổng phương sai, thì dữ liệu có nguy cơ bị CMB cao (Podsakoff et al., 2003)."
                    : "Common Method Bias (CMB) occurs when variations in responses are caused by the instrument rather than the actual predispositions of the respondents. According to Harman's single factor test, if a single factor explains more than 50% of the total variance, the data has a high risk of CMB (Podsakoff et al., 2003)."
                }
                citation="Podsakoff et al. (2003)"
                thresholds={[
                    { label: locale === 'vi' ? 'Không có CMB' : 'No CMB Issue', value: '< 50%', status: 'good' },
                    { label: locale === 'vi' ? 'Nguy cơ CMB' : 'CMB Risk', value: '≥ 50%', status: 'warn' }
                ]}
                reference={[
                    "Podsakoff, P. M., MacKenzie, S. B., Lee, J. Y., & Podsakoff, N. P. (2003). Common method biases in behavioral research: A critical review of the literature and recommended remedies. Journal of Applied Psychology, 88(5), 879-903."
                ]}
                assumptions={[
                    locale === 'vi' 
                        ? "Harman's Single Factor test chỉ là một công cụ chẩn đoán sơ bộ. Nó thường bị chỉ trích là kém nhạy (không phát hiện được CMB ở mức độ vừa)." 
                        : "Harman's Single Factor test is a preliminary diagnostic tool. It is often criticized for being insensitive (failing to detect moderate CMB).",
                    locale === 'vi'
                        ? "Để kiểm tra CMB một cách mạnh mẽ hơn, các nhà nghiên cứu thường sử dụng phương pháp Common Latent Factor (CLF) trong AMOS hoặc full collinearity VIFs (< 3.3) trong PLS-SEM theo Kock (2015)."
                        : "For a more robust check, researchers often use the Common Latent Factor (CLF) in AMOS or full collinearity VIFs (< 3.3) in PLS-SEM (Kock, 2015)."
                ]}
                pitfalls={[
                    locale === 'vi'
                        ? "Nếu kết quả Harman > 50%, bạn cần giải trình lý do (có thể do thang đo đã được xác nhận là uni-dimensional) hoặc áp dụng các kỹ thuật thống kê nâng cao (như Partial Least Squares) để xem xét ảnh hưởng của nó tới các hệ số đường dẫn."
                        : "If Harman > 50%, you need to justify it (e.g., scales are uni-dimensional) or apply advanced statistical techniques to account for method variance in path coefficients."
                ]}
            />
        </div>
    );
}
