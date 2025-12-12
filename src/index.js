import express from 'express';
import http from 'node:http';
import cors from 'cors';
import { Server } from 'socket.io';
import socketHandler from './socket/chatroom.js';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from '#config'

// routes
import { Test } from './routes/Test.js';
import { ChatHistory } from './routes/ChatHistory.js';

// utils
import { requestLogger } from './utils/requestLogger.js';
import { errorHandler, notFoundHandler } from './utils/errors.js';

class Main {
	constructor() {
		config.check_env_vars();
		config.log('@@force', `server starting, version: ${config.OPTIONS.definition.info.version} on address ${config.ENV.SERVER_ADDRESS}:${config.ENV.SERVER_PORT}`);
		this.app = express();
		this.app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
		this.app.use(express.json());
		
		// Request logging middleware (logs all API requests)
		this.app.use(requestLogger);
		
		this.specs = swaggerJsdoc(config.OPTIONS);
		this.server = http.createServer(this.app);
		this.io = new Server(this.server, {
			cors: {
				origin: config.ENV.SOCKET_ORIGIN,  // Allow all origins for development
				credentials: true
			}
		});
		config.log('@@force', `server config.OPTIONS set`);
		this.addRoutes();
		config.log('@@force', `server REST protocol established`);
		this.addIO();
		config.log('@@force', `server socket.io established`);
		this.start();
	}
	addRoutes() {

		this.app.get(['/health', '/api/health'], (_, res) => res.json({
			status: 'ok',
			uptime: process.uptime(),
			timestamp: new Date().toISOString()})
		);
		this.app.use('/api/v1/test', new Test(this.io));
		this.app.use('/api/v1/chat', new ChatHistory(this.io));
		this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(this.specs));

		// 404 handler for unmatched routes (must be before error handler)
		this.app.use(notFoundHandler);
		
		// Error handling middleware (must be last)
		this.app.use(errorHandler);
	}
	addIO() {
		// Initialize socket handlers
		socketHandler(this.io);
	}
	start() {
		this.server.listen(config.ENV.SERVER_PORT, () => {
			config.log('@@force;color=green', `server listening on ${config.ENV.SERVER_ADDRESS}:${config.ENV.SERVER_PORT}`);
		});
	}
}

new Main();
