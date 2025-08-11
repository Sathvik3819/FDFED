import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Import all models

import CommunityManager from "../models/cManager.js";
import Community from "../models/communities.js";
import Resident from "../models/resident.js";
import Security from "../models/security.js";
import Worker from "../models/workers.js";
import Ad from "../models/Ad.js";
import CommonSpace from "../models/commonSpaces.js";
import Issue from "../models/issues.js";
import Payment from "../models/payment.js";
import PreApproval from "../models/preapproval.js";
import Visitor from "../models/visitors.js";
import Interest from "../models/interestForm.js";


// MongoDB URI
const MONGODB_URI = "mongodb+srv://sathvikchiluka:UE123@urbanease.8evt9ty.mongodb.net/urbanEase?retryWrites=true&w=majority&appName=UrbanEase";

async function insertSampleData() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB Atlas");

    // Clear old data
    await Promise.all([
      Interest.deleteMany({}),
      CommunityManager.deleteMany({}),
      Community.deleteMany({}),
      Resident.deleteMany({}),
      Security.deleteMany({}),
      Worker.deleteMany({}),
      Ad.deleteMany({}),
      CommonSpace.deleteMany({}),
      Issue.deleteMany({}),
      Payment.deleteMany({}),
      PreApproval.deleteMany({}),
      Visitor.deleteMany({}),
    ]);

    console.log("🧹 Old data removed");

   
    console.log("📦 Sample data inserted");

  } catch (error) {
    console.error("❌ Error inserting data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB Atlas");
  }
}

insertSampleData();