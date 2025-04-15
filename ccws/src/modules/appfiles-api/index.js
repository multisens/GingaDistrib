const express = require('express');
const appfilesController = require('./controller');
const router = express.Router();

/* Application Files API */
/* 8.3.9 */
router.get('/:appid/files', appfilesController.GETAppFile);

module.exports = router;