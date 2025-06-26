import core from '../../core';
import mqttClient, { TOPICS } from '../../mqtt-client';
import { ReqBody } from '../remotedevice-api/service';
import RemoteDevice, { AppNode } from './remote-device';
import { WebSocketServer } from 'ws';


const devices = new Map<string, RemoteDevice>();
const devclasses = new Map<string, string[]>();


export function associateAppNodes() {
    let nodes: AppNode[] = core.app.nodes;
    nodes.forEach(node => {
        if (devices.has(node.device)) {
            if (devices.get(node.device)?.support(node.mimeType)) {
                devices.get(node.device)?.setNode(node);
            }
        }
    });
}

function addRemoteDevice(body: ReqBody, handle: string, wss: WebSocketServer): void {
    let device = new RemoteDevice(body, handle, wss);
    devices.set(handle, device);

    let devclass = device.getClass();
    if (devclasses.has(devclass)) {
        devclasses.get(devclass)?.push(device.getHandle());
    }
    else {
        devclasses.set(devclass, [device.getHandle()]);
    }

    mqttClient.publish(`${TOPICS.devices}/${devclass}`, JSON.stringify(devclasses.get(devclass)), true);
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