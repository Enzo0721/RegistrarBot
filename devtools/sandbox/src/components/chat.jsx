import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import config from "#config";

const socket = io(config.API_URL); // backend

export default function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [roomId, setRoomId] = useState('');
  const [user, setUser] = useState('');
  const [status, setStatus] = useState('waiting');
  const [error, setError] = useState('');

  // connect and join room
  useEffect(() => {
    socket.on("chat_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user_joined", (userId, userCount) => {
      setMessages((prev) => [
        ...prev,
        { system: true, message: `User ${userId} joined with ${userCount} in room` },
      ]);
    });

    socket.on("user_disconnected", (userId, userCount) => {
      setMessages((prev) => [
        ...prev,
        { system: true, message: `User ${userId} disconnected with ${userCount} in room` },
      ]);
    });

    socket.on("room_full", (roomId) => {
      	setStatus('waiting');
		setError(`room ${roomId} full`);
    });

    return () => {
      socket.off("chat_message");
      socket.off("user_joined");
      socket.off("user_disconnected");
	  socket.off("room_full");
      socket.disconnect();
    };
  }, []);

  // send message
  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("chat_message", { message: input });
    setInput("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
	setStatus('submitted');
	setError('');
    socket.emit("join_room", roomId, user);
  };

  return (
	  <div>
{status == 'waiting' ? 
	<div>
		<div>{error}</div>
		<form onSubmit={handleSubmit} className="p-4 flex flex-col gap-2 max-w-sm">
		  <input
			type="text"
			placeholder="Username"
			value={user}
			onChange={(e) => setUser(e.target.value)}
			className="border p-2 rounded"
		  />

		  <input
			type="text"
			placeholder="Room Id"
			value={roomId}
			onChange={(e) => setRoomId(e.target.value)}
			className="border p-2 rounded"
		  />

		  <button type="submit" className="bg-blue-600 text-white p-2 rounded">
			Submit
		  </button>
		</form>
	</div> :
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
	}
	  </div>
  );
}
