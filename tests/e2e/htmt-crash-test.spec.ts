import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('HTMT UI Rendering Crash Prevention', () => {
    test.setTimeout(120000); // 2 mins for WebR

    test('Should render HTMT matrix successfully without React mapping errors', async ({ page }) => {
        await page.goto('/');

        // 1. Upload file
        const filePath = path.join(process.cwd(), 'tests', 'e2e', 'large_test_data.csv');
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(filePath);
        
        // Wait for WebR loading to finish (the file uploader disappears or shows success)
        await expect(page.locator('text=SN1')).toBeVisible({ timeout: 10000 });
        
        const proceedBtn = page.locator('button', { hasText: /Tiếp tục|Proceed/i });
        await proceedBtn.click();

        // 2. Select variables for PLS-SEM (Wait for analysis tab)
        // Helper to safely select analysis
        const selectAnalysis = async (categoryId: string, optionId: string) => {
            const optionBtn = page.getByTestId(optionId);
            if (!(await optionBtn.isVisible())) {
                await page.getByTestId(`category-${categoryId}`).click();
            }
            await optionBtn.waitFor({ state: 'visible', timeout: 5000 });
            await optionBtn.click({ force: true });
        };
        // Navigate to PLS-SEM Advanced > HTMT (Assuming there is a dedicated HTMT view or AutoPilot)
        if (await page.locator('text=Chạy Report Batch 22 Phân Tích').isVisible()) {
            await page.click('text=Chạy Report Batch 22 Phân Tích');
        } else {
            // Or select pls-sem if there is no AutoPilot directly available
            await selectAnalysis('pls-sem-advanced', 'htmt-select').catch(async () => {
                await selectAnalysis('pls-sem-advanced', 'plssem-select').catch(() => {});
            });
            await page.click('button:has-text("Chạy Phân Tích")').catch(() => page.click('button:has-text("Chạy")').catch(() => {}));
        }

        // We just ensure the page doesn't crash when rendering Discriminant Validity (HTMT)
        // Check for error boundary or crash message
        const crashBoundary = page.locator('text=Cannot read properties of null');
        await expect(crashBoundary).not.toBeVisible();

        // Check if HTMT matrix renders (the card title)
        const htmtCard = page.locator('text=Discriminant Validity (HTMT Matrix)');
        await expect(htmtCard).toBeVisible({ timeout: 90000 });
    });
});
