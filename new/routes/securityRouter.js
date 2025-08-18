import express from "express";
const securityRouter = express.Router();

import Security from "../models/security.js";
import VisitorPreApproval from "../models/preapproval.js";
import auth from "../controllers/auth.js";
import { authorizeS } from "../controllers/authorization.js";
import Ad from "../models/Ad.js";

import visitor from "../models/visitors.js";

import mongoose from "mongoose";

import multer from "multer";
import bcrypt from "bcrypt";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "=profImg.png";
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

securityRouter.get("/addVisitor", (req, res) => {
  res.render("security/addV", { path: "aw" });
});

securityRouter.post("/addVisitor", async (req, res) => {
  const {
    visitorType,
    fullName,
    contact,
  
    email,
   
    vehicleNo,
  } = req.body;

  try {
    const v = await visitor.create({
      name: fullName,
      contactNumber: contact,
      purpose: visitorType,
      vehicleNumber: vehicleNo,
      entryDate: new Date(Date.now()),
      entryTime: new Date(Date.now()),
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
    $or: [{ status: "active" }, { status: "checkedOut" }],
  });

  const sec = await Security.findById(req.user.id);



 const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  res.render("communityManager/Advertisement", { path: "ad", ads });

  console.log(ads);

  res.render("security/dashboard", { path: "d", visitors, ads,sec });
});

securityRouter.get("/", (req, res) => {
  res.redirect("dashboard");
});

securityRouter.get("/preApproval", async (req, res) => {
  const pa = await VisitorPreApproval.find({
    community: req.user.community,
  }).populate("approvedBy");
  
  console.log(pa);
  

 const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  res.render("communityManager/Advertisement", { path: "ad", ads });


  res.render("security/preApproval", { path: "pa", pa, ads });
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
    const vis = await VisitorPreApproval.findById(ID).populate('approvedBy');
    if (!vis) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    vis.status = status.toLowerCase(); 
    vis.isCheckedIn = status === "Approved"; 
    vis.vehicleNumber = vehicleNumber; 

    vis.approvedBy.notifications.push({
      n:`Pre approved Visitor ${vis.ID} is ${vis.status}`,
      createdAt:new Date(Date.now()),
      belongs:"PA"
    });

    await vis.approvedBy.save();
    await vis.save();

    console.log(vis.status);
    

    if(vis.status === "approved"){
      const v = await visitor.create({
      name: vis.visitorName,
      contactNumber: vis.contactNumber,
      email: vis.email,
      purpose: vis.purpose,
      entryDate: new Date(Date.now()),
      entryTime:new Date(Date.now()),
      vehicleNumber:vehicleNumber,
      verifiedByResident:true,
      community : req.user.community,
      addedBy:req.user.id,
      status:"active",
    });
    console.log("new visitor by preapproval : "+ v);
    
    }

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

 const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  res.render("communityManager/Advertisement", { path: "ad", ads });

  console.log(ads);

  visitors.sort((a, b) => {
  const dateTimeA = new Date(a.entryDate);
  const dateTimeB = new Date(b.entryDate);

  return dateTimeB - dateTimeA; 
});


  console.log(visitors);

  res.render("security/VisitorManagement", { path: "vm", visitors, ads });
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
      v.status = "active";
      v.entryTime = new Date(Date.now())
      v.entryDate = new Date(Date.now())
    } else if (action === "checked-out") {
      v.status = "checkedOut";
      v.exitTime = new Date(Date.now())
      v.exitdate = new Date(Date.now())
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

securityRouter.get("/profile", async (req, res) => {
 const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  res.render("communityManager/Advertisement", { path: "ad", ads });

  const r = await Security.findById(req.user.id);

  res.render("security/Profile", { path: "pr", ads, r });
});

securityRouter.post("/profile", upload.single("image"), async (req, res) => {
  const { name, email, contact, address } = req.body;

  const r = await Security.findById(req.user.id);

  let image = null;

  if (req.file) {
    image = req.file.path;
  }

  r.name = name;
  r.email = email;
  r.contact = contact;
  r.address = address;

  if (image) {
    r.image = image;
  }

  await r.save();

  res.redirect("/security/profile");
});

securityRouter.post("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const security = await Security.findById(req.user.id);

  if (!security) {
    return res.json({ success: false, message: "Security not found." });
  }

  const isMatch = await bcrypt.compare(currentPassword, security.password);
  if (!isMatch) {
    return res.json({
      success: false,
      message: "Current password does not match.",
    });
  }

  const salt = await bcrypt.genSalt(10);
  security.password = await bcrypt.hash(newPassword, salt);
  await security.save();

  res.json({ ok: true, message: "Password changed successfully." });
});

export default securityRouter;
