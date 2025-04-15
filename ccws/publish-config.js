const mqtt = require('mqtt');
require('dotenv').config();

// Conecta ao broker
const client = mqtt.connect(`mqtt://${process.env.MQTT_HOST}`, {
    clientId : 'config',
    clean : true,
    connectTimeout : 4000,
});

client.on('connect', () => {
    console.log('Publicando tópicos de configuração...');
  
    // Publica os tópicos necessários
    client.publish('tv/users/currentUser', process.env.CURRENT_USER, { retain : true });
    
    client.publish('tv/apps/currentApp', process.env.CURRENT_APP, { retain : true });
    client.publish('tv/apps/100/path', process.env.APP_PATH, { retain : true });
    
    client.publish('tv/service/serviceName', process.env.SERVICE_NAME, { retain : true });
    client.publish('tv/service/serviceId', process.env.SERVICE_ID, { retain : true });

    setTimeout(() => {
        client.end();
        if (process.send) {
            process.send('ready');
            process.exit(0);
        }
    }, 1000);
});