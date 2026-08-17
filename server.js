import app, { startServer } from './backend/server.js';

const PORT = process.env.PORT || 5000;

startServer(PORT);
