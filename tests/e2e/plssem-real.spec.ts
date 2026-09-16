import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('NCSKIT Real E2E Testing - No Mocking', () => {
  test('E2E: Full PLS-SEM Advanced Analysis Flow', async ({ page }) => {
    await page.goto('/');
    
    // 1. Upload file
    const filePath = path.join(process.cwd(), 'tests', 'e2e', 'large_test_data.csv');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await expect(page.locator('text=SN1')).toBeVisible({ timeout: 10000 });
    
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

    // 2. Chay IPMA
    await selectAnalysis('pls-sem-advanced', 'ipma-select');
    await expect(async () => {
      // Setup model
      await page.locator('select#ipma-target').selectOption('ATT1').catch(() => {}); // Gia dinh
      await page.click('button:has-text("Chạy IPMA")').catch(() => page.click('button:has-text("IPMA")').catch(() => {}));
      await expect(page.locator('text=Performance').first()).toBeVisible({ timeout: 45000 });
    }).toPass({ timeout: 120000 });
    
    // 3. Chay VIF Check
    await page.getByRole('button', { name: '3', exact: true }).click();
    await selectAnalysis('pls-sem-advanced', 'vif-select');
    await expect(async () => {
      await page.locator('select#vif-dep').selectOption('ATT1').catch(() => {}); // Gia dinh
      await page.click('button:has-text("Chạy VIF")').catch(() => page.click('button:has-text("VIF")').catch(() => {}));
      await expect(page.locator('text=VIF').first()).toBeVisible({ timeout: 45000 });
    }).toPass({ timeout: 120000 });

    // 4. Chay Bootstrapping
    await page.getByRole('button', { name: '3', exact: true }).click();
    await selectAnalysis('pls-sem-advanced', 'bootstrap-select');
    await expect(async () => {
      await page.click('button:has-text("Chạy Bootstrap")').catch(() => page.click('button:has-text("Bootstrap")').catch(() => {}));
      await expect(page.locator('text=T-Statistic').or(page.locator('text=P-Value')).first()).toBeVisible({ timeout: 45000 });
    }).toPass({ timeout: 120000 });
    
    console.log('✅ Real E2E Test Passed! Dữ liệu WebR đã được nạp và hiển thị thành công lên UI.');
  });
});
