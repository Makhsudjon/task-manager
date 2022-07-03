import mongoose from "mongoose";
import validator from "validator";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
dotenv.config();

import Task from './task.js';


const userSchemaOptions = {
    versionKey:false,
    timestamps:true
}

const userSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid.');
            }
        }
    },
    password:{
        type:String,
        required:true,
        minLength:6,
        trim:true,        
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error(`Password must not have 'password', but got ${value}`);
            }
        }
    },
    age: {
        type:Number,
        validate(value){
            if(value<=0) throw new Error(`age must be greater than 0, but got ${value}`);
        },
        min:18
    },
    avatar:{
        type:Buffer
    },
    tokens:[{
        token: {
            type:String,
            required:true
        }
    }]
}, userSchemaOptions);

userSchema.virtual('tasks', {
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})

userSchema.methods.toJSON = function(){
    const user = this.toObject();
    
    delete user.password;
    delete user.avatar; 
    delete user.tokens;

    return user;
}

userSchema.pre('remove', async function(next){
    await Task.deleteMany({owner:this._id});
    next();
})

userSchema.methods.genereteToken = function(){
    const token = jwt.sign({name:this.name, email:this.email}, process.env.JWT_SECRET, { expiresIn: '1h' });
    return token;
}

userSchema.methods.saveToken = async function(token){
    this.tokens = this.tokens.concat({token}); 
    await this.save()
} 


userSchema.methods.removeToken = async function(token){
    this.tokens = this.tokens.filter(elem=>elem.token!=token);
    await this.save();
}

userSchema.methods.removeAllTokens = async function(){
    this.tokens = [];
    await this.save();
}

userSchema.methods.verifyToken = function (){
    const result = jwt.verify(this.token, process.env.JWT_SECRET);
    return result;
}



userSchema.statics.findByCredentials = async function (name, password){
    const user = await this.findOne({name});
    if(!user) throw new Error('User not found');
    const is = await bcrypt.compare(password, user.password);
    if(!is) throw new Error('Password is not matched');
    return user;
}



const User = mongoose.model('User', userSchema);

export default User