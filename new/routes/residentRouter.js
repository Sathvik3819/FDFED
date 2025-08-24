import express from "express";
const residentRouter = express.Router();
import bcrypt from "bcrypt";

import Issue from "../models/issues.js";
import Resident from "../models/resident.js";
import CommonSpaces from "../models/commonSpaces.js";
import Payment from "../models/payment.js";
import VisitorPreApproval from "../models/preapproval.js";
import Community from "../models/communities.js";
import auth from "../controllers/auth.js";
import { authorizeR } from "../controllers/authorization.js";
import Ad from "../models/Ad.js";
import communities from "../models/communities.js";
import PaymentController from "../controllers/payments.js";
import { OTP } from "../controllers/OTP.js";
import { getPreApprovals, getCommonSpace } from "../controllers/Resident.js";

import multer from "multer";
import cron from "node-cron";
import checkSubscriptionStatus from '../middleware/subcriptionStatus.js'
residentRouter.use(checkSubscriptionStatus);
function getPaymentRemainders(pending, notifications) {
  const now = new Date();
  const reminders = [];

  for (const payment of pending) {
    const deadline = new Date(payment.paymentDeadline);
    const diffMs = deadline.getTime() - now.getTime();

    const I = payment.ID || payment.title;
    const amount = payment.amount;

    const isFuture = diffMs >= 0;
    const diffDays = isFuture
      ? Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      : Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const hoursLeft = diffMs / (1000 * 60 * 60);


    if (diffDays === 1 || (diffDays === 0 && hoursLeft > 0)) {
      
      reminders.push({
        n: `Your payment for ${I} of amount ₹${amount} is due tomorrow.`,
        createdAt: new Date(),
        belongs: "Payment",
      });
    } else if (diffDays < 0) {
 

      reminders.push({
        n: `Your payment for ${I} of amount ₹${amount} was due ${Math.abs(diffDays)} day(s) ago.`,
        createdAt: new Date(),
        belongs: "Payment",
      });
    }
  }

  const newReminders = reminders.filter((newR) => {
  const newWords = newR.n.split(" ").slice(0, 5).join(" ");
  return !notifications.some((existingR) => {
    const existingWords = existingR.n.split(" ").slice(0, 5).join(" ");
    return existingWords === newWords;
  });
});


  console.log(reminders);
  

  // Push new reminders into notifications
  notifications.push(...newReminders);

  return reminders;
}


async function setPenalties(overdues){
  console.log("setting penalties");
  
  for(const o of overdues){
    const deadline = new Date(o.paymentDeadline);
    const diffMs = deadline.getTime() - new Date().getTime();

    const I = o.ID || o.title;
    const amount = o.amount;
    const penalty = amount*0.1;

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const hoursLeft = diffMs / (1000 * 60 * 60);

    const is = (new Date(o.penalty.changedOn)  - new Date())
    const is24 = Math.floor(is / (1000 * 60 * 60 * 24));
    
    if(!o.penalty || is24 ){
      o.penalty.p = penalty;
      o.penalty.changedOn = new Date();
      o.amount = Math.floor(amount + penalty);
    }

    return;
  }
}


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

function getTimeAgo(date) {
  const now = new Date(Date.now());
  const diffMs = now - new Date(date);
  const diffSeconds = Math.floor(diffMs / 1000);


  if (diffSeconds < 60)
    return `${diffSeconds} second${diffSeconds !== 1 ? "s" : ""} ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

residentRouter.get("/payment/community", async (req, res) => {
   try {
           
        
            const user = await Community.findById(req.user.community)
            
            if (!user) {
                return res.status(404).json({ message: 'community not found' });
            }
            
            return res.status(200).json(user);
        } catch (error) {
            console.error('Error fetching current user:', error);
            return res.status(500).json({ message: 'Error fetching user data', error: error.message });
        }
});
residentRouter.get("/ad", async (req, res) => {
  const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  res.render("resident/Advertisement", { path: "ad", ads });
});
residentRouter.get("/commonSpace", async (req, res) => {
  try {
    const bookings = await CommonSpaces.find({ bookedBy: req.user.id }).sort({
      createdAt: -1,
    });
    console.log("Booking Data:", bookings);

    const resi = await Resident.findById(req.user.id);

    resi.notifications.forEach(async (n) => {
      n.timeAgo = getTimeAgo(resi.notifications[0].createdAt);
    });
    await resi.save();

   const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  
    const community = await Community.findById(req.user.community);
    const availableSpaces = community ? community.commonSpaces : [];
    console.log(bookings);
    console.log(resi);
    console.log(availableSpaces);
    res.render("resident/commonSpace", {
      path: "cbs",
      bookings: bookings,
      ads,
      resi,
      availableSpaces: availableSpaces,
    });
  } catch (error) {
    console.error("Error fetching common space data:", error);
    req.flash("message", "Error loading common space data.");
    res.redirect("/resident/dashboardx");
  }
});
residentRouter.get("/commonSpace", getCommonSpace);

residentRouter.post("/commonSpace/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;

    const commonspace = await CommonSpaces.findById(bookingId);
    if (!commonspace) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Verify that this booking belongs to the current user
    if (commonspace.bookedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    console.log("Commonspace Data:", commonspace);
    res.status(200).json({ commonspace: commonspace });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ error: "Server error" });
  }
});

residentRouter.post("/commonSpace", async (req, res) => {
  try {
    const uid = req.user.id;
    const { facility, purpose, date, from, to } = req.body;
    console.log("Received booking data:", {
      facility,
      purpose,
      date,
      from,
      to,
    });

    // Validation
    if (!facility || !date || !from || !to) {
      req.flash("message", "Facility, date, and time are required fields.");
      return res.redirect("/resident/commonSpace");
    }

    // Validate date is not in the past
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      req.flash("message", "Cannot book for past dates.");
      return res.redirect("/resident/commonSpace");
    }

    // Validate time format and logic
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(from) || !timeRegex.test(to)) {
      req.flash("message", "Invalid time format.");
      return res.redirect("/resident/commonSpace");
    }

    // Check if end time is after start time
    const [fromHour, fromMin] = from.split(":").map(Number);
    const [toHour, toMin] = to.split(":").map(Number);
    const fromMinutes = fromHour * 60 + fromMin;
    const toMinutes = toHour * 60 + toMin;

    // Create the booking
    const space = await CommonSpaces.create({
      name: facility,
      description: purpose || "No purpose specified",
      Date: date,
      from,
      to,
      status: "Pending",
      availability: null,
      bookedBy: uid,
      community: req.user.community,
    });

    // Generate unique ID
    const uniqueId = generateCustomID(req.user.id, "CS", null);
    space.ID = uniqueId;
    await space.save();

    console.log("New Common Space Booking Created:", space);

    // Update user's booked spaces
    const user = await Resident.findById(uid);
    if (user) {
      user.bookedCommonSpaces.push(space._id);
      await user.save();
    }

    req.flash("message", "Booking request submitted successfully!");
    return res.redirect("/resident/commonSpace");
  } catch (error) {
    console.error("Error creating booking:", error);
    req.flash("message", "Something went wrong. Please try again.");
    res.redirect("/resident/commonSpace");
  }
});

residentRouter.get("/commonSpace/cancelled/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;

    // First verify the booking exists and belongs to the user
    const booking = await CommonSpaces.findOne({
      _id: bookingId,
      bookedBy: req.user.id,
      status: "Pending", // Only allow cancellation of pending bookings
    });

    if (!booking) {
      return res
        .status(404)
        .json({ error: "Booking not found or cannot be cancelled" });
    }

    // Update status to cancelled instead of deleting
    await CommonSpaces.findByIdAndUpdate(bookingId, {
      status: "Cancelled",
      cancelledBy: req.user.id,
      cancelledAt: new Date(),
      cancellationReason: "Cancelled by resident",
    });

    // Remove from user's booked spaces
    await Resident.findByIdAndUpdate(req.user.id, {
      $pull: { bookedCommonSpaces: bookingId },
    });

    console.log("Booking cancelled:", bookingId, "by user:", req.user.id);
    return res.json({ result: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ error: "Server error" });
  }
});
residentRouter.get("/api/facilities", async (req, res) => {
  try {
    // Fetch facilities from your database
    // Replace this with your actual database query
    const community = await Community.findById(req.user.community).select(
      "commonSpaces"
    );
    const facilities = community.commonSpaces || [];

    console.log("Raw facilities from database:", facilities); // Debug log

    // Format the data for frontend consumption
    const facilitiesData = facilities.map((facility) => ({
      name: facility.name,
      maxBookingDurationHours: facility.maxBookingDurationHours || 4, // default to 4 hours
      bookingRules: facility.bookingRules || facility.rules || "", // ADD THIS LINE - Include booking rules
      id: facility._id,
      // Add any other properties you need
      description: facility.description,
      capacity: facility.capacity,
      amenities: facility.amenities,
      type: facility.type,
      rent: facility.rent,
      bookable: facility.bookable
    }));

    console.log("Formatted facilities data being sent:", facilitiesData); // Debug log

    res.json({
      success: true,
      facilities: facilitiesData,
    });
  } catch (error) {
    console.error("Error fetching facilities:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch facilities data",
    });
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
  const notifications = [];

 const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  
  const issues = await Issue.find({ resident: req.user.id });
  const commonSpaces = await CommonSpaces.find({ bookedBy: req.user.id });
  const payments = await Payment.find({ sender: req.user.id });
  const preApp = await VisitorPreApproval.find({ approvedBy: req.user.id });
  const resi = await Resident.findById(req.user.id);

  // Add to recents (creation-based timeline)
  recents.push(
    ...issues.map((issue) => ({
      type: "Issue",
      title: issue.issueID,
      date: new Date(issue.createdAt),
    })),
    ...preApp.map((i) => ({
      type: "PreApproval",
      title: i._id,
      date: new Date(i.createdAt),
    })),
    ...commonSpaces.map((space) => ({
      type: "CommonSpace",
      title: space.name,
      date: new Date(space.createdAt),
    })),
    ...payments.map((payment) => ({
      type: "Payment",
      title: payment.title,
      date: new Date(payment.paymentDate),
    }))
  );

  const pendingPayments = await Payment.find({
    sender: req.user.id,
    status: {$in:["Pending","Overdue"]},
  });

  pendingPayments.forEach(async (p)=>{
    if(new Date(p.paymentDeadline) < new Date()){
      p.status = "Overdue"
    }
    await p.save();
  })

  const overdues = pendingPayments.filter((p)=>p.status==="Overdue")
  setPenalties(overdues);
  

  recents.sort((a, b) => b.updatedAt - a.updatedAt);

  const not = getPaymentRemainders(pendingPayments, resi.notifications);
  
  resi.notifications.forEach((n) => {
    n.timeAgo = getTimeAgo(n.createdAt);
  });


  resi.notifications.sort((a, b) => b.createdAt - a.createdAt);
  
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  resi.notifications = resi.notifications.filter((n) => { 
    const notificationDate = new Date(n.createdAt);
    return notificationDate >= twentyFourHoursAgo;
  });
  
  await resi.save();

  res.render("resident/dashboard", {
    path: "d",
    recents,
    ads,
    resi,
    pendingPayments,
    
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
   const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  

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

    let amount = null;

    if(issue.title==="Electricity"){
      amount = process.env.ELECTRICITY
    }else if(issue.title==="Maintenance"){
      amount = process.env.MAINTENANCE
    }else if(issue.title==="Cleaning"){
      amount = process.env.CLEANING
    }else if(issue.title==="Water Supply"){
      amount = process.env.WATERSUPPLY
    }

    const payment = await Payment.create({
      title: issue.issueID,
      sender: req.user.id,
      receiver: issue.workerAssigned.community,
      amount: amount,
      paymentDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      paymentDate: null,
      paymentMethod: "None",
      status: "Pending",
      remarks: null,
      belongTo: "Issue",
      belongToId: issue._id,
      community: issue.community,
    });

    const uniqueId = generateCustomID(payment._id, "PA", null);

    payment.ID = uniqueId;
    await payment.save();

    res.redirect("/resident/issueRaising");
  } catch (error) {
    console.error("Error submitting feedback:", error);
    req.flash("message", "Something went wrong.");
    return res.redirect("/resident/issueRaising");
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
      workerAssigned: null,
      community: resident.community,
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

   const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  

    console.log(ads);

    const payments = await Payment.find({ sender: userId })
      .populate("receiver", "name");

    // sort the payments  so that object with status overdue at first next with status pending and next with status completed , and in there are multiple objects with same status they should be in ascending order of paymentdeadline
    payments.sort((a, b) => {
      const statusOrder = { "Overdue": 1, "Pending": 2, "Completed": 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      
      return new Date(a.paymentDeadline) - new Date(b.paymentDeadline);
    });
    
    

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
    })
      .populate("receiver")
      .populate("sender");

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

    payment.paymentDate = new Date();

    await payment.save();

    const type = payment.belongTo;

    let ob = null;

    if (type === "Issue") {
      ob = await Issue.findById(payment.belongToId);
       ob.status = "Resolved";
    } else if (type === "CommonSpaces") {
      ob = await CommonSpaces.findById(payment.belongToId);
       ob.status = "Booked";
    } 
   
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

residentRouter.get('/preApprovals',auth, authorizeR ,getPreApprovals)

//pre approval routes
residentRouter.post("/preapproval", auth, authorizeR, async (req, res) => {
  try {
    // Add validation for req.body
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const { visitorName, contactNumber, dateOfVisit, timeOfVisit, purpose } =
      req.body;

    // Validate required fields
    if (
      !visitorName ||
      !contactNumber ||
      !dateOfVisit ||
      !timeOfVisit ||
      !purpose
    ) {
      return res.status(400).json({
        message: "Missing required fields",
        required: [
          "visitorName",
          "contactNumber",
          "dateOfVisit",
          "timeOfVisit",
          "purpose",
        ],
      });
    }

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

    const o = OTP();
    await newVisitor.save();

    // Return JSON response
    return res.status(201).json({
      success: true,
      preapproval: {
        _id: newVisitor._id,
        ID: uniqueId,
        visitorName,
        contactNumber,
        dateOfVisit: date,
        timeOfVisit,
        purpose,
        status: "approved",
      },
    });
  } catch (err) {
    console.error("Error in pre-approving visitor:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
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
 const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  

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

residentRouter.get("/clearNotification", async (req, res) => {
  const resi = await Resident.updateOne(
    { _id: req.user.id },
    { $set: { notifications: [] } }
  );

  console.log(resi.notifications);

  res.json({ ok: true });
});

export default residentRouter;
