const http = require('http');
require('dotenv').config();

const app = require('./app');
const server = http.createServer(app);
const _PORT = process.env.PORT || 44642;

server.listen(_PORT, () => {
    console.log(`Ginga CCWS running on port: ${_PORT}`);
});


const mqttClient = require('./mqtt-client');


if (process.send) {
    process.send('ready');
}