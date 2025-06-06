import fs from 'fs';
import mqttClient, { TOPICS } from '../../mqtt-client';
import path from 'path';


type AppData = {
	sid: string,
	id: string,
    url: string
}

export type FileData = {
	size: number,
	mime: string,
	type: string,
	name: string,
	path: string
}

const data:AppData = {
	sid: '',
	id : '',
	url : ''
}

const MIMES = new Map<string, string>([
	['.mpeg', 'video/mpeg'],
	['.mp4', 'video/mp4'],
	['.mp3', 'audio/mpeg'],
	['.ogg', 'audio/ogg'],
	['.txt', 'text/plain'],
	['.jpeg', 'image/jpeg'],
	['.jpg', 'image/jpeg'],
	['.png', 'image/png'],
	['.obj', 'model/obj']
]);

const TYPES = new Map<string, string>([
	['.mpeg', 'video'],
	['.mp4', 'video'],
	['.mp3', 'audio'],
	['.ogg', 'audio'],
	['.txt', 'text'],
	['.jpeg', 'image'],
	['.jpg', 'image'],
	['.png', 'image'],
	['.obj', 'model']
]);


function setAppId(appid: string): void {
	if (!appid) return;
	if (data.id == appid) return;

	if (data.id) {
		let t = mqttClient.parseTopic(TOPICS.app_path, { serviceId : data.sid, appId : data.id });
		mqttClient.removeTopicHandler(t, setAppBaseURL);
	}

	let t = mqttClient.parseTopic(TOPICS.app_path, { serviceId : data.sid, appId : appid });
	mqttClient.addTopicHandler(t, setAppBaseURL);

	data.id = appid;
}

function setAppBaseURL(path: string): void {
    if (!path) return;

	data.url = path;
}

function currentService(sid: string): void {
	if (!sid) return;
	if (sid == data.sid) return;
	
	let t = mqttClient.parseTopic(TOPICS.current_app, { serviceId : data.sid });
	mqttClient.removeTopicHandler(t, setAppId);

	t = mqttClient.parseTopic(TOPICS.current_app, { serviceId : sid });
	mqttClient.addTopicHandler(t, setAppId);

	data.sid = sid;
}

mqttClient.addTopicHandler(TOPICS.current_service, currentService);


function validateAppId(appid: string): boolean {
	return appid === data.id;
}


function getFile(fpath: string): FileData {
	const file_path = path.join(data.url, fpath);
	const file_name = path.parse(file_path).base;
	const file_ext = path.extname(file_name);
	
	const stat = fs.statSync(file_path);
	
	return {
		size: stat.size,
		mime: GetMime(file_ext),
		type: GetType(file_ext),
		name: file_name,
		path: file_path
	}
}


function GetMime(file_ext: string): string {
	if (MIMES.has(file_ext)) {
		return MIMES.get(file_ext) as string;
	}
	else {
		return 'application/octet-stream';
	}
}


function GetType(file_ext: string): string {
	if (TYPES.has(file_ext)) {
		return TYPES.get(file_ext) as string;
	}
	else {
		return 'application';
	}
}

export default { validateAppId, getFile }