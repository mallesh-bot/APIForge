import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

async function startServer() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 APIForge Server running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`);
    console.log(`🔒 SSRF Guard: Internal mock targets allowed: ${env.ENABLE_INTERNAL_MOCK_TARGET}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('Server terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
