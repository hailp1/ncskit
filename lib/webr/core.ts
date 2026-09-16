import { WebR } from 'webr';
import { translateRError } from './utils';
import { getCachedWebRState, setCachedWebRState } from './cache';
import { getRequiredPackages, isPackageLoaded, markPackageLoaded, resetLoadedPackages } from './package-registry';
import { logger } from '@/utils/logger';
import { captureWebRError } from '@/lib/monitoring';

let webRInstance: WebR | null = null;
let isInitializing = false;
let initPromise: Promise<WebR> | null = null;
let initProgress: string = '';
let onProgressCallback: ((msg: string) => void) | null = null;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

// Storage keys for crash monitoring
const CRASH_COUNTER_KEY = 'webr_crash_count';
const REPO_VERSION = 'webr_repo_v6';

// Error recovery state
let lastError: Error | null = null;

// Crash loop breaker - prevent infinite fatal error restart cycles
let fatalCrashCount = 0;
const MAX_FATAL_CRASHES = 2;

let evaluationLock: Promise<void> = Promise.resolve();

async function runLocked<T>(task: () => Promise<T>): Promise<T> {
    const previousLock = evaluationLock;
    let resolveLock: () => void;
    evaluationLock = new Promise(resolve => { resolveLock = resolve; });
    
    try {
        await previousLock;
        return await task();
    } finally {
        // @ts-ignore
        resolveLock!();
    }
}

export const BASE_URL = typeof window !== 'undefined' 
    ? window.location.origin + '/webr_core_v3/' 
    : '/webr_core_v3/';

export const getOptimalChannelType = (): 0 | 1 | 3 => {
    // CRITICAL FIX: Always use PostMessage (channel 3).
    // WebR + SharedArrayBuffer (channel 0/1) crashes silently or hangs indefinitely
    // when the page uses COEP 'credentialless' (which sets crossOriginIsolated=true
    // but doesn't provide full CORP compliance that WebR's SAB channel requires).
    // PostMessage is slower but 100% stable on ALL browsers.
    return 3;
};

export function getWebRStatus(): {
    isReady: boolean;
    isLoading: boolean;
    progress: string;
    lastError: string | null;
    canRetry: boolean;
} {
    return {
        isReady: webRInstance !== null,
        isLoading: isInitializing,
        progress: initProgress,
        lastError: lastError?.message || null,
        canRetry: initAttempts < MAX_INIT_ATTEMPTS && !isInitializing
    };
}

export function setProgressCallback(callback: (msg: string) => void) {
    onProgressCallback = callback;
}

function updateProgress(msg: string): void {
    initProgress = msg;
    if (onProgressCallback) {
        onProgressCallback(msg);
    }
}

export function resetWebR(): void {
    webRInstance = null;
    isInitializing = false;
    initPromise = null;
    initProgress = '';
    lastError = null;
    initAttempts = 0;
    evaluationLock = Promise.resolve();
    // NOTE: fatalCrashCount intentionally NOT reset here to track across resets
    resetLoadedPackages();
    updateProgress('WebR reset - ready for reinitialization');
}

/**
 * Aggressive environment cleanup
 */
export async function clearWebRStorage(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('webr_fs_broken');
        localStorage.removeItem(CRASH_COUNTER_KEY);
    }
    
    if (typeof window !== 'undefined' && window.indexedDB) {
        try {
            logger.debug('[WebR] CLEANUP: Deleting specific WebR IndexedDB corruptions...');
            const idb: any = window.indexedDB;
            // Only delete specific, known WebR/Emscripten databases to prevent wiping out other apps
            const targetDBs = ['emscripten_fs', 'webr_fs', 'WebR'];
            
            for (const dbName of targetDBs) {
                try { idb.deleteDatabase(dbName); } catch(err) {}
            }
        } catch (e) {
            logger.warn('[WebR] Cleanup skipped or restricted:', e);
        }
    }

    if (typeof window !== 'undefined' && navigator.serviceWorker) {
        try {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (let reg of regs) { await reg.unregister(); }
        } catch(e) {}
    }
    
    resetWebR();
    if (typeof window !== 'undefined') window.location.reload();
}

/**
 * Main WebR Initialization with Rapid Recovery
 */
export async function initWebR(maxRetries: number = 3): Promise<WebR> {
    if (webRInstance) return webRInstance;
    if (initPromise) return initPromise;

    // Monitor consecutive crashes in this session
    let crashCount = 0;
    if (typeof sessionStorage !== 'undefined') {
        crashCount = parseInt(sessionStorage.getItem(CRASH_COUNTER_KEY) || '0');
        if (crashCount >= 5) {
            logger.error('[WebR] Critical failure loop detected! Triggering deep reset.');
            sessionStorage.setItem(CRASH_COUNTER_KEY, '0');
            await clearWebRStorage();
            return new Promise(() => {}); // Stop execution, page will reload
        }
    }

    isInitializing = true;
    updateProgress('R-Engine Loading...');

    initPromise = (async () => {
        isInitializing = true;
        updateProgress('⚙️ Đang khởi động R-Engine...');
        const startTime = performance.now();

        const initTimeout = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('R-Engine initialization timed out (180s)')), 180000)
        );

        const performInit = (async (): Promise<WebR> => {
            try {
                console.log('[DEBUG-INIT] Step 1: Creating WebR instance with baseUrl:', BASE_URL, 'channelType:', getOptimalChannelType());
                logger.info('[WebR] Initializing WebR instance...');
                updateProgress('🚀 Đang kết nối máy chủ R...');
                
                const webR = new WebR({
                    baseUrl: BASE_URL,
                    channelType: getOptimalChannelType(),
                });
                console.log('[DEBUG-INIT] Step 2: WebR constructor succeeded');

                // Register the PWA Service Worker for caching WebR packages
                if (typeof window !== 'undefined' && navigator.serviceWorker) {
                    try {
                        await navigator.serviceWorker.register('/sw.js');
                        logger.info('[WebR] Service Worker registered for rapid package caching.');
                    } catch (e) {
                        logger.warn('[WebR] Service Worker registration failed:', e);
                    }
                }

                console.log('[DEBUG-INIT] Step 3: Calling webR.init()...');
                logger.debug('[WebR] Created instance, waiting for worker...');
                
                // CRITICAL: Safety timeout for webR.init()
                await Promise.race([
                    webR.init(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('WebR worker init timeout (Next.js server is likely compiling or lagging)')), 120000))
                ]);
                
                console.log('[DEBUG-INIT] Step 4: webR.init() resolved OK');
                logger.info('[WebR] Worker online.');
                const persistentLib = '/home/web_user/library';

                updateProgress('📂 Đang kết nối bộ nhớ...');
                let storageSane = false;
                const channelType = getOptimalChannelType();

                // IDBFS has been permanently disabled in favour of PWA Service Worker CacheStorage
                // The Service Worker handles intercepting and caching *.so and *.RData files,
                // providing <1s reload times without the WebR VFS crash bugs.
                logger.info('[WebR] Using Service Worker CacheStorage for offline capabilities.');
                storageSane = true;
                
                if (!storageSane) logger.info('[WebR] RAM Mode Active (High Performance)');

                const fallbackRepo = "https://repo.r-wasm.org/";
                const localRepo = (typeof window !== 'undefined' && window.location.origin) 
                    ? window.location.origin + "/" + REPO_VERSION 
                    : "https://ncskit.org/" + REPO_VERSION;

                console.log('[DEBUG-INIT] Step 5: Configuring R environment...');
                await runLocked(async () => {
                    await webR.evalR(`
                        if (dir.exists("${persistentLib}")) {
                            .libPaths(c('${persistentLib}', .libPaths()))
                        }
                        
                        # Configure repos: local first, then r-universe, then r-wasm.org as fallback
                        local_repo <- "${localRepo}"
                        lavaan_repo <- "https://repo.r-wasm.org/"
                        seminr_repo <- "https://sem-in-r.r-universe.dev"
                        ropensci_repo <- "https://ropensci.r-universe.dev"
                        fallback_repo <- "https://repo.r-wasm.org/"
                        
                        options(repos = c(LOCAL = local_repo, LAVAAN = lavaan_repo, SEMINR = seminr_repo, ROPEN = ropensci_repo, CRAN = fallback_repo))
                        options(pkgType = "binary")
                        options(webr.repo_quiet = FALSE) # Set to FALSE to see errors in console
                        options(timeout = 60)
                        
                        # Helper to install if missing
                        install_if_missing <- function(pkg) {
                            if (!require(pkg, character.only = TRUE, quietly = TRUE)) {
                                message("Installing missing package: ", pkg)
                                tryCatch(webr::install(pkg), error = function(e) { message("Install error: ", e) })
                                library(pkg, character.only = TRUE)
                            }
                        }
                        
                        # Ensure essential packages are available
                        # NOTE: psych, GPArotation, and jsonlite have been REMOVED.
                        # All analysis code now uses pure Base R (factanal, eigen, varimax, cor, etc.)
                        # We return results using WebR's native toJs() instead of jsonlite::toJSON.
                        # This eliminates WASM LAPACK crashes and saves 20-30s download time.
                        
                        r_version_info <- paste0(R.version$major, ".", R.version$minor, " (", R.version$platform, ")")
                    `);
                });

                console.log('[DEBUG-INIT] Step 6: R config done, getting version...');
                const rVersionFull = unpackWebRObject(await (await runLocked(() => webR.evalR('r_version_info'))).toJs());
                console.log('[DEBUG-INIT] Step 7: R version:', rVersionFull);
                logger.info(`[WebR] R Engine Online: ${rVersionFull}`);

                const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
                console.log(`[DEBUG-INIT] Step 8: INIT COMPLETE in ${elapsed}s`);
                logger.debug(`[WebR] Ready in ${elapsed}s`);
                updateProgress('✅ R-Engine sẵn sàng');
                
                // Active Memory Management (Immortal Mode)
                await runLocked(() => webR.evalR('gc()'));

                // Clear crash count on success
                if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(CRASH_COUNTER_KEY, '0');

                webRInstance = webR;
                isInitializing = false;
                initAttempts = 0;
                return webRInstance;

            } catch (error: any) {
                console.error('[DEBUG-INIT] INIT FAILED:', error?.message, error?.stack);
                logger.error('[WebR] Init Failure:', error);
                
                // Track crash count
                if (typeof sessionStorage !== 'undefined') {
                    const currentCrash = parseInt(sessionStorage.getItem(CRASH_COUNTER_KEY) || '0');
                    sessionStorage.setItem(CRASH_COUNTER_KEY, (currentCrash + 1).toString());
                }

                captureWebRError(error, { phase: 'init' });
                isInitializing = false;
                initPromise = null;
                lastError = error;
                initAttempts++;
                updateProgress('❌ Lỗi khởi tạo R-Engine');
                throw error;
            }
        });

        return Promise.race([performInit(), initTimeout]);
    })();

    return initPromise;
}

export async function loadPackagesForMethod(method: string): Promise<void> {
    const webR = await initWebR();
    const required = getRequiredPackages(method);
    const officialRepo = "https://repo.r-wasm.org/";
    const localRepo = (typeof window !== 'undefined' && window.location.origin) 
        ? window.location.origin + "/" + REPO_VERSION 
        : "https://ncskit.org/" + REPO_VERSION;

    for (const pkg of required) {
        if (isPackageLoaded(pkg)) continue;

        try {
            updateProgress(`Installing ${pkg}...`);

            // CRITICAL: Before loading lavaan, create quadprog stub package on VFS
            // quadprog is not available as WebR/WASM binary, but lavaan requires it as Imports dependency
            if (pkg === 'lavaan' && !isPackageLoaded('quadprog')) {
                updateProgress('Preparing quadprog compatibility layer...');
                await runLocked(async () => {
                    await webR.evalR(`
                        if (!require("quadprog", character.only = TRUE, quietly = TRUE)) {
                            lib_path <- .libPaths()[1]
                            pkg_dir <- file.path(lib_path, "quadprog")
                            if (dir.exists(pkg_dir)) unlink(pkg_dir, recursive = TRUE)
                            dir.create(file.path(pkg_dir, "R"), recursive = TRUE, showWarnings = FALSE)
                            dir.create(file.path(pkg_dir, "Meta"), recursive = TRUE, showWarnings = FALSE)
                            
                            writeLines(c(
                                "Package: quadprog", "Version: 1.5-8",
                                "Title: Quadratic Programming Stub for WebR",
                                "Description: Stub for WebR - provides namespace so lavaan can load.",
                                "Author: WebR Stub", "Maintainer: WebR Stub <stub@webr>",
                                "License: GPL-2", "NeedsCompilation: no",
                                paste0("Built: R ", R.version$major, ".", R.version$minor, "; ; ", Sys.time(), "; unix")
                            ), file.path(pkg_dir, "DESCRIPTION"))
                            
                            writeLines(c("export(solve.QP)", "export(solve.QP.compact)"), file.path(pkg_dir, "NAMESPACE"))
                            
                            desc_fields <- read.dcf(file.path(pkg_dir, "DESCRIPTION"))[1, ]
                            saveRDS(list(DESCRIPTION = desc_fields, Built = list(R = getRversion(), Platform = "", Date = Sys.time(), OStype = "unix")),
                                    file.path(pkg_dir, "Meta", "package.rds"))
                            
                            saveRDS(list(exports = c("solve.QP", "solve.QP.compact"), exportPatterns = character(0),
                                         imports = list(), importFrom = list(), importClasses = list(), importMethods = list(),
                                         S3methods = matrix(character(0), ncol = 4, dimnames = list(NULL, c("generic","class","method","from")))),
                                    file.path(pkg_dir, "Meta", "nsInfo.rds"))
                            
                            writeLines(c(
                                'solve.QP <- function(Dmat, dvec, Amat, bvec, meq=0, factorized=FALSE) stop("quadprog::solve.QP not available in WebR")',
                                'solve.QP.compact <- function(Dmat, dvec, Amat, Aind, bvec, meq=0, factorized=FALSE) stop("quadprog::solve.QP.compact not available in WebR")'
                            ), file.path(pkg_dir, "R", "quadprog"))
                        }
                    `);
                });
                markPackageLoaded('quadprog');
                logger.info('[WebR] quadprog stub package created successfully');
            }

            await runLocked(async () => {
                await webR.evalR(`
                    if (!require("${pkg}", character.only = TRUE, quietly = TRUE)) {
                        # CDN First - Much faster for deployment and ensures latest stable WASM binaries
                        .repos <- c("https://sem-in-r.r-universe.dev", "https://ropensci.r-universe.dev", "${officialRepo}")
                        tryCatch(webr::install("${pkg}", repos = .repos), error = function(e) {
                             # Local Fallback
                             tryCatch(webr::install("${pkg}", repos = "${localRepo}"), error = function(e) {})
                        })
                        library("${pkg}", character.only = TRUE)
                    }
                `);
            });

            // CRITICAL: After loading lavaan, patch lav_options_checkinterval for WASM compatibility
            // lavaan 0.6.21 has a bug where integer conversion in option validation produces NA on WASM
            if (pkg === 'lavaan') {
                await runLocked(async () => {
                    await webR.evalR(`
                        tryCatch(
                            assignInNamespace("lav_options_checkinterval", function(...) TRUE, ns = "lavaan"),
                            error = function(e) {}
                        )
                    `);
                });
                logger.info('[WebR] lavaan patched for WASM compatibility');
            }
            
            // DISABLED: syncfs() crashes WebR worker with FileReaderSync error
            // when VFS is large (60+ packages). PostMessage channel cannot handle
            // the serialized VFS data. Packages will be re-downloaded on reload.
            // const channelType = getOptimalChannelType();
            // if (channelType !== 0) {
            //     try {
            //         logger.info(`[WebR] Persisting ${pkg} to storage...`);
            //         await webR.FS.syncfs(false); 
            //     } catch (e) {
            //         logger.warn(`[WebR] Failed to persist ${pkg}:`, e);
            //     }
            // }
            logger.info(`[WebR] Package ${pkg} loaded (RAM-only, no syncfs)`);
            
            markPackageLoaded(pkg);
        } catch (error) {
            logger.error(`Failed to load ${pkg}:`, error);
        }
    }
}

function unpackWebRObject(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
    if (obj instanceof Uint8Array || obj instanceof Uint16Array || obj instanceof Uint32Array || 
        obj instanceof Int8Array || obj instanceof Int16Array || obj instanceof Int32Array || 
        obj instanceof Float32Array || obj instanceof Float64Array) {
        return obj;
    }
    if (Array.isArray(obj)) return obj.map(unpackWebRObject);
    if (obj.type === 'list' && obj.names && obj.values) {
        const result: any = {};
        for (let i = 0; i < obj.names.length; i++) {
            result[obj.names[i]] = unpackWebRObject(obj.values[i]);
        }
        return result;
    }
    if (obj.type && obj.values !== undefined) {
        if (Array.isArray(obj.values)) {
            if (obj.values.length === 1) return unpackWebRObject(obj.values[0]);
            return obj.values.map(unpackWebRObject);
        }
        return unpackWebRObject(obj.values);
    }
    const result: any = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) result[key] = unpackWebRObject(obj[key]);
    }
    return result;
}

export async function executeRWithRecovery(
    rCode: string,
    method?: string,
    retryCount: number = 0,
    maxRetries: number = 2,
    timeoutMs: number = 300000,
    csvData?: number[][] 
): Promise<any> {
    const webR = await initWebR();

    try {
        if (method) {
            const required = getRequiredPackages(method);
            const needsLoad = required.some(pkg => !isPackageLoaded(pkg));
            if (needsLoad) await loadPackagesForMethod(method);
        }

        if (csvData && csvData.length > 0) {
            updateProgress('📊 Đang nạp dữ liệu...');
        }

        const executionPromise = runLocked(async () => {
            if (csvData && csvData.length > 0) {
                const numRows = csvData.length;
                const numCols = numRows > 0 ? csvData[0].length : 0;

                const flatData = new Array(numRows * numCols);
                let idx = 0;
                let naCount = 0;
                
                for (let r = 0; r < numRows; r++) {
                    const row = csvData[r];
                    for (let c = 0; c < numCols; c++) {
                        const v = row[c];
                        if (v === null || v === undefined || (v as any) === '' || isNaN(Number(v))) {
                            flatData[idx++] = "NA";
                            naCount++;
                        } else {
                            flatData[idx++] = String(v);
                        }
                    }
                }

                // Warn if all data is NA (likely column-name mismatch)
                if (naCount === numRows * numCols) {
                    console.error(`[WebR] All ${naCount} cells are NA. Input data may have mismatched column names.`);
                }

                await webR.objs.globalEnv.bind('.flat_data', flatData);
                await webR.evalR(`
                    raw_data <- matrix(as.numeric(.flat_data), nrow=${numRows}, ncol=${numCols}, byrow=TRUE)
                    rm(.flat_data)
                `);
            }

            const wrappedCode = `
                tryCatch({
                    .res <- { ${rCode} }
                    if (is.list(.res)) {
                        attributes(.res)$call <- NULL
                        attributes(.res)$model <- NULL
                    }
                    .res
                }, error = function(e) {
                    list(WEBR_ERROR = paste("ERROR:", e$message))
                })
            `;

            console.log("[WebR Debug] Executing wrappedCode");
            const resultProxy = await webR.evalR(wrappedCode);
            console.log("[WebR Debug] wrappedCode executed");

            let jsResult;
            try {
                console.log("[WebR Debug] Calling toJs() on resultProxy");
                jsResult = await resultProxy.toJs() as any;
                console.log("[WebR Debug] toJs() successful");
            } catch (err) {
                console.error("[WebR Debug] toJs() failed!", err);
                throw err;
            }

            // Check if R threw an error (we caught it and returned a list with WEBR_ERROR)
            if (jsResult && jsResult.names && jsResult.values) {
                const errIdx = jsResult.names.indexOf("WEBR_ERROR");
                if (errIdx !== -1) {
                    let errMsg = "Unknown R error";
                    const errVal = jsResult.values[errIdx];
                    if (errVal && errVal.values && errVal.values.length > 0) {
                        errMsg = errVal.values[0];
                    }
                    throw new Error(errMsg.replace("ERROR:", "").trim());
                }
            }

            // Clear memory after successful execution
            console.log("[WebR Debug] Running gc()");
            await webR.evalR('gc()');
            console.log("[WebR Debug] gc() finished");

            return unpackWebRObject(jsResult);
        });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs / 1000}s`)), timeoutMs)
        );

        return await Promise.race([executionPromise, timeoutPromise]);

    } catch (error: any) {
        const errorMsg = error?.message || String(error);
        logger.warn('[WebR] Execution Error:', errorMsg);

        const isFatalWorkerError = 
            errorMsg.includes('promise already under evaluation') ||
            errorMsg.includes('FileReaderSync') ||
            errorMsg.includes('webr-worker') ||
            errorMsg.includes('Worker terminated') ||
            errorMsg.includes('not a function') ||
            errorMsg.includes('PostMessage channel');
        
        if (isFatalWorkerError) {
            fatalCrashCount++;
            logger.error(`[WebR] Fatal worker state (crash #${fatalCrashCount}/${MAX_FATAL_CRASHES}). Resetting engine...`);
            resetWebR();
            if (fatalCrashCount > MAX_FATAL_CRASHES) {
                throw new Error("Phân tích không khả dụng do lỗi hệ thống R lặp lại. Vui lòng tải lại trang (F5).");
            }
            throw new Error("Hệ thống R đang bận. Tôi đã tự động khởi động lại, vui lòng thực hiện lại phân tích sau vài giây.");
        }

        if (errorMsg.includes('Timeout after')) {
            logger.error('[WebR] Execution timeout. Resetting engine...');
            resetWebR();
            throw new Error(`Phân tích quá thời gian. Hệ thống đã reset, vui lòng thử lại.`);
        }

        if (errorMsg.includes('there is no package called') && retryCount < maxRetries) {
             const match = errorMsg.match(/no package called [‘'"]?([^’'" ]+)[’'" ]?/);
            const missingPkg = match ? match[1].replace(/[‘’'"]/g, '').trim() : null;
            if (missingPkg) {
                logger.warn(`Auto-installing missing package: ${missingPkg}`);
                updateProgress(`Setting up ${missingPkg}...`);
                const officialRepo = "https://repo.r-wasm.org/";
                const localRepo = (typeof window !== 'undefined' && window.location.origin) 
                    ? window.location.origin + "/" + REPO_VERSION 
                    : "https://ncskit.org/" + REPO_VERSION;
                    
                await runLocked(async () => {
                    await webR.evalR(`
                        if (!require("${missingPkg}", character.only = TRUE, quietly = TRUE)) {
                            tryCatch(webr::install("${missingPkg}", repos = "${localRepo}"), error = function(e) {})
                            if (!require("${missingPkg}", character.only = TRUE, quietly = TRUE)) {
                                message("Local install failed for ", "${missingPkg}", ", trying official repo...")
                                tryCatch(webr::install("${missingPkg}", repos = "${officialRepo}"), error = function(e) {})
                            }
                            library("${missingPkg}", character.only = TRUE)
                        }
                    `);
                });
                markPackageLoaded(missingPkg);
                return executeRWithRecovery(rCode, method, retryCount + 1, maxRetries, timeoutMs, csvData);
            }
        }

        if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            return executeRWithRecovery(rCode, method, retryCount + 1, maxRetries, timeoutMs, csvData);
        }

        throw error;
    }
}
