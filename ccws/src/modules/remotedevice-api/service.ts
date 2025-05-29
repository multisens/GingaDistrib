const { WebSocket, WebSocketServer } = require('ws');
const http = require('http');
const uuidv4 = require('uuid').v4;
require('dotenv').config();

var mqttClient = null;
var rdData = {
    type: null,
    ws : null,
    handle : null
}


function setMqttClient(c) {
    mqttClient = c;
}


function createWebSocket(body) {
    const server = http.createServer();
    const wsServer = new WebSocketServer({ server });
    const port = generateDynamicallyPort();
    const uuid = uuidv4();
    rdData.type = body.supportedTypes[0];
	
	server.listen(port, () => {
        console.log(`WebSocket server is running on port ${port}`);
    });

    wsServer.on('connection', function (connection) {
        console.log(`${uuid} connected.`);
		
		connection.id = uuid;
        connection.on('message', (message) => receiveRDMessage(message, connection));
        connection.on('close', () => {
            console.log(`${uuid} disconnected.`);
        });
		
        rdData.handle = uuid;
		rdData.ws = connection;
    });
	
	console.log(`Client ${uuid} registered.`);
    
    const url = `ws://${process.env.SERVER_URL}:${port}`
    return {
        handle: uuid,
        url: url
    };
}


function generateDynamicallyPort() {
    return Math.floor(1000 + Math.random() * 9000);
}


function hasAttribute(att) {
    if (att == null) return false;
    if (typeof att == 'string' && att.length == 0) return false;
    return true;
}


function receiveRDMessage(message, client) {
    const uuid = client.id;
	const data = JSON.parse(message.toString());
	
	console.log(`client ${uuid} sent message\n ${message.toString()}\n\n`);

    let topic = `tv/apps/${data.appId}/doc/${data.nodeId}`;
    if (hasAttribute(data.label))
        topic += `/interfaces/${data.label}`;
    
    topic += `/${data.eventType}Event`;
    if (data.eventType == 'selection')
        topic += '/OK';

    mqttClient.publish(topic + '/eventNotification', data.transition);
    
    if (hasAttribute(data.user) && data.eventType == 'selection')
        mqttClient.publish(topic + '/user', data.user);

    if (hasAttribute(data.value) && data.eventType == 'attribution')
        mqttClient.publish(topic + '/value', data.value);
}


function sendRDMessage(topic, message) {
    if (rdData.handle == null) return;
    if (!topic.match('/actionNotification')) return;

    let template = 'tv/apps/:appId/doc/:nodeId';
    if (topic.match('/interfaces/')) {
        template += '/interfaces/:label';
    }
    template += '/:eventType/actionNotification';

    let parsed = parseTopic(topic, template);

    if (parsed.eventType == 'preparationEvent' && message == 'starts') {
        let data = {
            nodeId : parsed.nodeId,
            nodeSrc : process.env.NODE_SRC,
            appId : parsed.appId,
            type : rdData.type
        };

        rdData.ws.send(JSON.stringify(data));
    }
    else {
        let data = {
            nodeId : parsed.nodeId,
            appId : parsed.appId,
            eventType : parsed.eventType.replace('Event', ''),
            action : message
        };

        if (parsed.label)
            data.label = parsed.label;

        rdData.ws.send(JSON.stringify(data));
    }
}


function parseTopic(topic, topicStructure) {
    let structure = topicStructure.split('/');
    let parts = topic.split('/');
    if (parts.length !== structure.length) {
        throw new Error('Topic does not match expected structure');
    }

    const result = {};
    for (let i = 0; i < structure.length; i++) {
        if (structure[i].startsWith(':')) {
            // It's a parameter
            const paramName = structure[i].substring(1);
            result[paramName] = parts[i];
        }
        else if (structure[i] !== parts[i]) {
            throw new Error(`Topic segment mismatch at position ${i}`);
        }
    }

    return result;
}


function deleteWebSocket(handle) {
    if (rdData.handle == handle) {
		rdData.ws.close();
        rdData.handle = null;
		rdData.ws = null;
        console.log(`Client ${handle} unregistered.`);
    }
    return;
}


module.exports = {
    setMqttClient,
    sendRDMessage,
    createWebSocket,
    deleteWebSocket
}