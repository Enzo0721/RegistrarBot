import config from '#config';

const PROMPT = 'you are a helpful cat assistant and you are like a cat trying to help a person';

class LLM {
	constructor(history = null) {
		this.history = history;
		if (history == null) {
			this.history = [{
				role: 'system',
				content: PROMPT
			}];
		}
	}

	history() {
		return this.history;
	}

	async chat(message, role, llm = false)  {
		this.history.push({
			role,
			content: message
		});
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
				this.history.push(json.message);
				return json;
			}
		} else {
			this.history.push({
				role,
				content: message
			});
		}
	}
}

export { LLM };
