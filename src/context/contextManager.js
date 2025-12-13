import config from '#config';
import { estimateMessageTokens } from './tokenEstimator.js';

const DEFAULT_MAX_MESSAGES = 20;
const DEFAULT_MAX_TOKENS = 2048;

export class ContextManager {
    constructor(
        initialHistory = [],
        maxMessages = DEFAULT_MAX_MESSAGES,
        maxTokens = DEFAULT_MAX_TOKENS
    ) {
        this.maxMessages = maxMessages;
        this.maxTokens = maxTokens;
        this.history = Array.isArray(initialHistory)
            ? [...initialHistory]
            : [];
    }

    addMessage(role, content) {
        if (!role || !content) return;

        this.history.push({ role, content });

        this.enforceLimits();
    }

    enforceLimits() {
        // Preserve system messages
        const systemMessages = this.history.filter(
            (m) => m.role === 'system'
        );
        let nonSystem = this.history.filter(
            (m) => m.role !== 'system'
        );

        // Enforce message count
        while (
	    systemMessages.length + nonSystem.length >
	    this.maxMessages
	) {
    	config.warn(
        	'@@force',
        	'ContextManager: dropping message due to maxMessages limit'
    	);
    	nonSystem.shift();
	}

        // Enforce token limit (naive)
        let totalTokens = this.getEstimatedTokenCount([
            ...systemMessages,
            ...nonSystem,
        ]);
	while (totalTokens > this.maxTokens && nonSystem.length > 0) {
	    config.warn(
	        '@@force',
	        'ContextManager: dropping message due to token limit'
	    );
	    nonSystem.shift();
	    totalTokens = this.getEstimatedTokenCount([
	        ...systemMessages,
	        ...nonSystem,
	    ]);
	}

        this.history = [...systemMessages, ...nonSystem];
    }

    getEstimatedTokenCount(messages = this.history) {
        return messages.reduce(
            (sum, msg) => sum + estimateMessageTokens(msg),
            0
        );
    }

    getHistory() {
        return [...this.history];
    }

    clear() {
        this.history = [];
    }

    size() {
        return this.history.length;
    }
}
