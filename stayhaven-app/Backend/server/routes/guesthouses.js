const express = require('express');
const guesthouses = require('../data/guesthouses');
const { searchGuesthouses } = require('../utils/search');

const router = express.Router();

// GET /api/guesthouses
// Take the URL query, filter the list, send the answer back as JSON.
router.get('/', (req, res) => {
  const { results, filter } = searchGuesthouses(guesthouses, req.query);

  res.json({
    count: results.length, // how many came back
    filter: filter, // what we searched for (handy for checking)
    data: results, // the guesthouses
  });
});

module.exports = router;