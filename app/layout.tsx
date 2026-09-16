import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react"
import { ClientProviders } from "@/components/ClientProviders"
import CacheVersionChecker from "@/components/CacheVersionChecker";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://open.ncskit.org'),
  title: "NCSKIT.org - Phân tích Thống kê Định lượng & Công cụ Nghiên cứu",
  description: "Giải pháp chạy SPSS, CFA, EFA, PLS-SEM trực tuyến không cần cài đặt. Hệ thống phân tích định lượng chuẩn khoa học dành cho sinh viên và nghiên cứu sinh, bảo mật 100%.",
  keywords: ["phân tích số liệu", "nhận làm spss", "hướng dẫn smartpls", "dịch vụ phân tích số liệu", "chạy spss trực tuyến", "phân tích định lượng", "thống kê ncs", "pls-sem", "cfa", "efa", "cronbach alpha", "nghiên cứu khoa học"],
  icons: {
    icon: '/favicon.svg',
  },
  verification: {
    google: "8CL6Lq3oZfJkk2HA8DhITuFYPTRgqnTBzBL3b0NEY1w",
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "NCSKIT.org - Công cụ Phân tích Thống kê Trực tuyến",
    description: "Giải pháp chạy dữ liệu định lượng (SPSS, AMOS, SmartPLS) trực tiếp trên trình duyệt, không lưu trữ máy chủ.",
    url: "https://open.ncskit.org",
    siteName: "NCSKIT.org",
    locale: "vi_VN",
    type: "website",
  },
};

import StructuredData from "@/components/seo/StructuredData";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "NCSKIT",
    "url": "https://open.ncskit.org",
    "logo": "https://open.ncskit.org/logo.svg",
    "description": "Nền tảng phân tích thống kê định lượng và nghiên cứu khoa học trực tuyến."
  };

  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <StructuredData data={orgSchema} />
        <ClientProviders>
          {children}
          <CacheVersionChecker />
          <Analytics />
        </ClientProviders>
      </body>
    </html>
  );
}

