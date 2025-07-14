import express from "express";
const managerRouter = express.Router();

import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import session from "express-session";
import bcrypt from "bcrypt";

import Issue from "../models/issues.js";
import Worker from "../models/workers.js";
import Resident from "../models/resident.js";
import Security from "../models/security.js";
import Community from "../models/communities.js";
import CommonSpaces from "../models/commonSpaces.js";
import PaymentController from "../controllers/payments.js";
import CommunityManager from "../models/cManager.js";
import Ad from "../models/Ad.js";
import Payment from "../models/payment.js";

managerRouter.get("/commonSpace", async (req, res) => {
  const c = req.user.community;
  const csb = await CommonSpaces.find({ community: c });

  res.render("communityManager/CSB", { path: "cbs", csb });
});

function mergeBusySlots(slots) {
  // Convert time strings to minutes
  const toMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const toTimeStr = (minutes) => {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    return `${h}:${m}`;
  };

  // Step 1: Sort slots by start time
  const sorted = slots
    .map((s) => ({ from: toMinutes(s.from), to: toMinutes(s.to) }))
    .sort((a, b) => a.from - b.from);

  const merged = [];

  for (const slot of sorted) {
    if (!merged.length || merged[merged.length - 1].to < slot.from) {
      merged.push(slot);
    } else {
      merged[merged.length - 1].to = Math.max(
        merged[merged.length - 1].to,
        slot.to
      );
    }
  }

  // Convert back to time strings
  return merged.map((s) => ({
    from: toTimeStr(s.from),
    to: toTimeStr(s.to),
  }));
}

managerRouter.get("/commonSpace/checkAvailability/:id", async (req, res) => {
  const id = req.params.id;
  const current = await CommonSpaces.findById(id).populate("bookedBy");
  const date = current.Date;
  const from = current.from;
  const to = current.to;
  try {
    const result = await CommonSpaces.find({
      Date: date,
      $or: [
        { from: { $lt: to }, to: { $gt: from } },
        { from: { $lte: from }, to: { $gt: from } },
        { from: { $lt: to }, to: { $gte: to } },
      ],
      _id: { $ne: id },
      name: current.name,
      status: "Booked",
    });

    console.log("Conflicting Bookings:", result);

    const busySlots = result.map((conflict) => ({
      from: conflict.from,
      to: conflict.to,
    }));

    const busy = mergeBusySlots(busySlots);
    const busyTimes = busy
      .map((slot) => `${slot.from} - ${slot.to}`)
      .join(", ");

    console.log("Busy Slots:", busy);

    if (result.length > 0) {
      current.availability = "NO";
      current.feedback = `Booking was rejected due to conflicting booking . ${current.name} is reserved between ${busyTimes} .`;
      current.status = "Rejected";
      current.availability = "YES";
      await current.save();
      return res.status(200).json({ message: "not Available" });
    } else {
      current.availability = "YES";
      current.status = "avalaible";
      await current.save();
      return res
        .status(200)
        .json({ message: "Available and booked succesfully" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

managerRouter.get("/commonSpace/approve/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const b = await CommonSpaces.findById(id);

    if (!b) {
      return res.status(404).json({ message: "Booking not found" });
    }

    b.status = "avalaible";
    b.availability = "NO";
    b.paymentStatus = "Pending";
    b.status = "Booked";

    console.log("Booking Data after update:", b);

    const payment = await Payment.create({
      title: b._id,
      sender: b.bookedBy._id,
      receiver: req.user.community,
      amount: 1000,
      paymentDeadline: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      paymentDate: null,
      paymentMethod: "None",
      status: "Pending",
      remarks: null,
      ID: b._id,
      belongTo: "CommonSpaces",
      community: req.user.community,
    });

    b.payment = payment._id;
    await b.save();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

managerRouter.get("/commonSpace/approve/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const b = await CommonSpaces.findById(id);

    if (!b) {
      return res.status(404).json({ message: "Booking not found" });
    }

    b.availability = "NO";
    b.paymentStatus = null;
    b.status = "Rejected";

    await b.save();

    res.status(200).json({ message: "rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

managerRouter.get("/userManagement", (req, res) => {
  res.render("communityManager/userManagement", { path: "um" });
});

managerRouter.get("/dashboard", (req, res) => {
  res.render("communityManager/dashboard", { path: "d" });
});

managerRouter.get("/", (req, res) => {
  res.redirect("dashboard");
});

managerRouter.get("/issueResolving", async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
      return res.status(404).json({ message: "Community manager not found" });
    }
    const community = manager.assignedCommunity;

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const workers = await Worker.find({ community: community });
    const issues = await Issue.find({})
      .populate("resident")
      .populate("workerAssigned");

    res.render("communityManager/issueResolving", {
      path: "ir",
      issues: issues,
      workers: workers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

managerRouter.post("/issue/assign", async (req, res) => {
  const { issueID, worker, deadline, remarks } = req.body;
  try {
    const issue = await Issue.findById(issueID);
    if (!issue) {
      return res.status(404).send("Issue not found");
    }

    issue.workerAssigned = worker;
    issue.deadline = deadline;
    issue.remarks = remarks;
    issue.status = "Assigned";
    await issue.save();

    // Find the worker and update their assigned issues
    const workerData = await Worker.findById(worker);
    if (!workerData) {
      return res.status(404).send("Worker not found");
    }
    workerData.assignedIssues.push(issueID);
    await workerData.save();

    res.redirect("/manager/issueResolving");
  } catch (error) {
    console.error("Error assigning issue:", error);
    return res.status(500).send("Server error");
  }
});

managerRouter.get("/issueResolving/:id", async (req, res) => {
  const id = req.params.id;

  const issue = await Issue.find({ issueID: id })
    .populate("resident")
    .populate("workerAssigned");

  if (!issue) {
    return res.status(404).json({ message: "Issue not found" });
  }

  res.status(200).json({ issue, success: true });
});

managerRouter.get("/payments", (req, res) => {
  res.render("communityManager/Payments", { path: "p" });
});

managerRouter.get("/ad", (req, res) => {
  res.render("communityManager/Advertisement", { path: "ad" });
});

managerRouter.get("/profile", (req, res) => {
  res.render("communityManager/Profile", { path: "pr" });
});

export default managerRouter;
