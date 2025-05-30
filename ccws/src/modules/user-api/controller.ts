const fs = require('fs');
const userService = require('./service');


exports.GETCurrentUser = (req, res, next) => {
    res.status(200).json({ id : userService.getCurrentUser() });
};


exports.POSTCurrentUser = (req, res, next) => {
    const body = req.body;
    if (!body) {
        res.status(400).json({
			error : 106,
			description : 'API unavailable for this runtime environment'
		});
    }
    userService.setCurrentUser(body.id);
    res.sendStatus(200);
};


exports.POSTUserList = (req, res, next) => {
	userService.getUserList(req.body)
	.then((response) => { res.status(200).json(response) })
};


exports.GETUserAttribute = (req, res, next) => {
	var uid = req.params.userid;
	var atname = null;
	if (Object.keys(req.query).length > 0) {
		atname = req.query.attribute;
	}
	userService.getUserAttribute(uid, atname)
	.then((response) => { res.status(200).json(response) })
};


exports.GETUserFile = (req, res, next) => {
    if (Object.keys(req.query).length == 0) {
		res.status(400).json({
            error : 105,
			description : 'Missing argument'
        });
	}

	userService.checkConsent(req.query.path)
	.then((result) => {
		if (!result) {
			res.status(400).json({
                error : 305,
                description : 'DTV resource not found'
            });
		}
		else {
			file_data = userService.getFile(req.query.path);
		
			res.setHeader('Content-Length', file_data.size);
			res.setHeader('Content-Type', file_data.mime);
			res.setHeader('Content-Disposition', `attachment; filename=${file_data.name}`);
			res.write(file_data.file, 'binary');
			res.end();
		}
	})
};