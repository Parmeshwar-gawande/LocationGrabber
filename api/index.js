require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// ============= LOCATION ENDPOINT =============
app.get('/api/location', (req, res) => {
  try {
    const { lat, lon, accuracy, email } = req.query;

    console.log('📍 Location received:', { lat, lon, accuracy, email });

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

// Root route - serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Export for Vercel
module.exports = app;

// Local server
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 7777;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}
