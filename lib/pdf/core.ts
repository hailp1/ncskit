import jsPDF from 'jspdf';

export interface PDFExportOptions {
    title: string;
    analysisType: string;
    results: any;
    columns?: string[];
    filename?: string;
    userName?: string;
    chartImages?: string[];
    batchData?: Array<{ title: string; results: any; columns?: string[] }>;
}

export interface PDFContext {
    doc: jsPDF;
    yPos: number;
    options: PDFExportOptions;
    commonTableOptions: any;
    checkPageBreak: (height?: number) => void;
}

export const loadVietnameseFont = async (doc: jsPDF) => {
    try {
        const paths = [
            '/webr_core_v3/vfs/usr/share/fonts/NotoSans-Regular.ttf',
            '/webr_core/vfs/usr/share/fonts/NotoSans-Regular.ttf'
        ];
        
        let regularBuffer: ArrayBuffer | null = null;
        for (const path of paths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    regularBuffer = await response.arrayBuffer();
                    break;
                }
            } catch (e) {}
        }

        if (!regularBuffer) throw new Error('Could not load NotoSans Regular');

        const binary = Array.from(new Uint8Array(regularBuffer)).map(b => String.fromCharCode(b)).join("");
        doc.addFileToVFS('NotoSans-Regular.ttf', binary);
        doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
        
        const boldPath = '/webr_core_v3/vfs/usr/share/fonts/NotoSans-Bold.ttf';
        try {
            const boldResponse = await fetch(boldPath);
            if (boldResponse.ok) {
                const boldBuffer = await boldResponse.arrayBuffer();
                const boldBinary = Array.from(new Uint8Array(boldBuffer)).map(b => String.fromCharCode(b)).join("");
                doc.addFileToVFS('NotoSans-Bold.ttf', boldBinary);
                doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
            }
        } catch (e) {}

        doc.setFont('NotoSans', 'normal');
    } catch (error) {
        console.warn('Could not load Vietnamese font, falling back to standard font:', error);
    }
};

export const addHeader = (doc: jsPDF, userName: string, title: string, showTitle = false, pageNum?: number, totalPages?: number) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageWidth, 5, 'F');

    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(30, 58, 138);
    doc.text('NCSKIT.org', 15, 22);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('NotoSans', 'normal');
    doc.text('HỆ THỐNG PHÂN TÍCH DỮ LIỆU KHOA HỌC CHUYÊN SÂU', 15, 28);

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('NGƯỜI THỰC HIỆN: ' + userName.toUpperCase(), pageWidth - 15, 18, { align: 'right' });
    
    const exportDate = new Date().toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    doc.setFont('NotoSans', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`NGÀY XUẤT BÁO CÁO: ${exportDate}`, pageWidth - 15, 24, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 34, pageWidth - 15, 34);

    if (showTitle) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, 40, pageWidth - 30, 15, 1, 1, 'F');
        doc.setFillColor(30, 58, 138); 
        doc.rect(15, 40, 2, 15, 'F');

        doc.setFont('NotoSans', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 58, 138);
        doc.text(title.toUpperCase(), 22, 50);
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

    const currentPage = pageNum || doc.getCurrentPageInfo().pageNumber;
    const total = totalPages || currentPage;
    
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`© 2026 NCSKIT.org - BÁO CÁO PHÂN TÍCH TỰ ĐỘNG`, 15, pageHeight - 10);
    doc.text(`TRANG ${currentPage} / ${total}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`XÁC THỰC TẠI: WWW.NCSKIT.ORG`, pageWidth - 15, pageHeight - 10, { align: 'right' });
};

export const COMMON_TABLE_OPTIONS = {
    styles: { 
        font: 'NotoSans', 
        fontSize: 8.5, 
        cellPadding: 2.5, 
        textColor: [33, 37, 41] as [number, number, number],
        lineWidth: 0.1,
        lineColor: [200, 200, 200] as [number, number, number]
    },
    headStyles: { 
        fillColor: [255, 255, 255] as [number, number, number],
        textColor: [30, 58, 138] as [number, number, number],
        fontStyle: 'bold' as any,
        fontSize: 9,
        halign: 'center' as any,
        lineWidth: { top: 0.5, bottom: 0.5, left: 0, right: 0 } as any,
        lineColor: [30, 58, 138] as [number, number, number]
    },
    bodyStyles: {
        lineWidth: { top: 0, bottom: 0.1, left: 0, right: 0 } as any,
    },
    alternateRowStyles: { fillColor: [250, 251, 253] as [number, number, number] },
    theme: 'plain' as const,
    margin: { top: 50, left: 15, right: 15 },
};

export const renderCharts = (ctx: PDFContext) => {
    const { doc, options } = ctx;
    if (options.chartImages && options.chartImages.length > 0) {
        ctx.checkPageBreak(100);
        doc.addPage();
        ctx.yPos = 50;

        doc.setFontSize(14);
        doc.setFont('NotoSans', 'bold');
        doc.text('Visual Charts', 15, ctx.yPos);
        ctx.yPos += 15;

        for (const imgData of options.chartImages) {
            const imgWidth = 180;
            const imgHeight = 90;
            ctx.checkPageBreak(imgHeight + 20);
            try {
                doc.addImage(imgData, 'PNG', 15, ctx.yPos, imgWidth, imgHeight);
                ctx.yPos += imgHeight + 15;
            } catch (e) {
                console.warn("Could not add image", e);
            }
        }
    }
};

export const renderCitation = (ctx: PDFContext) => {
    const { doc } = ctx;
    ctx.checkPageBreak(50);
    ctx.yPos += 15;
    doc.setDrawColor(200);
    doc.line(15, ctx.yPos, 196, ctx.yPos);
    ctx.yPos += 10;

    doc.setFontSize(9);
    doc.setFont("times", "italic");
    doc.setTextColor(80);

    const citation1 = "Data analyzed using R (R Core Team, 2023) via NCSKIT.org platform (Le, 2026). Reliability and factor analyses performed using psych (Revelle, 2023) and lavaan (Rosseel, 2012) packages.";
    const citation2 = "Le, P. H. (2026). NCSKIT.org: A Web-Based Statistical Analysis Platform for Psychometric Analysis. Available at https://open.ncskit.org";

    const splitText1 = doc.splitTextToSize(citation1, 180);
    doc.text(splitText1, 15, ctx.yPos);
    ctx.yPos += doc.getTextDimensions(splitText1).h + 5;

    const splitText2 = doc.splitTextToSize(citation2, 180);
    doc.text(splitText2, 15, ctx.yPos);
};
