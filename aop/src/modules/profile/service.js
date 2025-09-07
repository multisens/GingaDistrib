require('dotenv').config();
const ejs = require('ejs');
const fs = require('fs');
const mqttClient = require('../../mqtt-client');

const DATA = {
	screenWidth: process.env.SCREENWIDTH,
	users: [],
	isLoading: false,
	isInitialized: false
}

// Função para carregar usuários do broker MQTT ou arquivo JSON como fallback
async function loadUsers() {
	if (DATA.isLoading || DATA.isInitialized) {
		console.log('Users already loading or initialized');
		return;
	}
	
	DATA.isLoading = true;
	
	return new Promise((resolve) => {
		let mqttResolved = false;
		
		// Tenta primeiro carregar do broker MQTT
		const mqttHandler = (message) => {
			if (mqttResolved) return;
			
			try {
				const userData = JSON.parse(message);
				DATA.users = userData.users.map(usr => ({
					id: usr.id,
					name: usr.name,
					avatar: usr.avatar,
					age: usr.age,
					gender: usr.gender,
					isGroup: usr.isGroup,
					language: usr.language,
					captions: usr.captions,
					subtitle: usr.subtitle,
					signLanguageWindow: usr.signLanguageWindow,
					audioDescription: usr.audioDescription,
					dialogueEnhancement: usr.dialogueEnhancement,
					accessConsent: usr.accessConsent
				}));
				console.log('Users loaded from MQTT broker:', DATA.users.length);
				mqttResolved = true;
				DATA.isLoading = false;
				DATA.isInitialized = true;
				resolve();
			} catch (error) {
				console.error('Error parsing users from MQTT:', error);
				if (!mqttResolved) {
					loadUsersFromFile();
					mqttResolved = true;
					DATA.isLoading = false;
					DATA.isInitialized = true;
					resolve();
				}
			}
		};
		
		mqttClient.addTopicHandler(mqttClient.TOPIC.users_data, mqttHandler);

		// Se não conseguir carregar do MQTT em 2 segundos, carrega do arquivo
		setTimeout(() => {
			if (!mqttResolved) {
				console.log('MQTT timeout, loading from file...');
				loadUsersFromFile();
				mqttResolved = true;
				DATA.isLoading = false;
				DATA.isInitialized = true;
				resolve();
			}
		}, 2000);
	});
}

// Função para carregar do arquivo JSON
function loadUsersFromFile() {
	try {
		let userData = JSON.parse(fs.readFileSync(`${process.env.USER_DATA_PATH}/userData.json`));
		DATA.users = userData.users.map(usr => ({
			id: usr.id,
			name: usr.name,
			avatar: usr.avatar,
			age: usr.age,
			gender: usr.gender,
			isGroup: usr.isGroup,
			language: usr.language,
			captions: usr.captions || false,
			subtitle: usr.subtitle || false,
			signLanguageWindow: usr.signLanguageWindow || false,
			audioDescription: usr.audioDescription || false,
			dialogueEnhancement: usr.dialogueEnhancement || false,
			accessConsent: usr.accessConsent || []
		}));
		
		console.log('Users loaded from file:', DATA.users.length);
	} catch (error) {
		console.error('Error loading users from file:', error);
		DATA.users = [];
	}
}

// Função para publicar usuários no broker MQTT
function publishUsersToMqtt() {
	if (DATA.users.length === 0) {
		console.log('No users to publish');
		return;
	}
	
	const userData = { users: DATA.users };
	console.log('Publishing users to MQTT:', DATA.users.length);
	mqttClient.publish(mqttClient.TOPIC.users_data, JSON.stringify(userData));
	mqttClient.publish(mqttClient.TOPIC.current_user, DATA.users[0].id);
}

// Função para adicionar um novo usuário
function addNewUser(newUser) {
	// Gera um ID único para o novo usuário
	newUser.id = generateUserId();
	
	// Adiciona valores padrão se não fornecidos
	newUser = {
		id: newUser.id,
		name: newUser.name || 'New User',
		age: newUser.age || null,
		isGroup: newUser.isGroup || false,
		gender: newUser.gender || null,
		avatar: newUser.avatar || 'new.png',
		language: newUser.language || 'pt-br',
		captions: newUser.captions || false,
		subtitle: newUser.subtitle || false,
		signLanguageWindow: newUser.signLanguageWindow || false,
		audioDescription: newUser.audioDescription || false,
		dialogueEnhancement: newUser.dialogueEnhancement || false,
		accessConsent: newUser.accessConsent || []
	};
	
	DATA.users.push(newUser);
	publishUsersToMqtt();
	
	// Salva também no arquivo JSON como backup
	saveUsersToFile();
	
	return newUser;
}

// Função para gerar ID único do usuário
function generateUserId() {
	return Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 4);
}

// Função para salvar usuários no arquivo JSON (backup)
function saveUsersToFile() {
	try {
		const userData = { users: DATA.users };
		fs.writeFileSync(`${process.env.USER_DATA_PATH}/userData.json`, JSON.stringify(userData, null, '\t'));
		console.log('Users saved to file as backup');
	} catch (error) {
		console.error('Error saving users to file:', error);
	}
}

// Inicialização simples e direta
let initPromise = null;

function ensureInitialized() {
	if (initPromise) {
		return initPromise;
	}
	
	initPromise = new Promise((resolve) => {
		// Carrega do arquivo primeiro (método mais confiável)
		loadUsersFromFile();
		
		// Publica no MQTT após um delay
		setTimeout(() => {
			if (DATA.users.length > 0) {
				publishUsersToMqtt();
				console.log('Initial data published to MQTT');
			}
			DATA.isInitialized = true;
			resolve();
		}, 500);
	});
	
	return initPromise;
}

// Inicia a inicialização
ensureInitialized();



async function content(views, prev) {
	// Garante que está inicializado
	await ensureInitialized();
	
	return await ejs.renderFile(`${views}/profile.ejs`,
		{
			showback: prev != 'load',
			content: await cards(views)
		});
}


async function cards(views) {
	var card_width = 220;
	var card_space_factor = 1.2;
	var num = DATA.users.length;

	var all_cards = num * card_width * card_space_factor + card_width;
	var left = 100 * (1 - all_cards/DATA.screenWidth)/2;
	var delta = 100 * card_width * card_space_factor/DATA.screenWidth;

	var html = '';
	for(i = 0; i < num; i++) {
		let p = await ejs.renderFile(`${views}/profile-card.ejs`,
			{
				id: `profile${i}`,
				width: `${card_width}px`,
				left: `${left + i*delta}%`,
				focus: `moveleft="profile${i-1 >= 0 ? i-1 : num}" moveright="profile${i+1}" select="setUser${i}"`,
				img: DATA.users[i].avatar,
				name: DATA.users[i].name
			});
		html += p.toString();
	}

	let p = await ejs.renderFile(`${views}/profile-card.ejs`,
		{
			id: `profile${num}`,
			width: `${card_width}px`,
			left: `${left + num*delta}%`,
			focus: `moveleft="profile${num-1}" moveright="profile0" select="create"`,
			img: 'new.png',
			name: 'Create new<br/>profile'
		});
	html += p.toString();
	
	return html;
}


function script(prev) {
	var js = `setUserData(${JSON.stringify(DATA.users)});\n`;

	for(i = 0; i < DATA.users.length; i++) {
		js += `function setUser${i}() {\n\t`;
		js += 	`chooseCurrentUser(${i});\n\t`;
		js += 	'back()\n';
		js += '}\n';
	}

	js += 'function back() {\n\t';
	if (prev != 'load') {
		js += `loadNextPage('${prev}', 'profile');\n`;
	}
	else {
		js += `loadNextPage('dtv', 'profile');\n`;
	}
	js += '}\n';

	// Função para criar novo perfil
	js += 'function create() {\n\t';
	js += 	'createNewProfile();\n';
	js += '}\n';

	return js;
}


module.exports = {
    content,
	script,
	addNewUser,
	DATA
}