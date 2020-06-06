import {Request, Response} from 'express';
import knex from '../database/connection';

class PointsController{

    async index (request: Request, response: Response){
        const {city, uf, items} = request.query;
        console.log(city, uf, items)
        const parsedItems = String(items)
        .split(',').map(item => Number(item.trim()));

        
        const points = await knex('points')
        .join('point_items','points.id','=','point_items.point_id')
        .whereIn('point_items.item_id', parsedItems)
        .where('city', String(city))
        .where('uf', String(uf))
        .distinct()
        .select('points.*');

        const serializedPoints = points.map(point => {
            return {
                ...point,
                image_url: `http://192.168.100.16:3333/uploads/${point.image}`,
            }
        });

        return response.json(serializedPoints);
    }

    async show (request: Request, response: Response){
        const {id} = request.params;
        const point = await knex('points').where('id', id).first();
        if(!point){
            return response.status(400).json({message:"Point not found"});
        }

        const serializedPoint = {
            ...point,
            image_url: `http://192.168.100.16:3333/uploads/${point.image}`,
            
        };

        const items = await knex('items')
        .join('point_items', 'point_items.item_id','=','items.id')
        .where('point_items.point_id',id);

        return response.json({point: serializedPoint , items});
    }
    async create (request: Request, response: Response) {

        //pega os dados enviados na requisição
        const {name, email, whatsapp, latitude, longitude, city, uf, items} = request.body;
        
        const trx = await knex.transaction();
        
        const point = {image: request.file.filename ,name, email, whatsapp, latitude, longitude, city, uf};
        //insere os dados no banco
        const insertedsIds = await trx('points').insert(point);
        
        //pega o id do point registrado
        const point_id = insertedsIds[0]; 
            //pega os itens e armazena na variavel pointItems
        const pointItems = items
        .split(',')
        .map((item: string) => Number(item.trim()))
        .map((item_id: number) => {
        return {
                item_id,
                point_id: point_id,
            };
        });
    
        //salva os itens no banco
        await trx('point_items').insert(pointItems);

        await trx.commit();
        //caso tudo dê certo retorna true
        return response.json({id: point_id, ...point});
    }
   
}

export default PointsController;