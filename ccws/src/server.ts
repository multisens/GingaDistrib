import * as dotenv from 'dotenv';
import http from 'http';
dotenv.config();

import app from './app';
const server = http.createServer(app);
const _PORT = process.env.PORT || 44642;

server.listen(_PORT, () => {
    console.log(`Ginga CCWS running on port: ${_PORT}`);
});


if (process.send) {
    process.send('ready');
}