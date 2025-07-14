import mongoose from "mongoose";

// Define the Issue Schema
const { Schema } = mongoose; // Extract the Schema from mongoose to avoid errors

const issueSchema = new Schema({
  issueID: {
    type: String,
    required: true,
    unique: true, // Ensure each issue has a unique ID
    trim: true,
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
    default: "Pending",
  },
  resident: {
    type: Schema.Types.ObjectId,
    ref: "Resident", // Reference to the Resident who raised the issue
    required: true,
  },
  workerAssigned: {
    type: Schema.Types.ObjectId,
    ref: "Worker", // Reference to the Worker assigned to the issue
    default: null,
  },
  createdAt: {
    type: String,
    default: Date.now,
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
  },
  paymentStatus: {
    type: String,
    default: "Pending",
  },

  feedback: String,
  rating: Number,
});

// Automatically update the `updatedAt` field when the document is modified
issueSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create the Issue model
const Issue = mongoose.model("Issue", issueSchema);

export default Issue;
