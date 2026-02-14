// Modern framework-agnostic services

/**
 * Modern Storage Service
 */
export class Storage {
    constructor(useSessionStorage = true) {
        this.useSessionStorage = useSessionStorage;
    }

    getItem(key) {
        const s = this.useSessionStorage ? sessionStorage : localStorage;
        try {
            return s.getItem(key);
        } catch (e) {
            console.error(`[Storage] Unable to get data for '${key}'`, e);
            return null;
        }
    }

    setItem(key, data) {
        const s = this.useSessionStorage ? sessionStorage : localStorage;
        try {
            s.setItem(key, data);
        } catch (e) {
            console.error(`[Storage] Unable to set data for '${key}'`, e);
        }
    }
}

/**
 * Modern Requests Stats Service
 */
export class Requests {
    constructor() {
        this.pending = 0;
        this.successful = 0;
        this.failed = 0;
        this.lastStatus = [];
        this._listeners = new Set();
    }

    onChange(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    }

    _notify() {
        this._listeners.forEach(cb => cb({
            pending: this.pending,
            successful: this.successful,
            failed: this.failed
        }));
    }

    incPendingRequests() { this.pending++; this._notify(); }
    decPendingRequests() { this.pending--; this._notify(); }
    incSuccessfulRequests() { this.successful++; this._notify(); }
    incFailedRequests(status) {
        this.failed++;
        this.lastStatus.unshift(status);
        this._notify();
    }
}

/**
 * Modern Request Config Service
 */
export class RequestConfig {
    constructor(storage) {
        this.storage = storage;
        this.endpointURL = storage.getItem('endpoint') || '';
        this.limit = parseInt(storage.getItem('limit')) || 10;
        this.labelLanguage = storage.getItem('lang') || 'en';
        this.queryDelay = storage.getItem('query-delay') !== null ? parseInt(storage.getItem('query-delay')) : 100;
        this.concurrency = parseInt(storage.getItem('concurrency')) || 1;
        this.format = 'application/sparql-results+json';
        this.timeout = '30s';
    }

    getRequestURL() { return this.endpointURL; }
    setEndpointURL(url) {
        this.endpointURL = url;
        this.storage.setItem('endpoint', url);
    }

    forQuery(query, signal) {
        return {
            url: new URL(this.endpointURL),
            params: {
                query,
                format: this.format,
                timeout: this.timeout,
                debug: 'on'
            },
            headers: {
                'Accept': 'application/sparql-results+json'
            },
            signal
        };
    }
}

/**
 * Modern SparqlClient with Concurrency Control
 */
export class SparqlClient {
    constructor(requestConfig, requests) {
        this.requestConfig = requestConfig;
        this.requests = requests;
        this._queue = [];
        this._active = 0;
    }

    async query(query, abortSignal) {
        return new Promise((resolve, reject) => {
            this._queue.push({ query, abortSignal, resolve, reject });
            this._processQueue();
        });
    }

    async _processQueue() {
        const concurrency = this.requestConfig.concurrency || 1;
        if (this._active >= concurrency || this._queue.length === 0) return;

        const { query, abortSignal, resolve, reject } = this._queue.shift();
        this._active++;

        try {
            if (this.requestConfig.queryDelay > 0) {
                await new Promise(res => setTimeout(res, this.requestConfig.queryDelay));
            }

            const config = this.requestConfig.forQuery(query, abortSignal);
            // Append params to URL
            Object.keys(config.params).forEach(key => config.url.searchParams.append(key, config.params[key]));

            this.requests.incPendingRequests();

            const response = await fetch(config.url, {
                method: 'GET',
                headers: config.headers,
                signal: config.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.requests.decPendingRequests();
            this.requests.incSuccessfulRequests();
            resolve(data);
        } catch (err) {
            this.requests.decPendingRequests();
            if (err.name !== 'AbortError') {
                this.requests.incFailedRequests(err.status || -1);
            }
            reject(err);
        } finally {
            this._active--;
            this._processQueue();
        }
    }
}
