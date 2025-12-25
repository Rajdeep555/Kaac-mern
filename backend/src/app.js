
import express from "express";
import cors from "cors";
import morgan from "morgan";
import logger from "./utils/logger.js";
import routes from "./routes.js";

const app = express();

// === Global Middleware ===
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === morgan === 
app.use(
    morgan("combined", {
        stream: {
            write: (message) => logger.info(message.trim()),
        }
    })
)

// === health check === 
app.get("/", (req, res) => {
    res.status(200).json({ message: "Server is running" });
})

app.use("/api", routes);

export default app;