import app from './app';
import config from './config';
import { startSessionWatcher } from './services/sessionService';
import SessionModel from './models/sessionModel';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start background session watcher to automatically revoke expired sessions
  startSessionWatcher();
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server and database connections');
  server.close(() => {
    console.log('HTTP server closed');
    // Close database connections
    SessionModel.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server and database connections');
  server.close(() => {
    console.log('HTTP server closed');
    // Close database connections
    SessionModel.close();
    process.exit(0);
  });
}); 