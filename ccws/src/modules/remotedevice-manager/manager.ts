import core from "../../core";
import mqttClient, { TOPICS } from "../../mqtt-client";
import { ReqBody } from "../remotedevice-api/service";
import RemoteDevice, { AppNode } from "./remote-device";
import { WebSocketServer } from "ws";
import { CapabilitiesMetadata, DeviceCapabilities } from "./types";

const devices = new Map<string, RemoteDevice>();
const devclasses = new Map<string, string[]>();

export function associateAppNodes() {
  let nodes: AppNode[] = core.app.nodes;
  nodes.forEach((node) => {
    if (devices.has(node.device)) {
      if (devices.get(node.device)?.support(node.mimeType)) {
        devices.get(node.device)?.setNode(node);
      }
    }
  });
}

function addRemoteDevice(
  body: ReqBody,
  handle: string,
  wss: WebSocketServer
): void {
  let device = new RemoteDevice(body, handle, wss);
  devices.set(handle, device);

  let devclass = device.getClass();
  if (devclasses.has(devclass)) {
    devclasses.get(devclass)?.push(device.getHandle());
  } else {
    devclasses.set(devclass, [device.getHandle()]);
  }

  mqttClient.publish(
    `${TOPICS.devices}/${devclass}`,
    JSON.stringify(devclasses.get(devclass)),
    true
  );
}

function removeRemoteDevice(handle: string): boolean {
  if (!devices.has(handle)) return false;

  const dev = devices.get(handle);
  dev?.terminate();

  devices.delete(handle);
  console.log(`Client ${handle} unregistered.`);
  return true;
}

function getDevicesByClass(classId: string): RemoteDevice[] {
  if (!devclasses.has(classId)) return [];

  let handles = devclasses.get(classId);
  if (!handles) return [];

  let result: RemoteDevice[] = [];
  handles.forEach((handle) => {
    if (devices.has(handle)) {
      result.push(devices.get(handle)!);
    }
  });

  return result;
}

function getDeviceByHandle(handle: string): RemoteDevice | undefined {
  if (!devices.has(handle)) return undefined;
  return devices.get(handle);
}

function requestDeviceCapabilities(handle: string): CapabilitiesMetadata {
  if (!devices.has(handle))
    throw new Error(`Device with handle ${handle} not found`);
  const device = devices.get(handle);
  if (!device) throw new Error(`Device with handle ${handle} not found`);

  const deviceCapabilities = device.getCapabilities();

  if (!deviceCapabilities)
    return {
      type: device.getClass(),
      capabilities: [],
    };

  const capabilities: CapabilitiesMetadata["capabilities"] = [
    { name: "effectType", value: deviceCapabilities.effectType },
    { name: "state", value: deviceCapabilities.state },
  ];

  if (deviceCapabilities.locator) {
    capabilities.push({ name: "locator", value: deviceCapabilities.locator });
  }

  if (deviceCapabilities.preparationTime) {
    capabilities.push({
      name: "preparationTime",
      value: deviceCapabilities.preparationTime,
    });
  }

  return {
    type: device.getClass(),
    capabilities: capabilities,
  };
}

export default {
  addRemoteDevice,
  removeRemoteDevice,
  getDevicesByClass,
  getDeviceByHandle,
  requestDeviceCapabilities,
};
