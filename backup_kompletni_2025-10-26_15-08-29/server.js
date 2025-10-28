import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

// ========================================
// MIDDLEWARE
// ========================================

// Security headers
app.use(helmet());

// Compression
app.use(compression());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ========================================
// STATIC FILES
// ========================================

// Serve built Vite app
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath, {
  maxAge: NODE_ENV === 'production' ? '1y' : '0',
  etag: false
}));

// ========================================
// API ROUTES
// ========================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

// Config endpoint - expose non-sensitive config
app.get('/api/config', (req, res) => {
  res.json({
    appName: process.env.VITE_APP_NAME || 'Urban Analytics',
    apiUrl: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
    enableAI: process.env.VITE_ENABLE_AI_FEATURES === 'true',
    enablePDF: process.env.VITE_ENABLE_PDF_EXPORT === 'true',
    enableHeatmap: process.env.VITE_ENABLE_HEATMAP === 'true'
  });
});

// ========================================
// SPA FALLBACK
// ========================================

// All other routes serve index.html (for SPA routing)
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to load application' });
    }
  });
});

// ========================================
// ERROR HANDLING
// ========================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║       🏙️  URBAN ANALYTICS            ║
╚════════════════════════════════════════╝

📍 Server: http://${process.env.HOST || 'localhost'}:${PORT}
🔧 Environment: ${NODE_ENV}
📦 Version: 1.0.0
🚀 Ready for requests!
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n📛 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n📛 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

