import Security from "../models/security.js";
import VisitorPreApproval from "../models/preapproval.js";
import visitor from "../models/visitors.js";
import Ad from "../models/Ad.js";
import Community from "../models/communities.js";
import { getPreApprovals } from "./Resident.js";

const getDashboardInfo = async (req, res) => {
      const visitors = await visitor.find({
    community: req.user.community,
    addedBy: req.user.id,
    $or: [{ status: "active" }, { status: "checkedOut" }],
  });

    const sec = await Security.findById(req.user.id);

    const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

    const PendingRequests = await VisitorPreApproval.countDocuments({
      community : req.user.community,
      status : "Pending"
    });

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const yyyy = today.getFullYear();

    const formattedToday = `${dd}/${mm}/${yyyy}`;

    const VisitorToday = await VisitorPreApproval.countDocuments({
      community : req.user.community,
      status : "Approved",
      isCheckedIn : true,
      dateOfVisit: formattedToday
    })
    
    let stats = {Pending : PendingRequests, Visitor : VisitorToday};
  

  res.render("security/dashboard", { path: "d", visitors, ads,sec, stats });
}

export {getDashboardInfo};