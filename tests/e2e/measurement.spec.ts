import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Measurement Models E2E', () => {
  test('E2E: Reliability, EFA, CFA Flow', async ({ page }) => {
    test.setTimeout(300000); 
    await page.goto('/');
    
    // Upload large test data
    const filePath = path.join(process.cwd(), 'tests', 'e2e', 'large_test_data.csv');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    await expect(page.locator('text=SN1')).toBeVisible({ timeout: 15000 });
    
    // Go to Analysis Tab (click Proceed button in DataProfiler)
    const proceedBtn = page.locator('button', { hasText: /Tiếp tục|Proceed/i });
    await proceedBtn.click();
    
    // Helper to safely select analysis
    const selectAnalysis = async (categoryId: string, optionId: string) => {
      const optionBtn = page.getByTestId(optionId);
      if (!(await optionBtn.isVisible())) {
        await page.getByTestId(`category-${categoryId}`).click();
      }
      await optionBtn.waitFor({ state: 'visible', timeout: 5000 });
      await optionBtn.click({ force: true });
    };

    // 1. Cronbach's Alpha
    await selectAnalysis('reliability', 'cronbach-select');
    await expect(async () => {
      const allGroupsBtn = page.locator('button:has-text("Tất cả nhóm")');
      if (await allGroupsBtn.isVisible()) {
          await allGroupsBtn.click();
      }
      await page.click('button:has-text("Alpha")').catch(() => page.click('button:has-text("Chạy Phân tích")').catch(() => {}));
      await expect(page.locator('text=raw_alpha').or(page.locator('text=Alpha')).first()).toBeVisible({ timeout: 45000 });
    }).toPass({ timeout: 120000 });

    // 2. EFA
    await page.getByRole('button', { name: '3', exact: true }).click();
    await selectAnalysis('factor', 'efa-select').catch(() => selectAnalysis('reliability', 'efa-select'));
    await expect(async () => {
      await page.click('button:has-text("Select All")').catch(() => {});
      await page.click('button:has-text("EFA")').catch(() => page.getByTestId('run-analysis').click().catch(() => {}));
      await expect(page.locator('text=KMO').first()).toBeVisible({ timeout: 45000 });
    }).toPass({ timeout: 120000 });

    // 3. CFA
    await page.getByRole('button', { name: '3', exact: true }).click();
    await selectAnalysis('factor', 'cfa-select').catch(() => selectAnalysis('reliability', 'cfa-select'));
    await expect(async () => {
        const runCFABtn = page.locator('button:has-text("CFA")').first();
        await runCFABtn.click().catch(() => page.getByTestId('run-analysis').click().catch(() => {}));
        await expect(page.locator('text=CFI').or(page.locator('text=RMSEA')).first()).toBeVisible({ timeout: 45000 });
    }).toPass({ timeout: 120000 });
    
    console.log('✅ Measurement Models E2E Passed!');
  });
});
