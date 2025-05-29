import { Request, Response } from 'express';
import service from './service';


function POSTRemoteDevice(req: Request, res: Response): void {
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
    const response = service.createWebSocket(body);
    res.status(200).json(response);
}


function DELETERemoteDevice(req: Request, res: Response): void {
    const handle = req.params.handle;
    if (!handle) {
        res.status(400).json({
            error : 105,
            description : "Missing argument"
        });
    }
    if (!service.deleteWebSocket(handle)) {
        res.status(400).json({
            error : 305,
            description : "Handler does not exist"
        });
    }
    res.status(204).json({});
}


export default { POSTRemoteDevice, DELETERemoteDevice }