module.exports = {
    apps : [
        {
            name        : 'broker',
            script      : '/usr/sbin/mosquitto',
            args        : '-c mosquitto/mosquitto.conf',
            interpreter : 'none',
            wait_ready  : true,
            autorestart : false
        },
        {
            name        : 'aop',
            cwd         : '/mnt/c/Proj/GingaDistrib/aop',
            script      : 'npm',
            args        : 'start',
            interpreter : 'none',
            wait_ready  : true,
            autorestart : false,
            env : {
                PORT            : 8080,
                BROKER          : 'mqtt://localhost',
                SCREENWIDTH     : 1440,
                USER_DATA_PATH  : '/mnt/c/Proj/GingaDistrib/user-files'
            }
        },
        {
            name        : 'apps',
            cwd         : '/mnt/c/Proj/GingaDistrib/apps',
            script      : 'npm',
            args        : 'start',
            interpreter : 'none',
            wait_ready  : true,
            autorestart : false,
            env : {
                PORT            : 8081,
                BROKER          : 'mqtt://localhost',
                USER_DATA_PATH  : '/mnt/c/Proj/GingaDistrib/user-files'
            }
        },
        {
            name        : 'tv3ws',
            cwd         : '/mnt/c/Proj/GingaDistrib/ccws',
            script      : 'npm',
            args        : 'start',
            interpreter : 'none',
            wait_ready  : true,
            env : {
                PORT            : 44642,
                BROKER          : 'mqtt://localhost',
                SERVER_URL      : 'localhost',
                USER_DATA_FILE  : '/mnt/c/Proj/GingaDistrib/user-files/userData.json',
                USER_THUMBS     : '/mnt/c/Proj/GingaDistrib/user-files/thumbs'
            }
        }
    ]
}