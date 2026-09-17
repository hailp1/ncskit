/**
 * Unit tests for lib/asig/generator.ts
 * Tests the central dispatch router and inline diagnostic interpreters (VIF, Outlier, HTMT).
 */

import { generateInterpretation } from '@/lib/asig/generator';
import { interpretVIF, interpretOutlier, interpretHTMT } from '@/lib/asig/generator';

// ── DISPATCH ROUTER ─────────────────────────────────────────────────────────────

describe('generateInterpretation dispatch', () => {
    it('returns warning for unknown analysis type', () => {
        const result = generateInterpretation('nonexistent_type' as any, {});
        expect(result.verdict).toBe('warning');
        expect(result.summary).toContain('No ASIG template');
        expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('dispatches cronbach_alpha aliases correctly', () => {
        const mockData = { alpha: 0.85, numItems: 5, scaleName: 'Test', items: [] };
        const r1 = generateInterpretation('cronbach_alpha', mockData);
        const r2 = generateInterpretation('cronbach', mockData);
        const r3 = generateInterpretation('omega', mockData);
        // All three aliases should route to same interpreter
        expect(r1.summary.length).toBeGreaterThan(0);
        expect(r2.summary.length).toBeGreaterThan(0);
        expect(r3.summary.length).toBeGreaterThan(0);
    });

    it('dispatches regression aliases correctly', () => {
        const mockData = {
            modelSignificant: true, fStatistic: 5.0, fPValue: 0.01,
            adjustedR2: 0.30,
            coefficients: [
                { term: '(Intercept)', estimate: 1.5, pValue: 0.001 },
                { term: 'X1', estimate: 0.5, pValue: 0.01 },
            ],
            residualNormality: { pValue: 0.10 }
        };
        const r1 = generateInterpretation('linear_regression', mockData);
        const r2 = generateInterpretation('regression', mockData);
        expect(r1.summary.length).toBeGreaterThan(0);
        expect(r2.summary.length).toBeGreaterThan(0);
    });

    it('dispatches chi-square aliases correctly', () => {
        const mockData = {
            chiSquare: 5.0, df: 1, pValue: 0.025,
            cramersV: 0.22, variable1: 'Gender', variable2: 'Outcome'
        };
        const r1 = generateInterpretation('chi_square', mockData);
        const r2 = generateInterpretation('chisquare', mockData);
        const r3 = generateInterpretation('chi-square', mockData);
        expect(r1.summary.length).toBeGreaterThan(0);
        expect(r2.summary.length).toBeGreaterThan(0);
        expect(r3.summary.length).toBeGreaterThan(0);
    });

    it('dispatches wilcoxon aliases correctly', () => {
        const mockData = {
            W: 100, pValue: 0.03, medianDifference: 1.5,
            before: 'Pre', after: 'Post'
        };
        const r1 = generateInterpretation('wilcoxon_signed', mockData);
        const r2 = generateInterpretation('wilcoxon', mockData);
        expect(r1.summary.length).toBeGreaterThan(0);
        expect(r2.summary.length).toBeGreaterThan(0);
    });
});

// ── interpretVIF ────────────────────────────────────────────────────────────────

describe('interpretVIF', () => {
    it('passes when all VIF < threshold', () => {
        const result = interpretVIF({
            vifValues: [1.2, 2.3, 3.5],
            variableNames: ['X1', 'X2', 'X3'],
        });
        expect(result.verdict).toBe('pass');
        expect(result.summary).toContain('no problematic collinearity');
        expect(result.warnings).toHaveLength(0);
        expect(result.details.length).toBe(3);
    });

    it('warns for moderate VIF (≥ 5, < 10)', () => {
        const result = interpretVIF({
            vifValues: [1.2, 6.5, 2.1],
            variableNames: ['X1', 'X2', 'X3'],
        });
        expect(result.verdict).toBe('warning');
        expect(result.summary).toContain('moderate');
        expect(result.warnings.some(w => w.includes('X2'))).toBe(true);
    });

    it('fails for severe VIF (≥ 10)', () => {
        const result = interpretVIF({
            vifValues: [1.2, 15.3, 2.1],
            variableNames: ['X1', 'X2', 'X3'],
        });
        expect(result.verdict).toBe('fail');
        expect(result.summary).toContain('severe');
        expect(result.warnings.some(w => w.includes('X2'))).toBe(true);
    });

    it('uses custom threshold', () => {
        const result = interpretVIF({
            vifValues: [3.5],
            variableNames: ['X1'],
            threshold: 3,
        });
        expect(result.verdict).toBe('warning');
    });

    it('handles NaN VIF values gracefully', () => {
        const result = interpretVIF({
            vifValues: [NaN, undefined as any, 2.0],
            variableNames: ['X1', 'X2', 'X3'],
        });
        // NaN and undefined should become 0 via safeNum, which is < 5
        expect(result.verdict).toBe('pass');
    });

    it('supports Vietnamese locale', () => {
        const result = interpretVIF({
            vifValues: [12.0],
            variableNames: ['X1'],
        }, 'vi');
        expect(result.summary).toContain('đa cộng tuyến');
        expect(result.apaStatement).toContain('VIF');
    });

    it('includes citations', () => {
        const result = interpretVIF({ vifValues: [1.0] });
        expect(result.citations.length).toBeGreaterThan(0);
        expect(result.citations.some(c => c.includes('Hair'))).toBe(true);
    });

    it('provides recommendations', () => {
        const severe = interpretVIF({ vifValues: [15.0] });
        expect(severe.recommendations!.length).toBeGreaterThan(0);
        expect(severe.recommendations!.some(r => r.includes('Remove'))).toBe(true);

        const clean = interpretVIF({ vifValues: [1.0] });
        expect(clean.recommendations!.some(r => r.includes('No action'))).toBe(true);
    });
});

// ── interpretOutlier ────────────────────────────────────────────────────────────

describe('interpretOutlier', () => {
    it('passes when no outliers detected', () => {
        const result = interpretOutlier({
            nOutliers: 0,
            totalN: 200,
            cutoffValue: 22.36,
        });
        expect(result.verdict).toBe('pass');
        expect(result.summary).toContain('no influential outliers');
        expect(result.warnings).toHaveLength(0);
    });

    it('warns for outlier rate < 5%', () => {
        const result = interpretOutlier({
            nOutliers: 3,
            totalN: 200,
            cutoffValue: 22.36,
        });
        expect(result.verdict).toBe('warning');
        expect(result.summary).toContain('3 observation');
        expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('fails for outlier rate >= 5%', () => {
        const result = interpretOutlier({
            nOutliers: 15,
            totalN: 200,
            cutoffValue: 22.36,
        });
        expect(result.verdict).toBe('fail');
    });

    it('handles NaN/undefined gracefully', () => {
        const result = interpretOutlier({
            nOutliers: NaN as any,
            totalN: undefined as any,
            cutoffValue: NaN as any,
        });
        // safeNum converts NaN → 0
        expect(result.verdict).toBe('pass'); // 0 outliers = pass
    });

    it('supports Vietnamese locale', () => {
        const result = interpretOutlier({
            nOutliers: 5,
            totalN: 100,
            cutoffValue: 20.0,
        }, 'vi');
        expect(result.summary).toContain('ngoại lai');
    });

    it('includes APA statement', () => {
        const result = interpretOutlier({
            nOutliers: 2,
            totalN: 100,
            cutoffValue: 18.47,
        });
        expect(result.apaStatement).toContain('multivariate outlier');
        expect(result.apaStatement).toContain('Mahalanobis');
    });
});

// ── interpretHTMT ───────────────────────────────────────────────────────────────

describe('interpretHTMT', () => {
    it('passes when all HTMT values are below threshold', () => {
        const result = interpretHTMT({
            htmtMatrix: [
                [1.0, 0.65, 0.70],
                [0.65, 1.0, 0.55],
                [0.70, 0.55, 1.0],
            ],
            factorNames: ['F1', 'F2', 'F3'],
        });
        expect(result.verdict).toBe('pass');
        expect(result.summary).toContain('all construct pairs');
        expect(result.warnings).toHaveLength(0);
    });

    it('fails when any HTMT >= threshold', () => {
        const result = interpretHTMT({
            htmtMatrix: [
                [1.0, 0.92, 0.70],
                [0.92, 1.0, 0.55],
                [0.70, 0.55, 1.0],
            ],
            factorNames: ['F1', 'F2', 'F3'],
        });
        expect(result.verdict).toBe('fail');
        expect(result.warnings.some(w => w.includes('F1') && w.includes('F2'))).toBe(true);
    });

    it('uses custom threshold', () => {
        const result = interpretHTMT({
            htmtMatrix: [
                [1.0, 0.88],
                [0.88, 1.0],
            ],
            factorNames: ['A', 'B'],
            threshold: 0.90,
        });
        expect(result.verdict).toBe('pass'); // 0.88 < 0.90
    });

    it('handles 1D array (WebR serialization quirk)', () => {
        // WebR sometimes serializes 3x3 matrix as 9-element 1D array
        const result = interpretHTMT({
            htmtMatrix: [1.0, 0.65, 0.70, 0.65, 1.0, 0.55, 0.70, 0.55, 1.0],
            factorNames: ['F1', 'F2', 'F3'],
        });
        expect(result.verdict).toBe('pass');
        expect(result.details.length).toBeGreaterThan(0);
    });

    it('supports Vietnamese locale', () => {
        const result = interpretHTMT({
            htmtMatrix: [[1.0, 0.92], [0.92, 1.0]],
            factorNames: ['A', 'B'],
        }, 'vi');
        expect(result.summary).toContain('giá trị phân biệt');
    });

    it('includes Henseler et al. (2015) citation', () => {
        const result = interpretHTMT({
            htmtMatrix: [[1.0, 0.5], [0.5, 1.0]],
            factorNames: ['A', 'B'],
        });
        expect(result.citations.some(c => c.includes('Henseler'))).toBe(true);
    });

    it('provides actionable recommendations on violation', () => {
        const result = interpretHTMT({
            htmtMatrix: [[1.0, 0.95], [0.95, 1.0]],
            factorNames: ['A', 'B'],
        });
        expect(result.recommendations!.length).toBeGreaterThan(0);
        expect(result.recommendations!.some(r => r.includes('cross-loadings') || r.includes('merge'))).toBe(true);
    });
});
