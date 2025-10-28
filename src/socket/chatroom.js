import config from "#config";

export default (io) => {
	const getCount = (roomId) =>
		io.sockets.adapter.rooms.get(roomId)?.size ?? 0;

	io.on("connection", (socket) => {
		config.log("User connected:", socket.id);
		var room = null;
		var username = 'unknown';

		socket.on("join_room", (roomId, user) => {
			const numUsers = getCount(roomId);
			room = roomId;
			username = user;

			if (numUsers >= 2) {
				socket.emit("room_full", { room });
				config.log(`Room ${room} is full. Socket ${socket.id} rejected.`);
				return;
			}

			socket.join(room);
			io.to(room).emit("user_joined", user, getCount());
			config.log(`Socket ${socket.id} joined room ${room}`);
			socket.on("chat_message", ({ message }) => {
				io.to(room).emit("chat_message", {
					user: username,
					message,
					timestamp: new Date(),
				});
				if (getCount(room) == 1) {
					io.to(room).emit("chat_message", {
						user: 'system',
						message: 'auto message, will be llm',
						timestamp: new Date(),
					});
				}
			});
		});

		socket.on("disconnect", () => {
			if (room !== null)
				io.to(room).emit("user_disconnected", username, getCount());
			config.log("User disconnected:", socket.id);
		});
	});
};
