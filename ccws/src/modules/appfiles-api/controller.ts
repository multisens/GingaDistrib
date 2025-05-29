const fs = require('fs');
const appfilesService = require('./service');

exports.GETAppFile = (req, res, next) => {
    if (!appfilesService.validateAppId(req.params.appid) || Object.keys(req.query).length == 0) {
		res.status(400).json({
			error : 305,
			description : "DTV resource not found"
		});
	}
	file_data = appfilesService.getFile(req.query.path);
	
	if (file_data.type != 'video' && file_data.type != 'audio') {
		replyFile(res, file_data);
	}
	else {
		const range = req.headers.range;
		replyStream(res, range, file_data);
	}
};


function replyFile(res, file_data) {
	var file = fs.readFileSync(file_data.path, 'binary');
	res.setHeader('Content-Length', file_data.size);
	res.setHeader('Content-Type', file_data.mime);
	res.write(file, 'binary');
	res.end();
}


function replyStream(res, range, file_data) {
	if (range) {
		const parts = range.replace(/bytes=/, "").split("-");
		const start = parseInt(parts[0], 10);
		const end = parts[1] ? parseInt(parts[1], 10) : file_data.size-1;
 	    
		const chunksize = (end-start)+1;
		const file = fs.createReadStream(file_data.path, {start, end});
		
		res.setHeader('Content-Range', `bytes ${start}-${end}/${file_data.size}`);
		res.setHeader('Accept-Ranges', 'bytes');
		res.setHeader('Content-Length', chunksize);
		res.setHeader('Content-Type', file_data.mime);
		
		res.writeHead(206);
		file.pipe(res);
	}
	else {
		res.setHeader('Content-Length', file_data.size);
		res.setHeader('Content-Type', file_data.mime);
		res.writeHead(200);
		fs.createReadStream(file_data.path).pipe(res);
	}
}