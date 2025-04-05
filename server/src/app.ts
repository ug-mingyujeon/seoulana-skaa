import express from 'express';
import cors from 'cors';
import sessionController from './controllers/sessionController';
import { specs, swaggerUi } from './docs/swagger';
import authRoutes from './routes/authRoutes';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Swagger 문서 경로 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

// Routes
app.use('/auth', authRoutes);
app.post('/api/session/verify', sessionController.verifySessionKey);
app.post('/api/session/register', sessionController.registerSessionKey);
app.post('/api/session/revoke', sessionController.revokeSession);
app.post('/api/transaction/relay', sessionController.relayTransaction);

export default app; 