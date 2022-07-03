import mongoose from 'mongoose';

const taskSchemaOptions = {
    versionKey:false,
    timestamps:true
}

const taskSchema = new mongoose.Schema({
    description:{
        type:String,
        required:true,
        trim:true
    },
    completed:{
        type:Boolean,
        default:false
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'
    }
}, taskSchemaOptions);

const Task = mongoose.model('Task', taskSchema);

export default Task