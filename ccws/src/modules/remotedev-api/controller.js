const rdService = require('./service');


exports.POSTRemoteDevice = (req, res, next) => {
    const body = req.body;
    if (!body) {
        res.status(400).json({
            error : 106,
            description : "API unavailable for this runtime environment"
        });
    }
    else if (!body.deviceClass || !body.supportedTypes) {
        res.status(400).json({
            error : 105,
            description : "Missing argument"
        });
    }
    response = rdService.createWebSocket(body);
    res.status(200).json(response);
};


exports.DELETERemoteDevice = (req, res, next) => {
    const handle = req.params.handle;
    if (!handle) {
        res.status(400).json({
            error : 105,
            description : "Missing argument"
        });
    }
    rdService.deleteWebSocket(handle);
    res.status(204).json();
};