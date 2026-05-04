import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './lib/db';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { startCronJobs } from './jobs/renewal.cron';
import { logger } from './lib/logger';

const app = express();
const PORT = process.env.PORT ?? 5000;

// Security & parsing middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Global error handler (must be last)
app.use(errorMiddleware);

async function bootstrap() {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`[Server] Running on http://localhost:${PORT}`);
  });
  startCronJobs();
}

bootstrap().catch((err) => {
  logger.error('[Server] Failed to start', err);
  process.exit(1);
});
