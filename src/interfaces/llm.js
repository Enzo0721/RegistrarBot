import '#config';

const PORT = config.LLM_PORT;
const MODEL = config.LLM_MODEL;

class LLM {
	constructor() {	
		this.chat_history = null;
		this.security_prompt = 'hi whats up';
	}

	async function chat(message) {
		const result = await fetch('', {
			method: 'POST',
			headers:
		});
	}
}

export { LLM };
