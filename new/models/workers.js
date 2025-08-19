import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
  },
  jobRole: { type: String, required: true },
  contact: { type: String, required: true },
  address: { type: String, required: true },
  communityAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
  },
  image:String,

  
  salary: { type: Number, required: true },
  joiningDate: { type: Date, default: Date.now },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
    required: true,
  }, // Linked to Community

  assignedIssues: [{ type: mongoose.Schema.Types.ObjectId, ref: "Issue" }],
});

// Create Worker Model
const Worker = mongoose.model("Worker", workerSchema);

export default Worker;
