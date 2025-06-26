const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('main', {
        content: content(),
        current: 'load',
        script: ''
    });
});

function content() {
    return '<img style="position: fixed; left: 50%; top: 50%; width: 259px; height: 194px; transform: translate(-50%, -50%);" src="media/load.png"/>';
}

module.exports = router;