import mongoose from "mongoose";
import Community from "./communities.js";

const advertisementSchema = new mongoose.Schema(
  {
    ID: String,
    title: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    imagePath: { type: String, required: true },
    link: { type: String },
    status: {
      type: String,
      default: "Pending",
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },
  },
  {
    timestamps: true,
  }
);

const Ad = mongoose.model("Ad", advertisementSchema);
export default Ad;
