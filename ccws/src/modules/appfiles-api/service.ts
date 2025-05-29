const path = require('path');
const fs = require('fs');

var appData = {
	id : null,
	url : null
}


function setAppId(appid) {
    if (appid == null) return;

	appData.id = appid;
    console.log(`Set application id ${appData.id}.`);
}


function setAppBaseURL(path) {
    if (path == null) return;

	appData.url = path;
    console.log(`Set application location ${appData.url}.`);
}


function validateAppId(appid) {
	return appid == appData.id;
}


function getFile(fpath) {
	var file_path = path.join(appData.url, fpath);
	var file_name = path.parse(file_path).base;
	var file_ext = path.extname(file_name);
	
	var stat = fs.statSync(file_path);
	
	return {
		size: stat.size,
		mime: GetMime(file_ext),
		type: GetType(file_ext),
		name: file_name,
		path: file_path
	}
}


function GetMime(file_ext) {
	// video
	if (file_ext == '.mpeg') {
		return 'video/mpeg';
	}
	else if (file_ext == '.mp4') {
		return 'video/mp4';
	}
	// audio
	else if (file_ext == '.mp3') {
		return 'audio/mpeg';
	}
	else if (file_ext == '.ogg') {
		return 'audio/ogg';
	}
	// text
	else if (file_ext == '.txt') {
		return 'text/plain';
	}
	// images
	else if (file_ext == '.jpeg' || file_ext == '.jpg') {
		return 'image/jpeg';
	}
	else if (file_ext == '.png') {
		return 'image/png';
	}
	// 3D object
	else if (file_ext == '.obj') {
		return 'model/obj';
	}
	// others
	else {
		return 'application/octet-stream';
	}
}


function GetType(file_ext) {
	// video
	if (file_ext == '.mpeg') {
		return 'video';
	}
	else if (file_ext == '.mp4') {
		return 'video';
	}
	// audio
	else if (file_ext == '.mp3') {
		return 'audio';
	}
	else if (file_ext == '.ogg') {
		return 'audio';
	}
	// text
	else if (file_ext == '.txt') {
		return 'text';
	}
	// images
	else if (file_ext == '.jpeg' || file_ext == '.jpg') {
		return 'image';
	}
	else if (file_ext == '.png') {
		return 'image';
	}
	// 3D object
	else if (file_ext == '.obj') {
		return 'model';
	}
	// others
	else {
		return 'application';
	}
}


module.exports = {
	setAppId,
    setAppBaseURL,
	validateAppId,
	getFile
}