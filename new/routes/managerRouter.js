import express from "express";
const managerRouter = express.Router();

import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import session from "express-session";
import bcrypt from "bcrypt";
import multer from "multer";

import Issue from "../models/issues.js";
import Worker from "../models/workers.js";
import Resident from "../models/resident.js";
import Security from "../models/security.js";
import Community from "../models/communities.js";
import CommonSpaces from "../models/commonSpaces.js";
import PaymentController from "../controllers/payments.js";
import CommunityManager from "../models/cManager.js";
import Ad from "../models/Ad.js";
import Payment from "../models/payment.js";
import visitor from "../models/visitors.js";

<<<<<<< Updated upstream
import { sendPassword } from '../controllers/OTP.js'
=======
import { sendPassword } from "../controllers/OTP.js";
>>>>>>> Stashed changes

function generateCustomID(userEmail, facility, countOrRandom = null) {
  const id = userEmail.toUpperCase().slice(0, 2);

  const facilityCode = facility.toUpperCase().slice(0, 2);

  const suffix = countOrRandom
    ? String(countOrRandom).padStart(4, "0")
    : String(Math.floor(1000 + Math.random() * 9000));

  return `UE-${id}${facilityCode}${suffix}`;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + ".png";
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

managerRouter.get("/commonSpace", async (req, res) => {
  const c = req.user.community;
  const csb = await CommonSpaces.find({ community: c });
  const ads = await Ad.find({ community: req.user.community });
  const community = await Community.findById(req.user.community)
      .select('commonSpaces')
      .lean();

  res.render("communityManager/CSB", { path: "cbs", csb,community:community });
});

function mergeBusySlots(slots) {
  // Convert time strings to minutes
  const toMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const toTimeStr = (minutes) => {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    return `${h}:${m}`;
  };

  // Step 1: Sort slots by start time
  const sorted = slots
    .map((s) => ({ from: toMinutes(s.from), to: toMinutes(s.to) }))
    .sort((a, b) => a.from - b.from);

  const merged = [];

  for (const slot of sorted) {
    if (!merged.length || merged[merged.length - 1].to < slot.from) {
      merged.push(slot);
    } else {
      merged[merged.length - 1].to = Math.max(
        merged[merged.length - 1].to,
        slot.to
      );
    }
  }

  // Convert back to time strings
  return merged.map((s) => ({
    from: toTimeStr(s.from),
    to: toTimeStr(s.to),
  }));
}
managerRouter.get("/commonSpace/checkAvailability/:id", async (req, res) => {
  const id = req.params.id;
  const current = await CommonSpaces.findById(id).populate("bookedBy");
  const date = current.Date;
  const from = current.from;
  const to = current.to;
  try {
    const result = await CommonSpaces.find({
      Date: date,
      $or: [
        { from: { $lt: to }, to: { $gt: from } },
        { from: { $lte: from }, to: { $gt: from } },
        { from: { $lt: to }, to: { $gte: to } },
      ],
      _id: { $ne: id },
      name: current.name,
      status: "Booked",
    });

    console.log("Conflicting Bookings:", result);

    const busySlots = result.map((conflict) => ({
      from: conflict.from,
      to: conflict.to,
    }));

    const busy = mergeBusySlots(busySlots);
    const busyTimes = busy
      .map((slot) => `${slot.from} - ${slot.to}`)
      .join(", ");

    console.log("Busy Slots:", busy);

    if (result.length > 0) {
      current.availability = "NO";
      current.feedback = `Booking was rejected due to conflicting booking . ${current.name} is reserved between ${busyTimes} .`;
      current.status = "Rejected";
      current.availability = "YES";
      await current.save();
      return res.status(200).json({ message: "not Available" });
    } else {
      current.availability = "YES";
      current.status = "avalaible";
      await current.save();
      return res
        .status(200)
        .json({ message: "Available and booked succesfully" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

managerRouter.get("/commonSpace/approve/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const b = await CommonSpaces.findById(id).populate('bookedBy');

    if (!b) {
      return res.status(404).json({ message: "Booking not found" });
    }

    b.status = "avalaible";
    b.availability = "NO";
    b.paymentStatus = "Pending";
    b.status = "Booked";

    console.log("Booking Data after update:", b);

    const uniqueId = generateCustomID(b._id.toString(), "PY", null);

    const payment = await Payment.create({
      title: b._id,
      sender: b.bookedBy._id,
      receiver: req.user.community,
      amount: 1000,
      paymentDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      paymentDate: null,
      paymentMethod: "None",
      status: "Pending",
      remarks: null,
      ID: uniqueId,
      belongTo: "CommonSpaces",
      community: req.user.community,
    });

    b.payment = payment._id;

    b.bookedBy.notifications.push({
      n:`Common Space ${b.ID} is approved`,
      createdAt:new Date(Date.now()),
      belongs:"CS"
    });

    await b.bookedBy.save();
    await b.save();

    req.flash("alert-msg", `${b._id} approved successfully`);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

managerRouter.post("/commonSpace/reject/:id", async (req, res) => {
  const id = req.params.id;
  const { reason } = req.body;
  try {
    const b = await CommonSpaces.findById(id);

    if (!b) {
      return res.status(404).json({ message: "Booking not found" });
    }

    b.availability = "NO";
    b.paymentStatus = null;
    b.status = "Rejected";
    b.feedback = reason;

    b.bookedBy.notifications.push({
      n:`Common Space ${b.ID} is rejected`,
      createdAt:new Date(Date.now()),
      belongs:"CS"
    });

    await b.bookedBy.save();

    await b.save();

    res.status(200).json({ message: "rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

<<<<<<< Updated upstream
// Add new space
managerRouter.post('/api/community/spaces', async (req, res) => {
  try {
    // Validate required fields
    const { type, name } = req.body;
    if (!type || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Space type and name are required' 
      });
    }

    // Check if user has community access
    if (!req.user || !req.user.community) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
    }

    const community = await Community.findById(req.user.community);
    if (!community) {
      return res.status(404).json({ 
        success: false, 
        message: 'Community not found' 
      });
    }

    // Check for duplicate space names
    const existingSpace = community.commonSpaces.find(
      space => space.name.toLowerCase() === name.toLowerCase()
    );
    if (existingSpace) {
      return res.status(400).json({ 
        success: false, 
        message: 'A space with this name already exists' 
      });
    }

    // Validate and sanitize input data
    const newSpace = {
      type: type.trim(),
      name: name.trim(),
      bookable: req.body.bookable !== undefined ? Boolean(req.body.bookable) : true,
      maxBookingDurationHours: req.body.maxBookingDurationHours ? 
        Math.max(1, parseInt(req.body.maxBookingDurationHours)) : null,
      bookingRules: req.body.bookingRules ? req.body.bookingRules.trim() : '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    community.commonSpaces.push(newSpace);
    await community.save();

    res.status(201).json({ 
      success: true, 
      message: 'Space created successfully',
      space: newSpace 
    });
  } catch (error) {
    console.error('Error creating space:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update space
managerRouter.put('/api/community/spaces/:id', async (req, res) => {
  try {
    // Validate space ID
    const spaceId = req.params.id;
    if (!spaceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Space ID is required' 
      });
    }

    // Check if user has community access
    if (!req.user || !req.user.community) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
    }

    const community = await Community.findById(req.user.community);
    if (!community) {
      return res.status(404).json({ 
        success: false, 
        message: 'Community not found' 
      });
    }

    const spaceIndex = community.commonSpaces.findIndex(
      s => s._id.toString() === spaceId
    );

    if (spaceIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Space not found' 
      });
    }

    // Validate required fields if provided
    const { type, name } = req.body;
    if ((type !== undefined && !type.trim()) || (name !== undefined && !name.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Space type and name cannot be empty' 
      });
    }

    // Check for duplicate names (excluding current space)
    if (name && name.trim()) {
      const duplicateSpace = community.commonSpaces.find(
        (space, index) => 
          index !== spaceIndex && 
          space.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (duplicateSpace) {
        return res.status(400).json({ 
          success: false, 
          message: 'A space with this name already exists' 
        });
      }
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date()
    };

    if (type !== undefined) updateData.type = type.trim();
    if (name !== undefined) updateData.name = name.trim();
    if (req.body.bookable !== undefined) updateData.bookable = Boolean(req.body.bookable);
    if (req.body.maxBookingDurationHours !== undefined) {
      updateData.maxBookingDurationHours = req.body.maxBookingDurationHours ? 
        Math.max(1, parseInt(req.body.maxBookingDurationHours)) : null;
    }
    if (req.body.bookingRules !== undefined) {
      updateData.bookingRules = req.body.bookingRules ? req.body.bookingRules.trim() : '';
    }

    // Update the space
    Object.assign(community.commonSpaces[spaceIndex], updateData);

    await community.save();

    res.json({ 
      success: true, 
      message: 'Space updated successfully',
      space: community.commonSpaces[spaceIndex] 
    });
  } catch (error) {
    console.error('Error updating space:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete space
managerRouter.delete('/api/community/spaces/:id', async (req, res) => {
  try {
    // Validate space ID
    const spaceId = req.params.id;
    if (!spaceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Space ID is required' 
      });
    }

    // Check if user has community access
    if (!req.user || !req.user.community) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
    }

    const community = await Community.findById(req.user.community);
    if (!community) {
      return res.status(404).json({ 
        success: false, 
        message: 'Community not found' 
      });
    }

    const originalCount = community.commonSpaces.length;
    
    // Find the space to be deleted for additional checks
    const spaceToDelete = community.commonSpaces.find(
      space => space._id.toString() === spaceId
    );

    if (!spaceToDelete) {
      return res.status(404).json({ 
        success: false, 
        message: 'Common space not found' 
      });
    }

    // Optional: Check if space has active bookings before deletion
    // You might want to add this check based on your business logic
    // const hasActiveBookings = await checkActiveBookings(spaceId);
    // if (hasActiveBookings) {
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: 'Cannot delete space with active bookings' 
    //   });
    // }

    // Filter out the space with the given ID
    community.commonSpaces = community.commonSpaces.filter(
      space => space._id.toString() !== spaceId
    );

    // Double-check that something was actually removed
    if (community.commonSpaces.length === originalCount) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete space' 
      });
    }

    await community.save();

    res.json({ 
      success: true, 
      message: 'Common space deleted successfully',
      deletedSpace: {
        id: spaceId,
        name: spaceToDelete.name,
        type: spaceToDelete.type
      }
    });
  } catch (error) {
    console.error('Error deleting common space:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update booking rules
managerRouter.post('/api/community/booking-rules', async (req, res) => {
  try {
    // Validate input
    if (req.body.rules === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking rules are required' 
      });
    }

    // Check if user has community access
    if (!req.user || !req.user.community) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
    }

    const community = await Community.findById(req.user.community);
    if (!community) {
      return res.status(404).json({ 
        success: false, 
        message: 'Community not found' 
      });
    }

    // Sanitize and update booking rules
    const sanitizedRules = req.body.rules ? req.body.rules.trim() : '';
    community.bookingRules = sanitizedRules;
    community.updatedAt = new Date();

    await community.save();

    res.json({ 
      success: true, 
      message: 'Booking rules updated successfully',
      rules: sanitizedRules
    });
  } catch (error) {
    console.error('Error updating booking rules:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Optional: Get all spaces (for consistency)
managerRouter.get('/api/community/spaces', async (req, res) => {
  try {
    // Check if user has community access
    if (!req.user || !req.user.community) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
    }

    const community = await Community.findById(req.user.community);
    if (!community) {
      return res.status(404).json({ 
        success: false, 
        message: 'Community not found' 
      });
    }

    res.json({ 
      success: true, 
      spaces: community.commonSpaces,
      totalSpaces: community.commonSpaces.length
    });
  } catch (error) {
    console.error('Error fetching spaces:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Optional: Get single space
managerRouter.get('/api/community/spaces/:id', async (req, res) => {
  try {
    const spaceId = req.params.id;
    if (!spaceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Space ID is required' 
      });
    }

    // Check if user has community access
    if (!req.user || !req.user.community) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
    }

    const community = await Community.findById(req.user.community);
    if (!community) {
      return res.status(404).json({ 
        success: false, 
        message: 'Community not found' 
      });
    }

    const space = community.commonSpaces.find(
      s => s._id.toString() === spaceId
    );

    if (!space) {
      return res.status(404).json({ 
        success: false, 
        message: 'Space not found' 
      });
    }

    res.json({ 
      success: true, 
      space: space
    });
  } catch (error) {
    console.error('Error fetching space:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
=======
>>>>>>> Stashed changes
// Middleware to check subscription status
async function checkSubscription(req, res, next) {
  try {
    // Skip check for payment-related routes
<<<<<<< Updated upstream
    if (req.path.startsWith('/payments') ||
      req.path.startsWith('/subscription') ||
      req.path === '/all-communities' ||
      req.path === '/residents' ||
      req.path === '/communities' ||
      req.path === '/currentcManager' ||
      req.path === '/community-details' ||
      req.path === '/subscription-status' ||
      req.path === '/subscription-payment' ||
      req.path === '/all-payments' ||
      req.path === '/new-community' ||
      req.path === '/create-with-payment') {
=======
    if (
      req.path.startsWith("/payments") ||
      req.path.startsWith("/subscription") ||
      req.path === "/all-communities" ||
      req.path === "/residents" ||
      req.path === "/communities" ||
      req.path === "/currentcManager" ||
      req.path === "/community-details" ||
      req.path === "/subscription-status" ||
      req.path === "/subscription-payment" ||
      req.path === "/all-payments" ||
      req.path === "/new-community" ||
      req.path === "/create-with-payment"
    ) {
>>>>>>> Stashed changes
      return next();
    }

    // Get manager and community info
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
<<<<<<< Updated upstream
      return res.status(404).render('error', { message: 'Community manager not found' });
    }

    const community = await Community.findById(manager.assignedCommunity)
      .select('subscriptionStatus planEndDate');

    if (!community) {
      return res.status(404).render('error', { message: 'Community not found' });
=======
      return res
        .status(404)
        .render("error", { message: "Community manager not found" });
    }

    const community = await Community.findById(
      manager.assignedCommunity
    ).select("subscriptionStatus planEndDate");

    if (!community) {
      return res
        .status(404)
        .render("error", { message: "Community not found" });
>>>>>>> Stashed changes
    }

    // Check if subscription is active
    const now = new Date();
<<<<<<< Updated upstream
    const isExpired = community.planEndDate && new Date(community.planEndDate) < now;

    if (isExpired || community.subscriptionStatus !== 'active') {
=======
    const isExpired =
      community.planEndDate && new Date(community.planEndDate) < now;

    if (isExpired || community.subscriptionStatus !== "active") {
>>>>>>> Stashed changes
      // Store the original URL in session for redirecting back after payment
      req.session.returnTo = req.originalUrl;

      // Add a flash message
<<<<<<< Updated upstream
      req.flash('warning', 'Your subscription has expired or is inactive. Please complete the payment to continue.');

      // Redirect to payment page
      return res.redirect('/manager/payments');
=======
      req.flash(
        "warning",
        "Your subscription has expired or is inactive. Please complete the payment to continue."
      );

      // Redirect to payment page
      return res.redirect("/manager/payments");
>>>>>>> Stashed changes
    }

    next();
  } catch (error) {
<<<<<<< Updated upstream
    console.error('Subscription check error:', error);
    res.status(500).render('error', { message: 'Error checking subscription status' });
=======
    console.error("Subscription check error:", error);
    res
      .status(500)
      .render("error", { message: "Error checking subscription status" });
>>>>>>> Stashed changes
  }
}

// Apply checkSubscription middleware to all routes except excluded ones
managerRouter.use(checkSubscription);

async function getSubscriptionStatus(req) {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager || !manager.assignedCommunity) {
      return null;
    }

<<<<<<< Updated upstream
    const community = await Community.findById(manager.assignedCommunity)
      .select('subscriptionStatus planEndDate subscriptionPlan');
=======
    const community = await Community.findById(
      manager.assignedCommunity
    ).select("subscriptionStatus planEndDate subscriptionPlan");
>>>>>>> Stashed changes

    if (!community) {
      return null;
    }

    const now = new Date();
<<<<<<< Updated upstream
    const isExpired = community.planEndDate && new Date(community.planEndDate) < now;
    const daysUntilExpiry = community.planEndDate
      ? Math.ceil((new Date(community.planEndDate) - now) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      status: isExpired ? 'expired' : community.subscriptionStatus,
      plan: community.subscriptionPlan,
      isExpired,
      daysUntilExpiry,
      isExpiringSoon: daysUntilExpiry <= 7 && daysUntilExpiry > 0
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
=======
    const isExpired =
      community.planEndDate && new Date(community.planEndDate) < now;
    const daysUntilExpiry = community.planEndDate
      ? Math.ceil(
          (new Date(community.planEndDate) - now) / (1000 * 60 * 60 * 24)
        )
      : 0;

    return {
      status: isExpired ? "expired" : community.subscriptionStatus,
      plan: community.subscriptionPlan,
      isExpired,
      daysUntilExpiry,
      isExpiringSoon: daysUntilExpiry <= 7 && daysUntilExpiry > 0,
    };
  } catch (error) {
    console.error("Error getting subscription status:", error);
>>>>>>> Stashed changes
    return null;
  }
}
// Get community details with subscription info
<<<<<<< Updated upstream
managerRouter.get('/community-details', async (req, res) => {
=======
managerRouter.get("/community-details", async (req, res) => {
>>>>>>> Stashed changes
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
<<<<<<< Updated upstream
      return res.status(404).json({ message: 'Community manager not found' });
    }

    const community = await Community.findById(manager.assignedCommunity)
      .select('name subscriptionPlan subscriptionStatus planStartDate planEndDate subscriptionHistory');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    console.log(community)
    res.json(community);
  } catch (error) {
    console.error('Error fetching community details:', error);
    res.status(500).json({ message: 'Failed to fetch community details' });
=======
      return res.status(404).json({ message: "Community manager not found" });
    }

    const community = await Community.findById(
      manager.assignedCommunity
    ).select(
      "name subscriptionPlan subscriptionStatus planStartDate planEndDate subscriptionHistory"
    );

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }
    console.log(community);
    res.json(community);
  } catch (error) {
    console.error("Error fetching community details:", error);
    res.status(500).json({ message: "Failed to fetch community details" });
>>>>>>> Stashed changes
  }
});

// Handle subscription payment
<<<<<<< Updated upstream
managerRouter.post('/subscription-payment', async (req, res) => {
=======
managerRouter.post("/subscription-payment", async (req, res) => {
>>>>>>> Stashed changes
  try {
    const {
      communityId,
      subscriptionPlan,
      amount,
      paymentMethod,
      planDuration,
      transactionId,
      paymentDate,
<<<<<<< Updated upstream
      isRenewal
=======
      isRenewal,
>>>>>>> Stashed changes
    } = req.body;

    // Validate required fields
    if (!subscriptionPlan || !amount || !paymentMethod) {
<<<<<<< Updated upstream
      return res.status(400).json({ message: 'Missing required payment information' });
=======
      return res
        .status(400)
        .json({ message: "Missing required payment information" });
>>>>>>> Stashed changes
    }

    // Get the community
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
<<<<<<< Updated upstream
      return res.status(404).json({ message: 'Community manager not found' });
=======
      return res.status(404).json({ message: "Community manager not found" });
>>>>>>> Stashed changes
    }

    const community = await Community.findById(communityId);
    if (!community) {
<<<<<<< Updated upstream
      return res.status(404).json({ message: 'Community not found' });
=======
      return res.status(404).json({ message: "Community not found" });
>>>>>>> Stashed changes
    }

    // Calculate plan end date
    const startDate = new Date(paymentDate);
    const endDate = new Date(startDate);

<<<<<<< Updated upstream
    if (planDuration === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planDuration === 'yearly') {
=======
    if (planDuration === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planDuration === "yearly") {
>>>>>>> Stashed changes
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create subscription payment record
    const subscriptionPayment = {
<<<<<<< Updated upstream
      transactionId: transactionId || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
=======
      transactionId:
        transactionId ||
        `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
>>>>>>> Stashed changes
      planName: getSubscriptionPlanName(subscriptionPlan),
      planType: subscriptionPlan,
      amount: amount,
      paymentMethod: paymentMethod,

      paymentDate: new Date(paymentDate),
      planStartDate: startDate,
      planEndDate: endDate,
      duration: planDuration,
<<<<<<< Updated upstream
      status: 'completed',
      isRenewal: isRenewal || false,
      processedBy: managerId,
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip || req.connection.remoteAddress
      }
=======
      status: "completed",
      isRenewal: isRenewal || false,
      processedBy: managerId,
      metadata: {
        userAgent: req.get("User-Agent"),
        ipAddress: req.ip || req.connection.remoteAddress,
      },
>>>>>>> Stashed changes
    };

    // Update community subscription details
    community.subscriptionPlan = subscriptionPlan;
<<<<<<< Updated upstream
    community.subscriptionStatus = 'active';
=======
    community.subscriptionStatus = "active";
>>>>>>> Stashed changes
    community.planStartDate = startDate;
    community.planEndDate = endDate;

    // Add to subscription history
    if (!community.subscriptionHistory) {
      community.subscriptionHistory = [];
    }
    community.subscriptionHistory.push(subscriptionPayment);

    // Save the community
    await community.save();

    // Prepare response
    const response = {
      success: true,
<<<<<<< Updated upstream
      message: 'Subscription payment processed successfully',
=======
      message: "Subscription payment processed successfully",
>>>>>>> Stashed changes
      transactionId: subscriptionPayment.transactionId,
      planName: subscriptionPayment.planName,
      amount: subscriptionPayment.amount,
      planEndDate: subscriptionPayment.planEndDate,
<<<<<<< Updated upstream
      subscriptionStatus: community.subscriptionStatus
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Subscription payment error:', error);
    res.status(500).json({
      message: 'Payment processing failed',
      error: error.message
=======
      subscriptionStatus: community.subscriptionStatus,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Subscription payment error:", error);
    res.status(500).json({
      message: "Payment processing failed",
      error: error.message,
>>>>>>> Stashed changes
    });
  }
});

// Get subscription history
<<<<<<< Updated upstream
managerRouter.get('/subscription-history', async (req, res) => {
=======
managerRouter.get("/subscription-history", async (req, res) => {
>>>>>>> Stashed changes
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
<<<<<<< Updated upstream
      return res.status(404).json({ message: 'Community manager not found' });
    }

    const community = await Community.findById(manager.assignedCommunity)
      .select('subscriptionHistory');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
=======
      return res.status(404).json({ message: "Community manager not found" });
    }

    const community = await Community.findById(
      manager.assignedCommunity
    ).select("subscriptionHistory");

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
>>>>>>> Stashed changes
    }

    // Sort history by payment date (newest first)
    const sortedHistory = community.subscriptionHistory
<<<<<<< Updated upstream
      ? community.subscriptionHistory.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
=======
      ? community.subscriptionHistory.sort(
          (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
        )
>>>>>>> Stashed changes
      : [];

    res.json({
      success: true,
      history: sortedHistory,
<<<<<<< Updated upstream
      totalPayments: sortedHistory.length
    });

  } catch (error) {
    console.error('Error fetching subscription history:', error);
    res.status(500).json({ message: 'Failed to fetch subscription history' });
=======
      totalPayments: sortedHistory.length,
    });
  } catch (error) {
    console.error("Error fetching subscription history:", error);
    res.status(500).json({ message: "Failed to fetch subscription history" });
>>>>>>> Stashed changes
  }
});

// Get current subscription status
<<<<<<< Updated upstream
managerRouter.get('/subscription-status', async (req, res) => {
=======
managerRouter.get("/subscription-status", async (req, res) => {
>>>>>>> Stashed changes
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
<<<<<<< Updated upstream
      return res.status(404).json({ message: 'Community manager not found' });
    }

    const community = await Community.findById(manager.assignedCommunity)
      .select('name subscriptionPlan subscriptionStatus planStartDate planEndDate');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
=======
      return res.status(404).json({ message: "Community manager not found" });
    }

    const community = await Community.findById(
      manager.assignedCommunity
    ).select(
      "name subscriptionPlan subscriptionStatus planStartDate planEndDate"
    );

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
>>>>>>> Stashed changes
    }

    // Check if subscription is expired
    const now = new Date();
<<<<<<< Updated upstream
    const isExpired = community.planEndDate && new Date(community.planEndDate) < now;

    if (isExpired && community.subscriptionStatus === 'active') {
      community.subscriptionStatus = 'expired';
=======
    const isExpired =
      community.planEndDate && new Date(community.planEndDate) < now;

    if (isExpired && community.subscriptionStatus === "active") {
      community.subscriptionStatus = "expired";
>>>>>>> Stashed changes
      await community.save();
    }

    // Calculate days until expiry
    let daysUntilExpiry = null;
    if (community.planEndDate) {
<<<<<<< Updated upstream
      daysUntilExpiry = Math.ceil((new Date(community.planEndDate) - now) / (1000 * 60 * 60 * 24));
=======
      daysUntilExpiry = Math.ceil(
        (new Date(community.planEndDate) - now) / (1000 * 60 * 60 * 24)
      );
>>>>>>> Stashed changes
    }

    res.json({
      success: true,
      community: {
        name: community.name,
        subscriptionPlan: community.subscriptionPlan,
        subscriptionStatus: community.subscriptionStatus,
        planStartDate: community.planStartDate,
        planEndDate: community.planEndDate,
        daysUntilExpiry: daysUntilExpiry,
        isExpired: isExpired,
<<<<<<< Updated upstream
        isExpiringSoon: daysUntilExpiry && daysUntilExpiry <= 7 && daysUntilExpiry > 0
      }
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Failed to fetch subscription status' });
=======
        isExpiringSoon:
          daysUntilExpiry && daysUntilExpiry <= 7 && daysUntilExpiry > 0,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ message: "Failed to fetch subscription status" });
>>>>>>> Stashed changes
  }
});
import fs from "fs";

const storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join("uploads", "something");

    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) return cb(err);
      cb(null, dir); // ✅ tell multer where to store the file
    });
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload2 = multer({
  storage: storage2,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Maximum 10 files
  },
});

// Render new community page
<<<<<<< Updated upstream
managerRouter.get('/new-community', (req, res) => {
  res.render('communityManager/new-community');
});

// Create new community with photo upload
managerRouter.post('/communities', upload2.array('photos', 10), async (req, res) => {
  try {
    const {
      name,
      location,
      email,
      description,
      totalMembers,
      subscriptionPlan,
      paymentMethod,
      commonSpaces
    } = req.body;

    // Validate required fields
    if (!name || !location || !email || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }

    // Check if community with same name or email already exists
    const existingCommunity = await Community.findOne({
      $or: [{ name }, { email }]
    });

    if (existingCommunity) {
      return res.status(400).json({
        success: false,
        message: 'A community with this name or email already exists.'
      });
    }

    // Process uploaded photos
    const photos = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        photos.push({
          filename: file.filename,
          originalName: file.originalname,
          path: `/uploads/communities/${file.filename}`,
          size: file.size,
          mimeType: file.mimetype,
          uploadedAt: new Date()
        });
      });
    }

    // Parse common spaces if provided
    let parsedCommonSpaces = [];
    if (commonSpaces) {
      try {
        parsedCommonSpaces = JSON.parse(commonSpaces);
      } catch (error) {
        console.error('Error parsing common spaces:', error);
      }
    }

    // Calculate subscription dates
    const planStartDate = new Date();
    const planEndDate = new Date();
    planEndDate.setMonth(planEndDate.getMonth() + 1); // Add 1 month

    // Get plan pricing
    const planPrices = {
      basic: 999,
      standard: 1999,
      premium: 3999
    };

    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create community
    const newCommunity = new Community({
      name: name.trim(),
      location: location.trim(),
      email: email.trim(),
      description: description?.trim() || '',
      totalMembers: parseInt(totalMembers) || 0,
      subscriptionPlan,
      subscriptionStatus: 'active', // Set as active after successful payment
      planStartDate,
      planEndDate,
      profile: {
        photos: photos
      },
      commonSpaces: parsedCommonSpaces.map(space => ({
        ...space,
        createdBy: req.session?.managerId || null
      })),
      communityManager: req.session?.managerId || null,

      // Add subscription history entry
      subscriptionHistory: [{
        transactionId,
        planName: `${subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)} Plan`,
        planType: subscriptionPlan,
        amount: planPrices[subscriptionPlan],
        paymentMethod,
        paymentDate: new Date(),
        planStartDate,
        planEndDate,
        duration: 'monthly',
        status: 'completed',
        isRenewal: false,
        processedBy: req.session?.managerId || null,
        metadata: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        }
      }],

      // Legacy payment history for backward compatibility
      paymentHistory: [{
        date: new Date(),
        amount: planPrices[subscriptionPlan],
        method: paymentMethod,
        transactionId,
        invoiceUrl: null
      }]
    });
    const x = await CommunityManager.findById(req.user.id)
    x.assignedCommunity = newCommunity._id

    await x.save()
    await newCommunity.save();

    res.status(201).json({
      success: true,
      message: 'Community created successfully!',
      data: {
        communityId: newCommunity._id,
        name: newCommunity.name,
        subscriptionPlan: newCommunity.subscriptionPlan,
        transactionId
      }
    });

  } catch (error) {
    console.error('Error creating community:', error);

    // Clean up uploaded files if community creation fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(async (file) => {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      });
    }

    // Handle specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + Object.values(error.errors)[0].message
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A community with this name or email already exists.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the community. Please try again.'
    });
  }
});

// Get community details
managerRouter.get('/communities/:id', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('communityManager', 'name email')
=======
managerRouter.get("/new-community", (req, res) => {
  res.render("communityManager/new-community");
});

// Create new community with photo upload
managerRouter.post(
  "/communities",
  upload2.array("photos", 10),
  async (req, res) => {
    try {
      const {
        name,
        location,
        email,
        description,
        totalMembers,
        subscriptionPlan,
        paymentMethod,
        commonSpaces,
      } = req.body;

      // Validate required fields
      if (!name || !location || !email || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: "Please fill in all required fields.",
        });
      }

      // Check if community with same name or email already exists
      const existingCommunity = await Community.findOne({
        $or: [{ name }, { email }],
      });

      if (existingCommunity) {
        return res.status(400).json({
          success: false,
          message: "A community with this name or email already exists.",
        });
      }

      // Process uploaded photos
      const photos = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          photos.push({
            filename: file.filename,
            originalName: file.originalname,
            path: `/uploads/communities/${file.filename}`,
            size: file.size,
            mimeType: file.mimetype,
            uploadedAt: new Date(),
          });
        });
      }

      // Parse common spaces if provided
      let parsedCommonSpaces = [];
      if (commonSpaces) {
        try {
          parsedCommonSpaces = JSON.parse(commonSpaces);
        } catch (error) {
          console.error("Error parsing common spaces:", error);
        }
      }

      // Calculate subscription dates
      const planStartDate = new Date();
      const planEndDate = new Date();
      planEndDate.setMonth(planEndDate.getMonth() + 1); // Add 1 month

      // Get plan pricing
      const planPrices = {
        basic: 999,
        standard: 1999,
        premium: 3999,
      };

      // Generate transaction ID
      const transactionId = `TXN${Date.now()}${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

      // Create community
      const newCommunity = new Community({
        name: name.trim(),
        location: location.trim(),
        email: email.trim(),
        description: description?.trim() || "",
        totalMembers: parseInt(totalMembers) || 0,
        subscriptionPlan,
        subscriptionStatus: "active", // Set as active after successful payment
        planStartDate,
        planEndDate,
        profile: {
          photos: photos,
        },
        commonSpaces: parsedCommonSpaces.map((space) => ({
          ...space,
          createdBy: req.session?.managerId || null,
        })),
        communityManager: req.session?.managerId || null,

        // Add subscription history entry
        subscriptionHistory: [
          {
            transactionId,
            planName: `${
              subscriptionPlan.charAt(0).toUpperCase() +
              subscriptionPlan.slice(1)
            } Plan`,
            planType: subscriptionPlan,
            amount: planPrices[subscriptionPlan],
            paymentMethod,
            paymentDate: new Date(),
            planStartDate,
            planEndDate,
            duration: "monthly",
            status: "completed",
            isRenewal: false,
            processedBy: req.session?.managerId || null,
            metadata: {
              userAgent: req.get("User-Agent"),
              ipAddress: req.ip,
            },
          },
        ],

        // Legacy payment history for backward compatibility
        paymentHistory: [
          {
            date: new Date(),
            amount: planPrices[subscriptionPlan],
            method: paymentMethod,
            transactionId,
            invoiceUrl: null,
          },
        ],
      });
      const x = await CommunityManager.findById(req.user.id);
      x.assignedCommunity = newCommunity._id;

      await x.save();
      await newCommunity.save();

      res.status(201).json({
        success: true,
        message: "Community created successfully!",
        data: {
          communityId: newCommunity._id,
          name: newCommunity.name,
          subscriptionPlan: newCommunity.subscriptionPlan,
          transactionId,
        },
      });
    } catch (error) {
      console.error("Error creating community:", error);

      // Clean up uploaded files if community creation fails
      if (req.files && req.files.length > 0) {
        req.files.forEach(async (file) => {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error("Error deleting file:", unlinkError);
          }
        });
      }

      // Handle specific errors
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message:
            "Validation error: " + Object.values(error.errors)[0].message,
        });
      }

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "A community with this name or email already exists.",
        });
      }

      res.status(500).json({
        success: false,
        message:
          "An error occurred while creating the community. Please try again.",
      });
    }
  }
);

// Get community details
managerRouter.get("/communities/:id", async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("communityManager", "name email")
>>>>>>> Stashed changes
      .lean();

    if (!community) {
      return res.status(404).json({
        success: false,
<<<<<<< Updated upstream
        message: 'Community not found.'
=======
        message: "Community not found.",
>>>>>>> Stashed changes
      });
    }

    res.json({
      success: true,
<<<<<<< Updated upstream
      data: community
    });

  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching community details.'
=======
      data: community,
    });
  } catch (error) {
    console.error("Error fetching community:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching community details.",
>>>>>>> Stashed changes
    });
  }
});

// Get all communities for the logged-in manager
<<<<<<< Updated upstream
managerRouter.get('/communities', async (req, res) => {
=======
managerRouter.get("/communities", async (req, res) => {
>>>>>>> Stashed changes
  try {
    const managerId = req.session?.managerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = managerId ? { communityManager: managerId } : {};

    const communities = await Community.find(query)
<<<<<<< Updated upstream
      .select('name location email status totalMembers subscriptionPlan subscriptionStatus planEndDate profile.photos')
=======
      .select(
        "name location email status totalMembers subscriptionPlan subscriptionStatus planEndDate profile.photos"
      )
>>>>>>> Stashed changes
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Community.countDocuments(query);

    res.json({
      success: true,
      data: {
        communities,
        pagination: {
          page,
          limit,
          total,
<<<<<<< Updated upstream
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching communities.'
=======
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching communities.",
>>>>>>> Stashed changes
    });
  }
});

// Payment stats endpoint
<<<<<<< Updated upstream
managerRouter.get('/payment-stats', async (req, res) => {
=======
managerRouter.get("/payment-stats", async (req, res) => {
>>>>>>> Stashed changes
  try {
    const managerId = req.session?.managerId;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const matchCondition = {
<<<<<<< Updated upstream
      'subscriptionHistory.paymentDate': { $gte: firstDayOfMonth }
=======
      "subscriptionHistory.paymentDate": { $gte: firstDayOfMonth },
>>>>>>> Stashed changes
    };

    if (managerId) {
      matchCondition.communityManager = managerId;
    }

    const stats = await Community.aggregate([
      { $match: matchCondition },
<<<<<<< Updated upstream
      { $unwind: '$subscriptionHistory' },
      {
        $match: {
          'subscriptionHistory.paymentDate': { $gte: firstDayOfMonth },
          'subscriptionHistory.status': 'completed'
        }
=======
      { $unwind: "$subscriptionHistory" },
      {
        $match: {
          "subscriptionHistory.paymentDate": { $gte: firstDayOfMonth },
          "subscriptionHistory.status": "completed",
        },
>>>>>>> Stashed changes
      },
      {
        $group: {
          _id: null,
<<<<<<< Updated upstream
          totalAmount: { $sum: '$subscriptionHistory.amount' },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ['$subscriptionHistory.status', 'pending'] },
                '$subscriptionHistory.amount',
                0
              ]
            }
          },
          totalTransactions: { $sum: 1 }
        }
      }
=======
          totalAmount: { $sum: "$subscriptionHistory.amount" },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$subscriptionHistory.status", "pending"] },
                "$subscriptionHistory.amount",
                0,
              ],
            },
          },
          totalTransactions: { $sum: 1 },
        },
      },
>>>>>>> Stashed changes
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalAmount: 0,
        pendingAmount: 0,
<<<<<<< Updated upstream
        totalTransactions: 0
      }
    });

  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching payment statistics.'
=======
        totalTransactions: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching payment statistics.",
>>>>>>> Stashed changes
    });
  }
});
function getSubscriptionPlanName(planType) {
  const planNames = {
<<<<<<< Updated upstream
    'basic': 'Basic Plan',
    'standard': 'Standard Plan',
    'premium': 'Premium Plan'
  };
  return planNames[planType] || 'Unknown Plan';
=======
    basic: "Basic Plan",
    standard: "Standard Plan",
    premium: "Premium Plan",
  };
  return planNames[planType] || "Unknown Plan";
>>>>>>> Stashed changes
}
// Helper function to get plan price
function getPlanPrice(planType) {
  const planPrices = {
<<<<<<< Updated upstream
    'basic': 999,
    'standard': 1999,
    'premium': 3999
=======
    basic: 999,
    standard: 1999,
    premium: 3999,
>>>>>>> Stashed changes
  };
  return planPrices[planType] || 0;
}

managerRouter.get("/all-payments", PaymentController.getAllPayments);

// Create a new payment
managerRouter.post("/payments", PaymentController.createPayment);

// Get all residents
managerRouter.get("/residents", PaymentController.getAllResidents);

// Get current logged-in user information
managerRouter.get("/currentcManager", PaymentController.getCurrentcManager);

// Get a specific payment by ID
managerRouter.get("/payments/:id", PaymentController.getPaymentById);

// Update a payment status
managerRouter.put("/payments/:id", PaymentController.updatePayment);

// Delete a payment
managerRouter.delete("/payments/:id", PaymentController.deletePayment);

managerRouter.get("/userManagement", async (req, res) => {
  const ads = await Ad.find({ community: req.user.community });

  const R = await Resident.find({ community: req.user.community });
  const W = await Worker.find({ community: req.user.community });
  const S = await Security.find({ community: req.user.community });

  res.render("communityManager/userManagement", { path: "um", ads, R, W, S });
});

managerRouter.post("/userManagement/resident", async (req, res) => {
  try {
    const {
      Rid,
      residentFirstname,
      residentLastname,
      email,
      blockNo,
      flatNo,
      contact,
    } = req.body;

    console.log(Rid);

    if (Rid) {
      const r = await Resident.findById(Rid);

      r.residentFirstname = residentFirstname;
      r.residentLastname = residentLastname;
      r.email = email;
      r.blockNo = blockNo;
      r.flatNo = flatNo;
      r.contact = contact;

      await r.save();
    } else {
      const r = await Resident.create({
        residentFirstname,
        residentLastname,
        email,
        contact,
        flatNo,
        blockNo,
        community: req.user.community,
      });

      const password = await sendPassword(email);
      console.log(password);

      const hashedPassword = await bcrypt.hash(password, 10);

      r.password = hashedPassword;

      await r.save();

      console.log("new resident : ", r);
    }

    req.flash("alert-msg", "New Resident created");

    res.redirect("/manager/userManagement");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

managerRouter.get("/userManagement/resident/:id", async (req, res) => {
  const id = req.params.id;

  const r = await Resident.findById(id);

  res.status(200).json({ success: true, r });
});

managerRouter.delete("/userManagement/resident/:id", async (req, res) => {
  const id = req.params.id;

  const r = await Resident.deleteOne({ _id: id });

<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
  res.status(200).json({ ok: true });
});

managerRouter.post("/userManagement/security", async (req, res) => {
  try {
    const { Sid, name, email, contact, address, Shift } = req.body;

    if (Sid) {
      const s = await Security.findById(Sid);

      s.name = name;
      s.email = email;
      s.contact = contact;
      s.address = address;
      s.Shift = Shift;

      await s.save();
    } else {
      const r = await Security.create({
        name,
        email,
        contact,
        address,
        Shift,
        community: req.user.community,
      });
       req.flash("alert-msg", "New Security created");
    const password = await sendPassword(email);
      console.log(password);

      const hashedPassword = await bcrypt.hash(password, 10);

      r.password = hashedPassword;

      await r.save();
      console.log("new security : ", r);
    }
   
    res.redirect("/manager/userManagement");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

managerRouter.get("/userManagement/security/:id", async (req, res) => {
  const id = req.params.id;

  const r = await Security.findById(id);

  console.log(r);

  res.status(200).json({ success: true, r });
});
managerRouter.delete("/userManagement/security/:id", async (req, res) => {
  const id = req.params.id;

  const r = await Security.deleteOne({ _id: id });


  res.status(200).json({ ok: true });
});


managerRouter.post("/userManagement/worker", async (req, res) => {
  try {
    const {
      Wid,
      name,
      email,
      jobRole,
      contact,
      address,
      salary,
      availabilityStatus,
    } = req.body;

    if (Wid) {
      const w = await Worker.findById(Wid);

      w.name = name;
      w.email = email;
      w.jobRole = jobRole;
      w.contact = contact;
      w.address = address;
      w.salary = salary;
      w.availabilityStatus = availabilityStatus;

      await w.save();
    } else {
      const r = await Worker.create({
        name,
        email,
        jobRole,
        contact,
        address,
        salary,
        availabilityStatus,
        community: req.user.community,
      });

      console.log("new worker : ", r);
       req.flash("alert-msg", "New Security created");
    const password = await sendPassword(email);
      console.log(password);

      const hashedPassword = await bcrypt.hash(password, 10);

      r.password = hashedPassword;

      await r.save();
    }
    
    res.redirect("/manager/userManagement");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

managerRouter.get("/userManagement/worker/:id", async (req, res) => {
  const id = req.params.id;

  const w = await Worker.findById(id);

  res.status(200).json({ success: true, w });
});
managerRouter.delete("/userManagement/worker/:id", async (req, res) => {
  const id = req.params.id;

  const r = await Worker.deleteOne({ _id: id });


  res.status(200).json({ ok: true });
});


managerRouter.get("/dashboard", async (req, res) => {
  const ads = await Ad.find({ community: req.user.community });

  const issues = await Issue.find({ community: req.user.community });
  const residents = await Resident.find({ community: req.user.community });
  const workers = await Worker.find({ community: req.user.community });
  const security = await Security.find({ community: req.user.community });
  const commonSpacesBookings = await CommonSpaces.find({
    community: req.user.community,
  });
  const payments = await Payment.find({ community: req.user.community });
  const visitors = await visitor.find({ community: req.user.community });

  const totalIssues = issues.length;
  const totalResidents = residents.length;
  const totalWorkers = workers.length;
  const totalSecurity = security.length;
  const totalCommonSpacesBookings = commonSpacesBookings.length;
  const totalPayments = payments.length;

  const pendingIssues = issues.filter(
    (issue) => issue.status === "Pending"
  ).length;
  const resolvedIssues = issues.filter(
    (issue) => issue.status === "Resolved"
  ).length;
  const pendingCommonSpacesBookings = commonSpacesBookings.filter(
    (booking) => booking.status === "Pending"
  ).length;
  const approvedCommonSpacesBookings = commonSpacesBookings.filter(
    (booking) => booking.status === "Booked"
  ).length;
  const pendingPayments = payments.filter(
    (payment) => payment.status === "Pending"
  ).length;
  const completedPayments = payments.filter(
    (payment) => payment.status === "Completed"
  ).length;

  res.render("communityManager/dashboard", {
    path: "d",
    ads,
    totalIssues,
    totalResidents,
    totalWorkers,
    totalSecurity,
    totalCommonSpacesBookings,
    totalPayments,
    pendingIssues,
    resolvedIssues,
    pendingCommonSpacesBookings,
    approvedCommonSpacesBookings,
    pendingPayments,
    completedPayments,
    visitors,
  });
});

managerRouter.get("/", (req, res) => {
  res.redirect("dashboard");
});

managerRouter.get("/issueResolving", async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    const ads = await Ad.find({ community: req.user.community });

    if (!manager) {
      return res.status(404).json({ message: "Community manager not found" });
    }
    const community = manager.assignedCommunity;

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const workers = await Worker.find({ community: community });
    const issues = await Issue.find({})
      .populate("resident")
      .populate("workerAssigned");

    console.log(issues);

    res.render("communityManager/issueResolving", {
      path: "ir",
      issues: issues,
      workers: workers,
      ads,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

managerRouter.post("/issue/assign", async (req, res) => {
  const { id, issueID, worker, deadline, remarks } = req.body;
  try {
    const issue = await Issue.findById(id).populate("resident");
    console.log(issue);

    if (!issue) {
      return res.status(404).send("Issue not found");
    }

    issue.workerAssigned = worker;
    issue.deadline = deadline;
    issue.remarks = remarks;
    issue.status = "Assigned";

    issue.resident.notifications.push({
      n: `worker has assigned to issue ${issue.issueID}`,
      createdAt: new Date(Date.now()),
      belongs: "Issue",
    });

    await issue.resident.save();
    await issue.save();

    // Find the worker and update their assigned issues
    const workerData = await Worker.findById(worker);
    if (!workerData) {
      return res.status(404).send("Worker not found");
    }
    workerData.assignedIssues.push(id);
    await workerData.save();

    req.flash("alert-msg", "Worker Assigned");

    res.redirect("/manager/issueResolving");
  } catch (error) {
    console.error("Error assigning issue:", error);
    return res.status(500).send("Server error");
  }
});

managerRouter.get("/issueResolving/:id", async (req, res) => {
  const id = req.params.id;

  const issue = await Issue.findById(id)
    .populate("resident")
    .populate("workerAssigned");

  console.log(issue);

  if (!issue) {
    return res.status(404).json({ message: "Issue not found" });
  }

  res.status(200).json({ issue, success: true });
});

managerRouter.get("/payments", async (req, res) => {
  const ads = await Ad.find({ community: req.user.community });

  res.render("communityManager/Payments", { path: "p", ads });
});

managerRouter.get("/ad", async (req, res) => {
  const ads = await Ad.find({ community: req.user.community,status:"active" });

  res.render("communityManager/Advertisement", { path: "ad", ads });
});

managerRouter.post("/ad", upload.single("image"), async (req, res) => {
  const { title, sdate, edate, link } = req.body;
  const file = req.file.path;

  const ad = await Ad.create({
    title,
    startDate: new Date(sdate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    endDate: new Date(edate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    link,
    imagePath: file,
    community: req.user.community,
  });

  console.log("new ad : ", ad);

  res.redirect("ad");
});

managerRouter.get("/profile", async (req, res) => {
  const ads = await Ad.find({ community: req.user.community });

  const r = await CommunityManager.findById(req.user.id);

  console.log(r);

  res.render("communityManager/Profile", { path: "pr", ads, r });
});

managerRouter.post("/profile", upload.single("image"), async (req, res) => {
  const { name, email, contact } = req.body;
  const image = req.file.path;

  const r = await CommunityManager.findById(req.user.id);

  r.name = name;
  r.email = email;
  r.contact = contact;
  r.image = image;

  await r.save();
  req.flash("alert-msg", "profile updated");

  res.redirect("/manager/profile");
});

managerRouter.post("/profile/changePassword", async (req, res) => {
  const { cp, np, cnp } = req.body;

  console.log(np, cnp);

  const r = await CommunityManager.findById(req.user.id);

  const isMatch = await bcrypt.compare(cp, r.password);

  if (!isMatch) {
    res.json({ success: false, message: "current password does not match" });
  }

  if (np !== cnp) {
    console.log("not matched");

    return res.json({ success: false, message: "password doesnot match" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(np, salt);
  r.password = hashedPassword;

  await r.save();

  return res.json({ success: true, message: "password changed" });
});

export default managerRouter;
