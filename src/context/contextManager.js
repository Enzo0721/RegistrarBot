/**
 * Conversation Context Manager (v2)
 *
 * Adds:
 * - Fixed-size message window
 *
 * NOTE:
 * This implementation is intentionally naive.
 * Token awareness and smarter truncation
 * will be added in a later iteration.
 */

const DEFAULT_MAX_MESSAGES = 20;

export class ContextManager {
    constructor(initialHistory = [], maxMessages = DEFAULT_MAX_MESSAGES) {
        this.maxMessages = maxMessages;
        this.history = Array.isArray(initialHistory)
            ? [...initialHistory]
            : [];
    }

    /**
     * Add a message to context
     * Drops oldest messages if limit exceeded
     */
    addMessage(role, content) {
    if (!role || !content) return;

    this.history.push({ role, content });

    if (this.history.length > this.maxMessages) {
        const systemMessages = this.history.filter(
            (m) => m.role === 'system'
        );
        const nonSystem = this.history.filter(
            (m) => m.role !== 'system'
        );

        // Keep system messages, trim oldest non-system messages
        while (
            systemMessages.length + nonSystem.length >
            this.maxMessages
        ) {
            nonSystem.shift();
        }

        this.history = [...systemMessages, ...nonSystem];
    }
    }


    /**
     * Return conversation history
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Clear context
     */
    clear() {
        this.history = [];
    }

    /**
     * Get current context size
     */
    size() {
        return this.history.length;
    }
}
