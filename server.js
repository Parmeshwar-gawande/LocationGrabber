require('dotenv').config();
const app = require('./api/index.js');

const PORT = process.env.PORT || 7777;

app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});
