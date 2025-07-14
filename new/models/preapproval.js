import mongoose from "mongoose";

const visitorPreApprovalSchema = new mongoose.Schema(
  {
    visitorName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    dateOfVisit: { type: String, required: true },
    timeOfVisit: { type: String, required: true },
    purpose: { type: String },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    isCheckedIn: { type: Boolean, default: false },
    status: {
      type: String,
      default: "pending",
    },
    vehicleNo: String,
  },
  { timestamps: true }
);

const VisitorPreApproval = mongoose.model(
  "VisitorPreApproval",
  visitorPreApprovalSchema
);
export default VisitorPreApproval;
