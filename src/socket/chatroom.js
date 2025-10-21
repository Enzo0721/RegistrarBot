import config from "#config";

export default (io) => {
  io.on("connection", (socket) => {
    config.log("A user connected:", socket.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      config.log(`Socket ${socket.id} joined room ${roomId}`);
      io.to(roomId).emit("user_joined", socket.id);
    });

    socket.on("chat_message", ({ roomId, message, user }) => {
      io.to(roomId).emit("chat_message", {
        user,
        message,
        timestamp: new Date(),
      });
    });

    socket.on("disconnect", () => {
      config.log("User disconnected:", socket.id);
      io.emit("user_disconnected", socket.id);
    });
  });
};
