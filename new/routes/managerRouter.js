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

import { sendPassword } from '../controllers/OTP.js'

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
 const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  
  const community = await Community.findById(req.user.community)
    .select('commonSpaces')
    .lean();

  res.render("communityManager/CSB", { path: "cbs", csb, community: community,ads });
});
managerRouter.get("/commonSpace/details/:id", async (req, res) => {
  try {
    const booking = await CommonSpaces.findById(req.params.id)
      .populate("bookedBy", "name email") // fetch resident info
      .populate("payment", "amount status method") // fetch payment info
      .populate("community", "name"); // fetch community info

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({
      success: true,
      name: booking.name,
      description: booking.description,
      date: booking.Date,
      from: booking.from,
      to: booking.to,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      payment: booking.payment || null,
      availability: booking.availability,
      bookedBy: booking.bookedBy ? {
        name: booking.bookedBy.name,
        email: booking.bookedBy.email
      } : null,
      community: booking.community?.name || null,
      feedback: booking.feedback
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
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
      status: "payment Pending",
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
        .json({ message: "Requested slots are available." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

managerRouter.get("/commonSpace/approve/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const b = await CommonSpaces.findById(id).populate('bookedBy').populate('community');

    if (!b) {
      return res.status(404).json({ message: "Booking not found" });
    }

    b.status = "avalaible";
    b.availability = "NO";
    b.paymentStatus = "Pending";
    b.status = "Pending Payment";

    console.log("Booking Data after update:", b);

    const uniqueId = generateCustomID(b._id.toString(), "PY", null);

    const amount = b.community.commonSpaces.filter((c)=>c.name===b.name);

    // const noOfH = b.from

    //no of hours between b.from and b.to
    const fromTime = new Date(`2000/01/01 ${b.from}`);
    const toTime = new Date(`2000/01/01 ${b.to}`);
    const diffMs = toTime - fromTime;
    const noOfHours = diffMs / (1000 * 60 * 60);

    // convert string "9000" to number
    const rent = parseInt(amount[0].rent);
    const totalAmount = rent * noOfHours;

    if (isNaN(totalAmount)) {
      console.error("Calculated totalAmount is NaN. Check rent and noOfHours.");
      return res.status(500).json({ message: "Error calculating payment amount." });
    }

    const payment = await Payment.create({
      title: b._id,
      sender: b.bookedBy._id,
      receiver: req.user.community,
      amount: totalAmount,
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
      belongs:"CS",
      n:`You have successfully booked the ${b.name} from ${b.from} to ${b.to}.`
    })

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
    const b = await CommonSpaces.findById(id).populate('bookedBy');

    if (!b) {
      return res.status(404).json({ message: "Booking not found" });
    }

    b.availability = "NO";
    b.paymentStatus = null;
    b.status = "Rejected";
    b.feedback = reason;

    b.bookedBy.notifications.push({
      belongs:"CS",
      n:`Your common space booking ${b.ID ? b.ID : b.title} has been cancelled`,
      createdAt:new Date()
    })

    await b.save();

    res.status(200).json({ message: "rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add new space
managerRouter.post('/api/community/spaces', async (req, res) => {
  try {
    // Validate required fields
    const { type, name,bookingRent } = req.body;
    console.log("req.body : ",req.body);
    
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
      rent:bookingRent,
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

    if(req.body.bookingRent){
      updateData.rent = req.body.bookingRent ? req.body.bookingRent : '' 
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
// Middleware to check subscription status
async function checkSubscription(req, res, next) {
  try {
    // Skip check for payment-related routes
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
      return next();
    }

    // Get manager and community info
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
      return res.status(404).render('error', { message: 'Community manager not found' });
    }

    const community = await Community.findById(manager.assignedCommunity)
      .select('subscriptionStatus planEndDate');

    if (!community) {
      return res.status(404).render('error', { message: 'Community not found' });
    }

    // Check if subscription is active
    const now = new Date();
    const isExpired = community.planEndDate && new Date(community.planEndDate) < now;

    if (isExpired || community.subscriptionStatus !== 'active') {
      // Store the original URL in session for redirecting back after payment
      req.session.returnTo = req.originalUrl;

      // Add a flash message
      req.flash('warning', 'Your subscription has expired or is inactive. Please complete the payment to continue.');

      // Redirect to payment page
      return res.redirect('/manager/payments',);
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).render('error', { message: 'Error checking subscription status' });
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

    const community = await Community.findById(manager.assignedCommunity)
      .select('subscriptionStatus planEndDate subscriptionPlan');

    if (!community) {
      return null;
    }

    const now = new Date();
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
    return null;
  }
}
// Get community details with subscription info
managerRouter.get('/community-details', async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
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
  }
});

// Handle subscription payment
managerRouter.post('/subscription-payment', async (req, res) => {
  try {
    const {
      communityId,
      subscriptionPlan,
      amount,
      paymentMethod,
      planDuration,
      transactionId,
      paymentDate,
      isRenewal
    } = req.body;

    // Validate required fields
    if (!subscriptionPlan || !amount || !paymentMethod) {
      return res.status(400).json({ message: 'Missing required payment information' });
    }

    // Get the community
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
      return res.status(404).json({ message: 'Community manager not found' });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Calculate plan end date
    const startDate = new Date(paymentDate);
    const endDate = new Date(startDate);

    if (planDuration === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planDuration === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create subscription payment record
    const subscriptionPayment = {
      transactionId: transactionId || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      planName: getSubscriptionPlanName(subscriptionPlan),
      planType: subscriptionPlan,
      amount: amount,
      paymentMethod: paymentMethod,

      paymentDate: new Date(paymentDate),
      planStartDate: startDate,
      planEndDate: endDate,
      duration: planDuration,
      status: 'completed',
      isRenewal: isRenewal || false,
      processedBy: managerId,
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip || req.connection.remoteAddress
      }
    };

    // Update community subscription details
    community.subscriptionPlan = subscriptionPlan;
    community.subscriptionStatus = 'active';
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
      message: 'Subscription payment processed successfully',
      transactionId: subscriptionPayment.transactionId,
      planName: subscriptionPayment.planName,
      amount: subscriptionPayment.amount,
      planEndDate: subscriptionPayment.planEndDate,
      subscriptionStatus: community.subscriptionStatus
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Subscription payment error:', error);
    res.status(500).json({
      message: 'Payment processing failed',
      error: error.message
    });
  }
});

// Get subscription history
managerRouter.get('/subscription-history', async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
      return res.status(404).json({ message: 'Community manager not found' });
    }

    const community = await Community.findById(manager.assignedCommunity)
      .select('subscriptionHistory');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Sort history by payment date (newest first)
    const sortedHistory = community.subscriptionHistory
      ? community.subscriptionHistory.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
      : [];

    res.json({
      success: true,
      history: sortedHistory,
      totalPayments: sortedHistory.length
    });

  } catch (error) {
    console.error('Error fetching subscription history:', error);
    res.status(500).json({ message: 'Failed to fetch subscription history' });
  }
});

// Get current subscription status
managerRouter.get('/subscription-status', async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
      return res.status(404).json({ message: 'Community manager not found' });
    }

    const community = await Community.findById(manager.assignedCommunity)
      .select('name subscriptionPlan subscriptionStatus planStartDate planEndDate');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if subscription is expired
    const now = new Date();
    const isExpired = community.planEndDate && new Date(community.planEndDate) < now;

    if (isExpired && community.subscriptionStatus === 'active') {
      community.subscriptionStatus = 'expired';
      await community.save();
    }

    // Calculate days until expiry
    let daysUntilExpiry = null;
    if (community.planEndDate) {
      daysUntilExpiry = Math.ceil((new Date(community.planEndDate) - now) / (1000 * 60 * 60 * 24));
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
        isExpiringSoon: daysUntilExpiry && daysUntilExpiry <= 7 && daysUntilExpiry > 0
      }
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Failed to fetch subscription status' });
  }
});
import fs from 'fs';




const storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join("uploads", "something");

    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) return cb(err);
      cb(null, dir); // ✅ tell multer where to store the file
    });
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});


const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload2 = multer({
  storage: storage2,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  }
});

// Render new community page
managerRouter.get('/new-community', (req, res) => {
  res.render('communityManager/new-community');
});

// Create new community with photo upload
managerRouter.post('/communities', async (req, res) => {
  try {
    const {
      subscriptionPlan,
      paymentMethod
    } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }

    // Plan pricing
    const planPrices = {
      basic: 999,
      standard: 1999,
      premium: 3999
    };

    const planStartDate = new Date();
    const planEndDate = new Date();
    planEndDate.setMonth(planEndDate.getMonth() + 1);

    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Find the manager and their assigned community
    

    // Find the community and update it
    const community = req.user.community
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Assigned community not found.'
      });
    }

    // Update subscription details
    community.subscriptionPlan = subscriptionPlan;
    community.subscriptionStatus = 'active';
    community.planStartDate = planStartDate;
    community.planEndDate = planEndDate;

    // Add subscription history
    community.subscriptionHistory.push({
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
      isRenewal: true,
      processedBy: req.session?.managerId || null,
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    // Legacy payment history
    community.paymentHistory.push({
      date: new Date(),
      amount: planPrices[subscriptionPlan],
      method: paymentMethod,
      transactionId,
      invoiceUrl: null
    });

    await community.save();

    res.status(200).json({
      success: true,
      message: 'Community subscription updated successfully!',
      data: {
        communityId: community._id,
        subscriptionPlan: community.subscriptionPlan,
        transactionId
      }
    });

  } catch (error) {
    console.error('Error updating community:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the community.'
    });
  }
});


// Get community details
managerRouter.get('/communities/:id', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('communityManager', 'name email')
      .lean();

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found.'
      });
    }

    res.json({
      success: true,
      data: community
    });

  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching community details.'
    });
  }
});

// Get all communities for the logged-in manager
managerRouter.get('/communities', async (req, res) => {
  try {
    const managerId = req.session?.managerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = managerId ? { communityManager: managerId } : {};

    const communities = await Community.find(query)
      .select('name location email status totalMembers subscriptionPlan subscriptionStatus planEndDate profile.photos')
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
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching communities.'
    });
  }
});

// Payment stats endpoint
managerRouter.get('/payment-stats', async (req, res) => {
  try {
    const managerId = req.session?.managerId;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const matchCondition = {
      'subscriptionHistory.paymentDate': { $gte: firstDayOfMonth }
    };

    if (managerId) {
      matchCondition.communityManager = managerId;
    }

    const stats = await Community.aggregate([
      { $match: matchCondition },
      { $unwind: '$subscriptionHistory' },
      {
        $match: {
          'subscriptionHistory.paymentDate': { $gte: firstDayOfMonth },
          'subscriptionHistory.status': 'completed'
        }
      },
      {
        $group: {
          _id: null,
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
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalAmount: 0,
        pendingAmount: 0,
        totalTransactions: 0
      }
    });

  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching payment statistics.'
    });
  }
});
function getSubscriptionPlanName(planType) {
  const planNames = {
    'basic': 'Basic Plan',
    'standard': 'Standard Plan',
    'premium': 'Premium Plan'
  };
  return planNames[planType] || 'Unknown Plan';
}
// Helper function to get plan price
function getPlanPrice(planType) {
  const planPrices = {
    'basic': 999,
    'standard': 1999,
    'premium': 3999
  };
  return planPrices[planType] || 0;
}




managerRouter.get('/all-payments', PaymentController.getAllPayments);

// Create a new payment
managerRouter.post('/payments', PaymentController.createPayment);

// Get all residents
managerRouter.get('/residents', PaymentController.getAllResidents);

// Get current logged-in user information
managerRouter.get('/currentcManager', PaymentController.getCurrentcManager);


// Get a specific payment by ID
managerRouter.get('/payments/:id', PaymentController.getPaymentById);

// Update a payment status
managerRouter.put('/payments/:id', PaymentController.updatePayment);

// Delete a payment
managerRouter.delete('/payments/:id', PaymentController.deletePayment);








managerRouter.get("/userManagement", async (req, res) => {
 const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  
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
      uCode,
      contact,
    } = req.body;

    console.log("Incoming Resident ID:", Rid);
    console.log("Request body:", req.body);

    if (Rid) {
      // Update existing resident
      const r = await Resident.findById(Rid);
      if (!r) {
        req.flash("alert-msg", { text: `Resident with ID ${Rid} not found`, type: "error" });
        return res.redirect("/manager/userManagement");
      }

      r.residentFirstname = residentFirstname;
      r.residentLastname = residentLastname;
      r.email = email;
      r.uCode = uCode;
      r.contact = contact;

      await r.save();
      req.flash("alert-msg", { text: "Resident updated successfully", type: "success" });

    } else {
      // Create new resident
      const r = await Resident.create({
        residentFirstname,
        residentLastname,
        email,
        contact,
        uCode,
        community: req.user.community,
      });

      const password = await sendPassword({email,userType:"Resident"});
      const hashedPassword = await bcrypt.hash(password, 10);
      r.password = hashedPassword;
      await r.save();

      req.flash("alert-msg", { text: "New resident created successfully", type: "success" });
    }

    res.redirect("/manager/userManagement");

  } catch (err) {
    console.error("Error in /userManagement/resident:", err);

    let flashMsg;
    if (err.name === "ValidationError") {
      flashMsg = Object.values(err.errors)
        .map(e => e.message)
        .join(", ");
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      flashMsg = `Duplicate value for ${field}: ${err.keyValue[field]}`;
    } else {
      flashMsg = err.message || "Unexpected error occurred";
    }

    req.flash("alert-msg", { text: flashMsg, type: "error" });
    res.redirect("/manager/userManagement");
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


  res.status(200).json({ ok: true });
});

managerRouter.post("/userManagement/security", async (req, res) => {
  try {
    const { Sid, name, email, contact, address, Shift } = req.body;

    console.log("Incoming Security ID:", Sid);
    console.log("Request body:", req.body);

    if (Sid) {
      const s = await Security.findById(Sid);
      if (!s) {
        req.flash("alert-msg", { text: `Security staff with ID ${Sid} not found`, type: "error" });
        return res.redirect("/manager/userManagement");
      }

      s.name = name;
      s.email = email;
      s.contact = contact;
      s.address = address;
      s.Shift = Shift;

      await s.save();
      req.flash("alert-msg", { text: "Security staff updated successfully", type: "success" });

    } else {
      const s = await Security.create({
        name,
        email,
        contact,
        address,
        Shift,
        community: req.user.community,
      });

      const password = await sendPassword({email,userType:"Security"});
      const hashedPassword = await bcrypt.hash(password, 10);
      s.password = hashedPassword;
      await s.save();

      console.log("New security staff:", s);
      req.flash("alert-msg", { text: "New security staff created successfully", type: "success" });
    }

    res.redirect("/manager/userManagement");

  } catch (err) {
    console.error("Error in /userManagement/security:", err);

    let flashMsg;
    if (err.name === "ValidationError") {
      flashMsg = Object.values(err.errors).map(e => e.message).join(", ");
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      flashMsg = `Duplicate value for ${field}: ${err.keyValue[field]}`;
    } else {
      flashMsg = err.message || "Unexpected error occurred";
    }

    req.flash("alert-msg", { text: flashMsg, type: "error" });
    res.redirect("/manager/userManagement");
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
   
    } = req.body;

    console.log("Incoming Worker ID:", Wid);
    console.log("Request body:", req.body);

    if (Wid) {
      // Update existing worker
      const w = await Worker.findById(Wid);
      if (!w) {
        req.flash("alert-msg", { text: `Worker with ID ${Wid} not found`, type: "error" });
        return res.redirect("/manager/userManagement");
      }

      w.name = name;
      w.email = email;
      w.jobRole = jobRole;
      w.contact = contact;
      w.address = address;
      w.salary = salary;
     

      await w.save();
      req.flash("alert-msg", { text: "Worker updated successfully", type: "success" });

    } else {
      // Create new worker
      const w = await Worker.create({
        name,
        email,
        jobRole,
        contact,
        address,
        salary,
       
        community: req.user.community,
      });

     const password = await sendPassword({ email, userType: "Worker" });

      const hashedPassword = await bcrypt.hash(password, 10);
      w.password = hashedPassword;
      await w.save();

      console.log("New worker:", w);
      req.flash("alert-msg", { text: "New worker created successfully", type: "success" });
    }

    res.redirect("/manager/userManagement");

  } catch (err) {
    console.error("Error in /userManagement/worker:", err);

    let flashMsg;
    if (err.name === "ValidationError") {
      flashMsg = Object.values(err.errors)
        .map(e => e.message)
        .join(", ");
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      flashMsg = `Duplicate value for ${field}: ${err.keyValue[field]}`;
    } else {
      flashMsg = err.message || "Unexpected error occurred";
    }

    req.flash("alert-msg", { text: flashMsg, type: "error" });
    res.redirect("/manager/userManagement");
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
 const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  
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

   const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  

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
    const issue = await Issue.findById(id);
    console.log(issue);

    if (!issue) {
      return res.status(404).send("Issue not found");
    }

    issue.workerAssigned = worker;
    issue.deadline = deadline;
    issue.remarks = remarks;
    issue.status = "Assigned";
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
  try {
   const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  

    const community = req.user.community;
    const payments = community.subscriptionHistory || [];
    const hasPayments = payments.length > 0;

    const now = new Date();
    const isExpired = community?.planEndDate && new Date(community.planEndDate) < now;

    const x = !hasPayments;             // No payment yet
    const y = hasPayments && isExpired; // Paid but expired

    const planPrices = {
      basic: 999,
      standard: 1999,
      premium: 3999
    };

    res.render("communityManager/Payments", {
      path: "p",
      ads,
      x,
      y,
      plan: community.plan || "basic",
      planPrices
    });
  } catch (error) {
    console.error("Error loading payments page:", error);
    res.status(500).render("error", { message: "Error loading payments page" });
  }
});




managerRouter.get("/ad", async (req, res) => {
  const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

  res.render("communityManager/Advertisement", { path: "ad", ads });
});

managerRouter.post("/ad", upload.single("image"), async (req, res) => {
  const { title, sdate, edate, link } = req.body;
  const file = req.file.path;

  const ad = await Ad.create({
    title,
    startDate: new Date(sdate), // directly save as Date object
    endDate: new Date(edate),
    
    link,
    imagePath: file,
    community: req.user.community,
  });

  console.log("new ad : ", ad);
  res.redirect("ad");
});


managerRouter.get("/profile", async (req, res) => {
 const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });



  const r = await CommunityManager.findById(req.user.id);

  console.log(r);

  res.render("communityManager/Profile", { path: "pr", ads, r });
});

managerRouter.post("/profile", upload.single("image"), async (req, res) => {
  const { name, email, contact } = req.body;
  
  const image="";

  const r = await CommunityManager.findById(req.user.id);
if (req.file) {
     image = req.file.path;
  }
  
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
