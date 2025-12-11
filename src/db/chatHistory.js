import prisma from './client.js';
import config from '#config';

/**
 * Helper functions for saving chat history
 * These can be used from socket handlers, LLM interface, or anywhere else
 */

/**
 * Get or create a user and return their ID
 * @param {string} username - Required username
 * @param {string|null} email - Optional email
 * @param {string|null} name - Optional name
 * @returns {Promise<number>} User ID
 */
export async function getOrCreateUser(username, email = null, name = null) {
	try {
		let user = await prisma.user.findUnique({
			where: { username }
		});

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
 * Save a single chat message
 * @param {number} userId - User ID
 * @param {string} role - Message role ('system', 'user', 'assistant')
 * @param {string} content - Message content
 * @returns {Promise<Object>} Saved message
 */
export async function saveMessage(userId, role, content) {
	try {
		// Update user's lastOnline timestamp
		await prisma.user.update({
			where: { id: userId },
			data: { lastOnline: new Date() }
		});

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
 * Save multiple chat messages in a batch
 * @param {number} userId - User ID
 * @param {Array<{role: string, content: string}>} messages - Array of messages
 * @returns {Promise<Object>} Result with count of saved messages
 */
export async function saveChatHistory(userId, messages) {
	try {
		// Update user's lastOnline timestamp
		await prisma.user.update({
			where: { id: userId },
			data: { lastOnline: new Date() }
		});

		const result = await prisma.chatMessage.createMany({
			data: messages.map(msg => ({
				role: msg.role,
				content: msg.content,
				userId: userId
			}))
		});

		return result;
	} catch (error) {
		config.error('Error saving chat history:', error);
		throw error;
	}
}

/**
 * Get chat history for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of messages in format {role, content}
 */
export async function getChatHistory(userId) {
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

/**
 * Get chat history by username
 * @param {string} username - Username
 * @returns {Promise<Array>} Array of messages in format {role, content}
 */
export async function getChatHistoryByUsername(username) {
	try {
		const user = await prisma.user.findUnique({
			where: { username }
		});

		if (!user) {
			return null;
		}

		return await getChatHistory(user.id);
	} catch (error) {
		config.error('Error getting chat history by username:', error);
		throw error;
	}
}

