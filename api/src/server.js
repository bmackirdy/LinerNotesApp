require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createClient } = require('@supabase/supabase-js');

// Import route handlers
const authRoutes = require('./routes/auth');
const artistRoutes = require('./routes/artists');
const albumRoutes = require('./routes/albums');
const collectionRoutes = require('./routes/collections');
const wishlistRoutes = require('./routes/wishlists');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase configuration. Please check your .env file.');
  console.log('Current NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set');
  console.log('Current NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = 3000; // Explicitly set to 3000

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Add Supabase client to request object
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/artists', artistRoutes);
app.use('/v1/albums', albumRoutes);
app.use('/v1/collections', collectionRoutes);
app.use('/v1/wishlists', wishlistRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
