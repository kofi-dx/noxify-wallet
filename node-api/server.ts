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

// **FIXED: Correct middleware order - body parser FIRST**
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Noxify Wallet API is running',
    timestamp: new Date().toISOString(),
  });
});

// Temporary root route
app.get('/', (req, res) => {
  res.json({
    message: 'Noxify Wallet API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// **FIXED: Import routes properly**
import routes from './src/routes';
app.use('/api', routes);
console.log('✅ Routes mounted successfully');

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

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Initialize database and start server
// In the startServer function, update this section:
const startServer = async (): Promise<void> => {
  try {
    console.log('🔄 Testing database connection...');
    await testConnection();
    
    console.log('🔄 Initializing model associations...');
    try {
      initAssociations();
    } catch (associationError: any) { // **FIXED: Added type annotation**
      console.warn('⚠️ Association initialization warning (may be duplicates):', associationError.message);
      // Continue anyway - associations might already be defined
    }
    
    console.log('🔄 Synchronizing database...');
    const { default: sequelize } = await import('./src/config/database');
    
    // Use alter instead of force to preserve data
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully');

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Noxify Wallet API running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
      console.log(`👛 Wallet routes: http://localhost:${PORT}/api/wallet`);
      console.log(`💸 Transaction routes: http://localhost:${PORT}/api/transaction`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Error handling
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