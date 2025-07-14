import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  email:{
    type:String
  },
  purpose: {
    type: String,
    required: true,
  },
  vehicleNumber: {
    type: String,
    required: true,
  },
  entryDate:{
    type:String
  },
  exitdate:{
    type:String
  },
  entryTime: {
    type: String,
  },
  exitTime: {
    type: String,
  },
  verifiedByResident: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: "pending",
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Security", // or 'Admin' depending on who adds visitors
    required: true,
  },
  community: String,
});

const visitor = mongoose.model("visitor", visitorSchema);

export default visitor;
