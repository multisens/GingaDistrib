const mqtt = require('mqtt');
const appfilesService = require('./modules/appfiles-api/service');
const userService = require('./modules/user-api/service');
const rdService = require('./modules/remotedev-api/service');
const dvtController = require('./modules/dtv-api/controller');

const client = mqtt.connect('mqtt://localhost', {
    clientId : 'ccws-client',
    clean : true,
    connectTimeout : 4000,
});

userService.setMqttClient(client);
rdService.setMqttClient(client);
dvtController.setMqttClient(client);
var _APPID;

client.on('connect', () => {
    client.subscribe('tv/users/currentUser', { noLocal : true });
    client.subscribe('tv/apps/currentApp', { noLocal : true });
    client.subscribe('tv/service/#', { noLocal : true });
});


client.on('message', (topic, message) => {
    console.log(`Message received in ${topic}: ${message.toString()}`);

    if (topic == 'tv/users/currentUser') {
        userService.userAPIData(topic, message.toString());
    }
    else if (topic.startsWith(`tv/service/`)) {
        dvtController.serviceData(topic, message.toString());
        userService.userAPIData(topic, message.toString());
    }
    else if (topic == 'tv/apps/currentApp') {
        appfilesService.setAppId(message.toString());
        if (message.toString() == null) return;
	    _APPID = message.toString();
        client.subscribe(`tv/apps/${_APPID}/path`, { noLocal : true });
        client.subscribe(`tv/apps/${_APPID}/doc/#`, { noLocal : true });
    }
    else if (topic == `tv/apps/${_APPID}/path`) {
        appfilesService.setAppBaseURL(message.toString());
    }
    else if (topic.startsWith(`tv/apps/${_APPID}/doc/`)) {
        rdService.sendRDMessage(topic, message.toString());
    }
});


module.exports = client