const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/reportsController');

router.get('/summary', controller.getSummary);

module.exports = router;
