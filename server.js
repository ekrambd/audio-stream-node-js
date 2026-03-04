// server.js
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");

const recordingsDir = path.join(__dirname, "recordings");
if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir);

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Socket.IO Audio Server Running");
});

const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  let chunks = [];
  let lastChunkTime = Date.now();

  socket.on("audio_chunk", (chunk) => {
    if (!chunk || chunk.length === 0) return;

    chunks.push(Buffer.from(chunk.buffer || chunk));
    lastChunkTime = Date.now();
    console.log("📦 Chunk received:", chunk.byteLength);
  });

  const interval = setInterval(() => {
    if (Date.now() - lastChunkTime > 3000 && chunks.length > 0) {
      console.log("🛑 Silence detected");

      const fullAudio = Buffer.concat(chunks);
      chunks = [];

      const filename = path.join(recordingsDir, `audio_${Date.now()}.webm`);
      fs.writeFileSync(filename, fullAudio);

      console.log("💾 Saved:", filename, "| Size:", fullAudio.length, "bytes");
    }
  }, 1000);

  socket.on("disconnect", () => {
    clearInterval(interval);
    console.log("❌ User disconnected:", socket.id);
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});