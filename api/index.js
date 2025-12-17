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

// ============= MONGODB CONNECTION =============
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

  // Location Schema
  const locationSchema = new mongoose.Schema({
    lat: String,
    lon: String,
    accuracy: String,
    email: String,
    timestamp: { type: Date, default: Date.now }
  });

  const Location = mongoose.model('Location', locationSchema);

  // ============= LOCATION ENDPOINT =============
  app.post('/api/location', async (req, res) => {
    try {
      const { lat, lon, accuracy, email } = req.body;

      console.log('📍 Location received:', { lat, lon, accuracy, email });

      const newLocation = new Location({
        lat,
        lon,
        accuracy,
        email: email || 'anonymous'
      });

      await newLocation.save();
      console.log('✅ Location saved to MongoDB');

      res.json({ 
        status: 'success', 
        message: 'Location saved successfully',
        data: { lat, lon, accuracy, email }
      });

    } catch (err) {
      console.error('❌ Error:', err.message);
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

} else {
  // ============= LOCAL ENDPOINT (No MongoDB) =============
  app.post('/api/location', (req, res) => {
    try {
      const { lat, lon, accuracy, email } = req.body;

      console.log('📍 Location received:', { lat, lon, accuracy, email });

      res.json({ 
        status: 'success', 
        message: 'Location received (Local mode - no DB)',
        data: { lat, lon, accuracy, email }
      });

    } catch (err) {
      console.error('❌ Error:', err.message);
      res.status(500).json({ status: 'error', error: err.message });
    }
  });
}

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Export for Vercel
module.exports = app;

// Local server (sirf localhost pe)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  if (!app.listening) {
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  }
}
