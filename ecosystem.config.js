module.exports = {
    apps : [
        {
            name        : 'mosquitto',
            script      : '/opt/homebrew/sbin/mosquitto',
            args        : '-c /opt/homebrew/etc/mosquitto/mosquitto.conf',
            interpreter : 'none',
            wait_ready  : true,
            autorestart : false
        },
        {
            name        : 'config-publisher',
            script      : 'ccws/publish-config.js',
            interpreter : 'node',
            autorestart : false,
            wait_ready  : true,
            env : {
                MQTT_HOST       : 'localhost',
                CURRENT_USER    : '0',
                SERVICE_NAME    : 'TV Cefet',
                SERVICE_ID      : 'fe2481ea-5d44-4225-884b-504782636c3a', // Mesmo do código do Guaraná
                CURRENT_APP     : '100',
                APP_PATH        : '/Users/joel/Coding/DemoGuarana/sea360'
            }
        },
        {
            name        : 'tv30-ccws',
            cwd         : './ccws',
            script      : 'npm',
            args        : 'start',
            interpreter : 'none',
            wait_ready  : true,
            env : {
                PORT            : 44642,
                SERVER_URL      : 'localhost',
                NODE_SRC        : 'sea.ncl360',
                USER_DATA_FILE  : '/Users/joel/Coding/DemoGuarana/user-files/userData.json',
                USER_THUMBS     : '/Users/joel/Coding/DemoGuarana/user-files/thumbs'
            }
        },
        {
            name        : 'lua-scheduler',
            script      : './scheduler/init.lua',
            interpreter : 'lua'
        },
        {
            name        : 'topic-explorer',
            script      : '/Users/joel/Applications/nwjs.app/Contents/MacOS/nwjs',
            args        : './mqtt-explorer',
            interpreter : 'none',
            autorestart : false,
            env : {
                DISPLAY  : ':0'
            }
        },
        {
            name        : 'remote-device',
            script      : '/Users/joel/Applications/nwjs.app/Contents/MacOS/nwjs',
            args        : './remote-device',
            interpreter : 'none',
            autorestart : false,
            env : {
                DISPLAY  : ':0'
            }
        },
        {
            name        : 'dtv-simmulator',
            script      : '/Users/joel/Applications/nwjs.app/Contents/MacOS/nwjs',
            args        : './dtv',
            interpreter : 'none',
            autorestart : false,
            env : {
                DISPLAY  : ':0'
            }
        }
    ]
}