// api/socket.ts
import { io } from "socket.io-client";
import { BASE_URL } from "./index";

const SOCKET_URL = BASE_URL.replace("/api", "");
console.log("🔌 Socket.IO URL configured to:", SOCKET_URL);

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

socket.on("connect", () => console.log("Socket.IO: Connected"));
socket.on("disconnect", (reason) =>
  console.log("Socket.IO: Disconnected -", reason)
);
socket.on("connect_error", (err) =>
  console.error("Socket.IO Error:", err.message)
);

export default socket;
