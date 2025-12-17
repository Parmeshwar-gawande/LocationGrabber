require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============= LOCATION ENDPOINT =============
app.get('/api/location', (req, res) => {
  try {
    const { lat, lon, accuracy, email } = req.query;

    console.log('📍 Location received:', { lat, lon, accuracy, email });

    // Bas log kar, DB me nahi save kar
    res.json({ 
      status: 'success', 
      message: 'Location received',
      data: { lat, lon, accuracy, email }
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Export for Vercel
module.exports = app;

// Local server
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📍 Open: http://localhost:${PORT}\n`);
  });
}
