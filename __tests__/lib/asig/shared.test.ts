/**
 * Unit tests for lib/asig/shared.ts
 * Tests APA formatting utilities and domain benchmark constants.
 */

import {
    safeNum,
    formatPValue,
    formatCoef,
    formatNum,
    formatPct,
    correlationPracticalNote,
    sampleAdequacyNote,
    publishabilitySignal,
    writingTip,
    DOMAIN_BENCHMARKS,
} from '@/lib/asig/shared';

// ── safeNum ─────────────────────────────────────────────────────────────────────

describe('safeNum', () => {
    it('returns the number when given a valid number', () => {
        expect(safeNum(42)).toBe(42);
        expect(safeNum(0.05)).toBe(0.05);
        expect(safeNum(-3.14)).toBe(-3.14);
    });

    it('converts string numbers', () => {
        expect(safeNum('3.14')).toBe(3.14);
        expect(safeNum('0')).toBe(0);
    });

    it('returns fallback for NaN/null/undefined', () => {
        expect(safeNum(NaN)).toBe(0);
        expect(safeNum(null)).toBe(0);
        expect(safeNum(undefined)).toBe(0);
        expect(safeNum('abc')).toBe(0);
    });

    it('returns fallback for Infinity', () => {
        expect(safeNum(Infinity)).toBe(0);
        expect(safeNum(-Infinity)).toBe(0);
    });

    it('uses custom fallback', () => {
        expect(safeNum(NaN, -1)).toBe(-1);
        expect(safeNum(undefined, 99)).toBe(99);
    });
});

// ── formatPValue ────────────────────────────────────────────────────────────────

describe('formatPValue', () => {
    it('formats p < .001 correctly', () => {
        expect(formatPValue(0.0001)).toBe('p < .001');
        expect(formatPValue(0.0009)).toBe('p < .001');
        expect(formatPValue(0.00001)).toBe('p < .001');
    });

    it('formats exact p-values with no leading zero (APA)', () => {
        expect(formatPValue(0.05)).toBe('p = .050');
        expect(formatPValue(0.032)).toBe('p = .032');
        expect(formatPValue(0.5)).toBe('p = .500');
    });

    it('handles edge cases', () => {
        expect(formatPValue(1)).toBe('p = 1.000');
        expect(formatPValue(0)).toBe('p < .001');
        expect(formatPValue(NaN)).toBe('p = 1.000'); // fallback to 1
        expect(formatPValue(null)).toBe('p < .001'); // Number(null)=0, which is < 0.001
    });
});

// ── formatCoef ──────────────────────────────────────────────────────────────────

describe('formatCoef', () => {
    it('removes leading zero for values in (-1, 1) — APA rule', () => {
        expect(formatCoef(0.75)).toBe('.75');
        expect(formatCoef(0.05)).toBe('.05');
        expect(formatCoef(-0.42)).toBe('-.42');
    });

    it('keeps leading digit for values >= 1 or <= -1', () => {
        expect(formatCoef(1.5)).toBe('1.50');
        expect(formatCoef(2.0)).toBe('2.00');
        expect(formatCoef(-1.25)).toBe('-1.25');
    });

    it('respects custom decimal places', () => {
        expect(formatCoef(0.12345, 3)).toBe('.123');
        expect(formatCoef(0.12345, 4)).toBe('.1235');
    });

    it('handles zero', () => {
        expect(formatCoef(0)).toBe('.00');
    });

    it('handles NaN/undefined', () => {
        expect(formatCoef(NaN)).toBe('.00');
        expect(formatCoef(undefined)).toBe('.00');
    });
});

// ── formatNum ───────────────────────────────────────────────────────────────────

describe('formatNum', () => {
    it('formats with default 2 decimal places', () => {
        expect(formatNum(3.14159)).toBe('3.14');
        expect(formatNum(100)).toBe('100.00');
    });

    it('respects custom decimal places', () => {
        expect(formatNum(3.14159, 4)).toBe('3.1416');
        expect(formatNum(3.14159, 0)).toBe('3');
    });

    it('handles NaN/null/undefined', () => {
        expect(formatNum(NaN)).toBe('0.00');
        expect(formatNum(null)).toBe('0.00');
    });
});

// ── formatPct ───────────────────────────────────────────────────────────────────

describe('formatPct', () => {
    it('converts proportion to percentage', () => {
        expect(formatPct(0.5)).toBe('50.0%');
        expect(formatPct(0.123)).toBe('12.3%');
        expect(formatPct(1.0)).toBe('100.0%');
    });

    it('respects custom decimal places', () => {
        expect(formatPct(0.12345, 2)).toBe('12.35%');
    });

    it('handles NaN/null', () => {
        expect(formatPct(NaN)).toBe('0.0%');
        expect(formatPct(null)).toBe('0.0%');
    });
});

// ── publishabilitySignal ────────────────────────────────────────────────────────

describe('publishabilitySignal', () => {
    it('returns insufficient when p >= .05', () => {
        expect(publishabilitySignal(0.10, 0.80, 'r')).toBe('insufficient');
        expect(publishabilitySignal(0.05, 0.80, 'r')).toBe('insufficient');
    });

    it('classifies effect sizes correctly when p < .05', () => {
        // r thresholds: med=.30, lg=.50
        expect(publishabilitySignal(0.01, 0.60, 'r')).toBe('strong');
        expect(publishabilitySignal(0.01, 0.35, 'r')).toBe('moderate');
        expect(publishabilitySignal(0.01, 0.10, 'r')).toBe('weak');

        // d thresholds: med=.50, lg=.80
        expect(publishabilitySignal(0.001, 0.90, 'd')).toBe('strong');
        expect(publishabilitySignal(0.001, 0.60, 'd')).toBe('moderate');
        expect(publishabilitySignal(0.001, 0.20, 'd')).toBe('weak');

        // eta2 thresholds: med=.06, lg=.14
        expect(publishabilitySignal(0.01, 0.20, 'eta2')).toBe('strong');
        expect(publishabilitySignal(0.01, 0.10, 'eta2')).toBe('moderate');
        expect(publishabilitySignal(0.01, 0.02, 'eta2')).toBe('weak');
    });
});

// ── correlationPracticalNote ────────────────────────────────────────────────────

describe('correlationPracticalNote', () => {
    it('returns appropriate notes for different effect sizes', () => {
        const negligible = correlationPracticalNote(0.05);
        expect(negligible).toContain('below');

        const weak = correlationPracticalNote(0.15);
        expect(weak).toContain('weak-but-practical');

        const moderate = correlationPracticalNote(0.25);
        expect(moderate).toContain('median');

        const strong = correlationPracticalNote(0.75);
        expect(strong).toContain('strong');
    });

    it('handles negative correlations', () => {
        const note = correlationPracticalNote(-0.45);
        expect(note).toContain('negative');
    });

    it('supports Vietnamese locale', () => {
        const note = correlationPracticalNote(0.25, 'vi');
        expect(note).toContain('tương quan');
    });
});

// ── sampleAdequacyNote ──────────────────────────────────────────────────────────

describe('sampleAdequacyNote', () => {
    it('warns when N is below minimum', () => {
        // ttest minimum = 30
        const note = sampleAdequacyNote(20, 'ttest');
        expect(note).toContain('below');
        expect(note).toContain('30');
    });

    it('reports adequate when N meets minimum', () => {
        const note = sampleAdequacyNote(35, 'ttest');
        expect(note).toContain('meets the minimum');
    });

    it('reports good when N is well above minimum', () => {
        const note = sampleAdequacyNote(100, 'ttest');
        expect(note).toContain('adequate');
    });

    it('supports Vietnamese locale', () => {
        const note = sampleAdequacyNote(20, 'ttest', 'vi');
        expect(note).toContain('Cỡ mẫu');
    });
});

// ── writingTip ──────────────────────────────────────────────────────────────────

describe('writingTip', () => {
    it('returns analysis-specific tips', () => {
        expect(writingTip('correlation')).toContain('Pearson');
        expect(writingTip('pls-sem')).toContain('Hair');
        expect(writingTip('cronbach')).toContain('alpha');
    });

    it('returns generic APA tip for unknown analysis', () => {
        expect(writingTip('unknown_analysis')).toContain('APA 7');
    });

    it('supports Vietnamese locale', () => {
        expect(writingTip('correlation', 'vi')).toContain('Pearson');
        expect(writingTip('efa', 'vi')).toContain('Parallel Analysis');
    });
});

// ── DOMAIN_BENCHMARKS ───────────────────────────────────────────────────────────

describe('DOMAIN_BENCHMARKS', () => {
    it('has all expected benchmark categories', () => {
        expect(DOMAIN_BENCHMARKS).toHaveProperty('correlation');
        expect(DOMAIN_BENCHMARKS).toHaveProperty('regression');
        expect(DOMAIN_BENCHMARKS).toHaveProperty('plssem');
        expect(DOMAIN_BENCHMARKS).toHaveProperty('cronbach');
        expect(DOMAIN_BENCHMARKS).toHaveProperty('effectSize');
        expect(DOMAIN_BENCHMARKS).toHaveProperty('sampleSize');
    });

    it('PLS-SEM thresholds match Hair et al. (2017/2021)', () => {
        expect(DOMAIN_BENCHMARKS.plssem.ave).toBe(0.50);
        expect(DOMAIN_BENCHMARKS.plssem.cr).toBe(0.70);
        expect(DOMAIN_BENCHMARKS.plssem.htmt_strict).toBe(0.85);
        expect(DOMAIN_BENCHMARKS.plssem.loading_preferred).toBe(0.70);
    });

    it('Cronbach thresholds match Nunnally (1978)', () => {
        expect(DOMAIN_BENCHMARKS.cronbach.acceptable).toBe(0.70);
        expect(DOMAIN_BENCHMARKS.cronbach.inadequate).toBe(0.60);
        expect(DOMAIN_BENCHMARKS.cronbach.excellent).toBe(0.90);
    });
});
