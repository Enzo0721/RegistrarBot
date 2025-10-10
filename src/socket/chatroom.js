export default (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Join a specific chat room
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      io.to(roomId).emit("userJoined", socket.id);
    });

    // Handle incoming chat messages
    socket.on("chatMessage", ({ roomId, message, user }) => {
      io.to(roomId).emit("chatMessage", {
        user,
        message,
        timestamp: new Date(),
      });
    });

    // Handle user disconnects
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      io.emit("userLeft", socket.id);
    });
  });
};

