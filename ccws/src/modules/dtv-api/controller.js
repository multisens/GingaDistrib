const uuidv4 = require('uuid').v4;

var mqttClient = null;
var dtvData = {
    serviceName: null,
    serviceId : null,
	serviceContextId : 'c08b2c72-fd14-4095-adaf-2e5810850c57',
	transportStreamId : 'c08b2c72-fd14-4095-adaf-2e5810850c57',
	originalNetworkId : '09e59a1d-e2e7-467e-85db-2fb5a572e2fc'
}


exports.setMqttClient = (c) => {
    mqttClient = c;
};

exports.serviceData = (t, m) => {
	if (t == 'tv/service/serviceName') {
		dtvData.serviceName = m;
	}
	else if (t == 'tv/service/serviceId') {
		dtvData.serviceId = m;
	}
}

exports.GETAuthorize = (req, res, next) => {
	res.status(200).json({
		challenge : uuidv4()
	});
};

exports.GETToken = (req, res, next) => {
	res.status(200).json({
		accessToken : uuidv4(),
		tokenType : "uuidv4",
		expiresIn : 100000,
		refreshToken : uuidv4(),
		serverCert : uuidv4()
	});
};

exports.GETCurrentService = (req, res, next) => {
	res.status(200).json({
		serviceContextId : dtvData.serviceContextId,
		serviceName : dtvData.serviceName,
		transportStreamId : dtvData.transportStreamId,
		originalNetworkId : dtvData.originalNetworkId,
		serviceId : dtvData.serviceId
	});
};