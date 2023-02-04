import http from "http";
import { Logger } from "winston";
import Bot from "./bots/Bot";
import { getVersion } from "./core";

const SERVER_STARTED = false;
const PORT = process.env.PORT || 9001;

export default {
    startServer: async (logger: Logger, bots: Bot[]) => {
        if(SERVER_STARTED) {
            logger.info("Thwarted attempt to start server that has already been started.");
            return;
        }
        const server = http.createServer(async (req, res) => {
            if((req.url === "" || req.url === "/" || req.url === "/api/health") && req.method === "GET") {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ health: "good", bots: bots.map(bot => bot.getFullName()), version: getVersion() }));
            } else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Route not found" }));
            }
        });
        server.listen(PORT, () => {
            logger.info(`Health Server started on port: ${PORT}`);
        });
    }
};