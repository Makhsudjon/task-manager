import express from 'express';
import Task from '../db/models/task.js';
import User from '../db/models/user.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.post('/task/create', auth, async (req, res)=>{
    try{
        const task = new Task({
            ...req.body,
            'owner':req.user._id
        });
        await task.save();
        return res.status(201).send(task);
    } catch(e){
        res.status(400).send({message:e.message});
    }
});

router.get('/tasks', auth, async (req, res) => {
    try {

        const reqOptions = req.body.options;
        const condition = { owner:req.user._id };
        console.log(reqOptions)
        if(req.query.completed){
            condition.completed = req.query.completed==='true';
        }

        const options = {
            sort:{},
            page:null,
            limit:null
        };
        
        if(reqOptions?.sort){
            options.sort[reqOptions.sort_by] = reqOptions.sort;
        }

        if(reqOptions?.page){
            options.skip = reqOptions.page?(reqOptions.page-1)*10:0;
        }

        if(reqOptions?.limit){
            options.limit = reqOptions.limit;
        }
        
        const tasks = await Task.find(condition, {}, options);
        return res.send({success:true, data:tasks, total:tasks.length});        
    } catch (e) {
        console.log(e)
        res.status(500).send({success:false, error:e.message});
    }
});

router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;
        const task = await Task.findOne({_id:id, owner:user._id});
        if(!task){
            return res.status(400).send({ success:false, error:'Task not found'});
        }
        return res.send({success:true, data:task});        
    } catch (e) {
        res.status(500).send({success:false, message:e.message});
    }
});

router.patch('/task/:id', auth, async (req, res)=>{
    const id = req.params.id;
    const user = req.user;
    const data = req.body;
    const updates = Object.keys(data);
    const allowedUpdates = ['description', 'completed'];

    const is = updates.every(update=>allowedUpdates.includes(update));

    if(!is){
        return res.status(400).send({id: id, message:'Invalid update properties'});
    }

    try{
        const task = await Task.findOne({_id:id, owner:user._id});
        if(!task){
            return res.status(404).send({ success: true, message:'Task not found' });
        }
        updates.forEach(update => task[update] = data[update]);
        await task.save();
        return res.send({succes:true, data:task});
    } catch(e){
        res.status(400).send({success:false, error:e.message});
    }
});

router.delete('/task/:id', auth, async (req, res)=>{
    try{
        const id = req.params.id;
        const user = req.user;
        const task = await Task.findOne({_id: id, owner:user._id});
        if(!task){
            return res.status(404).send({ success:true, message:'Task not found' });
        }
        await Task.findOneAndDelete({_id: id, owner:user._id});
        return res.send({succes:true, message: 'Deleted successfully'});
    } catch(e){
        res.status(500).send({success:false, error:e.message});
    }
});

export default router;