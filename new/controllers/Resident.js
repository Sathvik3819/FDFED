// controllers/residentController.js
import Resident from "../models/resident.js";
import VisitorPreApproval from "../models/preapproval.js";
import Ad from "../models/Ad.js";
import CommonSpaces from "../models/commonSpaces.js";
import Community from "../models/communities.js";

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

    res.render("resident/commonSpace", {
      path: "cbs",
      bookings: bookings,
      ads,
      resi,
      availableSpaces: availableSpaces,
      approvedBookings,
      pendingBookings,  
    });
  } catch (error) {
    console.error("Error fetching common space data:", error);
    req.flash("message", "Error loading common space data.");
    res.redirect("/resident/dashboard");
  }

};

export {getPreApprovals,getCommonSpace};