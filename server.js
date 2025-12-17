require('dotenv').config();
const app = require('./api/index.js');

app.listen(7777, () => {
  console.log(`Server running at http://localhost:7777`);
});
