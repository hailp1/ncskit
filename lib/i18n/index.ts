import { vi } from './vi';
import { en } from './en';

export type Locale = 'vi' | 'en';

export const translations = {
    vi,
    en
} as const;

// Helper to get translation
export function t(locale: Locale, key: string, params?: Record<string, any>, fallback?: string): string {
    const keys = key.split('.');
    let value: any = translations[locale];

    for (const k of keys) {
        value = value?.[k];
    }

    if (!value && fallback) value = fallback;
    if (!value) return keys[keys.length - 1];
    
    if (typeof value === 'string' && params) {
        return value.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, p1) => {
            return params[p1] !== undefined ? String(params[p1]) : match;
        });
    }

    return value as string;
}

// Default locale
export const defaultLocale: Locale = 'vi';

// Get locale from localStorage or default
export function getStoredLocale(): Locale {
    if (typeof window === 'undefined') return defaultLocale;
    const stored = localStorage.getItem('ncsStat_locale');
    return (stored === 'en' || stored === 'vi') ? stored : defaultLocale;
}

// Save locale to localStorage
export function setStoredLocale(locale: Locale): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('ncsStat_locale', locale);
}
