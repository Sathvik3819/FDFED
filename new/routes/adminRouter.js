import express from "express";
import Community from "../models/communities.js";
import CommunityManager from "../models/cManager.js";
import Resident from "../models/resident.js";
import Security from "../models/security.js";
import Worker from "../models/workers.js";

const AdminRouter = express.Router();
import bcrypt from 'bcrypt';

const saltRounds = 10;

import {
  getAllApplications,
  getApplication,
  approveApplication,
  rejectApplication
} from '../controllers/interestForm.js';



// Application management routes
AdminRouter.get('/applications', getAllApplications);
AdminRouter.get('/applications/:id', getApplication);
AdminRouter.post('/applications/:id/approve', approveApplication);
AdminRouter.post('/applications/:id/reject', rejectApplication);



// ===== PAGE ROUTES =====

// Dashboard Route
AdminRouter.get(["/", "/dashboard"], (req, res) => {
  res.render("admin/dashboard");
});
AdminRouter.get(["/profile"], (req, res) => {
  res.render("admin/profile");
});
AdminRouter.get(["/payments"], (req, res) => {
  res.render("admin/payments");
});
// Update the payments route in AdminRouter
AdminRouter.get("/payments", async (req, res) => {
  try {
    // Fetch all communities with subscription details and payment history
    const communities = await Community.find()
      .populate("communityManager", "name email")
      .sort({ updatedAt: -1 });

    // Calculate payment statistics
    const totalRevenue = communities.reduce((sum, community) => {
      return sum + community.subscriptionHistory.reduce((historySum, payment) => {
        return payment.status === 'completed' ? historySum + payment.amount : historySum;
      }, 0);
    }, 0);

    const totalTransactions = communities.reduce((sum, community) => {
      return sum + community.subscriptionHistory.filter(payment => payment.status === 'completed').length;
    }, 0);

    const pendingPayments = communities.reduce((sum, community) => {
      return sum + community.subscriptionHistory.filter(payment => payment.status === 'pending').length;
    }, 0);

    const activeSubscriptions = communities.filter(c => c.subscriptionStatus === 'active').length;
    const expiredSubscriptions = communities.filter(c => c.subscriptionStatus === 'expired').length;

    // Get recent transactions (last 50)
    const recentTransactions = communities
      .flatMap(community => 
        community.subscriptionHistory.map(payment => ({
          ...payment.toObject(),
          communityName: community.name,
          communityId: community._id,
          managerName: community.communityManager?.name || 'N/A'
        }))
      )
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
      .slice(0, 50);

    // Monthly revenue data for charts (last 12 months)
    const monthlyRevenue = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthRevenue = communities.reduce((sum, community) => {
        return sum + community.subscriptionHistory
          .filter(payment => 
            payment.status === 'completed' &&
            new Date(payment.paymentDate) >= monthStart &&
            new Date(payment.paymentDate) <= monthEnd
          )
          .reduce((monthSum, payment) => monthSum + payment.amount, 0);
      }, 0);
      
      monthlyRevenue.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue
      });
    }

    // Plan distribution
    const planDistribution = {
      basic: communities.filter(c => c.subscriptionPlan === 'basic').length,
      standard: communities.filter(c => c.subscriptionPlan === 'standard').length,
      premium: communities.filter(c => c.subscriptionPlan === 'premium').length
    };

    res.render("admin/payments", {
      communities,
      recentTransactions,
      monthlyRevenue,
      statistics: {
        totalRevenue,
        totalTransactions,
        pendingPayments,
        activeSubscriptions,
        expiredSubscriptions
      },
      planDistribution
    });
  } catch (error) {
    console.error("Error fetching payment data:", error);
    res.status(500).send("Server Error");
  }
});

// API route to get payment details for a specific community
AdminRouter.get("/api/payments/community/:id", async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("communityManager", "name email contact");
    
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    // Sort subscription history by payment date (newest first)
    const sortedHistory = community.subscriptionHistory.sort(
      (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
    );

    res.json({
      success: true,
      community: {
        _id: community._id,
        name: community.name,
        email: community.email,
        subscriptionPlan: community.subscriptionPlan,
        subscriptionStatus: community.subscriptionStatus,
        planStartDate: community.planStartDate,
        planEndDate: community.planEndDate,
        communityManager: community.communityManager
      },
      subscriptionHistory: sortedHistory,
      totalRevenue: sortedHistory
        .filter(payment => payment.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0),
      totalTransactions: sortedHistory.filter(payment => payment.status === 'completed').length
    });
  } catch (error) {
    console.error("Error fetching community payment details:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch payment details" 
    });
  }
});

// API route to get all payment transactions with filters
AdminRouter.get("/api/payments/transactions", async (req, res) => {
  try {
    const { 
      status, 
      planType, 
      communityId, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;

    // Build query filters
    const matchQuery = {};
    
    if (communityId) {
      matchQuery._id = mongoose.Types.ObjectId(communityId);
    }

    const communities = await Community.find(matchQuery)
      .populate("communityManager", "name email");

    // Filter and flatten transactions
    let allTransactions = communities.flatMap(community => 
      community.subscriptionHistory
        .filter(payment => {
          let include = true;
          
          if (status && payment.status !== status) include = false;
          if (planType && payment.planType !== planType) include = false;
          if (startDate && new Date(payment.paymentDate) < new Date(startDate)) include = false;
          if (endDate && new Date(payment.paymentDate) > new Date(endDate)) include = false;
          
          return include;
        })
        .map(payment => ({
          ...payment.toObject(),
          communityName: community.name,
          communityId: community._id,
          managerName: community.communityManager?.name || 'N/A',
          managerEmail: community.communityManager?.email || 'N/A'
        }))
    );

    // Sort by payment date (newest first)
    allTransactions.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

    res.json({
      success: true,
      transactions: paginatedTransactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allTransactions.length / limit),
        totalTransactions: allTransactions.length,
        hasNext: endIndex < allTransactions.length,
        hasPrev: startIndex > 0
      },
      summary: {
        totalAmount: allTransactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0),
        completedCount: allTransactions.filter(t => t.status === 'completed').length,
        pendingCount: allTransactions.filter(t => t.status === 'pending').length,
        failedCount: allTransactions.filter(t => t.status === 'failed').length
      }
    });
  } catch (error) {
    console.error("Error fetching payment transactions:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch payment transactions" 
    });
  }
});

// API route to update payment status
AdminRouter.put("/api/payments/transaction/:communityId/:transactionId", async (req, res) => {
  try {
    const { communityId, transactionId } = req.params;
    const { status, notes } = req.body;

    if (!['completed', 'pending', 'failed'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid status. Must be completed, pending, or failed" 
      });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ 
        success: false, 
        error: "Community not found" 
      });
    }

    const transaction = community.subscriptionHistory.id(transactionId);
    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        error: "Transaction not found" 
      });
    }

    // Update transaction status
    transaction.status = status;
    if (notes) {
      transaction.metadata = { 
        ...transaction.metadata, 
        adminNotes: notes,
        lastUpdated: new Date()
      };
    }

    // If marking as completed and it's the latest transaction, update community subscription
    const latestTransaction = community.subscriptionHistory
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
    
    if (status === 'completed' && transaction._id.equals(latestTransaction._id)) {
      community.subscriptionStatus = 'active';
      community.subscriptionPlan = transaction.planType;
      community.planStartDate = transaction.planStartDate;
      community.planEndDate = transaction.planEndDate;
    }

    await community.save();

    res.json({
      success: true,
      message: "Transaction status updated successfully",
      transaction: transaction
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update payment status" 
    });
  }
});
// Communities Page Route
AdminRouter.get("/communities", async (req, res) => {
  try {
    const communities = await Community.find().populate("communityManager");
    const managers = await CommunityManager.find();

    // Calculate statistics
    const totalCommunities = communities.length;
    const activeCommunities = communities.filter(c => c.status === "Active").length;
    const inactiveCommunities = totalCommunities - activeCommunities;

    res.render("admin/communities", {
      communities, 
      managers,
      totalCommunities,
      activeCommunities,
      inactiveCommunities
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    res.status(500).send("Server Error");
  }
});

// Community Managers Page Route
AdminRouter.get("/community-managers", async (req, res) => {
  try {
    const managers = await CommunityManager.find().populate("assignedCommunity");
    const communities = await Community.find({ status: "Active" });
    
    res.render("admin/community-managers", {
      managers,
      communities
    });
  } catch (error) {
    console.error("Error fetching community managers:", error);
    res.status(500).send("Server Error");
  }
});

// Residents Page Route
AdminRouter.get("/residents", async (req, res) => {
  try {
    const residents = await Resident.find().populate("community");
    const communities = await Community.find({ status: "Active" });
    
    res.render("admin/residents", {
      residents,
      communities
    });
  } catch (error) {
    console.error("Error fetching residents:", error);
    res.status(500).send("Server Error");
  }
});

// Security Personnel Page Route
AdminRouter.get("/security", async (req, res) => {
  try {
    const security = await Security.find().populate("community");
    const communities = await Community.find({ status: "Active" });
    
    res.render("admin/security", {
      security,
      communities
    });
  } catch (error) {
    console.error("Error fetching security personnel:", error);
    res.status(500).send("Server Error");
  }
});

// Maintenance Workers Page Route
AdminRouter.get("/workers", async (req, res) => {
  try {
    const workers = await Worker.find().populate("community");
    const communities = await Community.find({ status: "Active" });
    
    res.render("admin/workers", {
      workers,
      communities
    });
  } catch (error) {
    console.error("Error fetching maintenance workers:", error);
    res.status(500).send("Server Error");
  }
});

// ===== API ROUTES =====

// ===== COMMUNITIES API =====
// Get all communities
AdminRouter.get("/api/communities", async (req, res) => {
  try {
    const communities = await Community.find().populate("communityManager", "name");
    res.json({ communities });
  } catch (error) {
    console.error("Error fetching communities:", error);
    res.status(500).json({ error: "Failed to fetch communities" });
  }
});

// Get single community by ID
AdminRouter.get("/api/communities/:id", async (req, res) => {
  try {
    const community = await Community.findById(req.params.id).populate("communityManager");
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }
    res.json(community);
  } catch (error) {
    console.error("Error fetching community:", error);
    res.status(500).json({ error: "Failed to fetch community details" });
  }
});

// Create new community
AdminRouter.post("/api/communities", async (req, res) => {
  try {
    const { name, location, description, status, communityManagerId } = req.body;

    // Validate required fields
    if (!name || !location || !status) {
      return res.status(400).json({ error: "Name, location and status are required fields" });
    }

    // Check if community with same name already exists
    const existingCommunity = await Community.findOne({ name });
    if (existingCommunity) {
      return res.status(409).json({ error: "A community with this name already exists" });
    }

    const newCommunity = new Community({
      name,
      location,
      description: description || '',
      status,
      assignedManager: communityManagerId || null,
      createdAt: new Date()
    });

    await newCommunity.save();
    res.status(201).json({ 
      message: "Community added successfully",
      community: newCommunity
    });
  } catch (error) {
    console.error("Error adding community:", error);
    res.status(500).json({ 
      error: "Failed to add community", 
      details: error.message 
    });
  }
});

// Update existing community
AdminRouter.put("/api/communities/:id", async (req, res) => {
  try {
    const { name, location, description, status, communityManagerId } = req.body;
    
    // Validate required fields
    if (!name || !location || !status) {
      return res.status(400).json({ error: "Name, location and status are required fields" });
    }
    
    // Check if another community has the same name (excluding this one)
    const existingCommunity = await Community.findOne({ 
      name, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingCommunity) {
      return res.status(409).json({ error: "Another community with this name already exists" });
    }
    
    const updatedCommunity = await Community.findByIdAndUpdate(
      req.params.id,
      {
        name,
        location,
        description,
        status,
        communityManager: communityManagerId || null,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedCommunity) {
      return res.status(404).json({ error: "Community not found" });
    }
    
    res.json({ 
      message: "Community updated successfully",
      community: updatedCommunity
    });
  } catch (error) {
    console.error("Error updating community:", error);
    res.status(500).json({ 
      error: "Failed to update community",
      details: error.message 
    });
  }
});

// Delete community
AdminRouter.delete("/api/communities/:id", async (req, res) => {
  try {
    const deletedCommunity = await Community.findByIdAndDelete(req.params.id);
    
    if (!deletedCommunity) {
      return res.status(404).json({ error: "Community not found" });
    }
    
    res.json({ message: "Community deleted successfully" });
  } catch (error) {
    console.error("Error deleting community:", error);
    res.status(500).json({ 
      error: "Failed to delete community",
      details: error.message 
    });
  }
});

// ===== COMMUNITY MANAGERS API =====
// Get all community managers
AdminRouter.get("/api/community-managers", async (req, res) => {
  try {
    const managers = await CommunityManager.find().populate("assignedCommunity", "name");
    res.json({ 
      success: true,
      managers 
    });
  } catch (error) {
    console.error("Error fetching community managers:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch community managers" 
    });
  }
});

// Get single community manager by ID
AdminRouter.get("/api/community-managers/:id", async (req, res) => {
  try {
    const manager = await CommunityManager.findById(req.params.id)
      .populate("assignedCommunity", "name location");
      
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        error: "Community manager not found" 
      });
    }
    
    res.json({ 
      success: true, 
      manager 
    });
  } catch (error) {
    console.error("Error fetching community manager:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch community manager details" 
    });
  }
});

// Create new community manager
AdminRouter.post("/api/community-managers", async (req, res) => {
  try {
    const { name, email, contact, password, assignedCommunityId } = req.body;

    // Validate required fields
    if (!name || !email || !contact ) {
      return res.status(400).json({ 
        success: false, 
        error: "Name, email and contact  are required fields" 
      });
    }

    // Check if manager with same email already exists
    const existingManager = await CommunityManager.findOne({ email });
    if (existingManager) {
      return res.status(409).json({ 
        success: false, 
        error: "A community manager with this email already exists" 
      });
    }
  const hashedPassword = await bcrypt.hash(password, saltRounds);
    // Create new manager
    const newManager = new CommunityManager({
      name,
      email,
      contact,
      password: hashedPassword, // Save to password field, 
      assignedCommunity: assignedCommunityId || null,
      createdAt: new Date()
    });

    await newManager.save();
    
    // Update community if assigned
    if (assignedCommunityId) {
      await Community.findByIdAndUpdate(
        assignedCommunityId,
        { communityManager: newManager._id }
      );
    }

    res.status(201).json({ 
      success: true,
      message: "Community manager added successfully",
      manager: newManager
    });
  } catch (error) {
    console.error("Error adding community manager:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to add community manager", 
      details: error.message 
    });
  }
});

// Update existing community manager
AdminRouter.put("/api/community-managers/:id", async (req, res) => {
  try {
    const { name, email, contact, password, assignedCommunityId } = req.body;
    
    // Validate required fields
    if (!name || !email || !contact) {
      return res.status(400).json({ 
        success: false, 
        error: "Name, email and contact are required fields" 
      });
    }
    
    // Check if another manager has the same email (excluding this one)
    const existingManager = await CommunityManager.findOne({ 
      email, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingManager) {
      return res.status(409).json({ 
        success: false, 
        error: "Another community manager with this email already exists" 
      });
    }
    
    // Get current manager info
    const currentManager = await CommunityManager.findById(req.params.id);
    if (!currentManager) {
      return res.status(404).json({ 
        success: false, 
        error: "Community manager not found" 
      });
    }
    
    // Prepare update data
    const updateData = {
      name,
      email,
      contact,
      assignedCommunity: assignedCommunityId || null,
      updatedAt: new Date()
    };
    
    // Add password to update only if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateData.password = hashedPassword; 
    }
    
    // Update manager
    const updatedManager = await CommunityManager.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    // Handle community assignment changes
    if (currentManager.assignedCommunity !== assignedCommunityId) {
      // Remove manager from previous community if existed
      if (currentManager.assignedCommunity) {
        await Community.findByIdAndUpdate(
          currentManager.assignedCommunity,
          { $unset: { communityManager: 1 } }
        );
      }
      
      // Assign to new community if provided
      if (assignedCommunityId) {
        await Community.findByIdAndUpdate(
          assignedCommunityId,
          { communityManager: updatedManager._id }
        );
      }
    }
    
    res.json({ 
      success: true,
      message: "Community manager updated successfully",
      manager: updatedManager
    });
  } catch (error) {
    console.error("Error updating community manager:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update community manager",
      details: error.message 
    });
  }
});

// Delete community manager
AdminRouter.delete("/api/community-managers/:id", async (req, res) => {
  try {
    const manager = await CommunityManager.findById(req.params.id);
    
    if (!manager) {
      return res.status(404).json({ 
        success: false, 
        error: "Community manager not found" 
      });
    }
    
    // Remove manager reference from assigned community
    if (manager.assignedCommunity) {
      await Community.findByIdAndUpdate(
        manager.assignedCommunity,
        { $unset: { communityManager: 1 } }
      );
    }
    
    // Delete the manager
    await CommunityManager.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: "Community manager deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting community manager:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to delete community manager",
      details: error.message 
    });
  }
});

// ===== RESIDENTS API =====
// Get all residents
AdminRouter.get("/api/residents", async (req, res) => {
  try {
    const residents = await Resident.find().populate("community", "name");
    res.json({ residents });
  } catch (error) {
    console.error("Error fetching residents:", error);
    res.status(500).json({ error: "Failed to fetch residents" });
  }
});

// Get single resident by ID
AdminRouter.get("/api/residents/:id", async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id).populate("community");
    if (!resident) {
      return res.status(404).json({ error: "Resident not found" });
    }
    res.json({ resident });
  } catch (error) {
    console.error("Error fetching resident:", error);
    res.status(500).json({ error: "Failed to fetch resident details" });
  }
});

// Create new resident
AdminRouter.post("/api/residents", async (req, res) => {
  try {
    const { 
      residentFirstname, 
      residentLastname, 
      flatNo, 
      blockNo, 
      email, 
      contact, 
      password, 
      communityId 
    } = req.body;

    // Validate required fields
    if (!residentFirstname || !residentLastname || !flatNo || !blockNo || !email || !contact || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if resident with same email already exists
    const existingResident = await Resident.findOne({ email });
    if (existingResident) {
      return res.status(409).json({ error: "A resident with this email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newResident = new Resident({
      residentFirstname,
      residentLastname,
      flatNo,
      blockNo,
      email,
      contact,
      password: hashedPassword, // Save to password field, 
      community: communityId || null,
      createdAt: new Date()
    });

    await newResident.save();
    res.status(201).json({ 
      message: "Resident added successfully",
      resident: newResident
    });
  } catch (error) {
    console.error("Error adding resident:", error);
    res.status(500).json({ 
      error: "Failed to add resident", 
      details: error.message 
    });
  }
});

// Update existing resident
AdminRouter.put("/api/residents/:id", async (req, res) => {
  try {
    const { 
      residentFirstname, 
      residentLastname, 
      flatNo, 
      blockNo, 
      email, 
      contact, 
      password, 
      communityId 
    } = req.body;
    
    // Validate required fields
    if (!residentFirstname || !residentLastname || !flatNo || !blockNo || !email || !contact) {
      return res.status(400).json({ error: "All fields except password are required" });
    }
    
    // Check if another resident has the same email (excluding this one)
    const existingResident = await Resident.findOne({ 
      email, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingResident) {
      return res.status(409).json({ error: "Another resident with this email already exists" });
    }
    
    // Prepare update data
    const updateData = {
      residentFirstname,
      residentLastname,
      flatNo,
      blockNo,
      email,
      contact,
      community: communityId || null,
      updatedAt: new Date()
    };
    
    // Add password to update only if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateData.password = hashedPassword; // Note: In a real application, this would be hashed
    }
    
    const updatedResident = await Resident.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!updatedResident) {
      return res.status(404).json({ error: "Resident not found" });
    }
    
    res.json({ 
      message: "Resident updated successfully",
      resident: updatedResident
    });
  } catch (error) {
    console.error("Error updating resident:", error);
    res.status(500).json({ 
      error: "Failed to update resident",
      details: error.message 
    });
  }
});

// Delete resident
AdminRouter.delete("/api/residents/:id", async (req, res) => {
  try {
    const deletedResident = await Resident.findByIdAndDelete(req.params.id);
    
    if (!deletedResident) {
      return res.status(404).json({ error: "Resident not found" });
    }
    
    res.json({ message: "Resident deleted successfully" });
  } catch (error) {
    console.error("Error deleting resident:", error);
    res.status(500).json({ 
      error: "Failed to delete resident",
      details: error.message 
    });
  }
});

// ===== SECURITY API =====
// Get all security personnel
AdminRouter.get("/api/security", async (req, res) => {
  try {
    const security = await Security.find().populate("community", "name");
    res.json({ security });
  } catch (error) {
    console.error("Error fetching security personnel:", error);
    res.status(500).json({ error: "Failed to fetch security personnel" });
  }
});

// Get single security personnel by ID
AdminRouter.get("/api/security/:id", async (req, res) => {
  try {
    const security = await Security.findById(req.params.id).populate("community");
    if (!security) {
      return res.status(404).json({ error: "Security personnel not found" });
    }
    res.json({ security });
  } catch (error) {
    console.error("Error fetching security personnel:", error);
    res.status(500).json({ error: "Failed to fetch security personnel details" });
  }
});

// Create new security personnel
AdminRouter.post("/api/security", async (req, res) => {
  try {
    const { 
      name, 
      email, 
      contact, 
      address, 
      Shift, 
      password, 
      communityId 
    } = req.body;

    // Validate required fields
    if (!name || !email || !contact || !address || !Shift || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if security personnel with same email already exists
    const existingSecurity = await Security.findOne({ email });
    if (existingSecurity) {
      return res.status(409).json({ error: "A security personnel with this email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newSecurity = new Security({
      name,
      email,
      contact,
      address,
      Shift,
      password: hashedPassword, // Save to password field, 
      community: communityId || null,
      createdAt: new Date()
    });

    await newSecurity.save();
    res.status(201).json({ 
      message: "Security personnel added successfully",
      security: newSecurity
    });
  } catch (error) {
    console.error("Error adding security personnel:", error);
    res.status(500).json({ 
      error: "Failed to add security personnel", 
      details: error.message 
    });
  }
});

// Update existing security personnel
AdminRouter.put("/api/security/:id", async (req, res) => {
  try {
    const { 
      name, 
      email, 
      contact, 
      address, 
      Shift, 
      password, 
      communityId 
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !contact || !address || !Shift) {
      return res.status(400).json({ error: "All fields except password are required" });
    }
    
    // Check if another security has the same email (excluding this one)
    const existingSecurity = await Security.findOne({ 
      email, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingSecurity) {
      return res.status(409).json({ error: "Another security personnel with this email already exists" });
    }
    
    // Prepare update data
    const updateData = {
      name,
      email,
      contact,
      address,
      Shift,
      community: communityId || null,
      updatedAt: new Date()
    };
    
    // Add password to update only if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateData.password = hashedPassword; 
    }
    
    const updatedSecurity = await Security.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!updatedSecurity) {
      return res.status(404).json({ error: "Security personnel not found" });
    }
    
    res.json({ 
      message: "Security personnel updated successfully",
      security: updatedSecurity
    });
  } catch (error) {
    console.error("Error updating security personnel:", error);
    res.status(500).json({ 
      error: "Failed to update security personnel",
      details: error.message 
    });
  }
});

// Delete security personnel
AdminRouter.delete("/api/security/:id", async (req, res) => {
  try {
    const deletedSecurity = await Security.findByIdAndDelete(req.params.id);
    
    if (!deletedSecurity) {
      return res.status(404).json({ error: "Security personnel not found" });
    }
    
    res.json({ message: "Security personnel deleted successfully" });
  } catch (error) {
    console.error("Error deleting security personnel:", error);
    res.status(500).json({ 
      error: "Failed to delete security personnel",
      details: error.message 
    });
  }
});

// ===== WORKERS API =====
// Get all maintenance workers
AdminRouter.get("/api/workers", async (req, res) => {
  try {
    const workers = await Worker.find().populate("community", "name");
    res.json({ workers });
  } catch (error) {
    console.error("Error fetching maintenance workers:", error);
    res.status(500).json({ error: "Failed to fetch maintenance workers" });
  }
});

// Get single maintenance worker by ID
AdminRouter.get("/api/workers/:id", async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id).populate("community");
    if (!worker) {
      return res.status(404).json({ error: "Maintenance worker not found" });
    }
    res.json({ worker });
  } catch (error) {
    console.error("Error fetching maintenance worker:", error);
    res.status(500).json({ error: "Failed to fetch maintenance worker details" });
  }
});

// Create new maintenance worker
AdminRouter.post("/api/workers", async (req, res) => {
  try {
    const { 
      name, 
      email, 
      contact, 
      address, 
      jobRole, 
      availabilityStatus, 
      salary,
      password, 
      communityId 
    } = req.body;

    // Validate required fields
    if (!name || !email || !contact || !address || !jobRole || !availabilityStatus || !salary || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if worker with same email already exists
    const existingWorker = await Worker.findOne({ email });
    if (existingWorker) {
      return res.status(409).json({ error: "A maintenance worker with this email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newWorker = new Worker({
      name,
      email,
      contact,
      address,
      jobRole,
      availabilityStatus,
      salary,
      password: hashedPassword, // Save to password field, 
      community: communityId || null,
      createdAt: new Date()
    });

    await newWorker.save();
    res.status(201).json({ 
      message: "Maintenance worker added successfully",
      worker: newWorker
    });
  } catch (error) {
    console.error("Error adding maintenance worker:", error);
    res.status(500).json({ 
      error: "Failed to add maintenance worker", 
      details: error.message 
    });
  }
});

// Update existing maintenance worker
AdminRouter.put("/api/workers/:id", async (req, res) => {
  try {
    const { 
      name, 
      email, 
      contact, 
      address, 
      jobRole, 
      availabilityStatus, 
      salary,
      password, 
      communityId 
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !contact || !address || !jobRole || !availabilityStatus || !salary) {
      return res.status(400).json({ error: "All fields except password are required" });
    }
    
    // Check if another worker has the same email (excluding this one)
    const existingWorker = await Worker.findOne({ 
      email, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingWorker) {
      return res.status(409).json({ error: "Another maintenance worker with this email already exists" });
    }
    
    // Prepare update data
    const updateData = {
      name,
      email,
      contact,
      address,
      jobRole,
      availabilityStatus,
      salary,
      community: communityId || null,
      updatedAt: new Date()
    };
    
    // Add password to update only if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateData.password = hashedPassword; 
    }
    
    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!updatedWorker) {
      return res.status(404).json({ error: "Maintenance worker not found" });
    }
    
    res.json({ 
      message: "Maintenance worker updated successfully",
      worker: updatedWorker
    });
  } catch (error) {
    console.error("Error updating maintenance worker:", error);
    res.status(500).json({ 
      error: "Failed to update maintenance worker",
      details: error.message 
    });
  }
});

// Delete maintenance worker
AdminRouter.delete("/api/workers/:id", async (req, res) => {
  try {
    const deletedWorker = await Worker.findByIdAndDelete(req.params.id);
    
    if (!deletedWorker) {
      return res.status(404).json({ error: "Maintenance worker not found" });
    }
    
    res.json({ message: "Maintenance worker deleted successfully" });
  } catch (error) {
    console.error("Error deleting maintenance worker:", error);
    res.status(500).json({ 
      error: "Failed to delete maintenance worker",
      details: error.message 
    });
  }
});
// Staff Management Page Route
AdminRouter.get("/staff-management", async (req, res) => {
    try {
      const residents = await Resident.find().populate("community");
      const security = await Security.find().populate("community");
      const workers = await Worker.find().populate("communityAssigned");
      const communities = await Community.find({ status: "Active" });
      
      res.render("admin/staff-management", {
        residents,
        security,
        workers,
        communities
      });
    } catch (error) {
      console.error("Error fetching staff data:", error);
      res.status(500).send("Server Error");
    }
  });
export default AdminRouter;