import { ReqBody } from '../remotedevice-api/service';
import RemoteDevice from './remote-device';
import { WebSocket, WebSocketServer } from 'ws';


const devices = new Map<string, RemoteDevice>();


function addRemoteDevice(body: ReqBody, handle: string, wss: WebSocketServer): void {
    devices.set(handle, new RemoteDevice(body, handle, wss));
}

function removeRemoteDevice(handle: string): boolean {
    if (!devices.has(handle)) return false;
    
    const dev = devices.get(handle);
    dev?.terminate();

    devices.delete(handle);
    console.log(`Client ${handle} unregistered.`);
    return true;
}


export default { addRemoteDevice, removeRemoteDevice }