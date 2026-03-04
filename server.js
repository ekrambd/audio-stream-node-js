// server.js
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");

// Create HTTP server
const server = http.createServer((req, res) => {
  // Optional: serve a simple HTML page for testing
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>Audio Streaming Server is running</h1>");
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

// Initialize Socket.io
const io = new Server(server, {
  cors: { origin: "*" },
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  let chunks = [];
  let lastChunkTime = Date.now();

  socket.on("audio_chunk", (chunk) => {
    chunks.push(Buffer.from(chunk));
    lastChunkTime = Date.now();
    console.log("📦 Chunk received:", chunk.byteLength);
  });

  // silence detection loop
  const interval = setInterval(() => {
    if (Date.now() - lastChunkTime > 3000 && chunks.length > 0) {
      console.log("🛑 Silence detected");

      const fullAudio = Buffer.concat(chunks);
      chunks = [];

      // Ensure 'recordings' folder exists
      const recordingsDir = path.join(__dirname, "recordings");
      if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir);

      const filename = path.join(recordingsDir, `audio_${Date.now()}.webm`);

      fs.writeFileSync(filename, fullAudio);
      console.log("💾 Saved:", filename);
    }
  }, 1000);

  socket.on("disconnect", () => {
    clearInterval(interval);
    console.log("❌ User disconnected:", socket.id);
  });
});

// Listen on port 3000
const port = 3000;
server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});