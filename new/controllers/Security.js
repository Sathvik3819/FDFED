import Security from "../models/security.js";
import visitor from "../models/visitors.js";
import Ad from "../models/Ad.js";
import Community from "../models/communities.js";
import { getPreApprovals } from "./Resident.js";
import Visitor from "../models/visitors.js";
import mongoose from "mongoose";

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

const UpdatePreApprovalData = async (req, res) =>{
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
    const vis = await Visitor.findById(ID).populate('approvedBy');
    if (!vis) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    vis.status = status; 
    vis.isCheckedIn = status === "Approved";
    vis.vehicleNumber = vehicleNumber; 

    vis.approvedBy.notifications.push({
      n:`Pre approved Visitor ${vis.ID} is ${vis.status}`,
      createdAt:new Date(Date.now()),
      belongs:"PA"
    });

    await vis.approvedBy.save();
    await vis.save();

    console.log("status of visitor : ",vis.status);
    

    // if(vis.status === "Approved"){
    //   const v = await Visitor.create({
    //   name: vis.name,
    //   contactNumber: vis.contactNumber,
    //   email: vis.email,
    //   purpose: vis.purpose,
    //   checkInAt : new Date(Date.now()),
    //   vehicleNumber:vehicleNumber,
    //   verifiedByResident:true,
    //   community : req.user.community,
    //   addedBy:req.user.id,
    //   status:"Active",
    // });
    // console.log("new visitor by preapproval : "+ v);
    
    // }

    res.status(200).json({
      success: true,
      message: `Visitor ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("Error updating visitor status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
export {getDashboardInfo, UpdatePreApprovalData};