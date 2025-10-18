
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000"); // change this to your backend URL

export default function ChatRoom({ roomId, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // connect and join room
  useEffect(() => {
    socket.emit("join_room", roomId);

    socket.on("chat_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user_joined", (userId) => {
      setMessages((prev) => [
        ...prev,
        { system: true, message: `User ${userId} joined` },
      ]);
    });

    socket.on("user_disconnected", (userId) => {
      setMessages((prev) => [
        ...prev,
        { system: true, message: `User ${userId} disconnected` },
      ]);
    });

    return () => {
      socket.off("chat_message");
      socket.off("user_joined");
      socket.off("user_disconnected");
      socket.disconnect();
    };
  }, [roomId]);

  // send message
  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("chat_message", { roomId, message: input, user });
    setInput("");
  };

  return (
    <div>
      <div>
        {messages.map((m, i) => (
          <div key={i}>
            {m.system ? (
              <em>{m.message}</em>
            ) : (
              <span>
                <strong>{m.user}:</strong> {m.message}
              </span>
            )}
          </div>
        ))}
      </div>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

