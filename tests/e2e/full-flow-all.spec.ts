import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Full Flow All Calculations', () => {
  test('Run 22 calculations and extract results', async ({ page }) => {
    test.setTimeout(900000); // 15 mins timeout for full suite

    page.on('console', msg => {
        console.log(`[Browser ${msg.type()}] ${msg.text()}`);
    });

    const results: { name: string, status: string, summary?: string }[] = [];
    
    await page.goto('/');
    
    const filePath = path.join(process.cwd(), 'tests', 'e2e', 'large_test_data.csv');
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await expect(page.locator('text=SN1')).toBeVisible({ timeout: 60000 });
    await page.locator('button', { hasText: /Tiếp tục|Proceed/i }).click();
    
    // Wait for WebR to be ready
    console.log('Waiting for WebR to be ready...');
    await page.waitForFunction(() => (window as any).webrLoaded === true, { timeout: 60000 }).catch(() => {
        console.log('Timeout waiting for WebR ready status.');
    });
    console.log('WebR should be ready now.');
    
    const selectAnalysis = async (categoryId: string, optionId: string) => {
      await page.waitForTimeout(1000);
      const optionBtn = page.getByTestId(optionId);
      if (!(await optionBtn.isVisible().catch(()=>false))) {
        await page.getByTestId('category-' + categoryId).click({ force: true }).catch(()=>{});
        await page.waitForTimeout(1000);
      }
      await page.evaluate((id) => {
          const el = document.querySelector(`[data-testid="${id}"]`) as HTMLElement;
          if (el) el.click();
      }, optionId);
      await page.waitForTimeout(1000);
    };

    const extractResult = async (name: string) => {
        try {
            await expect(page.locator('.bg-slate-50.text-slate-800').first().or(page.locator('.asig-summary').first()).or(page.locator('table').first())).toBeVisible({ timeout: 30000 });
            const summary = await page.evaluate(() => {
                const asig = document.querySelector('.bg-slate-50.text-slate-800, .asig-summary');
                if (asig) return asig.textContent?.trim().replace(/\s+/g, ' ');
                const table = document.querySelector('table');
                if (table && table.parentElement) return table.parentElement.innerText.replace(/\s+/g, ' ').slice(0, 500);
                return document.body.innerText.replace(/\s+/g, ' ').slice(0, 500);
            });
            results.push({ name, status: 'success', summary });
        } catch (e: any) {
            await page.screenshot({ path: `tests/e2e/screenshots/${name.replace(/[^a-z0-9]/gi, '_')}_fail.png`, fullPage: true }).catch(()=>{});
            results.push({ name, status: 'fail', summary: e.message });
        }
        
        fs.writeFileSync('all_22_results.json', JSON.stringify(results, null, 2));

        const backBtns = [
            page.locator('button', { hasText: /Quay lại|Back/i }),
            page.locator('button:has-text("Quay lại")'),
            page.getByRole('button', { name: /Quay lại|Back/i }),
            page.getByRole('button', { name: '3', exact: true }),
            page.locator('text="Quay lại"')
        ];
        
        let clickedBack = false;
        for (const btn of backBtns) {
            if (await btn.first().isVisible().catch(()=>false)) {
                await btn.first().click({ force: true }).catch(()=>{});
                clickedBack = true;
                break;
            }
        }
        
        if (!clickedBack) {
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const back = btns.find(b => b.innerText.toLowerCase().includes('quay lại') || b.innerText.toLowerCase().includes('back'));
                if (back) back.click();
            }).catch(()=>{});
        }
        await page.waitForTimeout(500);
    };

    const clickRun = async () => {
        await page.waitForTimeout(500);
        const runBtn = page.getByTestId('run-analysis');
        if (await runBtn.isVisible().catch(()=>false)) {
            await runBtn.click({ force: true });
        } else {
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b => b.innerText.toLowerCase().includes('chạy') || b.innerText.toLowerCase().includes('run'));
                if (btn) btn.click();
            }).catch(()=>{});
        }
    };

    const forceSelect = async (nth: number, val: string) => {
        try {
            await page.waitForTimeout(500);
            const comboboxes = page.locator('button[role="combobox"]');
            if (await comboboxes.count() > nth) {
                await comboboxes.nth(nth).click({ force: true });
                await page.waitForTimeout(500);
                const option = page.locator(`[role="option"]:has-text("${val}")`);
                if (await option.count() > 0) {
                    await option.first().click({ force: true });
                } else {
                    // close if not found
                    await page.keyboard.press('Escape');
                }
            } else {
                // Fallback to select if native select exists
                await page.evaluate(({ n, v }) => {
                    const selects = document.querySelectorAll('select');
                    if (selects[n]) {
                        selects[n].value = v;
                        selects[n].dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }, { n: nth, v: val }).catch(()=>{});
            }
        } catch (e) {
            console.error(`forceSelect failed for ${val}`, e);
        }
        await page.waitForTimeout(500);
    };

    const forceCheck = async (val: string) => {
        try {
            const loc = page.locator(`input[type="checkbox"][value="${val}"]`);
            if (await loc.count() > 0) {
                await loc.first().check({ force: true });
            } else {
                // fallback to label text
                await page.locator(`label:has-text("${val}") input[type="checkbox"]`).first().check({ force: true });
            }
        } catch (e) {
            console.error(`forceCheck failed for ${val}`, e);
        }
        await page.waitForTimeout(100);
    };

    // 1. Descriptive
    await selectAnalysis('basic-stats', 'descriptive-select');
    await forceCheck('SN1');
    await forceCheck('SN2');
    await clickRun();
    await extractResult('Descriptive Statistics');

    // 2. Frequencies
    await selectAnalysis('basic-stats', 'frequency-select');
    await forceCheck('Gender');
    await forceCheck('Education');
    await clickRun();
    await extractResult('Frequencies');

    // 3. Cross-tabulation (Chi-square)
    await selectAnalysis('basic-stats', 'chisq-select');
    await forceSelect(0, 'Gender');
    await forceSelect(1, 'Education');
    await clickRun();
    await extractResult('Cross-tabulation (Chi-square)');

    // 4. Independent T-Test
    await selectAnalysis('basic-stats', 'ttest-select');
    await forceSelect(0, 'Gender');
    await forceSelect(1, 'ATT1');
    await clickRun();
    await extractResult('Independent T-Test');

    // 5. Paired T-Test
    await selectAnalysis('basic-stats', 'ttest-paired-select');
    await forceSelect(0, 'ATT1');
    await forceSelect(1, 'ATT2');
    await clickRun();
    await extractResult('Paired T-Test');

    // 6. One-Way ANOVA
    await selectAnalysis('basic-stats', 'anova-select');
    await forceSelect(0, 'Education');
    await forceSelect(1, 'ATT1');
    await clickRun();
    await extractResult('One-Way ANOVA');

    // 7. Cronbach Alpha
    await selectAnalysis('measurement', 'cronbach-select');
    await forceCheck('SN1');
    await forceCheck('SN2');
    await forceCheck('SN3');
    await clickRun();
    await extractResult('Cronbach Alpha');

    // 8. McDonald Omega
    await selectAnalysis('measurement', 'omega-select');
    await forceCheck('ATT1');
    await forceCheck('ATT2');
    await forceCheck('ATT3');
    await clickRun();
    await extractResult('McDonald Omega');

    // 9. EFA
    await selectAnalysis('measurement', 'efa-select');
    await forceCheck('SN1');
    await forceCheck('SN2');
    await forceCheck('ATT1');
    await forceCheck('ATT2');
    await clickRun();
    await extractResult('EFA');

    // 10. CFA
    await selectAnalysis('measurement', 'cfa-select');
    await clickRun();
    await extractResult('CFA');

    // 11. CB-SEM
    await selectAnalysis('factor', 'cbsem-select');
    await clickRun();
    await extractResult('CB-SEM');

    // 12. PLS-SEM
    await selectAnalysis('factor', 'plssem-select');
    await clickRun();
    await extractResult('PLS-SEM');

    // 13. Correlation (Direct Run)
    await selectAnalysis('relationship', 'correlation');
    await extractResult('Correlation');

    // 14. OLS Regression
    await selectAnalysis('relationship', 'regression-select');
    await forceSelect(0, 'BEH1');
    await forceCheck('SN1');
    await forceCheck('ATT1');
    await clickRun();
    await extractResult('OLS Regression');

    // 15. Logistic Regression
    await selectAnalysis('relationship', 'logistic-select');
    await forceSelect(0, 'Gender');
    await forceCheck('ATT1');
    await clickRun();
    await extractResult('Logistic Regression');

    // 16. Mediation
    await selectAnalysis('relationship', 'mediation-select');
    await clickRun();
    await extractResult('Mediation');

    // 17. Moderation
    await selectAnalysis('relationship', 'moderation-select');
    await clickRun();
    await extractResult('Moderation');

    // 18. Bootstrapping
    await selectAnalysis('pls-sem-advanced', 'bootstrap-select');
    await clickRun();
    await extractResult('Bootstrapping');

    // 19. HTMT
    await selectAnalysis('pls-sem-advanced', 'htmt-select');
    await clickRun();
    await extractResult('HTMT');

    // 20. VIF
    await selectAnalysis('pls-sem-advanced', 'vif-select');
    await forceSelect(0, 'ATT1');
    await clickRun();
    await extractResult('VIF');

    // 21. IPMA
    await selectAnalysis('pls-sem-advanced', 'ipma-select');
    await forceSelect(0, 'ATT1');
    await clickRun();
    await extractResult('IPMA');

    // 22. MGA
    await selectAnalysis('pls-sem-advanced', 'mga-select');
    await forceSelect(0, 'Gender');
    await clickRun();
    await extractResult('MGA');
    
    console.log('Finished 22 calculations!');
  });
});
