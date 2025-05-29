import mqttClient from '../../mqtt-client';
import { ReqBody } from '../remotedevice-api/service';
import { Action, EventType, type ActionMetadata, type NodeMetadata, type TransitionMetadata } from './types';
import { WebSocket } from 'ws';


export default class RemoteDevice {
    protected handle: string;
    protected deviceClass: string;
    protected supportedTypes: string[];

    protected ws: WebSocket;
    protected topic_prefix: string;

    protected appId: string;
    protected nodeId: string;
    protected nodeSrc: string;
    protected nodeType: string;


    constructor(body: ReqBody, handle: string, ws: WebSocket) {
        this.handle = handle;
        this.ws = ws;
        this.deviceClass = body.deviceClass;
        this.supportedTypes = body.supportedTypes;
        
        this.topic_prefix = '';
        this.appId = '';
        this.nodeId = '';
        this.nodeSrc = '';
        this.nodeType = '';

        ws.on('message', (message) => this.receiveRDMessage(message));
        // mqttClient.addTopicHandler(`${this.topic_prefix}/#`, this.receiveTopicMessage);
    }

    public terminate(): void {
        this.ws.close();
        mqttClient.removeTopicHandler(`${this.topic_prefix}/#`, this.receiveTopicMessage);
    }

    protected receiveRDMessage(message: any): void {
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

    protected receiveTopicMessage(m: string, t?: string): void {
        if (!t) return;
        
        try {
            const parsed = this.parseTopic(m, t);

            if (parsed.eventType == EventType.preparation && m == Action.start) {
                let data: NodeMetadata = {
                    nodeId : this.nodeId,
                    nodeSrc : this.nodeSrc,
                    appId : this.appId,
                    type : this.nodeType
                };

                this.ws.send(JSON.stringify(data));
            }
            else {
                let data: ActionMetadata = {
                    nodeId : this.nodeId,
                    appId : this.appId,
                    eventType : parsed.eventType as EventType,
                    action : parsed.action as Action
                };

                if (parsed.label)
                    data.label = parsed.label;

                this.ws.send(JSON.stringify(data));
            }
        }
        catch (e) {
            console.error(e);
        }
    }

    protected publishTransitionMetadata(data: TransitionMetadata): void {
        if (!this.topic_prefix) {
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
}