const express = require('express');
const app = express();

console.log('Creating Express app...');

// Root endpoint for testing
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Liner Notes API is working!', environment: process.env.NODE_ENV });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Don't call app.listen() in Lambda - serverless-http handles this
module.exports = app;
