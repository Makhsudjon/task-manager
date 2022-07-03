import express from 'express';
import multer from 'multer';

import dotenv from 'dotenv';
dotenv.config();

import './db/connect.js';


//Import defined routers
import userRouter from './routers/user.js';
import taskRouter from './routers/task.js';

const app = express();


const upload = multer({dest:'my-uploads'});

app.use('/upload', upload.single('upload'), (req, res) => {
    res.send('file uploaded');
});

app.use(express.json());

//User routes
app.use(userRouter);

//Task routes
app.use(taskRouter);




app.listen(process.env.PORT, (e)=>{
    if(e){
        console.log(`Cannot connect to server on port: ${process.env.PORT}`);
    }
    console.log(`Server is running on port: ${process.env.PORT}`);
});
