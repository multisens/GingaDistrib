const express = require('express');
const rdController = require('./controller');
const router = express.Router();

/* Remode media player API */
/* 8.3.9 */
router.post('/', rdController.POSTRemoteDevice);
router.delete('/:handle', rdController.DELETERemoteDevice);

module.exports = router;