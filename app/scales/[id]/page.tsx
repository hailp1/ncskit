import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSupabase } from '@/utils/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { 
    BookOpen, Quote, Layers, ChevronLeft, 
    Calendar, User, Tag, ArrowRight,
    FileSpreadsheet, ClipboardCheck, Info
} from 'lucide-react';
import Link from 'next/link';
import { STATIC_SCALES } from '@/lib/constants/scales-fallbacks';

// Cấu hình Metadata động cho SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const supabase = getSupabase();
    const { data: dbScale } = await supabase
        .from('scales')
        .select('*')
        .eq('id', params.id)
        .single();

    const scale = dbScale || STATIC_SCALES.find(s => s.id === params.id);

    if (!scale) return { title: 'Scale Not Found - ncsStat' };

    const title = `Thang đo ${scale.name_vi} - ${scale.author} (${scale.year}) | ncsStat`;
    const description = `Hệ thống câu hỏi, trích dẫn chuẩn APA và hướng dẫn sử dụng thang đo ${scale.name_vi} (${scale.name_en}). Tài liệu tham khảo uy tín cho nghiên cứu khoa học.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            url: `https://open.ncskit.org/scales/${params.id}`,
        }
    };
}

export default async function ScaleDetailPage({ params }: { params: { id: string } }) {
    const supabase = getSupabase();
    
    // Fetch dữ liệu thang đo và items
    const { data: dbScale, error } = await supabase
        .from('scales')
        .select('*, scale_items(*)')
        .eq('id', params.id)
        .single();

    const scale = dbScale || STATIC_SCALES.find(s => s.id === params.id);

    if (!scale) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            
            <main className="container mx-auto px-4 py-12 max-w-5xl">
                {/* Nút quay lại */}
                <Link 
                    href="/scales" 
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-8 transition-colors group"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Quay lại Thư viện
                </Link>

                <article className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 overflow-hidden border border-slate-100">
                    {/* Header Thang đo */}
                    <div className="bg-slate-900 p-8 md:p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <BookOpen className="w-64 h-64 rotate-12" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex flex-wrap gap-2 mb-6">
                                {Array.isArray(scale.category) ? scale.category.map((cat: string) => (
                                    <span key={cat} className="px-3 py-1 bg-indigo-500/20 rounded-full text-[10px] font-black tracking-widest uppercase text-indigo-300 border border-indigo-500/30">
                                        {cat}
                                    </span>
                                )) : (
                                    <span className="px-3 py-1 bg-indigo-500/20 rounded-full text-[10px] font-black tracking-widest uppercase text-indigo-300 border border-indigo-500/30">
                                        {scale.category}
                                    </span>
                                )}
                            </div>
                            
                            <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight tracking-tight">
                                {scale.name_vi}
                                <span className="block text-xl md:text-2xl text-slate-400 mt-2 font-bold">{scale.name_en}</span>
                            </h1>

                            <div className="flex flex-wrap gap-6 text-indigo-200 font-medium">
                                <div className="flex items-center gap-2">
                                    <User className="w-5 h-5 opacity-60" />
                                    <span>{scale.author}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 opacity-60" />
                                    <span>Năm: {scale.year}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Layers className="w-5 h-5 opacity-60" />
                                    <span>{scale.scale_items?.length || 0} Biến quan sát</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Cột trái: Nội dung chính */}
                        <div className="lg:col-span-2 space-y-12">
                            {/* Mô tả */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Tổng quan Thang đo</h2>
                                </div>
                                <div className="prose prose-slate max-w-none">
                                    <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                                        {scale.description_vi}
                                    </p>
                                    <p className="text-slate-400 text-sm mt-4 italic border-l-4 border-slate-100 pl-4 uppercase font-bold tracking-wider">
                                        English Overview:
                                    </p>
                                    <p className="text-slate-500 italic leading-relaxed">
                                        {scale.description_en}
                                    </p>
                                </div>
                            </section>

                            {/* Danh sách items */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                        <Layers className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Hệ thống Biến quan sát (Items)</h2>
                                </div>
                                <div className="grid gap-4">
                                    {scale.scale_items?.sort((a:any, b:any) => a.code.localeCompare(b.code)).map((item: any) => (
                                        <div key={item.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group flex gap-5">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-indigo-600 text-xs shadow-sm border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                                                {item.code}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 mb-1 leading-snug">{item.text_vi}</p>
                                                <p className="text-sm text-slate-400 font-medium italic">{item.text_en}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 pt-8">
                                {scale.tags?.map((tag: string) => (
                                    <span key={tag} className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Tag className="w-3 h-3" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Cột phải: Sidebar Actions & Info */}
                        <div className="space-y-8">
                            {/* Citation Card */}
                            <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                                <Quote className="absolute -top-4 -right-4 w-32 h-32 opacity-10" />
                                <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                                    <ClipboardCheck className="w-5 h-5" />
                                    Trích dẫn gốc
                                </h3>
                                <div className="bg-white/10 p-4 rounded-xl border border-white/20 mb-6">
                                    <p className="text-sm leading-relaxed font-medium italic">
                                        {scale.citation}
                                    </p>
                                </div>
                                <button className="w-full py-4 bg-white text-indigo-600 rounded-xl font-black text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                    <Quote className="w-4 h-4" />
                                    SAO CHÉP TRÍCH DẪN
                                </button>
                            </div>

                            {/* Action List */}
                            <div className="space-y-3">
                                <button className="w-full p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-indigo-500 transition-all text-left">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                                            <FileSpreadsheet className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-xs text-slate-800 uppercase tracking-tight">Tải file Excel mẫu</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Nạp dữ liệu nhanh vào ncsStat</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                </button>

                                <Link href="/analyze" className="w-full p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-indigo-500 transition-all text-left">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-xs text-slate-800 uppercase tracking-tight">Phân tích ngay</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Dùng thang đo này để xử lý số liệu</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                </Link>
                            </div>

                            {/* Detailed Theory Guides Link */}
                            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-7 rounded-3xl text-white shadow-xl border border-indigo-500/20">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-300 shrink-0">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg text-white mb-1">Cơ sở Lý thuyết</h4>
                                        <p className="text-[11px] text-indigo-200 leading-relaxed">
                                            Tìm hiểu chuyên sâu hơn về phương pháp luận, cơ sở lý thuyết 1000+ chữ và các kịch bản chạy Data thực tế sử dụng thang đo này.
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-2.5">
                                    {((scale.name_en || '').toLowerCase().includes('tam') || (scale.name_en || '').toLowerCase().includes('technology')) && (
                                        <Link href="/knowledge/technology-acceptance-model-tam" className="block w-full p-4 bg-white/10 hover:bg-white/20 border border-white/5 rounded-2xl transition-all group">
                                            <p className="font-bold text-sm text-white flex items-center justify-between">
                                                Mô hình TAM - Hướng dẫn chi tiết
                                                <ArrowRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                                            </p>
                                        </Link>
                                    )}
                                    {((scale.name_en || '').toLowerCase().includes('tpb') || (scale.name_en || '').toLowerCase().includes('behavior')) && (
                                        <Link href="/knowledge/theory-of-planned-behavior-tpb" className="block w-full p-4 bg-white/10 hover:bg-white/20 border border-white/5 rounded-2xl transition-all group">
                                            <p className="font-bold text-sm text-white flex items-center justify-between">
                                                Thuyết Hành vi TPB - Bản đầy đủ
                                                <ArrowRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                                            </p>
                                        </Link>
                                    )}
                                    <Link href="/knowledge" className="block w-full p-4 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-2xl transition-all group text-center">
                                        <p className="font-bold text-xs text-indigo-300 uppercase tracking-widest">
                                            Duyệt Thư viện Tạp chí
                                        </p>
                                    </Link>
                                </div>
                            </div>


                            {/* Model Info */}
                            {scale.research_model && (
                                <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vị trí trong Mô hình</h4>
                                    <p className="text-slate-700 font-bold bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
                                        {scale.research_model}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </article>
            </main>

            <Footer />
        </div>
    );
}
