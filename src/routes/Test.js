import express from 'express';
const router = express.Router();

class Test {
	constructor(io) {
		this.io = io;
		this.listen();
		return router;
	}
	listen() {

		router.get('/ping', async (req, res) => {
			try {
				return res.send('pong');
			} catch (error) {
				return res.status(500).json({
					error: error.message
				});
			}
		});
	}
}

export { Test };
