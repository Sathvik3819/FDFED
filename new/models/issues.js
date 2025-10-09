import mongoose from "mongoose";

// Define the Issue Schema
const { Schema } = mongoose; 

const issueSchema = new Schema({
  issueID: {
    type: String,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum : ["Pending","Payment Pending","Review Pending","Assigned","Resolved"], // assingned : In progress, resolved : work done & payment completed
    default: "Pending",
  },
  resident: {
    type: Schema.Types.ObjectId,
    ref: "Resident",
    required: true,
  },
  workerAssigned: {
    type: Schema.Types.ObjectId,
    ref: "Worker",
    default: null,
  },
  resolvedAt: {
    type: String,
    default: null,
  },
  deadline: {
    type: String,
    required: false, // Optional field, can be added when assigning an issue
  },
  payment: {
    type: Schema.Types.ObjectId,
    ref: "Payment",
    default: null,
  },community: {
    type: Schema.Types.ObjectId,
    ref: "Community",
    
  },
  paymentStatus: {
    type: String,
    default: "Pending",
  },
  feedback: String,
  rating: Number,
},{timestamps:true});

// Automatically update the `updatedAt` field when the document is modified
issueSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create the Issue model
const Issue = mongoose.model("Issue", issueSchema);

export default Issue;
