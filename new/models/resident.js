import mongoose from 'mongoose';
import AutoIncrementFactory from 'mongoose-sequence';

// Initialize AutoIncrement
const connection = mongoose.connection; 
const AutoIncrement = AutoIncrementFactory(connection);

const residentSchema = new mongoose.Schema(
  {
    
    residentFirstname: { type: String, required: true },
    residentLastname: { type: String, required: true },
    flatNo: { type: String, required: true },
    blockNo: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password : String,
    image:String,
    contact: { type: String },
    preApprovedVisitors: [{ type: mongoose.Schema.Types.ObjectId, ref: "VisitorPreApproval" }],
    bookedCommonSpaces: [{ type: mongoose.Schema.Types.ObjectId, ref: "CommonSpaces" }],
    raisedIssues: [{ type: mongoose.Schema.Types.ObjectId, ref: "Issue" }],
    paymentHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }],
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true } ,// Linked to Community
    notifications:[{n:{type:String},status:{type:String},createdAt:{type:Date},timeAgo:String}]
  },
  { timestamps: true }
);



const Resident = mongoose.model("Resident", residentSchema);

export default Resident;
