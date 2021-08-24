const path = require("path");
const { exec, spawn } = require("child_process");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const SENSITIVITY = 1;
const PATH_TO_MOUSE_MOVER = path.join(__dirname, "mouse");

// Fetch screen res
let SCREEN_MULTIPLIER;
let SCREEN_RES;
exec("system_profiler SPDisplaysDataType | grep Resolution", (error, stdout) => {
  if (error) {
    console.log("Error getting screen resolution information");
    console.log(error);
    process.exit(1);
  }
  const resParsed = stdout.toString().trim().split(" ");
  SCREEN_RES = {
    width: parseInt(resParsed[1]),
    height: parseInt(resParsed[3]),
  };
  SCREEN_MULTIPLIER = Math.min(SCREEN_RES.width, SCREEN_RES.height);
});

app.use(express.static(path.join(__dirname, "../client")));

io.on("connection", (socket) => {
  // Start mouse mover
  console.log("Client connected, starting mouse mover");
  const mouseMover = spawn(PATH_TO_MOUSE_MOVER);
  mouseMover.stdin.setEncoding("utf-8");

  // Cursor begins at center of screen
  const lastPosition = {
    x: SCREEN_RES.width / 2,
    y: SCREEN_RES.height / 2,
  };

  // Click commands
  socket.on("click", (msg) => {
    console.log(`  Received click, writing to mover: ${msg}`);
    mouseMover.stdin.cork();
    mouseMover.stdin.write(`${msg}\n`);
    mouseMover.stdin.uncork();
  });

  // Move commands
  socket.on("move", (msg) => {
    // These are received as differential between 0 and 1
    // Scale these values by sensitivity and some fixed value based on screen
    // size.
    const [x, y] = msg.split(",").map(n => {
      return Math.floor(parseFloat(n) * SENSITIVITY * SCREEN_MULTIPLIER);
    });
    const newX = lastPosition.x - x;
    const newY = lastPosition.y - y;
    console.log(`  Received move: ${msg}, writing to mover: ${newX},${newY}`);
    mouseMover.stdin.cork();
    mouseMover.stdin.write(`${newX},${newY}\n`);
    mouseMover.stdin.uncork();

    lastPosition.x = newX;
    lastPosition.y = newY;
  });

  socket.on("type", (msg) => {
    console.log(`  Received type: ${msg}, executing Applescript`);
    if (msg === "Enter") {
      exec(`osascript -e 'tell application "System Events" to keystroke (ASCII character 13)'`);
    } else if (msg === "Backspace") {
      exec(`osascript -e 'tell application "System Events" to keystroke (ASCII character 8)'`);
    } else {
      exec(`osascript -e 'tell application "System Events" to keystroke "${msg}"'`);
    }
  });

  socket.on("disconnect", () => {
    // Stop mouse mover
    console.log("Client disconnected, killing mouse mover");
    mouseMover.kill();
  });
});

server.listen(4000, () => {
  console.log("Listening on *:4000");
});
