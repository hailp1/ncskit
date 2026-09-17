import { WebR } from 'webr';
import { getOptimalChannelType, BASE_URL, unpackWebRObject } from './core';
import { logger } from '@/utils/logger';

export class WebRPoolManager {
    private static instance: WebRPoolManager;
    private pool: WebR[] = [];
    private busyWorkers: Set<WebR> = new Set();
    private maxWorkers: number = 1;
    private isInitializing: boolean = false;

    private constructor() {
        const hardwareCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2;
        const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        
        // Mobile devices have strict RAM limits (especially iOS). 
        // Spawning 4 WebR workers uses >1GB RAM and causes silent OOM crashes.
        // If mobile, we set maxWorkers to 1 (which forces single-thread fallback in pls-sem).
        this.maxWorkers = isMobile ? 1 : Math.max(1, Math.min(hardwareCores - 1, 4));
    }

    public static getInstance(): WebRPoolManager {
        if (!WebRPoolManager.instance) {
            WebRPoolManager.instance = new WebRPoolManager();
        }
        return WebRPoolManager.instance;
    }

    /**
     * Initializes the worker pool. Can be called in the background.
     */
    public async initPool(): Promise<void> {
        if (this.isInitializing || this.pool.length >= this.maxWorkers) return;
        this.isInitializing = true;

        try {
            logger.info(`[WebR Pool] Initializing pool with ${this.maxWorkers} workers...`);
            
            // Spawn workers sequentially to avoid blocking the main thread entirely
            for (let i = this.pool.length; i < this.maxWorkers; i++) {
                const worker = new WebR({
                    baseUrl: BASE_URL,
                    channelType: getOptimalChannelType(),
                });
                
                await worker.init();

                // Generate unique RNG state
                const localRepo = (typeof window !== 'undefined' && window.location.origin) 
                    ? window.location.origin + "/webr_repo_v6" 
                    : "https://open.ncskit.org/webr_repo_v6";

                await worker.evalR(`
                    RNGkind("L'Ecuyer-CMRG")
                    options(repos = c(LOCAL = "${localRepo}", SEMINR = "https://sem-in-r.r-universe.dev", CRAN = "https://repo.r-wasm.org/"))
                    options(pkgType = "binary")
                `);
                
                logger.info('[WebR Pool] Worker ' + (i + 1) + ' verifying/installing seminr...');
                try {
                    await worker.evalR(`
                        if (!require("seminr", character.only = TRUE, quietly = TRUE)) {
                            tryCatch(webr::install("seminr"), error = function(e) {})
                        }
                    `);
                } catch (e) {
                    logger.warn('[WebR Pool] Worker install failed, but continuing...', e);
                }
                
                this.pool.push(worker);
                logger.debug('[WebR Pool] Worker ' + (i + 1) + '/' + this.maxWorkers + ' ready.');
            }
        } catch (error) {
            logger.error('[WebR Pool] Failed to initialize pool:', error);
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Acquires an idle worker from the pool.
     */
    public async acquireWorker(): Promise<WebR | null> {
        // Find an idle worker
        const idleWorker = this.pool.find(w => !this.busyWorkers.has(w));
        
        if (idleWorker) {
            this.busyWorkers.add(idleWorker);
            return idleWorker;
        }

        // If no idle worker and we haven't reached max capacity, try to init more (auto-scale)
        if (this.pool.length < this.maxWorkers && !this.isInitializing) {
            await this.initPool();
            return this.acquireWorker();
        }

        return null;
    }

    /**
     * Releases a worker back to the pool.
     */
    public releaseWorker(worker: WebR): void {
        if (this.busyWorkers.has(worker)) {
            // Clean up memory before releasing
            worker.evalR('rm(list = ls(all.names = TRUE)); gc()').catch(e => logger.warn('[WebR Pool] Failed to GC worker:', e)).finally(() => {
                this.busyWorkers.delete(worker);
            });
        }
    }
    
    public getPoolSize(): number {
        return this.pool.length;
    }
    
    public getBusyCount(): number {
        return this.busyWorkers.size;
    }

    public getMaxWorkers(): number {
        return this.maxWorkers;
    }

    /**
     * Executes R code in parallel across available workers
     */
    public async executeRParallel<T>(
        tasks: { code: string; data?: number[][] }[],
        timeoutMs: number = 300000
    ): Promise<T[]> {
        await this.initPool();
        const results: T[] = [];
        const activePromises: Promise<void>[] = [];

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            
            const workerPromise = (async () => {
                let worker = await this.acquireWorker();
                let waitStart = Date.now();
                
                // Wait for an available worker if all are busy
                while (!worker) {
                    if (Date.now() - waitStart > 30000) {
                        throw new Error("Timeout: Could not acquire an R worker within 30 seconds. System might be out of memory or workers crashed.");
                    }
                    await new Promise(r => setTimeout(r, 100));
                    worker = await this.acquireWorker();
                }

                try {
                    // Inject data if provided
                    if (task.data && task.data.length > 0) {
                        const CHUNK_SIZE = 500;
                        const numRows = task.data.length;
                        await worker.evalR(`raw_data <- NULL`);
                        for (let j = 0; j < numRows; j += CHUNK_SIZE) {
                            const chunk = task.data.slice(j, j + CHUNK_SIZE);
                            const chunkText = chunk.map(row =>
                                row.map(v => {
                                    if (v === null || v === undefined || (v as any) === '') return 'NA';
                                    const n = Number(v);
                                    return isNaN(n) ? 'NA' : n;
                                }).join(',')
                            ).join('\n');
                            const escapedChunk = chunkText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                            await worker.evalR(`
                                .chunk <- read.csv(text = "${escapedChunk}", header = FALSE, stringsAsFactors = FALSE)
                                .chunk[] <- suppressWarnings(lapply(.chunk, as.numeric))
                                .chunk <- as.matrix(.chunk)
                                raw_data <- if(is.null(raw_data)) .chunk else rbind(raw_data, .chunk)
                                rm(.chunk)
                            `);
                        }
                    }

                    const wrappedCode = `
                        tryCatch({
                            .res <- { ${task.code} }
                            if (is.list(.res)) {
                                attributes(.res)$call <- NULL
                                attributes(.res)$model <- NULL
                            }
                            .res
                        }, error = function(e) {
                            paste("ERROR:", e$message)
                        })
                    `;

                    const evalPromise = worker.evalR(wrappedCode);
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error("Worker timeout or silent crash. Execution took too long.")), 600000); // 10 minutes max
                    });
                    
                    const resultProxy = await Promise.race([evalPromise, timeoutPromise]) as any;

                    try {
                        const resultType = await resultProxy.type();
                        if (resultType === "character" || resultType === "string") {
                            const strArray = await resultProxy.toArray();
                            const str = strArray[0];
                            if (typeof str === 'string' && str.startsWith("ERROR:")) {
                                throw new Error(str.replace("ERROR:", "").trim());
                            }
                        }

                        const rawJs = await resultProxy.toJs();
                        results[i] = unpackWebRObject(rawJs);
                    } finally {
                        if (resultProxy && typeof resultProxy.destroy === 'function') {
                            resultProxy.destroy();
                        }
                    }
                } finally {
                    this.releaseWorker(worker);
                }
            })();

            activePromises.push(workerPromise);
        }

        await Promise.all(activePromises);
        return results;
    }
}

export const webRPool = WebRPoolManager.getInstance();
