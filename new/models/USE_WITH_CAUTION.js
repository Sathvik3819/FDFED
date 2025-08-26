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

const MONGODB_URI =
  "mongodb+srv://sathvikchiluka:UE123@urbanease.8evt9ty.mongodb.net/urbanEase?retryWrites=true&w=majority&appName=UrbanEase";

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

    // Hash passwords
    const hashedManagerPass = await bcrypt.hash("manager123", 10);
    const hashedResidentPass = await bcrypt.hash("resident123", 10);
    const hashedSecurityPass = await bcrypt.hash("security123", 10);
    const hashedWorkerPass = await bcrypt.hash("worker123", 10);

    // Insert community
    const community = await Community.create({
      name: "Urban Heights",
      location: "Hyderabad, India",
      subscriptionStatus: "active",
    });

    // Insert community manager
    const manager = await CommunityManager.create({
      name: "Ravi Kumar",
      email: "manager@urbanheights.com",
      password: hashedManagerPass,
      community: community._id,
    });

    // Insert residents
    const residents = await Resident.insertMany([
      {
        name: "Sathvik Chiluka",
        email: "sathvik@example.com",
        flatNumber: "A-101",
        community: community._id,
        password: hashedResidentPass,
      },
      {
        name: "Priya Sharma",
        email: "priya@example.com",
        flatNumber: "B-202",
        community: community._id,
        password: hashedResidentPass,
      },
    ]);

    // Insert security guards
    const securities = await Security.insertMany([
      { 
        name: "Arun", 
        shift: "Day", 
        community: community._id,
        password: hashedSecurityPass 
      },
      { 
        name: "Deepak", 
        shift: "Night", 
        community: community._id,
        password: hashedSecurityPass 
      },
    ]);

    // Insert workers
    const workers = await Worker.insertMany([
      { 
        name: "Kiran", 
        role: "Electrician", 
        community: community._id,
        password: hashedWorkerPass 
      },
      { 
        name: "Sunil", 
        role: "Plumber", 
        community: community._id,
        password: hashedWorkerPass 
      },
    ]);

    // Insert ads
    await Ad.create({
      title: "20% Off at Local Gym",
      description: "Exclusive offer for residents of Urban Heights.",
      community: community._id,
    });

    // Insert common spaces
    const commonSpaces = await CommonSpace.insertMany([
      { name: "Clubhouse", status: "Available", community: community._id },
      { name: "Tennis Court", status: "Booked", community: community._id },
    ]);

    // Insert issues
    const issues = await Issue.insertMany([
      {
        title: "Water Leakage",
        description: "Leak in Block B",
        status: "Open",
        resident: residents[0]._id,
        community: community._id,
      },
      {
        title: "Lift Not Working",
        description: "Block C Lift stuck frequently",
        status: "In Progress",
        resident: residents[1]._id,
        community: community._id,
      },
    ]);

    // Insert payments
    await Payment.insertMany([
      {
        amount: 1500,
        status: "Completed",
        belongToId: community._id,
        type: "Community",
      },
      {
        amount: 500,
        status: "Pending",
        belongToId: residents[0]._id,
        type: "Resident",
      },
    ]);

    // Insert pre-approvals
    await PreApproval.insertMany([
      {
        visitorName: "Ajay Mehta",
        approvedBy: residents[0]._id,
        community: community._id,
      },
      {
        visitorName: "Neha Verma",
        approvedBy: residents[1]._id,
        community: community._id,
      },
    ]);

    // Insert visitors
    await Visitor.insertMany([
      {
        name: "Delivery Guy",
        purpose: "Food Delivery",
        status: "Checked In",
        community: community._id,
      },
      {
        name: "Rahul Singh",
        purpose: "Friend Visit",
        status: "Checked Out",
        community: community._id,
      },
    ]);

    // Insert interest forms
    await Interest.insertMany([
      {
        name: "Akash Gupta",
        phone: "9876543210",
        message: "Interested in renting a flat",
        community: community._id,
      },
    ]);

    console.log("📦 Sample data inserted successfully!");
    console.log("🔑 Passwords:");
    console.log("  Manager: manager123");
    console.log("  Residents: resident123");
    console.log("  Security: security123");
    console.log("  Workers: worker123");

  } catch (error) {
    console.error("❌ Error inserting data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB Atlas");
  }
}

insertSampleData();
