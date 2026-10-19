const express = require('express');
const cors = require('cors');
const guesthouseRoutes = require('./routes/guesthouses');

const app = express();

app.use(cors()); // lets the web app and mobile app call this API
app.use(express.json()); // lets us read JSON sent in a request body

// A simple check that the server is alive. Open http://localhost:5000 in a browser.
app.get('/', (req, res) => {
  res.json({ message: 'StayHaven API is running' });
});

// All guesthouse URLs live in routes/guesthouses.js
app.use('/api/guesthouses', guesthouseRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
  console.log('Try http://localhost:' + PORT + '/api/guesthouses');
});