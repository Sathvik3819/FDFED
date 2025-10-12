import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    //Custom unique ID like PA-12345
  //  ID: { type: String, unique: true },

    // Basic visitor info
    name: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true },
    email: { type: String },

    purpose: { type: String },
    vehicleNumber: { type: String },

    // QR for verification
    qrCode: { type: String }, // store base64 QR image
    qrToken: { type: String }, // JWT token for verification

    // Pre-approval details (if resident schedules a visit)
    scheduledAt: { type: Date }, // planned visit date+time
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Resident" },

    // Actual check-in/out
    isCheckedIn: { type: Boolean, default: false },
    checkInAt: { type: Date },
    checkOutAt: { type: Date },

    // Status flow
    status: {
      type: String,
      enum: ["Pending", "Approved", "Active", "Rejected", "Unactive"],
      default: "Pending",
    },
    verifiedByResident: { type: Boolean, default: false },

    // References
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Security" }, // security/admin who added visitor
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
  },
  { timestamps: true }
);

const Visitor = mongoose.model("Visitor", visitorSchema);

export default Visitor;
