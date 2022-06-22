var express = require('express');
var router = express.Router();

// Require controller modules.
var yelpScraperController = require('../controllers/yelpScraperController');

router.get('/getReviews/:userId/:reviewNumberLimit', yelpScraperController.GetReviews);
router.get('/getUser/:userId', yelpScraperController.GetUser);

module.exports = router;