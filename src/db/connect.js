import mongoose from "mongoose";

import dotenv from 'dotenv';
dotenv.config();

const dbConnect = async()=>{
    try {
        mongoose.connect(process.env.MONGODB_PROD_URL||'mongodb://127.0.0.1:27017/task-manager');
        console.log('Mongoose connection successed !')
    } catch (e) {
        console.log('Mongoose connection failed !')
    }
};

dbConnect();

