import express, { request } from 'express';
import path from 'path';
import PointsController from './controllers/PointsController';
import ItemsController from './controllers/ItemsController';
import multer from 'multer';
import multerConfig from './config/multer';
import {celebrate, Joi} from 'celebrate';

const itemsController = new ItemsController();
const pointsController = new PointsController();

const routes = express.Router();

const upload = multer(multerConfig);

routes.get('/items', itemsController.index);

//routes.post('/points', pointsController.create);
routes.get('/points', pointsController.index);
routes.get('/points/:id', pointsController.show);

routes.post('/points', upload.single('image'),
celebrate({
    body: Joi.object().keys({
        name: Joi.string().required(),
        email: Joi.string().required().email(),
        whatsapp: Joi.string().required(),
        latitude: Joi.string().required(),
        longitude: Joi.string().required(),
        city: Joi.string().required(),
        uf: Joi.string().required().max(2),
        items: Joi.string().required(),

    })
},{
    abortEarly: false
}),
pointsController.create);


routes.use('/uploads', express.static(path.resolve(__dirname, '..','uploads')));

export default routes;