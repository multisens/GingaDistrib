const DATA = {
  base_path : '/home/mota/Documents/uff/tcc/GuaranaDemo/user-files/thumbs',
  profile : [
    'Without<br/>profile',
    'Karen',
    'Jo&atilde;o'
  ],
  serviceName : 'TV Cefet',
  serviceId : 'fe2481ea-5d44-4225-884b-504782636c3a'
}

const LOAD_CLASS = 'loadscreen';
const LOAD_PAGE = '<img id="load" src="media/load.png"/>';

const MAIN_CLASS = 'mainscreen';
const MAIN_PAGE = '<img class="screen" src="media/main/screen.png"/>' +
  '<div id="user" class="user" movedown="tvuff" select="openProfile"/>' +
    `<span id="user_name">${DATA.profile[0]}</span>` +
    '<img id="user_img"/>' +
  '</div>' +
  '<img id="tvuff" class="tv" moveleft="tvunb" moveright="tvcefet" moveup="user" movedown="tvufpb" src="media/main/uff.png"/>' +
  '<img id="tvcefet" class="tv" moveleft="tvuff" moveright="tvufma" moveup="user" movedown="tvpucrio" select="openCefet" src="media/main/cefet.png"/>' +
  '<img id="tvufma" class="tv" moveleft="tvcefet" moveright="tvufjf" moveup="user" movedown="tvmakenzie" src="media/main/ufma.png"/>' +
  '<img id="tvufjf" class="tv" moveleft="tvufma" moveright="tvunb" moveup="user" src="media/main/ufjf.png"/>' +
  '<img id="tvunb" class="tv" moveleft="tvufjf" moveright="tvuff" moveup="user" src="media/main/unb.png"/>' +
  '<img id="tvufpb" class="tv" moveleft="tvmakenzie" moveright="tvpucrio" moveup="tvuff" src="media/main/ufpb.png"/>' +
  '<img id="tvpucrio" class="tv" moveleft="tvufpb" moveright="tvmakenzie" moveup="tvcefet" src="media/main/pucrio.png"/>' +
  '<img id="tvmakenzie" class="tv" moveleft="tvpucrio" moveright="tvufpb" moveup="tvufma" src="media/main/makenzie.png"/>';

const PROFILE_CLASS = 'profilescreen';
const PROFILE_PAGE = '<img class="screen" src="media/profile/screen.png"/>' +
  '<div id="profile0" class="profile focused" moveleft="profile2" moveright="profile1" movedown="back" select="setUser0">' +
    `<img src="${DATA.base_path}/0.png"/>` +
    DATA.profile[0] +
		// 'Continue <br/> without a <br/> profile' +
	'</div>' +
	'<div id="profile1" class="profile" moveleft="profile0" moveright="profile2" movedown="back" select="setUser1">' +
		`<img src="${DATA.base_path}/1.png"/>` +
		DATA.profile[1] +
	'</div>' +
	'<div id="profile2" class="profile" moveleft="profile1" moveright="profile0" movedown="back" select="setUser2">' +
		`<img src="${DATA.base_path}/2.png"/>` +
		DATA.profile[2] +
	'</div>' +
  '<img id="back" moveup="profile1" select="openMain" src="media/back.png"/>';

const CEFET_CLASS = 'cefetscreen';
const CEFET_PAGE = '<img id="screen" class="screen menu" src="media/cefet/screen.png"/>' +
  '<img id="info" class="menu"/>' +
  '<div id="user" class="user menu" movedown="tvvideo" select="openProfile"/>' +
    `<span id="user_name">${DATA.profile[0]}</span>` +
    '<img id="user_img"/>' +
  '</div>' +
  '<img id="connect" class="menu" moveup="tvvideo" movedown="back" src="media/cefet/vrButton.png"/>' +
  '<img id="back" class="menu" moveup="connect" select="openMain" src="media/back.png"/>' +
  '<video id="tvvideo" class="focused" width="67.50%" height="67.50%" autoplay loop moveup="user" movedown="connect" select="fullscreen"></video>' +
  '<img id="infobtn" class="full" select="seemenu" src="media/cefet/infoButton.png"/>';