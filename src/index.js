import express from 'express';
import http from 'node:http';
import cors from 'cors';
import { Server } from 'socket.io';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from '#config'

// routes
import { Test } from './routes/Test.js';

class Main {
	constructor() {
		config.log('@@force', `server starting, version: ${config.OPTIONS.definition.info.version} on address ${config.SERVER_ADDRESS}:${config.SERVER_PORT}`);
		this.app = express();
		this.app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
		this.app.use(express.json());
		this.specs = swaggerJsdoc(config.OPTIONS);
		this.server = http.createServer(this.app);
		this.io = new Server(this.server, {
			cors: {
				origin: config.SOCKET_ORIGIN,
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
		this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(this.specs));
		// Catch all missing routes, send 404
		this.app.use((_, res) => {
			res.sendStatus(404);
		});
	}
	addIO() {
		this.io.use((socket, next) => {
		const origin = socket.handshake.headers.origin;

		if (origin !== config.SOCKET_ORIGIN) {								// SOCKET_ORIGIN is our site
			config.log('socket connection refused');
			return next(new Error('Forbidden origin'));				// aborts the handshake
		}
		return next();												// allow the connection
	});
	}
	start() {
		this.server.listen(config.SERVER_PORT, () => {
			config.log('@@force', `server listening on ${config.SERVER_ADDRESS}:${config.SERVER_PORT}`);
		});
	}
}

new Main();
