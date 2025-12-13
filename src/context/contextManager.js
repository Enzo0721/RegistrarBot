/**
 * Conversation Context Manager (v1)
 *
 * Responsibilities:
 * - Store ordered conversation messages
 * - Append messages with role + content
 * - Expose history in LLM-compatible format
 *
 * NOTE:
 * This version intentionally does NOT perform
 * truncation or token counting yet.
 */

export class ContextManager {
    constructor(initialHistory = []) {
        this.history = Array.isArray(initialHistory)
            ? [...initialHistory]
            : [];
    }

    /**
     * Add a message to context
     * @param {string} role - system | user | assistant
     * @param {string} content
     */
    addMessage(role, content) {
        if (!role || !content) return;

        this.history.push({
            role,
            content,
        });
    }

    /**
     * Get full conversation history
     * (LLM-compatible format)
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Reset conversation context
     */
    clear() {
        this.history = [];
    }
}
