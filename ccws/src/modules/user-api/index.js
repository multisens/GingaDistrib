const express = require('express');
const userController = require('./controller');
const router = express.Router();

/* User API */
router.get('/current-user', userController.GETCurrentUser);
router.post('/current-user', userController.POSTCurrentUser);
router.post('/user-list', userController.POSTUserList);
router.get('/users/:userid', userController.GETUserAttribute);
router.get('/files', userController.GETUserFile);

module.exports = router;