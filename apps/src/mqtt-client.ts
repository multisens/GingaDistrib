import * as dotenv from 'dotenv';
import mqtt, { MqttClient } from 'mqtt';
dotenv.config();

let brokerUrl : string = process.env.BROKER as string;
const client:MqttClient = mqtt.connect(brokerUrl, {
    clientId : 'app-client',
    clean : true,
    connectTimeout : 4000,
});


export const TOPIC = {
    users: 'aop/users',
    current_user: 'aop/currentUser',
    services: 'aop/services'
}

type TopicHandler = {
    (m:string): void;
};
const TOPIC_HANDLER = new Map<string, TopicHandler[]>();


client.on('connect', () => {
    console.log('Connected to MQTT broker');
});


client.on('message', (topic, message) => {
    console.log(`Message received in ${topic}: ${message.toString()}`);

    if (TOPIC_HANDLER.has(topic)) {
        TOPIC_HANDLER.get(topic)?.forEach(f => {
            f(message.toString());
        });
    }
    else {
        console.log(`no handler for topic ${topic}`);
    }
});


export function addTopicHandler(t:string, f:TopicHandler) {
    if (TOPIC_HANDLER.has(t)) {
        TOPIC_HANDLER.get(t)?.push(f);
    }
    else {
        TOPIC_HANDLER.set(t, [f]);
        client.subscribe(t, { qos : 1, nl : true }); 
        console.log(`Subscribed to topic ${t}`);
    }
}


export function publish(t:string, m:string, r = true) {
    client.publish(t, m, { retain : r });
}