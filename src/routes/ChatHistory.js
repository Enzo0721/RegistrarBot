import express from 'express';
import config from '#config';
import prisma from '../db/client.js';
import { ValidationError, NotFoundError, AppError, asyncHandler } from '../utils/errors.js';

const router = express.Router();

class ChatHistory {
	constructor(io) {
		this.io = io;
		this.listen();
		return router;
	}

	/**
	 * Save a single chat message for a user
	 */
	async saveMessage(userId, role, content) {
		// Update user's lastOnline timestamp
		await prisma.user.update({
			where: { id: userId },
			data: { lastOnline: new Date() }
		});

		// Save the message
		const message = await prisma.chatMessage.create({
			data: {
				role,
				content,
				userId
			}
		});

		return message;
	}

	/**
	 * Save chat history for a user (batch) - appends to existing history
	 * POST /api/v1/chat/save
	 * Body: { userId: number, messages: Array<{role: string, content: string}> }
	 * This method appends messages to the user's existing chat history
	 */
	async saveChatHistory(userId, messages) {
		// Update user's lastOnline timestamp
		await prisma.user.update({
			where: { id: userId },
			data: { lastOnline: new Date() }
		});

		// Get existing messages to check for duplicates (optional optimization)
		// We'll save all messages - duplicates are acceptable if user sends same message twice
		const savedMessages = await prisma.chatMessage.createMany({
			data: messages.map(msg => ({
				role: msg.role,
				content: msg.content,
				userId: userId
			}))
		});

		return savedMessages;
	}

	/**
	 * Get or create a user by username
	 * Returns the user ID
	 */
	async getOrCreateUser(username, email = null, name = null) {
		// Try to find existing user by username
		let user = await prisma.user.findUnique({
			where: { username }
		});

		// If not found, create new user
		if (!user) {
			user = await prisma.user.create({
				data: {
					username,
					email,
					name,
					lastOnline: new Date()
				}
			});
		} else {
			// Update lastOnline for existing user
			user = await prisma.user.update({
				where: { id: user.id },
				data: { lastOnline: new Date() }
			});
		}

		return user.id;
	}

	/**
	 * Get chat history for a user
	 */
	async getChatHistory(userId) {
		const messages = await prisma.chatMessage.findMany({
			where: { userId },
			orderBy: { createdAt: 'asc' }
		});

		return messages.map(msg => ({
			role: msg.role,
			content: msg.content
		}));
	}

	/**
	 * Save entire conversation history (appends any new messages)
	 * Useful for syncing the full LLM history to database
	 */
	async saveFullHistory(userId, fullHistory) {
		if (!fullHistory || !Array.isArray(fullHistory) || fullHistory.length === 0) {
			return { count: 0, message: 'No history to save' };
		}

		// Get existing messages to avoid duplicates
		const existingMessages = await prisma.chatMessage.findMany({
			where: { userId },
			select: { role: true, content: true, createdAt: true },
			orderBy: { createdAt: 'asc' }
		});

		// Filter out messages that already exist (simple content + role matching)
		// This is a basic deduplication - in production you might want more sophisticated logic
		const existingSet = new Set(
			existingMessages.map(msg => `${msg.role}:${msg.content.substring(0, 100)}`)
		);

		const newMessages = fullHistory.filter(msg => {
			const key = `${msg.role}:${msg.content.substring(0, 100)}`;
			return !existingSet.has(key);
		});

		if (newMessages.length === 0) {
			return { count: 0, message: 'All messages already exist in database' };
		}

		// Update user's lastOnline timestamp
		await prisma.user.update({
			where: { id: userId },
			data: { lastOnline: new Date() }
		});

		// Save only new messages
		const result = await prisma.chatMessage.createMany({
			data: newMessages.map(msg => ({
				role: msg.role,
				content: msg.content,
				userId: userId
			}))
		});

		return {
			count: result.count,
			totalInHistory: fullHistory.length,
			alreadyExisted: fullHistory.length - newMessages.length,
			message: `Saved ${result.count} new message(s), ${fullHistory.length - newMessages.length} already existed`
		};
	}

	listen() {
		/**
		 * @swagger
		 * /api/v1/chat/save:
		 *   post:
		 *     summary: Save chat history for a user (batch or single message) - APPENDS to existing history
		 *     description: This endpoint appends messages to the user's existing chat history. It does not overwrite or replace existing messages. Both user messages and assistant responses should be included.
		 *     tags: [Chat]
		 *     requestBody:
		 *       required: true
		 *       content:
		 *         application/json:
		 *           schema:
		 *             type: object
		 *             required:
		 *               - username
		 *             properties:
		 *               username:
		 *                 type: string
		 *                 description: Username of the user
		 *               email:
		 *                 type: string
		 *                 description: Optional email of the user
		 *               name:
		 *                 type: string
		 *                 description: Optional name of the user
		 *               messages:
		 *                 type: array
		 *                 description: Array of chat messages (for batch save)
		 *                 items:
		 *                   type: object
		 *                   properties:
		 *                     role:
		 *                       type: string
		 *                       enum: [system, user, assistant]
		 *                     content:
		 *                       type: string
		 *               message:
		 *                 type: object
		 *                 description: Single message (alternative to messages array)
		 *                 properties:
		 *                   role:
		 *                     type: string
		 *                     enum: [system, user, assistant]
		 *                   content:
		 *                     type: string
		 *     responses:
		 *       200:
		 *         description: Chat history saved successfully
		 *       400:
		 *         description: Invalid request body
		 *       500:
		 *         description: Server error
		 */
		router.post('/save', asyncHandler(async (req, res) => {
			const { username, email, name, messages, message } = req.body;

			if (!username) {
				throw new ValidationError('username is required');
			}

			// Get or create user
			const userId = await this.getOrCreateUser(username, email, name);

			// Handle single message or batch of messages
			// Both methods APPEND to existing history (do not overwrite)
			if (message) {
				// Save single message (appends to history)
				if (!message.role || !message.content) {
					throw new ValidationError('message must have role and content fields');
				}
				const savedMessage = await this.saveMessage(
					userId,
					message.role,
					message.content
				);
				return res.status(200).json({
					success: true,
					userId,
					messageId: savedMessage.id,
					message: 'Message appended to chat history successfully'
				});
			} else if (messages && Array.isArray(messages)) {
				// Validate messages array
				if (messages.length === 0) {
					throw new ValidationError('messages array cannot be empty');
				}
				
				// Validate each message has required fields
				const invalidMessages = messages.filter(msg => !msg.role || !msg.content);
				if (invalidMessages.length > 0) {
					throw new ValidationError('All messages must have role and content fields', {
						invalidCount: invalidMessages.length
					});
				}

				// Save batch of messages (appends to history)
				const result = await this.saveChatHistory(userId, messages);
				return res.status(200).json({
					success: true,
					userId,
					messagesSaved: result.count,
					message: `Successfully appended ${result.count} message(s) to chat history`
				});
			} else {
				throw new ValidationError('Either message or messages (array) is required');
			}
		}));

		/**
		 * @swagger
		 * /api/v1/chat/history:
		 *   get:
		 *     summary: Get chat history for a user
		 *     tags: [Chat]
		 *     parameters:
		 *       - in: query
		 *         name: username
		 *         required: true
		 *         schema:
		 *           type: string
		 *         description: Username of the user
		 *     responses:
		 *       200:
		 *         description: Chat history retrieved successfully
		 *       400:
		 *         description: Invalid request
		 *       404:
		 *         description: User not found
		 *       500:
		 *         description: Server error
		 */
		router.get('/history', asyncHandler(async (req, res) => {
			const { username } = req.query;

			if (!username) {
				throw new ValidationError('username query parameter is required');
			}

			const user = await prisma.user.findUnique({
				where: { username }
			});

			if (!user) {
				throw new NotFoundError('User not found');
			}

			const history = await this.getChatHistory(user.id);

			return res.status(200).json({
				success: true,
				userId: user.id,
				username: user.username,
				lastOnline: user.lastOnline,
				messages: history
			});
		}));

		/**
		 * @swagger
		 * /api/v1/chat/save-full:
		 *   post:
		 *     summary: Save entire conversation history (appends new messages, skips duplicates)
		 *     tags: [Chat]
		 *     requestBody:
		 *       required: true
		 *       content:
		 *         application/json:
		 *           schema:
		 *             type: object
		 *             required:
		 *               - username
		 *               - history
		 *             properties:
		 *               username:
		 *                 type: string
		 *                 description: Username of the user
		 *               email:
		 *                 type: string
		 *                 description: Optional email of the user
		 *               name:
		 *                 type: string
		 *                 description: Optional name of the user
		 *               history:
		 *                 type: array
		 *                 description: Complete conversation history including system, user, and assistant messages
		 *                 items:
		 *                   type: object
		 *                   properties:
		 *                     role:
		 *                       type: string
		 *                       enum: [system, user, assistant]
		 *                     content:
		 *                       type: string
		 *     responses:
		 *       200:
		 *         description: History saved successfully
		 *       400:
		 *         description: Invalid request body
		 *       500:
		 *         description: Server error
		 */
		router.post('/save-full', asyncHandler(async (req, res) => {
			const { username, email, name, history } = req.body;

			if (!username) {
				throw new ValidationError('username is required');
			}

			if (!history || !Array.isArray(history)) {
				throw new ValidationError('history (array) is required');
			}

			// Get or create user
			const userId = await this.getOrCreateUser(username, email, name);

			// Save full history (with deduplication)
			const result = await this.saveFullHistory(userId, history);

			return res.status(200).json({
				success: true,
				userId,
				...result
			});
		}));
	}
}

export { ChatHistory };

