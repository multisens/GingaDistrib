import mqttClient from '../../mqtt-client';
import { ReqBody } from '../remotedevice-api/service';
import { Action, EventType, type ActionMetadata, type NodeMetadata, type TransitionMetadata } from './types';
import { WebSocket, WebSocketServer } from 'ws';


export default class RemoteDevice {
    protected handle: string;
    protected deviceClass: string;
    protected supportedTypes: string[];

    protected ws?: WebSocket;
    protected wss: WebSocketServer;

    protected subscribed: boolean;
    protected topic_prefix?: string;

    protected appId?: string;
    protected nodeId?: string;
    protected nodeSrc?: string;
    protected nodeType?: string;


    constructor(body: ReqBody, handle: string, wss: WebSocketServer) {
        this.deviceClass = body.deviceClass;
        this.supportedTypes = body.supportedTypes;
        this.handle = handle;
        this.wss = wss;
        
        this.subscribed = false;

        wss.on('connection', this.onWebSocketConnection);
        // TODO mqttClient.addTopicHandler(`${this.topic_prefix}/#`, this.onMqttMessage);
    }

    protected onWebSocketConnection(ws: WebSocket): void {
        console.log(`${this.handle} connected.`);

        ws.on('close', () => {
            console.log(`${this.handle} disconnected.`);
        });

        ws.on('message', (message) => this.onWebSocketMessage(message));
    }

    protected onWebSocketMessage(message: any): void {
        const msg: string = message.toString();
        console.log(`Client ${this.handle} sent message\n ${msg}\n\n`);
    
        if (msg.includes('transition')) {
            const data: TransitionMetadata = JSON.parse(msg);
            this.publishTransitionMetadata(data);
        }
        else {
            console.error('Message does not have the expected format.')
            return;
        }
    }

    protected sendWebSocketMessage(data: NodeMetadata | ActionMetadata) {
        if (this.ws) {
            this.ws.send(JSON.stringify(data));
        }
        else {
            // TODO: store message for later
        }
    }

    protected onMqttMessage(m: string, t?: string): void {
        if (!t) return;
        
        try {
            const parsed = this.parseTopic(m, t);

            if (parsed.eventType == EventType.preparation && m == Action.start) {
                let data: NodeMetadata = {
                    nodeId : this.nodeId as string,
                    nodeSrc : this.nodeSrc as string,
                    appId : this.appId as string,
                    type : this.nodeType as string
                };

                this.sendWebSocketMessage(data);
            }
            else {
                let data: ActionMetadata = {
                    nodeId : this.nodeId as string,
                    appId : this.appId as string,
                    eventType : parsed.eventType as EventType,
                    action : parsed.action as Action
                };

                if (parsed.label)
                    data.label = parsed.label;

                this.sendWebSocketMessage(data);
            }
        }
        catch (e) {
            console.error(e);
        }
    }

    protected publishTransitionMetadata(data: TransitionMetadata): void {
        if (!this.subscribed) {
            console.error(`No MQTT topic prefix defined for device ${this.handle}`);
            return;
        }

        let topic = this.topic_prefix;

        if (data.label)
            topic += `/${data.label}`;
        topic += `/${data.eventType}Event`;
        if (data.eventType == EventType.selection)
            topic += '/OK';

        mqttClient.publish(topic + '/eventNotification', data.transition, false);

        if (data.user && data.eventType == EventType.selection)
            mqttClient.publish(topic + '/user', data.user);

        if (data.value && data.eventType == EventType.attribution)
            mqttClient.publish(topic + '/value', data.value);
    }

    protected parseTopic(m: string, t: string): Record<string, string> {
        // [:ifaceId/](presentation|preparation|selection|attribution)Event/[:key/]actionNotification
        
        const parts = t.split('/');
        if (parts.length < 2 || !t.match('/actionNotification')) {
            throw new Error('Topic does not match expected structure');
        }

        const result: Record<string, string> = {};
        if (parts[0].includes('Event')) {
            // It's the node eventType
            this.parseEvent(parts, m, result);
        }
        else {
            // must be an interface id
            this.parseInterface(parts, m, result);
        }

        return result;
    }

    protected parseInterface(parts: string[], m: string, result: Record<string, string>): void {
        let part: string = parts.shift() as string;

        result['label'] = part;

        this.parseEvent(parts, m, result);
    }

    protected parseEvent(parts: string[], m: string, result: Record<string, string>): void {
        let part: string = parts.shift() as string;

        if (!part.includes('Event')) {
            throw new Error(`Should be an event, got ${part} instead`);
        }

        part = part.replace('Event', '');
        if (!Object.values(EventType).includes(part as EventType)) {
            throw new Error(`Event ${part} does not match expected event types`);
        }

        result['eventType'] = part;

        if (part == EventType.selection) {
            // parses the key
            this.parseKey(parts, m, result);
        }
        else {
            this.parseAction(parts, m, result);
        }
    }

    protected parseKey(parts: string[], m: string, result: Record<string, string>): void {
        let part: string = parts.shift() as string;

        result['key'] = part;

        this.parseAction(parts, m, result);
    }

    protected parseAction(parts: string[], m: string, result: Record<string, string>): void {
        let part: string = parts.shift() as string;

        if (!part.match('actionNotification')) {
            throw new Error(`Expecting actionNotification, got ${parts[0]} instead`);
        }

        if (!Object.values(Action).includes(m as Action)) {
            throw new Error(`Action ${m} does not match expected actions`);
        }

        result['action'] = m;
    }

    public terminate(): void {
        if (this.ws) {
            this.ws.close();
        }
        this.wss.close();
        if (this.subscribed) {
            mqttClient.removeTopicHandler(`${this.topic_prefix}/#`, this.onMqttMessage);
        }
    }
}