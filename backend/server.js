import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import locationsRouter from './routes/locations.js';
import routesRouter from './routes/routes.js';
import stationsRouter from './routes/stations.js';
import issuesRouter from './routes/issues.js';
import profileRouter from './routes/profile.js';
import aiRouter from './routes/ai.js';
import transitRouter from './routes/transit.js';
import geoRoutingRouter from './routes/geoRouting.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lightweight request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health check and root information
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'AccessRoute Backend API',
    status: 'online',
    version: '1.0.0',
    endpoints: [
      'GET  /api/health',
      'GET  /api/locations',
      'POST /api/routes/search',
      'POST /api/routes/timetable-search',
      'GET  /api/routes/timetable/status',
      'GET  /api/routes/:routeId',
      'GET  /api/stations/:stationId',
      'POST /api/issues',
      'GET  /api/issues',
      'GET  /api/profile',
      'GET  /api/ai/status',
      'POST /api/ai/extract-preferences',
      'POST /api/ai/explain-route'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'AccessRoute Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/locations', locationsRouter);
app.use('/api/routes', routesRouter);
app.use('/api/stations', stationsRouter);
app.use('/api/transit', transitRouter);
app.use('/api/geo', geoRoutingRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/profile', profileRouter);
app.use('/api/ai', aiRouter);

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

export function startServer(port = PORT) {
  return app.listen(port, () => {
    console.log(`🚀 AccessRoute Backend API running at http://localhost:${port}`);
    console.log(`📍 Health Check: http://localhost:${port}/api/health`);
    console.log(`📍 Locations API: http://localhost:${port}/api/locations`);
  });
}

export default app;
