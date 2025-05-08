const path = require('path');
const fs = require('fs');
const jsonata = require('jsonata');
const exp = require('./expression');
require('dotenv').config();

var mqttClient = null;
var userData = {
	current_user : null,
	serviceId : null,
	users : JSON.parse(fs.readFileSync(process.env.USER_DATA_FILE))
}


function setMqttClient(c) {
	mqttClient = c;
}


function userAPIData(t, m) {
	if (t == 'tv/users/currentUser') {
		if (m == null || m == '') return;

		userData.current_user = m;
    	console.log(`Set current user ${userData.current_user}.`);
	}
    else if (t == 'tv/service/serviceId') {
		userData.serviceId = m;
		console.log(`Set serviceId ${userData.serviceId}.`);
	}
}


function getCurrentUser() {
	return userData.current_user;
}


function setCurrentUser(uid) {
	userData.current_user = uid;
	console.log(`Set current user ${userData.current_user}.`);

	mqttClient.publish('tv/users/currentUser', userData.current_user, { retain : true });
}


async function getUserList(body) {
	let expression = jsonata(exp.getUsersExpression(body, userData.serviceId));
	let result = await expression.evaluate(userData.users);
	return result;
}


async function getUserAttribute(uid, atname) {
	let expression = jsonata(exp.getAttExpression(userData.serviceId, uid, atname));
	let result = await expression.evaluate(userData.users);
	return result;
}


async function checkConsent(fpath) {
	let expression = jsonata(exp.getConsentExpression(userData.serviceId, fpath));
	let result = await expression.evaluate(user_data);
	return result;
}


function getFile(fpath) {
	var file_path = path.join(process.env.USER_THUMBS, fpath);
	var file_name = path.parse(file_path).base;
	
	var stat = fs.statSync(file_path);
	var file = fs.readFileSync(file_path, 'binary');
	
	return {
		size: stat.size,
		mime: GetMime(path.extname(file_name)),
		name: file_name,
		file: file
	}
}


function GetMime(file_ext) {
	// images
	if (file_ext == '.jpeg' || file_ext == '.jpg') {
		return 'image/jpeg';
	}
	else if (file_ext == '.png') {
		return 'image/png';
	}
	// others
	else {
		return 'application/octet-stream';
	}
}


module.exports = {
	setMqttClient,
	userAPIData,
	getCurrentUser,
	setCurrentUser,
	getUserList,
	getUserAttribute,
	checkConsent,
	getFile
}