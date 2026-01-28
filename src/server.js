import express from "express";
import http from "http";
import cors from "cors";
import { env } from "./config/environment.js";
import connecDB from "./config/mongodb.js";
import { APIs_V1 } from "./routes/v1/index.js";
import { initializeSocketServer } from "./socket/socket.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/v1", APIs_V1);
const server = http.createServer(app);

const io = initializeSocketServer(server);
app.set("socketio", io);

const PORT = env.APP_PORT;

app.get("/", (req, res) => res.send("Hello World!"));

connecDB()
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.log("Failed to start", error);
  });
