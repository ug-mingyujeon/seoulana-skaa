import express from 'express';
import cors from 'cors';
import sessionController from './controllers/sessionController';
import { specs, swaggerUi } from './docs/swagger';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger 문서 경로 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

// Routes
app.post('/api/session/verify', sessionController.verifySessionKey);
app.post('/api/session/register', sessionController.registerSessionKey);
app.post('/api/session/revoke', sessionController.revokeSession);
app.post('/api/transaction/relay', sessionController.relayTransaction);

export default app; 