import { ReqBody } from '../remotedevice-api/service';
import RemoteDevice from './remote-device';
import { WebSocket } from 'ws';


const devices = new Map<string, RemoteDevice>();


function addRemoteDevice(body: ReqBody, handle: string, ws: WebSocket): void {
    devices.set(handle, new RemoteDevice(body, handle, ws));
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