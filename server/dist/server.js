"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const sessionService_1 = require("./services/sessionService");
const sessionModel_1 = __importDefault(require("./models/sessionModel"));
const PORT = config_1.default.port;
const server = app_1.default.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Start background session watcher to automatically revoke expired sessions
    (0, sessionService_1.startSessionWatcher)();
});
// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server and database connections');
    server.close(() => {
        console.log('HTTP server closed');
        // Close database connections
        sessionModel_1.default.close();
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server and database connections');
    server.close(() => {
        console.log('HTTP server closed');
        // Close database connections
        sessionModel_1.default.close();
        process.exit(0);
    });
});
