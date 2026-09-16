import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Admin Auto Test', () => {
  test('Run all backend algorithms and generate report', async ({ page }) => {
    test.setTimeout(300000); // 5 mins
    
    await page.goto('/test-runner');
    
    // Wait for the CSV to load
    await expect(page.locator('#run-test-btn')).toHaveText('Run Real Data Test', { timeout: 30000 });
    
    // Click the button
    await page.locator('#run-test-btn').click();
    
    // Wait for the button to revert back (meaning tests finished)
    await expect(page.locator('#run-test-btn')).toHaveText('Run Real Data Test', { timeout: 180000 });
    
    // Extract results
    const results = await page.evaluate(() => {
        const rows = document.querySelectorAll('.divide-y > div.flex-col');
        const data: any[] = [];
        rows.forEach(row => {
            const name = row.querySelector('.font-medium')?.textContent?.trim() || '';
            const statusStr = row.querySelector('.text-green-600, .text-red-600')?.textContent?.trim() || '';
            const status = statusStr.includes('Pass') ? 'Pass' : 'Fail';
            const asig = row.querySelector('.whitespace-pre-wrap')?.textContent?.trim() || '';
            data.push({ name, status, asig });
        });
        return data;
    });
    
    fs.writeFileSync('admin_test_results.json', JSON.stringify(results, null, 2));
    
    console.log(`Finished admin tests: ${results.filter(r => r.status === 'Pass').length} passed out of ${results.length}`);
  });
});
