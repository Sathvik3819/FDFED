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
  email: {
    type: String,
  },
  purpose: {
    type: String,
    required: true,
  },
  vehicleNumber: {
    type: String,
    required: true,
  },
  entryDate: {
    type: Date,
  },
  exitdate: {
    type: Date,
  },
  entryTime: {
    type: Date,
  },
  exitTime: {
    type: Date,
  },
  verifiedByResident: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: "Pending",
    enum : ["Pending","Active","Rejected","Unactive"]
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
