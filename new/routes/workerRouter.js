import express from "express";
import Issue from "../models/issues.js";
const workerRouter = express.Router();
import Ad from '../models/Ad.js'

workerRouter.get("/dashboard", async (req, res) => {
  const t = await Issue.find({workerAssigned:req.user.id})
  console.log(t);

  const ads = await Ad.find({ community: req.user.community });

  console.log(ads);
  
  res.render("worker/dashboard", { path: "d",t ,ads});
});

workerRouter.get("/", (req, res) => {
  
  res.redirect("dashboard");
});

workerRouter.get("/history", async (req, res) => {
  const issues = await Issue.find({ workerAssigned: req.user.id })
    .populate("workerAssigned")
    .populate("resident");

    const ads = await Ad.find({ community: req.user.community });

  console.log(ads);

  console.log(issues);

  res.render("worker/History", { path: "H", issues,ads });
});

workerRouter.get("/tasks", async (req, res) => {
  const tasks = await Issue.find({ workerAssigned: req.user.id })
    .populate("workerAssigned")
    .populate("resident");

    const ads = await Ad.find({ community: req.user.community });

  console.log(ads);

  console.log(tasks);

  res.render("worker/Task", { path: "t", tasks,ads });
});

workerRouter.post("/issueResolving/resolve/:id", async (req, res) => {
  const issueId = req.params.id;
  try {
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }
    issue.status = "Review Pending";
    issue.resolvedAt = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    await issue.save();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

workerRouter.get("/profile",async  (req, res) => {
  const ads = await Ad.find({ community: req.user.community });

  console.log(ads);
  res.render("worker/Profile", { path: "pr" ,ads});
});

export default workerRouter;
