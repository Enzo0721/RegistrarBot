/**
 * Naive token estimator
 *
 * This is an approximation intended for
 * rough context window management.
 *
 * Assumption:
 * ~4 characters per token (common heuristic)
 */

const CHARS_PER_TOKEN = 4;

export function estimateTokens(text) {
    if (!text || typeof text !== 'string') return 0;
    return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function estimateMessageTokens(message) {
    if (!message || !message.content) return 0;
    return estimateTokens(message.content);
}
