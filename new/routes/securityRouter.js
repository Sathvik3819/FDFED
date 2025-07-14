import express from "express";
const securityRouter = express.Router();

import Security from "../models/security.js";
import VisitorPreApproval from "../models/preapproval.js";
import auth from "../controllers/auth.js";
import { authorizeS } from "../controllers/authorization.js";

import visitor from "../models/visitors.js";

import mongoose from "mongoose";

securityRouter.get("/addVisitor", (req, res) => {
  res.render("security/addV", { path: "aw" });
});

securityRouter.post("/addVisitor", async (req, res) => {
  const {
    visitorType,
    fullName,
    contact,
    visitDate,
    email,
    visitTime,
    vehicleNo,
  } = req.body;

  try {
    const v = await visitor.create({
      name: fullName,
      contactNumber: contact,
      purpose: visitorType,
      vehicleNumber: vehicleNo,
      entryDate: visitDate,
      entryTime: visitTime,
      email,
      addedBy: req.user.id,
      community: req.user.community,
    });
    console.log("visitor entered");
  } catch (err) {
    console.log(err);
  }

  res.redirect("/security/visitorManagement");
});

securityRouter.get("/dashboard", async (req, res) => {
  const visitors = await visitor.find({
    community: req.user.community,
    addedBy: req.user.id,
    $or: [
      { status: "active" },
      { status: "checkedOut" },
    ],
  });
  
  
  res.render("security/dashboard", { path: "d" ,visitors});
});

securityRouter.get("/", (req, res) => {
  res.redirect("dashboard");
});

securityRouter.get("/preApproval", async (req, res) => {
  const pa = await VisitorPreApproval.find({
    community: req.user.community,
  }).populate("approvedBy");
  console.log(pa);

  res.render("security/preApproval", { path: "pa", pa });
});

securityRouter.post("/preApproval/action", async (req, res) => {
  try {
    const {
      name,
      contact,
      requestedBy,
      purpose,
      date,
      vehicleNumber,
      ID,
      status,
    } = req.body;

    console.log("Visitor ID received:", ID);

    // Validate ObjectId format first
    if (!mongoose.Types.ObjectId.isValid(ID)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid visitor ID" });
    }

    // Fetch the visitor record
    const visitor = await VisitorPreApproval.findById(ID);
    if (!visitor) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    // Update fields safely
    visitor.status = status.toLowerCase(); // "approved" or "rejected"
    visitor.isCheckedIn = status === "Approved"; // only check-in if approved
    visitor.vehicleNumber = vehicleNumber; // optional: store vehicleNumber

    await visitor.save();

    res.status(200).json({
      success: true,
      message: `Visitor ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("Error updating visitor status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

securityRouter.get("/visitorManagement", async (req, res) => {
  const visitors = await visitor.find({
    community: req.user.community,
    addedBy: req.user.id,
  });

  visitors.sort((a, b) => {
    const dateA = new Date(
      a.entryDate.split("/").reverse().join("-") + " " + a.entryTime
    );
    const dateB = new Date(
      b.entryDate.split("/").reverse().join("-") + " " + b.entryTime
    );
    const timeA = new Date("1970/01/01 " + a.entryTime);
    const timeB = new Date("1970/01/01 " + b.entryTime);

    if (dateA.toDateString() === dateB.toDateString()) {
      return timeB - timeA;
    }

    return dateB - dateA;
  });

  console.log(visitors);

  res.render("security/VisitorManagement", { path: "vm", visitors });
});

securityRouter.get("/visitorManagement/:action/:id", async (req, res) => {
  const { action, id } = req.params;

  console.log(action, id);

  try {
    const v = await visitor.findById(id);

    if (!v) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    if (action === "checked-in") {
      v.status = "checkedIn";
      v.entryTime = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      v.entryDate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } else if (action === "checked-out") {
      v.status = "checkedOut";
      v.exitTime = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      v.exitdate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    await v.save();
    res.status(200).json({ success: true, message: "Visitor updated" });
  } catch (error) {
    console.error("Error updating visitor status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

securityRouter.get("/profile", (req, res) => {
  res.render("security/Profile", { path: "pr" });
});

export default securityRouter;
