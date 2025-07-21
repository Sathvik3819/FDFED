import express from "express";
const residentRouter = express.Router();
import bcrypt from "bcrypt";

import Issue from "../models/issues.js";
import Resident from "../models/resident.js";
import CommonSpaces from "../models/commonSpaces.js";
import Payment from "../models/payment.js";
import VisitorPreApproval from "../models/preapproval.js";
import auth from "../controllers/auth.js";
import { authorizeR } from "../controllers/authorization.js";
import Ad from "../models/Ad.js";
import communities from "../models/communities.js";

import multer from "multer";

function generateCustomID(userEmail, facility, countOrRandom = null) {
  const emailPrefix = userEmail.toUpperCase().slice(-4);

  const facilityCode = facility.toUpperCase().slice(0, 2);

  const suffix = countOrRandom
    ? String(countOrRandom).padStart(4, "0")
    : String(Math.floor(1000 + Math.random() * 9000));

  return `UE-${emailPrefix}-${facilityCode}-${suffix}`;
}

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

residentRouter.get("/commonSpace", async (req, res) => {
  const booking = await CommonSpaces.find({ bookedBy: req.user.id });

  console.log("Booking Data:", booking);

  const ads = await Ad.find({ community: req.user.community });

  res.render("resident/commonSpace", { path: "cbs", bookings: booking, ads });
});

residentRouter.post("/commonSpace/:id", async (req, res) => {
  const issueId = req.params.id;

  const commonspace = await CommonSpaces.findById(issueId);
  if (!commonspace) {
    return res.status(404).send("commonspace not found");
  }

  console.log("Commonspace Data:", commonspace);

  res.status(200).json({ commonspace: commonspace });
});

residentRouter.post("/commonSpace", async (req, res) => {
  try {
    const uid = req.user.id;
    const { facility, purpose, date, from, to } = req.body;
    console.log(facility, purpose, date, from, to);

    if (!facility || !purpose || !date || !from || !to) {
      req.flash("message", "All fields are required.");
      console.log("Missing fields in request body:", req.body);
      return res.redirect("commonSpace");
    }

    const formattedDate = formatDate(date);
    console.log("Formatted Date:", formattedDate);

    const space = await CommonSpaces.create({
      name: facility,
      description: purpose,
      Date: formattedDate,
      from,
      to,
      status: "Pending",
      availability: null,
      bookedBy: uid,
      community: req.user.community,
    });

    const uniqueId = generateCustomID(req.user.id, "CS", null);
    space.ID = uniqueId;

    await space.save();

    console.log("New Common Space Created:", space);

    const user = await Resident.findById(uid);
    if (!user) {
      console.log("User not found");
      req.flash("message", "User not found.");
      return res.redirect("/login");
    }

    user.bookedCommonSpaces.push(space._id);
    await user.save();

    req.flash("message", "Booking request submitted successfully");
    return res.redirect("commonSpace");
  } catch (error) {
    console.error("Error:", error);
    req.flash("message", "Something went wrong.");
    res.redirect("commonSpace");
  }
});

residentRouter.get("/commonSpace/cancelled/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;

    const booking = await CommonSpaces.deleteOne({
      _id: bookingId,
      bookedBy: req.user.id,
    });

    console.log(bookingId, req.user.id);

    return res.json({ result: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Error fetching cancellation reason:", error);
    res.status(500).json({ error: "Server error" });
  }
});

const formatDate = (rawDate) => {
  return new Date(rawDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

residentRouter.get("/dashboard", async (req, res) => {
  const recents = [];

  const ads = await Ad.find({ community: req.user.community });

  const issues = await Issue.find({ resident: req.user.id });
  const commonSpaces = await CommonSpaces.find({ bookedBy: req.user.id });
  const payments = await Payment.find({ sender: req.user.id });

  // Add issues
  recents.push(
    ...issues.map((issue) => ({
      type: "Issue",
      title: issue.issueID,
      dateRaw: new Date(issue.createdAt),
      date: formatDate(issue.createdAt),
    }))
  );

  // Add common space bookings
  recents.push(
    ...commonSpaces.map((space) => ({
      type: "CommonSpace",
      title: space.name,
      dateRaw: new Date(space.createdAt),
      date: formatDate(space.createdAt),
    }))
  );

  // Add payments
  recents.push(
    ...payments.map((payment) => ({
      type: "Payment",
      title: payment.title,
      dateRaw: new Date(payment.paymentDate),
      date: formatDate(payment.paymentDate),
    }))
  );

  console.log(recents);

  // Sort by dateRaw descending
  recents.sort((a, b) => b.dateRaw - a.dateRaw);

  // Remove dateRaw for display
  const cleanedRecents = recents.map(({ dateRaw, ...rest }) => rest);

  // Log for debugging
  cleanedRecents.forEach((r) => {
    console.log(`${r.type} — ${r.title} — ${r.date}`);
  });

  // Render with recent data
  res.render("resident/dashboard", {
    path: "d",
    recents: cleanedRecents,
    ads,
  });
});

residentRouter.get("/", (req, res) => {
  res.redirect("dashboard");
});

residentRouter.get("/issueRaising", async (req, res) => {
  try {
    const resident = await Resident.findOne({ email: req.user.email }).populate(
      {
        path: "raisedIssues",
        populate: {
          path: "workerAssigned",
        },
      }
    );
    const ads = await Ad.find({ community: req.user.community });

    console.log(ads);

    if (!resident) {
      return res.status(404).json({ error: "Resident not found." });
    }

    const issues = await resident.raisedIssues;

    res.render("resident/issueRaising", { path: "ir", i: issues, ads });
  } catch (error) {
    console.error("Error fetching issues:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

residentRouter.post("/issueRaising/feedback", async (req, res) => {
  try {
    const { id, rating, feedback } = req.body;

    const issue = await Issue.findById(id).populate("workerAssigned");
    if (!issue) {
      req.flash("message", "Issue not found.");
      console.log("Issue not found for ID:", id);
      return res.redirect("/resident/issueRaising");
    }

    issue.rating = rating;
    issue.feedback = feedback;
    issue.status = "Payment Pending";
    await issue.save();

    const payment = await Payment.create({
      title: issue.issueID,
      sender: req.user.id,
      receiver: issue.workerAssigned.community,
      amount: 100,
      paymentDeadline: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      paymentDate: null,
      paymentMethod: "None",
      status: "Pending",
      remarks: null,
      belongTo: "Issue",
      belongToId: issue._id,
      communityId: issue.workerAssigned.communityAssigned,
    });

    const uniqueId = generateCustomID(payment._id, "PA", null);

    payment.ID = uniqueId;
    await payment.save();

    res.redirect("/resident/issueRaising");
  } catch (error) {
    console.error("Error submitting feedback:", error);
    req.flash("message", "Something went wrong.");
    return res.redirect("/issueRaising");
  }
});

residentRouter.post("/issueRaising", async (req, res) => {
  try {
    const { category, description } = req.body;
    console.log("Received Issue Data:", req.body);
    if (!category || !description) {
      req.flash("message", "All fields are required.");
      console.log("Missing fields in request body:", req.body);
      return res.redirect("issueRaising");
    }
    const resident = await Resident.findById(req.user.id);
    if (!resident) {
      req.flash("message", "Resident not found.");
      console.log("Resident not found for ID:", req.user.id);
      return res.redirect("issueRaising");
    }
    console.log("Resident Found:", resident);

    const creat = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    // Create the new issue document
    const newIssue = await Issue.create({
      resident: resident._id,
      title: category,
      description: description,
      status: "Pending",
      createdAt: creat,
      workerAssigned: null,
    });

    const issueID = generateCustomID(req.user.id, "IS", null);
    newIssue.issueID = issueID;
    await newIssue.save();

    console.log("New Issue Created:", newIssue);
    resident.raisedIssues.push(newIssue._id);
    await resident.save();
    console.log("Resident's raisedIssues updated:", resident.raisedIssues);

    return res.redirect("issueRaising");
  } catch (error) {
    console.error("Error raising issue:", error);
    req.flash("message", "Something went wrong.");
    return res.redirect("issueRaising");
  }
});

residentRouter.delete("/deleteIssue/:issueID", async (req, res) => {
  try {
    const { issueID } = req.params;

    const issue = await Issue.findOneAndDelete({ _id: issueID });

    if (!issue) {
      return res.status(404).json({ error: "Issue not found." });
    }

    await Resident.updateOne(
      { raisedIssues: issue._id },
      { $pull: { raisedIssues: issue._id } }
    );

    res.json({ message: "Issue deleted successfully." });
  } catch (error) {
    console.error("Error deleting issue:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

residentRouter.get("/getIssueData/:issueID", async (req, res) => {
  try {
    const { issueID } = req.params;
    console.log("Fetching issue data for ID:", issueID);
    const issue = await Issue.findById(issueID)
      .populate("resident")
      .populate("workerAssigned");
    if (!issue) {
      return res.status(404).json({ error: "Issue not found." });
    }
    console.log("Issue data found:", issue);

    res.status(200).json(issue);
  } catch (error) {
    console.error("Error fetching issue data:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Payment routes - corrected version
residentRouter.get("/payments", async (req, res) => {
  try {
    const userId = req.user.id;

    const ads = await Ad.find({ community: req.user.community });

    console.log(ads);

    const payments = await Payment.find({ sender: userId })
      .populate("receiver", "name")
      .sort({ paymentDeadline: -1 });

      console.log(payments);
      

    res.render("resident/payments", { path: "p", payments, ads });
  } catch (error) {
    console.error("Error fetching payments:", error);
    req.flash("message", "Failed to load payment data");
    res.redirect("/dashboard");
  }
});

residentRouter.get("/payment/receipt/:id", async (req, res) => {
  const Id = req.params.id;
  console.log("Payment ID:", Id);

  const payment = await Payment.findById(Id)
    .populate("receiver")
    .populate("sender");

  console.log("Payment Details:", payment);

  res.render("resident/receipt", { path: "p", payment });
});

residentRouter.get("/payment/:paymentId", async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentId = req.params.paymentId;

    const payment = await Payment.findOne({
      _id: paymentId,
      sender: userId,
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment receipt not found" });
    }
    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    res.status(500).json({ error: "Failed to fetch receipt" });
  }
});

residentRouter.post("/payment/post", async (req, res) => {
  try {
    const {
      paymentId,
      bill,
      amount,
      paymentMethod,
      cardNumber,
      expiryDate,
      cvv,
    } = req.body;

    const payment = await Payment.findById(paymentId).populate("");
    if (!payment) {
      req.flash("message", "Payment not found.");
      console.log("Payment not found for ID:", paymentId);
      return res.redirect("/resident/payments");
    }

    payment.status = "Completed";
    payment.paymentMethod = paymentMethod;
    payment.amount = amount;

    payment.paymentDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });

    await payment.save();

    const type = payment.belongTo;

    let ob = null;

    if (type === "Issue") {
      ob = await Issue.findById(payment.belongToId);
    } else if (type === "commonSpaces") {
      ob = await CommonSpaces.findById(payment.belongToId);
    }
    ob.status = "Resolved";
    ob.paymentStatus = "Completed";
    ob.payment = payment._id;
    await ob.save();

    console.log("Payment updated successfully:", payment);

    res.redirect("/resident/payments");
  } catch (error) {
    console.error("Error in payment processing:", error);
    req.flash("message", "Something went wrong.");
    return res.redirect("/resident/payments");
  }
});

residentRouter.get("/preApprovals", async (req, res) => {
  try {
    const resident = await Resident.findById(req.user.id).populate(
      "preApprovedVisitors"
    );
    const ads = await Ad.find({ community: req.user.community });

    console.log(resident.preApprovedVisitors);

    res.render("resident/preApproval", {
      path: "pa",
      visitors: resident.preApprovedVisitors || [],
      ads,
    });
  } catch (err) {
    console.error("Error loading visitor history:", err);
    res.render("users/resident/preapproval", { visitors: [] });
  }
});

//pre approval routes
residentRouter.post("/preapproval", auth, authorizeR, async (req, res) => {
  try {
    const { visitorName, contactNumber, dateOfVisit, timeOfVisit, purpose } =
      req.body;

    const resident = await Resident.findById(req.user.id).populate("community");
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    const date = formatDate(dateOfVisit);
    console.log("Formatted Date:", date);

    const newVisitor = await VisitorPreApproval.create({
      visitorName,
      contactNumber,
      dateOfVisit: date,
      timeOfVisit,
      purpose,
      approvedBy: resident._id,
      community: resident.community._id,
    });

    resident.preApprovedVisitors.push(newVisitor._id);
    await resident.save();

    const uniqueId = generateCustomID(newVisitor._id.toString(), "PA", null);

    newVisitor.ID = uniqueId;
    await newVisitor.save();

    console.log(newVisitor);

    return res.redirect("/resident/preApprovals");
  } catch (err) {
    console.error("Error in pre-approving visitor:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

residentRouter.delete("/preapproval/cancel/:id", async (req, res) => {
  const requestId = req.params.id;
  console.log("Canceling request with ID:", requestId);

  try {
    const result = await VisitorPreApproval.findByIdAndDelete(requestId);
    if (!result) {
      console.log("Request not found for ID:", requestId);
      return res.status(404).json({ error: "Request not found" });
    }

    res
      .status(200)
      .json({ message: "Request canceled successfully", ok: true });
  } catch (error) {
    console.error("Error canceling request:", error);
    return res.status(500).json({ error: "Failed to cancel request" });
  }
});

residentRouter.get("/profile", async (req, res) => {
  const ads = await Ad.find({ community: req.user.community });

  const r = await Resident.findById(req.user.id);

  res.render("resident/Profile", { path: "pr", ads, r });
});

residentRouter.post("/profile", upload.single("image"), async (req, res) => {
  const { firstName, lastName, contact, email, address } = req.body;

  const r = await Resident.findById(req.user.id);

  const image = req.file.path;

  r.residentFirstname = firstName;
  r.residentLastname = lastName;
  r.email = email;
  r.contact = contact;
  const blockNo = address.split(" ")[1] + " " + address.split(" ")[2];
  const flatNo = address.split(" ")[3];

  if (image) {
    r.image = image;
  }

  r.blockNo = blockNo;
  r.flatNo = flatNo;

  await r.save();

  res.redirect("/resident/Profile");
});

residentRouter.post("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const resident = await Resident.findById(req.user.id);

  if (!resident) {
    return res.json({ success: false, message: "Resident not found." });
  }

  const isMatch = await bcrypt.compare(currentPassword, resident.password);
  if (!isMatch) {
    return res.json({
      success: false,
      message: "Current password does not match.",
    });
  }

  const salt = await bcrypt.genSalt(10);
  resident.password = await bcrypt.hash(newPassword, salt);
  await resident.save();

  res.json({ ok: true, message: "Password changed successfully." });
});

export default residentRouter;
