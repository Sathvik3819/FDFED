import mongoose from 'mongoose';

const advertisementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    imagePath: { type: String, required: true },
    link: { type: String },
    status:{
        type: String,
        default: 'active',
    }
});

const Ad = mongoose.model('Ad', advertisementSchema);
export default Ad;

