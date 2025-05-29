const express = require('express');
const dtvController = require('./controller');
const router = express.Router();

/* DTV Access API */
router.get('/authorize', dtvController.GETAuthorize);
router.get('/token', dtvController.GETToken);
router.get('/current-service', dtvController.GETCurrentService);

module.exports = router;