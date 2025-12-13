import config from '#config';
import { ContextManager } from '../context/contextManager.js';
import { LLM_CONFIG, getLLMEndpoint } from './llmConfig.js';
import { increment } from '../metrics/registry.js';

/**
 * LLM Interface
 *
 * Responsibilities:
 * - Maintain conversation context
 * - Send messages to LLM backend
 * - Track LLM metrics
 */
export class LLM {
    constructor(initialHistory = null, userId = null) {
        this.userId = userId;

        // Initialize context manager
        this.context = new ContextManager(initialHistory || []);

        // Ensure system prompt exists
        if (!initialHistory || initialHistory.length === 0) {
            this.context.addMessage(
                'system',
                'You are a helpful registrar assistant for RPI students.'
            );
        }
    }

    /**
     * Send a message to the LLM
     *
     * @param {string} content
     * @param {string} role
     * @param {boolean} save
     */
    async chat(content, role = 'user', save = false) {
        // Track LLM request
        increment('llm_requests_total');

        // Add user message to context
        this.context.addMessage(role, content);

        let response;
        try {
            response = await fetch(`${getLLMEndpoint()}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: LLM_CONFIG.model,
                    messages: this.context.getHistory(),
                }),
            });
        } catch (error) {
            increment('llm_failures_total');
            config.error('LLM connection failed:', error);
            throw new Error('Failed to connect to LLM backend');
        }

        if (!response.ok) {
            increment('llm_failures_total');
            const text = await response.text().catch(() => '');
            config.error('LLM error response:', text);
            throw new Error('LLM backend returned an error');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let assistantMessage = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                for (const line of chunk.split('\n')) {
                    if (!line.trim()) continue;

                    try {
                        const data = JSON.parse(line);
                        if (data.message?.content) {
                            assistantMessage += data.message.content;
                        }
                    } catch {
                        // Ignore partial JSON fragments
                    }
                }
            }
        } catch (error) {
            increment('llm_failures_total');
            config.error('Error reading LLM stream:', error);
            throw new Error('Failed while reading LLM response');
        }

        // Add assistant response to context
        this.context.addMessage('assistant', assistantMessage);

        return {
            role: 'assistant',
            message: {
                content: assistantMessage,
            },
        };
    }
}
