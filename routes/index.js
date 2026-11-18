const express = require('express');
const router = express.Router();

// Home route: redirect to the books listing
router.get('/', (req, res) => {
  res.redirect('/books');
});

module.exports = router;
