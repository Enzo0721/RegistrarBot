import express from 'express';
import config from '#config';
const router = express.Router();

class Test {
	async chatbot(message) {
		config.log('asking chatbot ' + message);
		const response = await fetch("http://localhost:11434/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
			  model: "qwen3",  // change to your model name
			  messages: [{ role: "user", content: message }],
			})
		});
		const reader = response.body.getReader();
		const decoder = new TextDecoder("utf-8");
		let fullResponse = "";

		while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		const chunk = decoder.decode(value, { stream: true });

		// Each chunk may contain one or more lines of JSON
		for (const line of chunk.split("\n")) {
				if (line.trim()) {
					const data = JSON.parse(line);
						if (data.message?.content) {
							fullResponse += data.message.content;
					}
				}
			}
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
			try {
				return res.json({ping: 'pong'});
			} catch (error) {
				return res.status(500).json({
					error: error.message
				});
			}
		});
		router.post('/ask', async (req, res) => {
			try {
				const response = await this.chatbot(req.body.query);
				return res.status(200).json({question: req.body.query, response: response});
			} catch (error) {
				config.error(error);
				return res.status(500).json({
					error: error.message
				});
			}
		});
	}

}
export { Test };

