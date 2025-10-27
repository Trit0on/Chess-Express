const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Simple health endpoint
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, message: 'pong', time: new Date().toISOString() });
});

// Example API route
app.get('/api/hello', (req, res) => {
  res.json({ ok: true, greeting: 'Hello from Chess RPG' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
