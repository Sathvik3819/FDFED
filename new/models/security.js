import mongoose from 'mongoose';

const SecuritySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    image:String,
    password:{
        type:String
    },
    contact: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    communityAssigned: {
        type: String,
        
        required: true
    },
    Shift: {
        type: String,
        enum: ["Day", "Night"],
        default: "Day"
    },
    workplace:String,
    joiningDate: {
        type: Date,
        default: Date.now
    },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true } // Linked to Community
}, { timestamps: true });

const Security = mongoose.model('Security', SecuritySchema);

export default Security;
