'use client';

import { useEffect, useState } from 'react';
import { getStoredLocale, t } from '@/lib/i18n';
import { initWebR, getWebRStatus, setProgressCallback } from '@/lib/webr-wrapper';
import { FeedbackService } from '@/lib/feedback-service';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useAnalysisPersistence } from '@/hooks/useAnalysisPersistence';
import { profileData } from '@/lib/data-profiler';

export function useAnalyzeLifecycle({
    data,
    step,
    setStep,
    profile,
    setProfile,
    filename,
    results,
    analysisType,
    isPrivateMode,
    setNcsBalance,
    setToast,
    setShowDemographics,
    isDemo = false
}: any) {
    const [loading, setLoading] = useState(true);
    const [locale, setLocale] = useState('vi');
    const [authTimeout, setAuthTimeout] = useState(false);
    const [showRestoreBanner, setShowRestoreBanner] = useState(false);
    const { saveWorkspace, loadWorkspace, hasSavedData, clearWorkspace } = useAnalysisPersistence();

    // 0. Global unhandled rejection catcher for debugging
    useEffect(() => {
        const handler = (event: PromiseRejectionEvent) => {
            console.error('[DEBUG-GLOBAL] Unhandled Promise Rejection caught!');
            console.error('[DEBUG-GLOBAL] Reason:', event.reason?.message || event.reason);
            console.error('[DEBUG-GLOBAL] Stack:', event.reason?.stack || 'No stack');
            console.error('[DEBUG-GLOBAL] Full event:', event);
        };
        window.addEventListener('unhandledrejection', handler);
        return () => window.removeEventListener('unhandledrejection', handler);
    }, []);

    // 1. Cache Buster
    useEffect(() => {
        const CURRENT_DEPLOY_VERSION = "20260911_1548"; 
        const savedVersion = localStorage.getItem('ncs_deploy_version');
        
        if (savedVersion && savedVersion !== CURRENT_DEPLOY_VERSION) {
            console.log('[CacheBuster] New version detected, clearing site data and reloading...');
            localStorage.setItem('ncs_deploy_version', CURRENT_DEPLOY_VERSION);
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    for (let registration of registrations) registration.unregister();
                });
            }
            window.location.reload();
        } else {
            localStorage.setItem('ncs_deploy_version', CURRENT_DEPLOY_VERSION);
        }
    }, []);

    // 2. Sync locale only (no balance — no credits in demo)
    useEffect(() => setLocale(getStoredLocale()), []);

    // 3. Auth Guard — REMOVED (demo: always open access)
    useEffect(() => {
        setLoading(false);
    }, []);

    // 4. Safety Timeout for Auth hangs
    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => setAuthTimeout(true), 8000);
            return () => clearTimeout(timer);
        } else {
            setAuthTimeout(false);
        }
    }, [loading]);

    // 5. Data & Profile Availability Check
    useEffect(() => {
        if (loading) return;
        if (data.length === 0 && step !== 'upload') {
            setStep('upload');
            return;
        }
        if (data.length > 0 && profile) {
            // Validate profile matches current data: if column names mismatch, force re-profile
            const dataColumns = Object.keys(data[0] || {});
            const profileColumns = Object.keys(profile.columnStats || {});
            const mismatch = profileColumns.length > 0 && dataColumns.length > 0 &&
                !profileColumns.every(pc => dataColumns.includes(pc));
            if (mismatch) {
                console.warn('[Profile] Stale profile detected: profile columns do not match data. Re-profiling...');
                setProfile(null); // Will trigger re-profile below
            }
        }
        if (step === 'profile' && !profile && data.length > 0) {
            const prof = profileData(data);
            if (prof) setProfile(prof);
            else setStep('upload');
        }
    }, [step, data.length, profile, loading, setStep, setProfile]);

    useEffect(() => {
        setShowRestoreBanner(hasSavedData && data.length === 0);
    }, [hasSavedData, data.length]);

    // 6. Auto-Save
    const getNumericColumns = () => {
        if (!profile) return [];
        return Object.entries(profile.columnStats)
            .filter(([_, stats]: any) => stats.type === 'numeric')
            .map(([name, _]) => name);
    };

    useAutoSave(
        () => {
            if (data.length === 0) return;
            saveWorkspace({
                data,
                columns: getNumericColumns(),
                fileName: filename,
                currentStep: step,
                results,
                analysisType,
            });
        },
        [data, step, results, analysisType, filename],
        { delay: 60000, enabled: data.length > 0 && !isPrivateMode }
    );

    // 7. Save before page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (data.length > 0) {
                saveWorkspace({
                    data,
                    columns: getNumericColumns(),
                    fileName: filename,
                    currentStep: step,
                    results,
                    analysisType,
                });
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [data, step, results, analysisType, filename, saveWorkspace]);

    // 8. Online/Offline events
    useEffect(() => {
        const handleOnline = () => setToast(t(locale as any, 'analyze.common.internet_restored'), 'success');
        const handleOffline = () => setToast(t(locale as any, 'analyze.common.internet_lost'), 'error');
        window.addEventListener('app:online', handleOnline);
        window.addEventListener('app:offline', handleOffline);
        return () => {
            window.removeEventListener('app:online', handleOnline);
            window.removeEventListener('app:offline', handleOffline);
        };
    }, [locale, setToast]);

    // 9. WebR Eager Loading
    useEffect(() => {
        const status = getWebRStatus();
        console.log('[DEBUG-LIFECYCLE] WebR status:', JSON.stringify(status));
        if (!status.isReady && !status.isLoading) {
            setProgressCallback((msg) => {
                console.log('[DEBUG-LIFECYCLE] WebR progress:', msg);
                setToast(msg.includes('Cleaning') ? t(locale as any, 'analyze.common.processing') : msg, 'info');
            });
            console.log('[DEBUG-LIFECYCLE] Calling initWebR()...');
            initWebR()
                .then(() => {
                    console.log('[DEBUG-LIFECYCLE] initWebR() resolved successfully');
                    (window as any).webrLoaded = true;
                    setToast(t(locale as any, 'analyze.common.engine_ready'), 'success');
                })
                .catch((err) => {
                    console.error('[DEBUG-LIFECYCLE] initWebR() REJECTED with error:', err?.message || err, err?.stack);
                    setToast(t(locale as any, 'analyze.common.engine_error'), 'error');
                });
        }
    }, [locale, setToast]);

    // 10. Demographics Survey Check
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!FeedbackService.hasCompletedDemographics()) {
                setShowDemographics(true);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [setShowDemographics]);

    const handleRestore = async (setData: any, setFilename: any, setStep: any, setResults: any, setAnalysisType: any) => {
        const saved = await loadWorkspace();
        if (saved) {
            setData(saved.data);
            setFilename(saved.fileName);
            setProfile(profileData(saved.data));
            setStep(saved.currentStep);
            setResults(saved.results);
            setAnalysisType(saved.analysisType);
            setToast(t(locale as any, 'analyze.common.restored_success') || 'Restored', 'success');
            setShowRestoreBanner(false);
        }
    };

    const discardSaved = async () => {
        await clearWorkspace();
        setShowRestoreBanner(false);
        setToast(t(locale as any, 'analyze.common.data_cleared') || 'Cleared', 'info');
    };

    return {
        loading,
        authTimeout,
        showRestoreBanner,
        handleRestore,
        discardSaved,
        locale,
        getNumericColumns
    };
}
