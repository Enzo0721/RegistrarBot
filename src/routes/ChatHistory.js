import express from 'express';
import config from '#config';
import prisma from '../db/client.js';

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
		try {
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
		} catch (error) {
			config.error('Error saving message:', error);
			throw error;
		}
	}

	/**
	 * Save chat history for a user (batch)
	 * POST /api/v1/chat/save
	 * Body: { userId: number, messages: Array<{role: string, content: string}> }
	 */
	async saveChatHistory(userId, messages) {
		try {
			// Update user's lastOnline timestamp
			await prisma.user.update({
				where: { id: userId },
				data: { lastOnline: new Date() }
			});

			// Save all messages
			const savedMessages = await prisma.chatMessage.createMany({
				data: messages.map(msg => ({
					role: msg.role,
					content: msg.content,
					userId: userId
				}))
			});

			return savedMessages;
		} catch (error) {
			config.error('Error saving chat history:', error);
			throw error;
		}
	}

	/**
	 * Get or create a user by username
	 * Returns the user ID
	 */
	async getOrCreateUser(username, email = null, name = null) {
		try {
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
		} catch (error) {
			config.error('Error getting/creating user:', error);
			throw error;
		}
	}

	/**
	 * Get chat history for a user
	 */
	async getChatHistory(userId) {
		try {
			const messages = await prisma.chatMessage.findMany({
				where: { userId },
				orderBy: { createdAt: 'asc' }
			});

			return messages.map(msg => ({
				role: msg.role,
				content: msg.content
			}));
		} catch (error) {
			config.error('Error getting chat history:', error);
			throw error;
		}
	}

	listen() {
		/**
		 * @swagger
		 * /api/v1/chat/save:
		 *   post:
		 *     summary: Save chat history for a user (batch or single message)
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
		router.post('/save', async (req, res) => {
			try {
				const { username, email, name, messages, message } = req.body;

				if (!username) {
					return res.status(400).json({
						error: 'username is required'
					});
				}

				// Get or create user
				const userId = await this.getOrCreateUser(username, email, name);

				// Handle single message or batch of messages
				if (message) {
					// Save single message
					const savedMessage = await this.saveMessage(
						userId,
						message.role,
						message.content
					);
					return res.status(200).json({
						success: true,
						userId,
						messageId: savedMessage.id,
						message: 'Message saved successfully'
					});
				} else if (messages && Array.isArray(messages)) {
					// Save batch of messages
					const result = await this.saveChatHistory(userId, messages);
					return res.status(200).json({
						success: true,
						userId,
						messagesSaved: result.count,
						message: 'Chat history saved successfully'
					});
				} else {
					return res.status(400).json({
						error: 'Either message or messages (array) is required'
					});
				}
			} catch (error) {
				config.error('Error in save endpoint:', error);
				return res.status(500).json({
					error: error.message || 'Failed to save chat history'
				});
			}
		});

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
		router.get('/history', async (req, res) => {
			try {
				const { username } = req.query;

				if (!username) {
					return res.status(400).json({
						error: 'username query parameter is required'
					});
				}

				const user = await prisma.user.findUnique({
					where: { username }
				});

				if (!user) {
					return res.status(404).json({
						error: 'User not found'
					});
				}

				const history = await this.getChatHistory(user.id);

				return res.status(200).json({
					success: true,
					userId: user.id,
					username: user.username,
					lastOnline: user.lastOnline,
					messages: history
				});
			} catch (error) {
				config.error('Error in history endpoint:', error);
				return res.status(500).json({
					error: error.message || 'Failed to retrieve chat history'
				});
			}
		});
	}
}

export { ChatHistory };

