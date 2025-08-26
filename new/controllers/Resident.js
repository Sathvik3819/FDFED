
// controllers/residentController.js
import Resident from "../models/resident.js";
import VisitorPreApproval from "../models/preapproval.js";
import Ad from "../models/Ad.js";
import CommonSpaces from "../models/commonSpaces.js";
import Community from "../models/communities.js";
import Issue from "../models/issues.js";

// Utils function
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


const getPreApprovals = async (req, res) => {
  try {
    const resident = await Resident.findById(req.user.id).populate(
      "preApprovedVisitors"
    );
    const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

    
    const stats = await VisitorPreApproval.aggregate([
      { $match: { approvedBy: resident._id } },   // filter by logged-in resident
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const counts = { pending: 0, approved: 0, rejected: 0 };
    stats.forEach((s) => {
      counts[s._id] = s.count;
    });

    console.log(resident.preApprovedVisitors);
    console.log(counts.pending);

    res.render("resident/preApproval", {
      path: "pa",
      visitors: resident.preApprovedVisitors || [],
      ads,
      counts,
    });
  } catch (err) {
    console.error("Error loading visitor history:", err);
    res.render("users/resident/preapproval", { visitors: [] });
  }
};

const getCommonSpace = async (req, res) => {

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

    // Count total bookings by user in their community
    const pendingBookings = await CommonSpaces.countDocuments({
    bookedBy: req.user.id,
    community: req.user.community,
    status: "pending"
    });

    // Count only approved bookings
    const approvedBookings = await CommonSpaces.countDocuments({
    bookedBy: req.user.id,
    community: req.user.community,
    status: "approved"
    });

    const ammenities = await CommonSpaces.countDocuments({
      community : req.user.community,
    })
    console.log(ammenities);

    res.render("resident/commonSpace", {
      path: "cbs",
      bookings: bookings,
      ads,
      resi,
      availableSpaces: availableSpaces,
      approvedBookings,
      pendingBookings,
      ammenities,               
    });
  } catch (error) {
    console.error("Error fetching common space data:", error);
    req.flash("message", "Error loading common space data.");
    res.redirect("/resident/dashboard");
  }

};

const getPaymentData = async (req,res) =>{
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
}


const getIssueData = async(req, res) =>{
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

    const issueCounts = {
      pending: 0,
      inProgress: 0,
      resolved: 0,
    };

    issues.forEach((issue) => {
      const status = issue.status.toLowerCase();
      if (status === "pending") issueCounts.pending += 1;
      else if (status === "in progress") issueCounts.inProgress += 1;
      else if (status === "resolved") issueCounts.resolved += 1;
    });
    
    console.log(issueCounts.pending);
    
    res.render("resident/issueRaising", { path: "ir", i: issues, ads, issueCounts });
  } catch (error) {
    console.error("Error fetching issues:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}
export {getPreApprovals,getCommonSpace, getIssueData};