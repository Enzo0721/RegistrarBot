import config from "#config";

export default (io) => {
	const getCount = (roomId) =>
		io.sockets.adapter.rooms.get(roomId)?.size ?? 0;

	io.on("connection", (socket) => {
		config.log("A user connected:", socket.id);

		socket.on("join_room", (roomId) => {
			const numUsers = getCount(roomId);

			if (numUsers >= 2) {
				socket.emit("room_full", { roomId });
				config.log(`Room ${roomId} is full. Socket ${socket.id} rejected.`);
				return;
			}

			socket.join(roomId);
			config.log(`Socket ${socket.id} joined room ${roomId}`);
			socket.on("chat_message", ({ roomId, message, user }) => {
				io.to(roomId).emit("chat_message", {
					user,
					message,
					timestamp: new Date(),
				});
				if (getCount(roomId) == 1) {
					io.to(roomId).emit("chat_message", {
						user: 'system',
						message: 'auto message, will be llm',
						timestamp: new Date(),
					});
				}
			});
		});

		socket.on("disconnecting", () => {
			socket.rooms.forEach((roomId) => {
				if (roomId !== socket.id) {
					config.log(`Socket ${socket.id} left room ${roomId}`);
				}
			});
		});

		socket.on("disconnect", () => {
			config.log("User disconnected:", socket.id);
		});
	});
};
