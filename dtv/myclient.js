let mqttOptions = {
    clean: true,
    connectTimeout: 4000,
    clientId: 'dtv-client',
};
var USER_ID = 0;

const client = mqtt.connect('ws://localhost:9001/mqtt', mqttOptions);

client.on('connect', () => {
    console.log('Connected to MQTT broker');

    // topics to subscribe
    client.subscribe('tv/users/currentUser');
});

client.on('message', (topic, message) => {
    console.log(`Received message on ${topic}: ${message.toString()}`);

    if (topic === 'tv/users/currentUser') {
        USER_ID = parseInt(message);
        updateUser();
    }
  });

client.on('error', (err) => {
    console.error('MQTT Error:', err);
    client.end();
});