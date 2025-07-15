import express from "express";
const managerRouter = express.Router();

import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import session from "express-session";
import bcrypt from "bcrypt";
import multer from "multer";

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
import visitor from "../models/visitors.js"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + ".png";
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

managerRouter.get("/commonSpace", async (req, res) => {
  const c = req.user.community;
  const csb = await CommonSpaces.find({ community: c });

  const ads = await Ad.find({ community: req.user.community });

  console.log(ads);

  res.render("communityManager/CSB", { path: "cbs", csb, ads });
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

managerRouter.get("/userManagement", async (req, res) => {
  const ads = await Ad.find({ community: req.user.community });

  const R = await Resident.find({ community: req.user.community });
  const W = await Worker.find({ community: req.user.community });
  const S = await Security.find({ community: req.user.community });


  res.render("communityManager/userManagement", { path: "um", ads, R, W, S });
});

managerRouter.post("/userManagement/resident", async (req, res) => {
  try {
    const {
      Rid,
      residentFirstname,
      residentLastname,
      email,
      blockNo,
      flatNo,
      contact,
    } = req.body;

    console.log(Rid);

    if (Rid) {
      const r = await Resident.findById(Rid);

      r.residentFirstname = residentFirstname;
      r.residentLastname = residentLastname;
      r.email = email;
      r.blockNo = blockNo;
      r.flatNo = flatNo;
      r.contact = contact;

      await r.save();
    } else {
      const r = await Resident.create({
        residentFirstname,
        residentLastname,
        email,
        contact,
        flatNo,
        blockNo,
        community: req.user.community,
      });

      console.log("new resident : ", r);
    }

    res.redirect("/manager/userManagement");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

managerRouter.get("/userManagement/resident/:id", async (req, res) => {
  const id = req.params.id;

  const r = await Resident.findById(id);

  res.status(200).json({ success: true, r });
});

managerRouter.post("/userManagement/security", async (req, res) => {
  try {
    const { Sid,name, email, contact, address, Shift } = req.body;

    if(Sid){

      const s = await Security.findById(Sid);

      s.name = name;
      s.email = email;
      s.contact = contact;
      s.address = address;
      s.Shift = Shift;

      await s.save();
      

    }else{
      const r = await Security.create({
      name,
      email,
      contact,
      address,
      Shift,
      community: req.user.community,
    });

    console.log("new security : ", r);
    }
    

    res.redirect("/manager/userManagement");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


managerRouter.get("/userManagement/security/:id", async (req, res) => {
  const id = req.params.id;

  const r = await Security.findById(id);

  console.log(r);
  

  res.status(200).json({ success: true, r });
});

managerRouter.post("/userManagement/worker", async (req, res) => {
  try {
    const {
      Wid,
      name,
      email,
      jobRole,
      contact,
      address,
      salary,
      availabilityStatus,
    } = req.body;

    if(Wid){
      const w = await Worker.findById(Wid);

      w.name = name;
      w.email = email;
      w.jobRole = jobRole;
      w.contact = contact;
      w.address = address;
      w.salary = salary;
      w.availabilityStatus = availabilityStatus;

      await w.save();
      
    }else{
      const r = await Worker.create({
      name,
      email,
      jobRole,
      contact,
      address,
      salary,
      availabilityStatus,
      community: req.user.community,
    });

    console.log("new worker : ", r);
    }

    res.redirect("/manager/userManagement");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

managerRouter.get("/userManagement/worker/:id", async (req, res) => {
  const id = req.params.id;

  const w = await Worker.findById(id);

  res.status(200).json({ success: true, w });
});

managerRouter.get("/dashboard", async (req, res) => {
  const ads = await Ad.find({ community: req.user.community });

  const issues = await Issue.find({community:req.user.community});
  const residents = await Resident.find({community:req.user.community});
  const workers = await Worker.find({community:req.user.community});
  const security = await Security.find({community:req.user.community});
  const commonSpacesBookings = await CommonSpaces.find({community:req.user.community});
  const payments = await Payment.find({community:req.user.community});
  const visitors = await visitor.find({community:req.user.community})

  const totalIssues = issues.length;
  const totalResidents = residents.length;
  const totalWorkers = workers.length;
  const totalSecurity = security.length;
  const totalCommonSpacesBookings = commonSpacesBookings.length;
  const totalPayments = payments.length;

  const pendingIssues = issues.filter(issue => issue.status === 'Pending').length;
  const resolvedIssues = issues.filter(issue => issue.status === 'Resolved').length;
  const pendingCommonSpacesBookings = commonSpacesBookings.filter(booking => booking.status === 'Pending').length;
  const approvedCommonSpacesBookings = commonSpacesBookings.filter(booking => booking.status === 'Booked').length;
  const pendingPayments = payments.filter(payment => payment.status === 'Pending').length;
  const completedPayments = payments.filter(payment => payment.status === 'Completed').length;

  res.render("communityManager/dashboard", {
    path: "d",
    ads,
    totalIssues,
    totalResidents,
    totalWorkers,
    totalSecurity,
    totalCommonSpacesBookings,
    totalPayments,
    pendingIssues,
    resolvedIssues,
    pendingCommonSpacesBookings,
    approvedCommonSpacesBookings,
    pendingPayments,
    completedPayments,
    visitors
  });
  

});

managerRouter.get("/", (req, res) => {
  res.redirect("dashboard");
});

managerRouter.get("/issueResolving", async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    const ads = await Ad.find({ community: req.user.community });

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
      ads,
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

managerRouter.get("/payments", async (req, res) => {
  const ads = await Ad.find({ community: req.user.community });

  res.render("communityManager/Payments", { path: "p", ads });
});

managerRouter.get("/ad", async (req, res) => {
  const ads = await Ad.find({ community: req.user.community,status:"active" });

  

  res.render("communityManager/Advertisement", { path: "ad", ads });
});

managerRouter.post("/ad", upload.single("image"), async (req, res) => {
  const { title, sdate, edate, link } = req.body;
  const file = req.file.path;

  const ad = await Ad.create({
    title,
    startDate: new Date(sdate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    endDate: new Date(edate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    link,
    imagePath: file,
    community: req.user.community,
  });

  console.log("new ad : ", ad);

  res.redirect("ad");
});

managerRouter.get("/profile", async (req, res) => {
  const ads = await Ad.find({ community: req.user.community });

  res.render("communityManager/Profile", { path: "pr", ads });
});

export default managerRouter;
