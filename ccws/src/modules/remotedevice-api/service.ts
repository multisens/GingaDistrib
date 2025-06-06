import * as dotenv from 'dotenv';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { WebSocket, WebSocketServer } from 'ws';
import manager from '../remotedevice-manager/manager';
dotenv.config();


export type ReqBody = {
    deviceClass: string,
    supportedTypes: string[]
}

export type Response = {
    handle: string,
    url?: string
}


function createWebSocket(body: ReqBody): Response {
    const server = http.createServer();
    const wsServer = new WebSocketServer({ server });
    const port = generateDynamicallyPort();
    const uuid = uuidv4();
	
	server.listen(port, () => {
        console.log(`WebSocket server is running on port ${port}`);
    });

    manager.addRemoteDevice(body, uuid, wsServer);
	console.log(`Client ${uuid} registered.`);
    
    const url = `ws://${process.env.SERVER_URL}:${port}`
    return {
        handle: uuid,
        url: url
    };
}

function generateDynamicallyPort(): number {
    return Math.floor(1000 + Math.random() * 9000);
}

function deleteWebSocket(handle: string): boolean {
    return manager.removeRemoteDevice(handle);
}


export default { createWebSocket, deleteWebSocket }