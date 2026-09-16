import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Auto-Pilot Analysis Luồng (PLS-SEM)', () => {
    test('Nên chạy báo cáo Auto-Pilot đầy đủ mà không gặp lỗi', async ({ page }) => {
        test.setTimeout(300000);
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

        // 1. Tải trang analyze
        await page.goto('/analyze');
        
        // 2. Tải file CSV
        const filePath = path.join(process.cwd(), 'tests', 'e2e', 'large_test_data.csv');
        await page.setInputFiles('input[type="file"]', filePath);
        
        // 3. Đợi dữ liệu được load thành công và hiển thị các tab
        await expect(page.locator('text=SN1')).toBeVisible({ timeout: 10000 });
        
        // Go to Analysis Tab (click Proceed button in DataProfiler)
        await expect(page.getByRole('button', { name: 'Tiếp tục' })).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: 'Tiếp tục' }).click();
        
        // 4. Click chuyển sang tab Auto-Pilot
        await expect(page.locator('text=Auto Pilot')).toBeVisible({ timeout: 10000 });
        await page.click('text=Auto Pilot');
        
        // 5. Chọn kịch bản "Kiểm định mô hình PLS-SEM" (Preset đầu tiên thường là PLS-SEM)
        // Dựa vào text hiển thị trong preset
        await page.click('text=Kiểm định Mô hình PLS-SEM');
        
        // 6. Kiểm tra giao diện Cấu hình Mô hình xuất hiện
        await expect(page.locator('text=Thiết lập Giả thuyết (Đường dẫn)')).toBeVisible();

        // (AutoPilot mặc định tự động group biến có chung tiền tố và auto link IV -> DV)
        // Nên nếu file test_data.csv có ATT, SN -> group, paths đã được auto-gen!

        // 7. Click nút "Bắt đầu Phân tích Toàn diện"
        await page.click('button:has-text("Bắt đầu Phân tích Toàn diện")');

        // 8. Đợi WebR chạy xong toàn bộ tiến trình.
        // Giao diện sẽ báo "Đang phân tích tự động..." và tiến trình tăng dần.
        // Chúng ta đợi popup tiến trình biến mất hoặc text Toast success
        // Hoặc check bảng kết quả render ra
        
        // Timeout 60s cho việc tải WebR và chạy Model
        await expect(page.locator('text=Chạy Auto Pilot thành công!')).toBeVisible({ timeout: 60000 });
        
        // 9. Kiểm tra xem màn hình kết quả (Results) đã hiển thị đúng kết quả Auto-Pilot chưa
        // Thường có text "BÁO CÁO PHÂN TÍCH TỰ ĐỘNG ĐA BƯỚC"        // Wait for results
        await expect(page.locator('text=Cronbach\'s Alpha').first()).toBeVisible();
        await expect(page.locator('text=Báo cáo Auto Pilot Tổng Hợp')).toBeVisible();

        // 10. Check if the new CMB and HTMT tests are rendered
        await expect(page.locator('text=Discriminant Validity (HTMT Matrix)')).toBeVisible();
        await expect(page.locator('text=Full Collinearity VIF (CMB Check)')).toBeVisible();
        await expect(page.locator('text=Harman\'s Single Factor Test (CMB)')).toBeVisible();
    });
});
