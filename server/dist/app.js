"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const sessionController_1 = __importDefault(require("./controllers/sessionController"));
const swagger_1 = require("./docs/swagger");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Swagger 문서 경로 설정
app.use('/api-docs', swagger_1.swaggerUi.serve, swagger_1.swaggerUi.setup(swagger_1.specs, { explorer: true }));
// Routes
app.post('/api/session/verify', sessionController_1.default.verifySessionKey);
app.post('/api/session/register', sessionController_1.default.registerSessionKey);
app.post('/api/session/revoke', sessionController_1.default.revokeSession);
app.post('/api/transaction/relay', sessionController_1.default.relayTransaction);
exports.default = app;
