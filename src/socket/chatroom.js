import config from "#config";
import { LLM } from '../interfaces/llm.js';

export default (io) => {
	const getCount = (roomId) =>
		io.sockets.adapter.rooms.get(roomId)?.size ?? 0;

	io.on("connection", (socket) => {
		config.log('Socket connected:', socket.id, '; Total connections:', io.of("/").sockets.size);
		var room = null;
		var username = 'unknown';

		socket.on("join_room", (roomId, user) => {
			const numUsers = getCount(roomId);
			room = roomId;
			username = user;
			const bot = new LLM;

			if (numUsers >= 2) {
				socket.emit("room_full", { room });
				config.log(`Room ${room} is full. Socket ${socket.id} rejected.`);
				return;
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
					const res = await bot.chat(message, 'user', true);
					io.to(room).emit("llm_end", {
						user: 'ollama',
						message: res.message.content,
						timestamp: new Date(),
					});
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
