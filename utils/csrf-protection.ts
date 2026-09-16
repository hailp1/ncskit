/**
 * CSRF Protection Utilities
 * Generates and validates CSRF tokens for form submissions
 */

import { NextRequest } from 'next/server';

// ─── Origin Validation ────────────────────────────────────────────────────────

/**
 * Validate that a request originates from a trusted domain.
 *
 * This is the primary CSRF defense for Next.js API routes.
 * SameSite=Lax cookies (set by Supabase SSR) already block most CSRF,
 * but origin validation adds a second layer for mutation endpoints.
 *
 * Returns true if:
 *  - The Origin header matches a known production/staging domain, OR
 *  - The request has no Origin header (server-to-server, curl, etc.) — allowed
 *    because Supabase auth already validates the session cookie.
 *
 * Returns false if:
 *  - The Origin header is present but does NOT match any allowed domain.
 */
export function validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');

    // No Origin header → server-to-server or same-origin form POST → allow
    if (!origin) return true;

    const host = request.headers.get('host') || '';

    const allowedOrigins = new Set([
        // Production domains
        'https://open.ncskit.org',
        // Dynamic: match the current host (handles Vercel preview URLs)
        `https://${host}`,
        `http://${host}`,
    ]);

    // Development
    if (process.env.NODE_ENV === 'development') {
        allowedOrigins.add('http://localhost:3000');
        allowedOrigins.add('http://localhost:3001');
        allowedOrigins.add('http://127.0.0.1:3000');
    }

    // Check exact match or prefix match (handles ports)
    for (const allowed of allowedOrigins) {
        if (origin === allowed || origin.startsWith(allowed)) {
            return true;
        }
    }

    return false;
}

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback for environments without crypto.getRandomValues
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Validate CSRF token from request
 */
export function validateCSRFToken(request: NextRequest, expectedToken: string): boolean {
    // Check header first (for AJAX requests)
    const headerToken = request.headers.get('x-csrf-token');
    if (headerToken && headerToken === expectedToken) {
        return true;
    }

    // Check form data (for form submissions)
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/x-www-form-urlencoded')) {
        // Would need to parse form data here
        // For now, rely on header-based validation
    }

    return false;
}

/**
 * Get CSRF token from cookie or generate new one
 */
export function getOrCreateCSRFToken(request: NextRequest): string {
    const existingToken = request.cookies.get('csrf-token')?.value;
    
    if (existingToken && existingToken.length === 64) {
        return existingToken;
    }
    
    return generateCSRFToken();
}

/**
 * Client-side CSRF token management
 */
export class CSRFManager {
    private token: string | null = null;

    /**
     * Get CSRF token from meta tag or generate new one
     */
    getToken(): string {
        if (this.token) return this.token;

        // Try to get from meta tag
        const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (metaToken) {
            this.token = metaToken;
            return this.token;
        }

        // Generate new token
        this.token = generateCSRFToken();
        return this.token;
    }

    /**
     * Add CSRF token to fetch headers
     */
    addToHeaders(headers: HeadersInit = {}): HeadersInit {
        return {
            ...headers,
            'X-CSRF-Token': this.getToken()
        };
    }

    /**
     * Add CSRF token to form data
     */
    addToFormData(formData: FormData): FormData {
        formData.append('_token', this.getToken());
        return formData;
    }

    /**
     * Clear stored token (force regeneration)
     */
    clearToken(): void {
        this.token = null;
    }
}

// Singleton instance for client-side use
export const csrfManager = new CSRFManager();

/**
 * React hook for CSRF protection
 */
export function useCSRF() {
    const getToken = () => csrfManager.getToken();
    const addToHeaders = (headers: HeadersInit = {}) => csrfManager.addToHeaders(headers);
    const addToFormData = (formData: FormData) => csrfManager.addToFormData(formData);

    return { getToken, addToHeaders, addToFormData };
}