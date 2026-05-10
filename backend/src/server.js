import app from "./app.js";
import prisma from "./config/database.js";
import logger from "./utils/logger.js";
import env from "./config/env.js";

const PORT = env.PORT;

async function startServer() {
    try {
        await prisma.$connect();
        // logger.info("Database connected");

        app.listen(PORT, () => {
            // logger.info(`Server running on port ${PORT}`);
        })
    } catch (error) {
        logger.error("Failed to start server", error);
        process.exit(1)
    }
}

startServer();