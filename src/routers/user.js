import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import sharp from 'sharp';

import User from '../db/models/user.js';
import auth from '../middlewares/auth.js';

const upload = multer({
    limits:{
        fileSize:4000000
    },
    fileFilter(req, file, cb){
        if(file.size>102400000){
            cb(new Error(`File size have to be no more than 1MB, but got file size ${file.size}`))
        }

        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            cb(new Error(`File type have to be jpg, jpeg and png, but got file type ${file.mimetype}`))
        }

        cb(undefined, true);
    }
});

const router = express.Router();

router.post('/user/login', async (req, res) => {
    try {
        const { name, password } = req.body;
        const user = await User.findByCredentials( name, password);
        const token = user.genereteToken();
        await user.saveToken(token);
        return res.send({success:true, data: user, token});
    } catch (e) {
        res.status(400).send({success:false, error:e.message});
    }
});

router.post('/user/logout', auth, async (req, res) => {
    try {
        const user = req.user;
        await user.removeToken(req.token);
        delete req.token;
        return res.send({success:true, data: user, message: 'Successfully logged out'});      
    } catch (e) {
        res.status(400).send({success:false, error:e.message});
    }
});

router.post('/user/logoutAll', auth, async (req, res) => {
    try {
        const user = req.user;
        await user.removeAllTokens();
        delete req.token;
        return res.send({success:true, data:user, message: 'Successfully logged out all sessions'});      
    } catch (e) {
        res.status(400).send({success:false, error:e.message});
    }
});

router.get('/user/profile', auth, async (req, res) => {
    res.send(req.user);
});



router.post('/user/create', async (req, res) => {
    try {
        const user = new User(req.body); 
        user.password = await bcrypt.hash(user.password, 8);
        const token = user.genereteToken();
        user.tokens = user.tokens.concat({token}); 
        await user.save();
        return res.status(201).send({success:true, data:user, token});
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
});

router.get('/users', auth, async (req, res) => {
    try {
        const users = await User.find();
        return res.send({success:true, data:users, total:users.length});
    } catch (e) {
        res.status(500).send({message:e.message});
    }
});

// router.get('/users/:id', auth, async (req, res) => {
//     try {
//         const id = req.params.id;
//         const user = await User.findById(id);
//         if(!user){
//            return res.status(400).send({_id: id, message:'User not found'});
//         }
//         return res.send(user);
//     } catch (e) {
//         res.status(500).send({message:e.message});
//     }
// });

router.patch('/user/me', auth, async (req, res)=>{
    const user = req.user;
    const data = req.body;
    const updates = Object.keys(data);
    const allowedUpdates = ['name', 'email', 'age', 'password'];

    const is = updates.every(update=>allowedUpdates.includes(update));

    if(!is){
        return res.status(400).send({id: user._id, message:'Invalid update properties'});
    }

    if(data.password){
        data.password = await bcrypt.hash(data.password, 8);
    }

    

    try{
        const token = user.genereteToken();
        user.tokens = user.tokens.concat({token}); 
        updates.forEach(update=>user[update]=data[update])
        await user.save();
        return res.send({success:true, data:user, token});
    } catch(e){
        res.status(400).send({success:false, error:e.message});
    }
});

router.delete('/user/me', auth, async (req, res)=>{
    try{  
        const user = req.user;      
        await user.remove();
        return res.send({success:true, data:user});
    } catch(e){
        res.status(500).send({success:false, error:e.message});
    }
});

router.post('/user/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    try{
        const user = req.user;
        const buffer = await sharp(req.file.buffer).resize({width:200, height:200}).png().toBuffer();
        user.avatar = buffer;
        await user.save();
        res.send({success:true, message: 'File uploaded successfully'});

    }catch(e){
        throw new Error(e);
    }
}, async (e, req, res, next) => {
    res.status(400).send({success:false, error: e.message});
});

router.get('/user/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id, { avatar:1 });
        if(!user.avatar){
            return res.send({success:true, message: 'User do not have avatar'}); 
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);        
    } catch (e) {
        res.send({success:true, error: e.message});
    }
});

router.delete('/user/me/avatar', auth, async (req, res) => {
    try {
        const user = req.user;
        user.avatar = undefined;
        await user.save();
        res.send({success:true, message: 'File deleted successfully'});
    } catch (e) {
        res.status(400).send({success:false, error: e.message});
    }
});

export default router;