import config from '#config';
import { saveMessage } from '../db/chatHistory.js';

const PROMPT = 'you are a helpful cat assistant and you are like a cat trying to help a person';

class LLM {
	constructor(history = null, userId = null) {
		this.userId = userId; // User ID for saving to database
		if (history == null || history.length === 0) {
			// New conversation - start with system prompt
			this.history = [{
				role: 'system',
				content: PROMPT
			}];
			// Save system prompt if userId is provided (only for new conversations)
			if (userId) {
				this.saveMessageToDb('system', PROMPT).catch(err => {
					config.error('Failed to save system message:', err);
				});
			}
		} else {
			// Load existing history - ensure system prompt is first
			this.history = [...history];
			const hasSystemPrompt = this.history.some(msg => msg.role === 'system');
			if (!hasSystemPrompt) {
				// Add system prompt at the beginning if it's missing
				this.history.unshift({
					role: 'system',
					content: PROMPT
				});
				// Save it to database if userId is provided
				if (userId) {
					this.saveMessageToDb('system', PROMPT).catch(err => {
						config.error('Failed to save system message:', err);
					});
				}
			}
		}
	}

	history() {
		return this.history;
	}

	/**
	 * Save a message to the database (non-blocking)
	 */
	async saveMessageToDb(role, content) {
		if (!this.userId) return;
		
		try {
			await saveMessage(this.userId, role, content);
		} catch (error) {
			config.error('Error saving message to database:', error);
			// Don't throw - we don't want to break the chat flow if DB save fails
		}
	}

	async chat(message, role, llm = false)  {
		// Add user message to history
		this.history.push({
			role,
			content: message
		});

		// Save user message to database
		if (this.userId) {
			this.saveMessageToDb(role, message).catch(err => {
				config.error('Failed to save user message:', err);
			});
		}

		if (llm && role == 'user') {
			const response = await fetch(`http://${config.ENV.SERVER_ADDRESS}:${config.ENV.LLM_PORT}/api/chat`, {
				method: 'POST',
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					model: config.ENV.LLM_MODEL,
					messages: this.history,
					stream: false
				})
			});
			if (!response.ok) {
				config.error('LLM experienced fetch error');
				throw new Error('LLM experienced fetch request error');
			} else {
				const json = await response.json();
				const assistantMessage = json.message;
				this.history.push(assistantMessage);

				// Save assistant response to database
				if (this.userId && assistantMessage.content) {
					this.saveMessageToDb('assistant', assistantMessage.content).catch(err => {
						config.error('Failed to save assistant message:', err);
					});
				}

				return json;
			}
		}
	}
}

export { LLM };
