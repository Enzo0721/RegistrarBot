const API_URL = process.env.NEXT_PUBLIC_API_URL;
import { io } from "socket.io-client";

let socket;

export function getSocket() {
	if (!socket) {
		socket = io(API_URL);
	}
	return socket;
}

export default {
	// variables
	API_URL,

	getSocket
}
