/**
 * Metrics Registry (v1)
 *
 * Central in-memory metrics store.
 * Intentionally simple and synchronous.
 */

const metrics = {
    requests_total: 0,
    llm_requests_total: 0,
    llm_failures_total: 0,
    active_sockets: 0,
};

export function increment(metric) {
    if (metrics[metric] !== undefined) {
        metrics[metric]++;
    }
}

export function set(metric, value) {
    if (metrics[metric] !== undefined) {
        metrics[metric] = value;
    }
}

export function getAllMetrics() {
    return { ...metrics };
}
