// server.ts - FIXED (remove duplicate payment routes)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { testConnection } from './src/config/database';
import { initAssociations } from './src/models';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Noxify Wallet API is running',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Noxify Wallet API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ✅ IMPORTANT: Mount ALL routes through /api only
import routes from './src/routes';
app.use('/api', routes);
console.log('✅ All routes mounted under /api');

// ❌ REMOVE THIS DUPLICATE LINE:
// app.use('/pay', paymentRoutes);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof SyntaxError) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
    });
    return;
  }
  next();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Start server function (same as before)
const startServer = async (): Promise<void> => {
  try {
    console.log('🔄 Testing database connection...');
    await testConnection();
    
    console.log('🔄 Initializing model associations...');
    try {
      initAssociations();
    } catch (associationError: any) {
      console.warn('⚠️ Association initialization warning:', associationError.message);
    }
    
    console.log('🔄 Synchronizing database...');
    const { default: sequelize } = await import('./src/config/database');
    const { FiatPayment } = await import('./src/models');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully');

    // 🆕 Verify FiatPayment table was created
    const fiatPaymentsExist = await FiatPayment.findOne();
    console.log('✅ FiatPayment model ready');

    // Start payment monitoring
    try {
      console.log('🔄 Starting payment monitoring service...');
      const paymentMonitorService = await import('./src/services/paymentMonitorService');
      await paymentMonitorService.default.startMonitoring();
      console.log('✅ Payment monitoring service started');
    } catch (monitorError: any) {
      console.error('❌ Failed to start payment monitoring:', monitorError.message);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Noxify Wallet API running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 All API routes: http://localhost:${PORT}/api`);
      console.log(`💳 Payment pages: http://localhost:${PORT}/api/pay/{paymentId}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

export default app;