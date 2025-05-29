import { Request, Response } from 'express';
import mqttClient, { TOPICS } from '../../mqtt-client';
import { v4 as uuidv4 } from 'uuid';


type ServiceData = {
	services: {
		serviceId: number,
		serviceName: string,
		serviceIcon: string,
		initialMediaURL: string
	}[],
	current: {
		serviceName: string,
		serviceId: number,
		serviceContextId: string,
		transportStreamId: string,
		originalNetworkId: string
	}
}

const data: ServiceData = {
	services : [],
	current : {
		serviceName : '',
		serviceId : -1,
		serviceContextId : 'c08b2c72-fd14-4095-adaf-2e5810850c57',
		transportStreamId : 'c08b2c72-fd14-4095-adaf-2e5810850c57',
		originalNetworkId : '09e59a1d-e2e7-467e-85db-2fb5a572e2fc'
	}
}


function loadServiceData(m: string): void {
	if (!m) return;

	data.services = JSON.parse(m);
}

function currentService(m: string): void {
	if (!m) return;

	data.current.serviceId = parseInt(m);
}

mqttClient.addTopicHandler(TOPICS.services, loadServiceData);
mqttClient.addTopicHandler(TOPICS.current_service, currentService);


function GETAuthorize(req: Request, res: Response): void {
	res.status(200).json({
		challenge : uuidv4()
	});
}

function GETToken(req: Request, res: Response): void {
	res.status(200).json({
		accessToken : uuidv4(),
		tokenType : "uuidv4",
		expiresIn : 100000,
		refreshToken : uuidv4(),
		serverCert : uuidv4()
	});
}

function GETCurrentService(req: Request, res: Response): void {
	res.status(200).json({
		serviceContextId : data.current.serviceContextId,
		serviceName : data.current.serviceName,
		transportStreamId : data.current.transportStreamId,
		originalNetworkId : data.current.originalNetworkId,
		serviceId : String(data.current.serviceId)
	});
}


export default { GETAuthorize, GETToken, GETCurrentService }