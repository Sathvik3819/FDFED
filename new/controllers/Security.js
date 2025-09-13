import Security from "../models/security.js";
import visitor from "../models/visitors.js";
import Ad from "../models/Ad.js";
import Community from "../models/communities.js";
import { getPreApprovals } from "./Resident.js";
import Visitor from "../models/visitors.js";

const getDashboardInfo = async (req, res) => {
    const visitors = await visitor.find({
    community: req.user.community,
    addedBy: req.user.id,
    $or: [{ status: "active" }, { status: "checkedOut" }],
  });

    const sec = await Security.findById(req.user.id);

    const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

    const PendingRequests = await Visitor.countDocuments({
      community : req.user.community,
      status : "Pending"
    });

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const yyyy = today.getFullYear();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const formattedToday = `${dd}/${mm}/${yyyy}`;

    const VisitorToday = await Visitor.countDocuments({
      community : req.user.community,
      status : "Approved",
      scheduledAt: { $gte: startOfDay, $lte: endOfDay }
      // add today condition
    })

    const ActiveVisitors = await Visitor.countDocuments({
      community : req.user.community,
      status : "Approved",
      isCheckedIn : true,
      // add today conditon
    })
    
    let stats = {Pending : PendingRequests, Visitor : VisitorToday, Active : ActiveVisitors};
  

  res.render("security/dashboard", { path: "d", visitors, ads,sec, stats });
}

export {getDashboardInfo};