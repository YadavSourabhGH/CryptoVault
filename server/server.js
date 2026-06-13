require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const { initSockets } = require('./services/socketService');
const { initEngine } = require('./services/priceEngine');
const { initMatchingEngine } = require('./services/matchingEngine');
const { initMarketMaker } = require('./services/marketMaker');

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);

// Security and utility middleware
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP for easy local socket connections
}));
app.use(cors({
  origin: '*', // Allow all origins in local dev
  credentials: true
}));
app.use(express.json());

if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'));
}

// Rate Limiting
app.use('/api', apiLimiter);

// Register REST Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/market', require('./routes/market'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'CryptoVault Digital Asset Exchange API is online' });
});

// Error handling middleware
app.use(errorHandler);

// Start Sockets and Engines
const io = initSockets(server);

// Initialize engines in correct order (dependency order)
initMatchingEngine(io);
initEngine(io).then(() => {
  // Start fake orderbooks and trades once prices are loaded
  initMarketMaker(io);
}).catch(err => {
  console.error('Failed to initialize Price Engine:', err.message);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
