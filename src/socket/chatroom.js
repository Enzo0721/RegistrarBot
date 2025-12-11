import config from "#config";
import { LLM } from '../interfaces/llm.js';
import { getOrCreateUser, getChatHistory } from '../db/chatHistory.js';

export default (io) => {
	const getCount = (roomId) =>
		io.sockets.adapter.rooms.get(roomId)?.size ?? 0;

	io.on("connection", (socket) => {
		config.log('Socket connected:', socket.id, '; Total connections:', io.of("/").sockets.size);
		var room = null;
		var username = 'unknown';
		var userId = null;
		var bot = null;

		socket.on("join_room", async (roomId, user) => {
			const numUsers = getCount(roomId);
			room = roomId;
			username = user;

			if (numUsers >= 2) {
				socket.emit("room_full", { room });
				config.log(`Room ${room} is full. Socket ${socket.id} rejected.`);
				return;
			}

			try {
				// Get or create user in database
				userId = await getOrCreateUser(username);
				config.log(`User ${username} (ID: ${userId}) joining room ${room}`);

				// Load chat history from database
				const chatHistory = await getChatHistory(userId);
				
				// Initialize LLM with chat history (or null for new conversation)
				// The LLM class will add system prompt if history is empty
				let history = null;
				if (chatHistory && chatHistory.length > 0) {
					history = chatHistory;
					config.log(`Loaded ${chatHistory.length} messages from history for user ${username}`);
				}

				// Create LLM instance with history and userId for auto-saving
				bot = new LLM(history, userId);

			} catch (error) {
				config.error('Error loading user/chat history:', error);
				// Continue anyway with a fresh LLM instance
				bot = new LLM(null, null);
			}

			socket.join(room);
			io.to(room).emit("user_joined", user, getCount());
			config.log(`Socket ${socket.id} joined room ${room}`);

			socket.on("chat_message", async ({ message }) => {
				io.to(room).emit("chat_message", {
					user: username,
					message,
					timestamp: new Date(),
				});
				if (getCount(room) == 1) {
					io.to(room).emit("llm_start");
					try {
						const res = await bot.chat(message, 'user', true);
						io.to(room).emit("llm_end", {
							user: 'ollama',
							message: res.message.content,
							timestamp: new Date(),
						});
					} catch (error) {
						config.error('Error in LLM chat:', error);
						io.to(room).emit("llm_error", {
							error: 'Failed to get response from LLM'
						});
					}
				} else {
					bot.chat(message, 'user');
				}
			});
		});

		socket.on("disconnect", () => {
			if (room !== null)
				io.to(room).emit("user_disconnected", username, getCount());
			config.log('Socket disconnected:', socket.id, '; Total connections:', io.of("/").sockets.size);
		});
	});
};
