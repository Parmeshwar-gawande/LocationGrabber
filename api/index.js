require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// ===== DEBUG ENV (local + vercel dono ke liye useful) =====
console.log('DEBUG MONGODB_URI present:', !!process.env.MONGODB_URI);

// ===== MONGODB CONNECTION =====
let Location; // model ko outer scope me rakh

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error (connect):', err));

  const locationSchema = new mongoose.Schema({
    lat: String,
    lon: String,
    accuracy: String,
    email: String,
    timestamp: { type: Date, default: Date.now }
  });

  Location = mongoose.model('Location', locationSchema);

  // LOCATION ENDPOINT (Mongo mode)
  app.post('/api/location', async (req, res) => {
    try {
      const { lat, lon, accuracy, email } = req.body;
      console.log('📍 Location received (Mongo mode):', { lat, lon, accuracy, email });

      const newLocation = new Location({
        lat,
        lon,
        accuracy,
        email: email || 'anonymous'
      });

      const saved = await newLocation.save();
      console.log('✅ Location saved to MongoDB with _id:', saved._id);

      res.json({
        status: 'success',
        message: 'Location saved successfully',
        data: { lat, lon, accuracy, email }
      });
    } catch (err) {
      console.error('❌ Error (Mongo mode):', err);
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

} else {
  // LOCATION ENDPOINT (No DB mode)
  app.post('/api/location', (req, res) => {
    try {
      const { lat, lon, accuracy, email } = req.body;
      console.log('📍 Location received (NO DB mode):', { lat, lon, accuracy, email });

      res.json({
        status: 'success',
        message: 'Location received (Local mode - no DB)',
        data: { lat, lon, accuracy, email }
      });
    } catch (err) {
      console.error('❌ Error (NO DB mode):', err);
      res.status(500).json({ status: 'error', error: err.message });
    }
  });
}

// Debug test route
app.get('/test-insert', async (req, res) => {
  try {
    if (!Location) {
      return res.status(500).json({ status: 'error', error: 'Location model not initialized (no MONGODB_URI)' });
    }

    const doc = await Location.create({
      lat: '11.11',
      lon: '22.22',
      accuracy: '5',
      email: 'test-from-route@example.com'
    });

    console.log('✅ Test doc inserted:', doc._id);
    res.json({ status: 'ok', id: doc._id });
  } catch (err) {
    console.error('❌ Test-insert error:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Export for server.js / Vercel
module.exports = app;
