import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import StructuredData from '@/components/seo/StructuredData';
import { ArrowRight, ShieldCheck, Zap, Clock, FileText, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: "Dịch vụ Xử lý Số liệu Luận văn & Chạy SPSS/SmartPLS Trực tuyến",
  description: "Giải pháp thay thế hoàn hảo cho dịch vụ nhận chạy SPSS, AMOS, SmartPLS. Hệ thống phân tích định lượng tự động 100%, bảo mật tuyệt đối, xuất báo cáo ngay lập tức.",
  keywords: ["dịch vụ chạy spss", "nhận làm spss", "xử lý số liệu luận văn", "thuê chạy smartpls", "chạy amos giá rẻ", "sửa lỗi dữ liệu spss", "phần mềm phân tích dữ liệu", "ncsstat"],
  alternates: {
    canonical: '/dich-vu-phan-tich',
  },
  openGraph: {
    title: "Dịch vụ Xử lý Số liệu Định lượng (SPSS, AMOS, SmartPLS)",
    description: "Công cụ tự động chạy mô hình CFA, EFA, PLS-SEM và xuất báo cáo PDF chuẩn học thuật. Nhanh hơn 10x so với thuê dịch vụ ngoài.",
    url: "https://open.ncskit.org/dich-vu-phan-tich",
    type: "website",
  }
};

export default function AnalyticsServiceLandingPage() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NCSKIT - Nền tảng Phân tích Thống kê Tự động",
    "operatingSystem": "Web Browser",
    "applicationCategory": "EducationalApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "VND"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "1250"
    },
    "description": "Giải pháp thay thế dịch vụ chạy SPSS, SmartPLS truyền thống. Xử lý số liệu luận văn tự động 100% bằng WebR."
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <StructuredData data={schemaData} />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#10b981]/10 to-[#3b82f6]/10 z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold mb-6">
            🚀 Giải pháp phân tích dữ liệu thế hệ mới
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
            Không cần thuê <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Dịch vụ SPSS / SmartPLS</span> nữa!
          </h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl text-gray-600 mx-auto mb-10">
            Hệ thống <b>NCSKIT</b> giúp bạn tự động xử lý số liệu luận văn, chạy mô hình EFA, CFA, PLS-SEM trực tiếp trên trình duyệt. Xuất báo cáo PDF chuẩn APA chỉ trong <b className="text-emerald-600">1 click</b>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/analyze" 
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
            >
              Chạy dữ liệu ngay (Miễn phí)
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              href="/knowledge" 
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-xl text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm transition-all duration-200"
            >
              Xem hướng dẫn thao tác
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tại sao nên dùng Web thay vì thuê người làm?</h2>
            <p className="text-lg text-gray-600">Giải quyết triệt để 3 rủi ro lớn nhất khi thuê dịch vụ ngoài.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">100% Bảo mật dữ liệu</h3>
              <p className="text-gray-600 mb-4">Thuê ngoài dễ bị rò rỉ dữ liệu nghiên cứu. Với NCSKIT, mọi thuật toán chạy cục bộ trên máy bạn. File Excel của bạn <b className="text-gray-900">không bao giờ</b> được tải lên Server.</p>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Kết quả ngay lập tức</h3>
              <p className="text-gray-600 mb-4">Thay vì chờ đợi 3-5 ngày từ các dịch vụ làm thuê, hệ thống R-Wasm của chúng tôi tính toán và vẽ biểu đồ trong chưa đầy <b>5 giây</b>.</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Báo cáo chuẩn học thuật</h3>
              <p className="text-gray-600 mb-4">Không chỉ đưa ra con số, NCSKIT tự động xuất PDF diễn giải kết quả bằng tiếng Việt, kèm theo trích dẫn (Citations) chuẩn APA.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-emerald-900 rounded-3xl p-8 md:p-16 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-10">
              <Zap className="w-96 h-96" />
            </div>
            
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Xử lý toàn bộ quy trình luận văn định lượng</h2>
                <p className="text-emerald-100 text-lg mb-8">Nền tảng hỗ trợ đầy đủ các phép kiểm định phổ biến nhất mà các hội đồng bảo vệ yêu cầu.</p>
                <div className="space-y-4">
                  {[
                    "Kiểm định độ tin cậy Cronbach's Alpha",
                    "Phân tích nhân tố khám phá (EFA) & khẳng định (CFA)",
                    "Kiểm định T-Test, ANOVA, Chi-Square",
                    "Phân tích Tương quan Pearson & Hồi quy tuyến tính",
                    "Mô hình phương trình cấu trúc PLS-SEM & CB-SEM",
                    "Phân tích Bootstrapping, Blindfolding, IPMA"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mr-3 flex-shrink-0" />
                      <span className="text-emerald-50">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 w-full max-w-md">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-emerald-400 mb-2">0đ</div>
                    <div className="text-emerald-100">Bắt đầu hoàn toàn miễn phí</div>
                  </div>
                  <Link 
                    href="/analyze" 
                    className="w-full flex items-center justify-center px-6 py-4 text-emerald-900 font-bold bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors"
                  >
                    Trải nghiệm NCSKIT ngay
                  </Link>
                  <p className="text-center text-emerald-200/60 text-sm mt-4">Cam kết không yêu cầu đăng nhập đối với dữ liệu mẫu.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
