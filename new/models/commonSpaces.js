import mongoose from "mongoose";
import Community from "./communities.js";

const commonSpacesSchema = new mongoose.Schema({
  ID: String,
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  Date: {
    type: String,
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  status: {type: String,
    enum :["Pending","available","Booked","Pending Payment","Paid","Rejected"], 
    default: "Pending"},
  paymentStatus: String,
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
  },
  availability: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resident",
  },
  feedback: String,
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
  },
});

const CommonSpaces = mongoose.model("CommonSpaces", commonSpacesSchema);
export default CommonSpaces;
