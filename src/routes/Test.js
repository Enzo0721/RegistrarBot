import express from 'express';
import config from '#config';
import { LLM_CONFIG, getLLMEndpoint } from '../interfaces/llmConfig.js';

const router = express.Router();

class Test {
    async chatbot(message) {
        config.log('asking chatbot ' + message);

        let response;
        try {
            response = await fetch(`${getLLMEndpoint()}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: LLM_CONFIG.model,
                    messages: [{ role: 'user', content: message }],
                }),
            });
        } catch (error) {
            config.error('Failed to connect to LLM service:', error);
            throw new Error(
                `Failed to connect to LLM service at ${getLLMEndpoint()}`
            );
        }

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            config.error(
                `LLM service returned error: ${response.status} ${response.statusText} - ${errorText}`
            );
            throw new Error(
                `LLM service error: ${response.status} ${response.statusText}`
            );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullResponse = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                // Each chunk may contain one or more JSON lines
                for (const line of chunk.split('\n')) {
                    if (!line.trim()) continue;

                    try {
                        const data = JSON.parse(line);
                        if (data.message?.content) {
                            fullResponse += data.message.content;
                        }
                    } catch {
                        // Ignore partial JSON fragments
                        config.warn(
                            'Failed to parse JSON chunk from LLM response'
                        );
                    }
                }
            }
        } catch (streamError) {
            config.error('Error reading LLM response stream:', streamError);
            throw new Error('Failed to read LLM response stream');
        }

        config.log('Chatbot full response: ' + fullResponse);
        return fullResponse;
    }

    constructor(io) {
        this.io = io;
        this.listen();
        return router;
    }

    listen() {
        router.get('/ping', async (_, res) => {
            return res.json({ ping: 'pong' });
        });

        router.post('/ask', async (req, res) => {
            try {
                const response = await this.chatbot(req.body.query);
                return res.status(200).json({
                    question: req.body.query,
                    response,
                });
            } catch (error) {
                config.error(error);
                return res.status(500).json({
                    error: error.message,
                });
            }
        });
    }
}

export { Test };

