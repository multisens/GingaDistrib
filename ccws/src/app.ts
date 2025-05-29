const express = require('express');

// import modules routes
const dtvAPI = require('./modules/dtv-api');
const appfilesAPI = require('./modules/appfiles-api');
const userAPI = require('./modules/user-api');
const remotedevAPI = require('./modules/remotedev-api');

// middleware configuration
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended : false}));

// allowing local clients to connect to the server
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next();
});

app.use('/dtv', dtvAPI);
app.use('/dtv/current-service/apps', appfilesAPI);
app.use('/dtv/current-service/user-api', userAPI);
app.use('/dtv/remote-device', remotedevAPI);

module.exports = app;