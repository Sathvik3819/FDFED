import express from "express";
import Issue from "../models/issues.js";
const workerRouter = express.Router();
import Ad from "../models/Ad.js";
import Worker from "../models/workers.js";

import multer from "multer";
import bcrypt from "bcrypt";
import { noop } from "chart.js/helpers";

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

workerRouter.get("/dashboard", async (req, res) => {
  const t = await Issue.find({ workerAssigned: req.user.id });
  console.log(t);

 const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  

  console.log(ads);

  res.render("worker/dashboard", { path: "d", t, ads });
});

workerRouter.get("/", (req, res) => {
  res.redirect("dashboard");
});

workerRouter.get("/history", async (req, res) => {
  const issues = await Issue.find({ workerAssigned: req.user.id,status:{ $nin: ["Assigned", "Pending"] } })
    .populate("workerAssigned")
    .populate("resident");

 const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  
  
  console.log(issues);
  

  res.render("worker/History", { path: "H", issues, ads });
});

workerRouter.get("/tasks", async (req, res) => {
  const tasks = await Issue.find({ workerAssigned: req.user.id,status:"Assigned" })
    .populate("workerAssigned")
    .populate("resident");

 const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  

  res.render("worker/Task", { path: "t", tasks, ads });
});

workerRouter.post("/issueResolving/resolve/:id", async (req, res) => {
  const issueId = req.params.id;
  try {
    const issue = await Issue.findById(issueId).populate('resident');
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }
    issue.status = "Review Pending";
    issue.resolvedAt = new Date();
    issue.resident.notifications.push({
      n:`Issue ${issue.issueID} is resolved `,
      createdAt:new Date(),
      belongs:"Issue"
    })

    await issue.resident.save();
    await issue.save();
    res.status(200).json({ success: true, message: "Issue resolved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({success: false, message: "Server error" });
  }
});

workerRouter.get("/profile", async (req, res) => {
 const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  

  const r = await Worker.findById(req.user.id);
  console.log(r);

  res.render("worker/Profile", { path: "pr", ads, r });
});

workerRouter.post("/profile", upload.single("image"), async (req, res) => {
  const { name, email, contact, address } = req.body;

  const r = await Worker.findById(req.user.id);

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
    console.log(image);
    await r.save();
  }

  await r.save();

  return res.json({success:true,message:"Profile updated successfully",r});
});

workerRouter.post("/change-password", async (req, res) => {
  const { cp, np } = req.body;
  const security = await Worker.findById(req.user.id);

  if (!security) {
    return res.json({ success: false, message: "Security not found." });
  }

  const isMatch = await bcrypt.compare(cp, security.password);
  if (!isMatch) {
    return res.json({
      success: false,
      message: "Current password does not match.",
    });
  }

  const salt = await bcrypt.genSalt(10);
  security.password = await bcrypt.hash(np, salt);
  await security.save();

  res.json({ success: true, message: "Password changed successfully." });
});

export default workerRouter;
