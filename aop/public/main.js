const DATA = {
    topics: {
        current_user: 'aop/currentUser',
	    current_service: 'aop/currentService'
    },
    environment: {
        aop: {}
    }
};


function postFrameMessage(msg) {
    window.parent.postMessage(JSON.stringify(msg), '*');
}


function receiveFrameMessage(e) {
    let m = JSON.parse(e.data);

    if (m.type == 'load') {
        loadNextPage(m.dest, CURRENT);
    }
    else if (m.type == 'env') {
        DATA.environment = JSON.parse(m.data);
        setCurrentUser(DATA.environment.aop.currentUser);
    }
    if (m.type == 'message') {
        if (m.topic == DATA.topics.current_user) {
            setCurrentUser(m.message);
        }
        else if (m.topic == DATA.topics.current_service) {
            setCurrentService(m.message);
        }
    }
    else if (m.type == 'key') {
        navigate(m.key);
    }
}


function loadNextPage(next, current) {
    window.location.href = `/${next}?prev=${current}`;
}


// ### User-related functions
function setUserData(users) {
    DATA.environment.aop.users = users;
    postFrameMessage({ type: 'save', name: 'users', value: JSON.stringify(users) });
    postFrameMessage({ type: 'loaded' });
}


function setCurrentUser(uuid) {
    if (DATA.environment.aop.users === undefined) return;

    let users = DATA.environment.aop.users;
    for(i = 0; i < users.length; i++) {
        // find the user by its id
        if (users[i].id == uuid) {
            DATA.environment.aop.userIndex = i;

            // Try to focus on user profile or update user info
            focusOnCurrentProfile();
            updateUserInfo(users[i].avatar, users[i].name);
            
            break;
        }
    }
}


function chooseCurrentUser(i) {
    DATA.environment.aop.userIndex = i;
    DATA.environment.aop.currentUser = DATA.environment.aop.users[i].id;
    
    postFrameMessage({ type: 'save', name: 'currentUser', value: DATA.environment.aop.currentUser });
}


function focusOnCurrentProfile() {
    let elm = $(`#profile${DATA.environment.aop.userIndex}`);

    if (elm.length > 0) {
        elm.addClass('focused');
    }
}


function updateUserInfo(avatar, name) {
    if ($('#user').length > 0) {
        $('#user_img').attr('src', avatar);
        $('#user_name').html(name);
    }
}


// ### Service-related functions
function setCurrentService(sid) {
    DATA.environment.aop.currentService = sid;
}


function chooseCurrentService(sid) {
    DATA.environment.aop.currentService = sid;
    postFrameMessage({ type: 'save', name: 'currentService', value: `${sid}` });
}


function focusOnCurrentService() {
    let elm = $(`#app${DATA.environment.aop.currentService}`);

    if (elm.length > 0) {
        elm.addClass('focused');
    }
    else {
        $('#user').addClass('focused');
    }
}