import express, { Router } from 'express';
import controller from './controller';
const router: Router = express.Router();


/*
    C.6.15.2 Registering a remote device
*/
router.post('/', controller.POSTRemoteDevice);


/*
    C.6.15.3 Deregistering a remote device
*/
router.delete('/:handle', controller.DELETERemoteDevice);


export default router;