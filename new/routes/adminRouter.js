import express from "express";
import Community from "../models/communities.js";
import CommunityManager from "../models/cManager.js";
import Resident from "../models/resident.js";
import Security from "../models/security.js";
import Worker from "../models/workers.js";
import Application from "../models/interestForm.js";
import Admin from "../models/admin.js";


const AdminRouter = express.Router();
import bcrypt from 'bcrypt';

const saltRounds = 10;

import {
  getAllApplications,
  getAllApplicationsJSON,
  approveApplication,
  rejectApplication
} from '../controllers/interestForm.js';

AdminRouter.get('/interests/json', getAllApplicationsJSON);



// Application management routes
AdminRouter.get('/interests', getAllApplications);

AdminRouter.post('/interests/:id/approve', approveApplication);
AdminRouter.post('/interests/:id/reject', rejectApplication);



AdminRouter.get("/api/dashboard", async (req, res) => {
  try {
    // KPIs
    const totalCommunities = await Community.countDocuments();
    const totalResidents = await Resident.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: "pending" });

   const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

const monthlyRevenueAgg = await Community.aggregate([
  { $unwind: "$subscriptionHistory" },
  {
    $match: {
      "subscriptionHistory.status": "completed",
      "subscriptionHistory.paymentDate": { $gte: startOfMonth }
    }
  },
  {
    $group: {
      _id: null,
      total: { $sum: "$subscriptionHistory.amount" }
    }
  }
]);

const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

    const growthChart = await Community.aggregate([
  { $unwind: "$subscriptionHistory" },
  {
    $match: { "subscriptionHistory.status": "completed" }
  },
  {
    $group: {
      _id: { $month: "$subscriptionHistory.paymentDate" },
      revenue: { $sum: "$subscriptionHistory.amount" },
      communities: { $sum: 1 }
    }
  },
  { $sort: { "_id": 1 } }
]);

// Format for frontend
const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const revenueTrend = Array(12).fill(0);
const communityTrend = Array(12).fill(0);

growthChart.forEach(item => {
  const monthIndex = item._id - 1;
  revenueTrend[monthIndex] = item.revenue;
  communityTrend[monthIndex] = item.communities;
});

    // Application breakdown
    const appStatus = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const appStatusMap = appStatus.reduce((acc, a) => {
      acc[a._id] = a.count;
      return acc;
    }, {});

    // --- Hardcoded Notifications ---
    const systemAlerts = [
      { id: 1, message: "System update scheduled for tonight", priority: "medium", time: "2h ago" },
      { id: 2, message: "Backup completed successfully", priority: "low", time: "5h ago" }
    ];

    const actionRequired = [
      { id: 1, message: "3 applications pending approval", priority: "high", time: "1h ago" },
      { id: 2, message: "2 payments overdue", priority: "high", time: "30m ago" }
    ];

   res.json({
  success: true,
  data: {
    kpis: {
      totalCommunities,
      totalResidents,
      pendingApplications,
      monthlyRevenue
    },
    chartData: {
      applicationsStatus: {
        approved: appStatusMap.approved || 0,
        pending: appStatusMap.pending || 0,
        rejected: appStatusMap.rejected || 0
      },
      growthChart: {
        labels,
        communities: communityTrend,
        revenue: revenueTrend
      }
    },
    notifications: {
      systemAlerts,
      actionRequired
    }
  }
});

  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --- KPIs Only ---
AdminRouter.get("/api/dashboard/kpis", async (req, res) => {
  try {
    const totalCommunities = await Community.countDocuments();
    const totalResidents = await Resident.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: "pending" });
    const activeManagers = await CommunityManager.countDocuments({ status: "active" });

    res.json({
      success: true,
      data: {
        kpis: { totalCommunities, totalResidents, pendingApplications, activeManagers }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --- Charts ---
// Update the dashboard endpoint to include proper revenue chart data
AdminRouter.get("/api/dashboard", async (req, res) => {
  try {
    // KPIs
    const totalCommunities = await Community.countDocuments();
    const totalResidents = await Resident.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: "pending" });

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const monthlyRevenueAgg = await Community.aggregate([
      { $unwind: "$subscriptionHistory" },
      {
        $match: {
          "subscriptionHistory.status": "completed",
          "subscriptionHistory.paymentDate": { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$subscriptionHistory.amount" }
        }
      }
    ]);

    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

    // Get all communities with subscription history for revenue calculations
    const communities = await Community.find().lean();
    
    // Flatten all subscription history
    let allPayments = [];
    for (const c of communities) {
      if (!Array.isArray(c.subscriptionHistory)) continue;
      allPayments.push(...c.subscriptionHistory);
    }

    // Generate revenue chart data (last 12 months)
    const now = new Date();
    const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const revenueTrend = Array(12).fill(0);
    const communityTrend = Array(12).fill(0);

    // Calculate revenue for each month
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now.getFullYear(), i, 1);
      const nextMonthDate = new Date(now.getFullYear(), i + 1, 1);
      
      const monthRevenue = allPayments
        .filter(p => {
          const pDate = new Date(p.paymentDate);
          return (
            pDate >= monthDate &&
            pDate < nextMonthDate &&
            p.status === "completed"
          );
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const monthCommunities = allPayments
        .filter(p => {
          const pDate = new Date(p.paymentDate);
          return (
            pDate >= monthDate &&
            pDate < nextMonthDate &&
            p.status === "completed"
          );
        }).length;

      revenueTrend[i] = monthRevenue;
      communityTrend[i] = monthCommunities;
    }

    // Application breakdown
    const appStatus = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const appStatusMap = appStatus.reduce((acc, a) => {
      acc[a._id] = a.count;
      return acc;
    }, {});

    // Notifications
    const systemAlerts = [
      { id: 1, message: "System update scheduled for tonight", priority: "medium", time: "2h ago" },
      { id: 2, message: "Backup completed successfully", priority: "low", time: "5h ago" }
    ];

    const actionRequired = [
      { id: 1, message: `${pendingApplications} applications pending approval`, priority: "high", time: "1h ago" },
      { id: 2, message: "2 payments overdue", priority: "high", time: "30m ago" }
    ];

    res.json({
      success: true,
      data: {
        kpis: {
          totalCommunities,
          totalResidents,
          pendingApplications,
          monthlyRevenue
        },
        chartData: {
          applicationsStatus: {
            approved: appStatusMap.approved || 0,
            pending: appStatusMap.pending || 0,
            rejected: appStatusMap.rejected || 0
          },
          growthChart: {
            labels,
            communities: communityTrend,
            revenue: revenueTrend
          }
        },
        notifications: {
          systemAlerts,
          actionRequired
        }
      }
    });

  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add separate endpoint for dynamic chart filtering
AdminRouter.get("/api/dashboard/charts", async (req, res) => {
  try {
    const { period = '6M' } = req.query;
    
    // Get all communities with subscription history
    const communities = await Community.find().lean();
    
    // Flatten all payments
    let allPayments = [];
    for (const c of communities) {
      if (!Array.isArray(c.subscriptionHistory)) continue;
      allPayments.push(...c.subscriptionHistory);
    }

    const now = new Date();
    let labels = [];
    let revenueTrend = [];
    let communityTrend = [];

    switch(period) {
      case '6M':
        // Last 6 months
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          labels.push(monthName);
          
          const monthRevenue = allPayments
            .filter(p => {
              const pDate = new Date(p.paymentDate);
              return (
                pDate.getFullYear() === date.getFullYear() && 
                pDate.getMonth() === date.getMonth() &&
                p.status === 'completed'
              );
            })
            .reduce((sum, p) => sum + (p.amount || 0), 0);
          
          const monthCommunities = allPayments
            .filter(p => {
              const pDate = new Date(p.paymentDate);
              return (
                pDate.getFullYear() === date.getFullYear() && 
                pDate.getMonth() === date.getMonth() &&
                p.status === 'completed'
              );
            }).length;

          revenueTrend.push(monthRevenue);
          communityTrend.push(monthCommunities);
        }
        break;
        
      case '1Y':
        // Last 12 months
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          labels.push(monthName);
          
          const monthRevenue = allPayments
            .filter(p => {
              const pDate = new Date(p.paymentDate);
              return (
                pDate.getFullYear() === date.getFullYear() && 
                pDate.getMonth() === date.getMonth() &&
                p.status === 'completed'
              );
            })
            .reduce((sum, p) => sum + (p.amount || 0), 0);
          
          const monthCommunities = allPayments
            .filter(p => {
              const pDate = new Date(p.paymentDate);
              return (
                pDate.getFullYear() === date.getFullYear() && 
                pDate.getMonth() === date.getMonth() &&
                p.status === 'completed'
              );
            }).length;

          revenueTrend.push(monthRevenue);
          communityTrend.push(monthCommunities);
        }
        break;
        
      case 'All':
        // Yearly aggregation - last 5 years
        for (let i = 4; i >= 0; i--) {
          const year = now.getFullYear() - i;
          labels.push(year.toString());
          
          const yearRevenue = allPayments
            .filter(p => {
              const pDate = new Date(p.paymentDate);
              return pDate.getFullYear() === year && p.status === 'completed';
            })
            .reduce((sum, p) => sum + (p.amount || 0), 0);
          
          const yearCommunities = allPayments
            .filter(p => {
              const pDate = new Date(p.paymentDate);
              return pDate.getFullYear() === year && p.status === 'completed';
            }).length;

          revenueTrend.push(yearRevenue);
          communityTrend.push(yearCommunities);
        }
        break;
    }

    res.json({ 
      success: true, 
      data: {
        growthChart: {
          labels,
          communities: communityTrend,
          revenue: revenueTrend
        }
      }
    });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch chart data" 
    });
  }
});










// --- Render Dashboard Page ---
AdminRouter.get(["/","/dashboard"], (req, res) => {
  res.render("admin/dashboard", {
    title: "Admin Dashboard - Community Management",
    pageTitle: "Dashboard Overview",
    pageSubtitle: "Welcome back, Admin! Here's what's happening across all communities."
  });
});


import multer from 'multer';
import path from 'path';

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/admin/'); // Adjust path as needed
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'admin-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// GET: Profile Page
AdminRouter.get("/profile", async (req, res) => {
  try {
    const admin = await Admin.findOne();
    if (!admin) return res.status(404).send("Admin not found");
    res.render("admin/profile", { admin });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// POST: Update Profile
AdminRouter.post("/profile/update", upload.single('image'), async (req, res) => {
  try {
    const { name, email } = req.body;
    
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    // Validate input
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }
    
    // Find admin
    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check if email is being changed and if it already exists
    if (email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email, _id: { $ne: admin._id } });
      if (existingAdmin) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Update fields
    admin.name = name;
    admin.email = email;

    // Update image if uploaded
    if (req.file) {
      admin.image = `/uploads/admin/${req.file.filename}`;
      console.log('Image path saved:', admin.image);
    }

    await admin.save();

    return res.status(200).json({ 
      message: "Profile updated successfully",
      admin: {
        name: admin.name,
        email: admin.email,
        image: admin.image
      }
    });

  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ 
      message: "Failed to update profile",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// POST: Change Password
AdminRouter.post("/profile/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: "Password must be at least 8 characters with uppercase, lowercase, and number/special character" 
      });
    }

    // Find admin
    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, admin.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({ message: "Password changed successfully" });

  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: "Failed to change password" });
  }
});


AdminRouter.get(["/payments"], (req, res) => {
  res.render("admin/payments");
});

AdminRouter.get("/payments", async (req, res) => {
  try {
    // Fetch all communities with manager + subscription data
    const communities = await Community.find()
      .populate("communityManager", "name email")
      .sort({ updatedAt: -1 })
      .lean(); // lean() = faster, returns plain JS objects

    // Aggregate payment statistics
    let totalRevenue = 0,
        totalTransactions = 0,
        pendingPayments = 0;

    for (const c of communities) {
      if (!Array.isArray(c.subscriptionHistory)) continue;

      for (const p of c.subscriptionHistory) {
        if (p.status === "completed") {
          totalRevenue += p.amount || 0;
          totalTransactions++;
        } else if (p.status === "pending") {
          pendingPayments++;
        }
      }
    }

    const activeSubscriptions = communities.filter(c => c.subscriptionStatus === "active").length;
    const expiredSubscriptions = communities.filter(c => c.subscriptionStatus === "expired").length;

    // Collect all payments for recent transaction view
    const allPayments = [];
    for (const c of communities) {
      if (!Array.isArray(c.subscriptionHistory)) continue;
      for (const p of c.subscriptionHistory) {
        allPayments.push({
          ...p,
          communityName: c.name,
          communityId: c._id,
          managerName: c.communityManager?.name || "N/A"
        });
      }
    }

    const recentTransactions = allPayments
      .filter(p => p.paymentDate)
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
      .slice(0, 50);

    const monthlyRevenue = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthRevenue = allPayments.reduce((sum, p) => {
        if (
          p.status === "completed" &&
          new Date(p.paymentDate) >= start &&
          new Date(p.paymentDate) <= end
        ) {
          return sum + (p.amount || 0);
        }
        return sum;
      }, 0);

      monthlyRevenue.push({
        month: start.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        revenue: monthRevenue
      });
    }

    const planDistribution = {
      basic: communities.filter(c => c.subscriptionPlan === "basic").length,
      standard: communities.filter(c => c.subscriptionPlan === "standard").length,
      premium: communities.filter(c => c.subscriptionPlan === "premium").length
    };

    // Render payments dashboard
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
    res.status(500).send("Internal Server Error");
  }
});
// Add these API routes to your AdminRouter

// API: Get transactions with filters
AdminRouter.get("/api/payments/transactions", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      planType,
      startDate,
      endDate,
      search
    } = req.query;

    // Fetch all communities with subscription data
    const communities = await Community.find()
      .populate("communityManager", "name email")
      .lean();

    // Collect all transactions
    let allTransactions = [];
    for (const c of communities) {
      if (!Array.isArray(c.subscriptionHistory)) continue;
      
      for (const payment of c.subscriptionHistory) {
        allTransactions.push({
          ...payment,
          _id: payment._id.toString(),
          communityName: c.name,
          communityId: c._id.toString(),
          managerName: c.communityManager?.name || "N/A"
        });
      }
    }

    // Apply filters
    let filteredTransactions = allTransactions;

    // Status filter
    if (status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === status);
    }

    // Plan type filter
    if (planType) {
      filteredTransactions = filteredTransactions.filter(t => t.planType === planType);
    }

    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filteredTransactions = filteredTransactions.filter(t => {
        const paymentDate = new Date(t.paymentDate);
        return paymentDate >= start && paymentDate <= end;
      });
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTransactions = filteredTransactions.filter(t => {
        return (
          t.communityName?.toLowerCase().includes(searchLower) ||
          t.managerName?.toLowerCase().includes(searchLower) ||
          t.transactionId?.toLowerCase().includes(searchLower) ||
          t._id?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort by payment date (newest first)
    filteredTransactions.sort((a, b) => {
      return new Date(b.paymentDate) - new Date(a.paymentDate);
    });

    // Calculate summary statistics
    const summary = {
      totalAmount: filteredTransactions
        .filter(t => t.status === "completed")
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      completedCount: filteredTransactions.filter(t => t.status === "completed").length,
      pendingCount: filteredTransactions.filter(t => t.status === "pending").length,
      failedCount: filteredTransactions.filter(t => t.status === "failed").length
    };

    // Pagination
    const totalTransactions = filteredTransactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);
    const currentPage = Math.min(Math.max(1, parseInt(page)), totalPages || 1);
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    res.json({
      success: true,
      transactions: paginatedTransactions,
      pagination: {
        currentPage,
        totalPages,
        totalTransactions,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      },
      summary
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch transactions"
    });
  }
});

// API: Get community payment details
AdminRouter.get("/api/payments/community/:communityId", async (req, res) => {
  try {
    const { communityId } = req.params;

    const community = await Community.findById(communityId)
      .populate("communityManager", "name email")
      .lean();

    if (!community) {
      return res.status(404).json({
        success: false,
        error: "Community not found"
      });
    }

    const subscriptionHistory = community.subscriptionHistory || [];
    const totalRevenue = subscriptionHistory
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      success: true,
      community,
      subscriptionHistory,
      totalRevenue,
      totalTransactions: subscriptionHistory.length
    });
  } catch (error) {
    console.error("Error fetching community payment details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment details"
    });
  }
});

// API: Update payment status
AdminRouter.put("/api/payments/transaction/:communityId/:transactionId", async (req, res) => {
  try {
    const { communityId, transactionId } = req.params;
    const { status, notes } = req.body;

    if (!["completed", "pending", "failed"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status"
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

    transaction.status = status;
    if (notes) {
      transaction.notes = notes;
    }

    await community.save();

    res.json({
      success: true,
      message: "Payment status updated successfully",
      transaction
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update payment status"
    });
  }
});

// API: Get revenue chart data
AdminRouter.get("/api/payments/revenue-chart", async (req, res) => {
  try {
    const { timePeriod = "monthly" } = req.query;

    const communities = await Community.find().lean();
    
    let allPayments = [];
    for (const c of communities) {
      if (!Array.isArray(c.subscriptionHistory)) continue;
      allPayments.push(...c.subscriptionHistory);
    }

    const now = new Date();
    let labels = [];
    let data = [];

    switch (timePeriod) {
      case "weekly":
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
          labels.push(dayName);

          const dayRevenue = allPayments
            .filter(p => {
              const pDate = new Date(p.paymentDate);
              return (
                pDate.toDateString() === date.toDateString() &&
                p.status === "completed"
              );
            })
            .reduce((sum, p) => sum + (p.amount || 0), 0);

          data.push(dayRevenue);
        }
        break;

      case "monthly":
        // Last 12 months
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = date.toLocaleDateString("en-US", { month: "short" });
          labels.push(monthName);

          const monthRevenue = allPayments
            .filter(p => {
              const pDate = new Date(p.paymentDate);
              return (
                pDate.getFullYear() === date.getFullYear() &&
                pDate.getMonth() === date.getMonth() &&
                p.status === "completed"
              );
            })
            .reduce((sum, p) => sum + (p.amount || 0), 0);

          data.push(monthRevenue);
        }
        break;

      case "yearly":
        // Last 5 years
        for (let i = 4; i >= 0; i--) {
          const year = now.getFullYear() - i;
          labels.push(year.toString());

          const yearRevenue = allPayments
            .filter(p => {
              const pDate = new Date(p.paymentDate);
              return pDate.getFullYear() === year && p.status === "completed";
            })
            .reduce((sum, p) => sum + (p.amount || 0), 0);

          data.push(yearRevenue);
        }
        break;
    }

    res.json({
      success: true,
      data: { labels, data }
    });
  } catch (error) {
    console.error("Error fetching revenue chart data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch chart data"
    });
  }
});


AdminRouter.get("/api/payments/community/:id", async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("communityManager", "name email contact")
      .lean();

    if (!community) {
      return res.status(404).json({ success: false, error: "Community not found" });
    }

    const history = Array.isArray(community.subscriptionHistory)
      ? [...community.subscriptionHistory].sort(
          (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
        )
      : [];

    const totalRevenue = history
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalTransactions = history.filter(p => p.status === "completed").length;

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
      subscriptionHistory: history,
      totalRevenue,
      totalTransactions
    });
  } catch (error) {
    console.error("Error fetching community payment details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment details"
    });
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

// API route to get revenue chart data
AdminRouter.get("/api/payments/revenue-chart", async (req, res) => {
  try {
    const { timePeriod = 'monthly' } = req.query;
    
    // Get all communities with subscription history
    const communities = await Community.find()
      .populate("communityManager", "name email")
      .select("subscriptionHistory subscriptionPlan");
    
    // Flatten all subscription history
    const allTransactions = [];
    communities.forEach(community => {
      community.subscriptionHistory.forEach(transaction => {
        allTransactions.push({
          ...transaction.toObject(),
          communityName: community.name,
          managerName: community.communityManager?.name || 'N/A',
          planType: transaction.planType || community.subscriptionPlan
        });
      });
    });
    
    // Generate revenue chart data based on time period
    const chartData = generateRevenueChartData(allTransactions, timePeriod);
    
    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error("Error fetching revenue chart data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch revenue chart data"
    });
  }
});

// Helper function to generate revenue chart data
function generateRevenueChartData(transactions, timePeriod) {
  const now = new Date();
  let labels = [];
  let data = [];
  
  switch(timePeriod) {
    case 'weekly':
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        labels.push(dayName);
        
        const dayRevenue = transactions
          .filter(t => {
            const paymentDate = new Date(t.paymentDate);
            return paymentDate.toDateString() === date.toDateString() && t.status === 'completed';
          })
          .reduce((sum, t) => sum + t.amount, 0);
        
        data.push(dayRevenue);
      }
      break;
      
    case 'monthly':
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        labels.push(monthName);
        
        const monthRevenue = transactions
          .filter(t => {
            const paymentDate = new Date(t.paymentDate);
            return paymentDate.getFullYear() === date.getFullYear() && 
                   paymentDate.getMonth() === date.getMonth() &&
                   t.status === 'completed';
          })
          .reduce((sum, t) => sum + t.amount, 0);
        
        data.push(monthRevenue);
      }
      break;
      
    case 'yearly':
      // Last 5 years
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        labels.push(year.toString());
        
        const yearRevenue = transactions
          .filter(t => {
            const paymentDate = new Date(t.paymentDate);
            return paymentDate.getFullYear() === year && t.status === 'completed';
          })
          .reduce((sum, t) => sum + t.amount, 0);
        
        data.push(yearRevenue);
      }
      break;
  }
  
  return { labels, data };
}

// API route to get extended payments chart data
AdminRouter.get("/api/payments/extended-chart", async (req, res) => {
  try {
    const { timePeriod = 'monthly' } = req.query;
    
    // Get all communities with subscription history
    const communities = await Community.find()
      .populate("communityManager", "name email")
      .select("subscriptionHistory subscriptionPlan");
    
    // Flatten all subscription history
    const allTransactions = [];
    communities.forEach(community => {
      community.subscriptionHistory.forEach(transaction => {
        allTransactions.push({
          ...transaction.toObject(),
          communityName: community.name,
          managerName: community.communityManager?.name || 'N/A',
          planType: transaction.planType || community.subscriptionPlan
        });
      });
    });
    
    // Generate chart data based on time period
    const chartData = generateExtendedPaymentsChartData(allTransactions, timePeriod);
    
    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error("Error fetching extended payments chart data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch extended payments chart data"
    });
  }
});

// Helper function to generate extended payments chart data
function generateExtendedPaymentsChartData(transactions, timePeriod) {
  const now = new Date();
  let labels = [];
  let completed = [];
  let pending = [];
  let failed = [];
  
  switch(timePeriod) {
    case 'weekly':
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        labels.push(dayName);
        
        const dayData = getPaymentsForPeriod(transactions, date, 'day');
        completed.push(dayData.completed);
        pending.push(dayData.pending);
        failed.push(dayData.failed);
      }
      break;
      
    case 'monthly':
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        labels.push(monthName);
        
        const monthData = getPaymentsForPeriod(transactions, date, 'month');
        completed.push(monthData.completed);
        pending.push(monthData.pending);
        failed.push(monthData.failed);
      }
      break;
      
    case 'yearly':
      // Last 5 years
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        labels.push(year.toString());
        
        const yearData = getPaymentsForPeriod(transactions, new Date(year, 0, 1), 'year');
        completed.push(yearData.completed);
        pending.push(yearData.pending);
        failed.push(yearData.failed);
      }
      break;
  }
  
  return { labels, completed, pending, failed };
}

// Helper function to get payments for a specific period
function getPaymentsForPeriod(transactions, date, period) {
  let startDate, endDate;
  
  switch(period) {
    case 'day':
      startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      break;
    case 'year':
      startDate = new Date(date.getFullYear(), 0, 1);
      endDate = new Date(date.getFullYear() + 1, 0, 1);
      break;
  }
  
  const periodTransactions = transactions.filter(t => {
    const paymentDate = new Date(t.paymentDate);
    return paymentDate >= startDate && paymentDate < endDate;
  });
  
  return {
    completed: periodTransactions.filter(t => t.status === 'completed').length,
    pending: periodTransactions.filter(t => t.status === 'pending').length,
    failed: periodTransactions.filter(t => t.status === 'failed').length
  };
}

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
// Add this temporary debug route to see what's actually in your database
AdminRouter.get("/communities", async (req, res) => {
  try {
    const communities = await Community.find().populate("communityManager");
    const managers = await CommunityManager.find();

    // Calculate statistics using subscriptionStatus field (lowercase values)
    const totalCommunities = communities.length;
    const activeCommunities = communities.filter(c => 
      c.subscriptionStatus && c.subscriptionStatus.toLowerCase() === "active"
    ).length;
    const pendingCommunities = communities.filter(c => 
      c.subscriptionStatus && c.subscriptionStatus.toLowerCase() === "pending"
    ).length;
    
    const topLocations = await Community.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.render("admin/communities", {
      communities, 
      managers,
      totalCommunities,
      activeCommunities,
      pendingCommunities,
      topLocations
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    res.status(500).send("Server Error");
  }
});
// Add this new route to provide JSON data for refresh
AdminRouter.get("/communities/data", async (req, res) => {
  try {
    const communities = await Community.find().populate("communityManager");
    res.json({ communities });
  } catch (error) {
    console.error("Error fetching communities data:", error);
    res.status(500).json({ error: "Server Error" });
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

// In your route file
AdminRouter.get("/staff-management", async (req, res) => {
  try {
    const [residents, security, workers, communities] = await Promise.all([
      Resident.find().populate("community").lean(),
      Security.find().populate("community").lean(),
      Worker.find().populate("community").lean(),
      Community.find({ status: "Active" }).lean()
    ]);

    res.render("admin/staff-management", {
      residents,
      security,
      workers,
      communities,
      initialData: { residents, security, workers } // Pass initial data to client
    });
  } catch (error) {
    console.error("Error fetching staff data:", error);
    res.status(500).send("Server Error");
  }
});
// ===== RESIDENTS API =====
AdminRouter.get("/api/residents", async (req, res) => {
  try {
    const residents = await Resident.find()
      .populate("community", "name _id")
      .select('-password -__v');
    res.json(residents);
  } catch (error) {
    console.error("Error fetching residents:", error);
    res.status(500).json({ error: "Failed to fetch residents" });
  }
});

AdminRouter.get("/api/residents/:id", async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id)
      .populate("community", "name _id")
      .select('-password -__v');
    
    if (!resident) return res.status(404).json({ error: "Resident not found" });
    res.json(resident);
  } catch (error) {
    console.error("Error fetching resident:", error);
    res.status(500).json({ error: "Failed to fetch resident" });
  }
});

AdminRouter.post("/api/residents", async (req, res) => {
  try {
    const requiredFields = [
      'residentFirstname', 'residentLastname', 
      'flatNo', 'blockNo', 'email', 'contact', 'password'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: "Missing required fields",
        missing: missingFields
      });
    }

    const existingResident = await Resident.findOne({ email: req.body.email });
    if (existingResident) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const newResident = new Resident({
      ...req.body,
      password: hashedPassword,
      community: req.body.communityId || null
    });

    await newResident.save();
    res.status(201).json(newResident);
  } catch (error) {
    console.error("Error creating resident:", error);
    res.status(500).json({ error: "Failed to create resident" });
  }
});

AdminRouter.put("/api/residents/:id", async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) return res.status(404).json({ error: "Resident not found" });

    if (req.body.email && req.body.email !== resident.email) {
      const emailExists = await Resident.findOne({ email: req.body.email });
      if (emailExists) return res.status(409).json({ error: "Email already in use" });
    }

    const updateData = { ...req.body };
    if (req.body.password) {
      updateData.password = await bcrypt.hash(req.body.password, saltRounds);
    }

    const updatedResident = await Resident.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password -__v');

    res.json(updatedResident);
  } catch (error) {
    console.error("Error updating resident:", error);
    res.status(500).json({ error: "Failed to update resident" });
  }
});

AdminRouter.delete("/api/residents/:id", async (req, res) => {
  try {
    const resident = await Resident.findByIdAndDelete(req.params.id);
    if (!resident) return res.status(404).json({ error: "Resident not found" });
    res.json({ message: "Resident deleted successfully" });
  } catch (error) {
    console.error("Error deleting resident:", error);
    res.status(500).json({ error: "Failed to delete resident" });
  }
});

// ===== SECURITY API =====
AdminRouter.get("/api/security", async (req, res) => {
  try {
    const security = await Security.find()
      .populate("community", "name _id")
      .select('-password -__v');
    res.json(security);
  } catch (error) {
    console.error("Error fetching security personnel:", error);
    res.status(500).json({ error: "Failed to fetch security personnel" });
  }
});

AdminRouter.get("/api/security/:id", async (req, res) => {
  try {
    const security = await Security.findById(req.params.id)
      .populate("community", "name _id")
      .select('-password -__v');
    
    if (!security) return res.status(404).json({ error: "Security personnel not found" });
    res.json(security);
  } catch (error) {
    console.error("Error fetching security personnel:", error);
    res.status(500).json({ error: "Failed to fetch security personnel" });
  }
});

AdminRouter.post("/api/security", async (req, res) => {
  try {
    const requiredFields = ['name', 'email', 'contact', 'address', 'Shift', 'password'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: "Missing required fields",
        missing: missingFields
      });
    }

    const existingSecurity = await Security.findOne({ email: req.body.email });
    if (existingSecurity) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const newSecurity = new Security({
      ...req.body,
      password: hashedPassword,
      community: req.body.communityId || null
    });

    await newSecurity.save();
    res.status(201).json(newSecurity);
  } catch (error) {
    console.error("Error creating security personnel:", error);
    res.status(500).json({ error: "Failed to create security personnel" });
  }
});

AdminRouter.put("/api/security/:id", async (req, res) => {
  try {
    const security = await Security.findById(req.params.id);
    if (!security) return res.status(404).json({ error: "Security personnel not found" });

    if (req.body.email && req.body.email !== security.email) {
      const emailExists = await Security.findOne({ email: req.body.email });
      if (emailExists) return res.status(409).json({ error: "Email already in use" });
    }

    const updateData = { ...req.body };
    if (req.body.password) {
      updateData.password = await bcrypt.hash(req.body.password, saltRounds);
    }

    const updatedSecurity = await Security.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password -__v');

    res.json(updatedSecurity);
  } catch (error) {
    console.error("Error updating security personnel:", error);
    res.status(500).json({ error: "Failed to update security personnel" });
  }
});

AdminRouter.delete("/api/security/:id", async (req, res) => {
  try {
    const security = await Security.findByIdAndDelete(req.params.id);
    if (!security) return res.status(404).json({ error: "Security personnel not found" });
    res.json({ message: "Security personnel deleted successfully" });
  } catch (error) {
    console.error("Error deleting security personnel:", error);
    res.status(500).json({ error: "Failed to delete security personnel" });
  }
});

// ===== WORKERS API =====
AdminRouter.get("/api/workers", async (req, res) => {
  try {
    const workers = await Worker.find()
      .populate("community", "name _id")
      .select('-password -__v');
    res.json(workers);
  } catch (error) {
    console.error("Error fetching workers:", error);
    res.status(500).json({ error: "Failed to fetch workers" });
  }
});

AdminRouter.get("/api/workers/:id", async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate("community", "name _id")
      .select('-password -__v');
    
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    res.json(worker);
  } catch (error) {
    console.error("Error fetching worker:", error);
    res.status(500).json({ error: "Failed to fetch worker" });
  }
});

AdminRouter.post("/api/workers", async (req, res) => {
  try {
    const requiredFields = [
      'name', 'email', 'contact', 'address', 
      'jobRole', 'salary', 'password'
    ];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: "Missing required fields",
        missing: missingFields
      });
    }

    const existingWorker = await Worker.findOne({ email: req.body.email });
    if (existingWorker) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const newWorker = new Worker({
      ...req.body,
      password: hashedPassword,
      community: req.body.communityId || null
    });

    await newWorker.save();
    res.status(201).json(newWorker);
  } catch (error) {
    console.error("Error creating worker:", error);
    res.status(500).json({ error: "Failed to create worker" });
  }
});

AdminRouter.put("/api/workers/:id", async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: "Worker not found" });

    if (req.body.email && req.body.email !== worker.email) {
      const emailExists = await Worker.findOne({ email: req.body.email });
      if (emailExists) return res.status(409).json({ error: "Email already in use" });
    }

    const updateData = { ...req.body };
    if (req.body.password) {
      updateData.password = await bcrypt.hash(req.body.password, saltRounds);
    }

    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password -__v');

    res.json(updatedWorker);
  } catch (error) {
    console.error("Error updating worker:", error);
    res.status(500).json({ error: "Failed to update worker" });
  }
});

AdminRouter.delete("/api/workers/:id", async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    res.json({ message: "Worker deleted successfully" });
  } catch (error) {
    console.error("Error deleting worker:", error);
    res.status(500).json({ error: "Failed to delete worker" });
  }
});
export default AdminRouter;