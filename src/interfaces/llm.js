import '#config';

const PROMPT = '';

class LLM {
	constructor(history = null) {
		this.history = []; // prompt add herr
		if (history == null) {
			this.history = history;
		}
	}

	async chat(message, role = 'user') {
		const chat_history = history;
		chat_history.push({
			role,
			message
		});
		const response = await fetch(config.llm, {
			header: 'applicatiob/json',
			body: JSON.stringify(chat_history)
		}
		if (!response.ok) {
			config.error('LLM experienced fetch error');
			throw new Error('LLM experienced fetch request error');
		} else {
			this.history = history;
			const json = await response.json();
			return json;
		}
	}
}

export { LLM };
