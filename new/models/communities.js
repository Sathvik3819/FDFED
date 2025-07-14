import mongoose from "mongoose";

const CommunitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  location: { type: String, required: true },
  description: { type: String },
  email: { type: String, required: true, unique: true },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  totalMembers: { type: Number, default: 0 },
  
  // Subscription fields
  subscriptionPlan: {
    type: String,
    enum: ['basic', 'standard', 'premium'],
    default: 'basic',
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'pending', 'expired'],
    default: 'pending',
  },
  planStartDate: Date,
  planEndDate: Date,
  
  // Legacy payment history (keep for backward compatibility)
  paymentHistory: [{
    date: Date,
    amount: Number,
    method: String,
    transactionId: String,
    invoiceUrl: String
  }],
  
  // NEW: Detailed subscription history (matches your route code)
  subscriptionHistory: [{
    transactionId: { type: String, required: true },
    planName: { type: String, required: true },
    planType: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    paymentDate: { type: Date, required: true },
    planStartDate: { type: Date, required: true },
    planEndDate: { type: Date, required: true },
    duration: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'pending' },
    isRenewal: { type: Boolean, default: false },
    processedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "CommunityManager",
      required: true 
    },
    metadata: {
      userAgent: String,
      ipAddress: String
    }
  }],
  
  // Reference to community manager
  communityManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CommunityManager"
  }
}, { 
  timestamps: true 
});

// Add index for better query performance
CommunitySchema.index({ subscriptionStatus: 1, planEndDate: 1 });
CommunitySchema.index({ 'subscriptionHistory.paymentDate': -1 });
// Add virtual property to check if subscription is expired
CommunitySchema.virtual('isExpired').get(function() {
  if (!this.planEndDate || !this.subscriptionStatus) return true;
  return this.subscriptionStatus === 'expired' || 
         (this.subscriptionStatus === 'active' && new Date() > new Date(this.planEndDate));
});

// Add virtual property to check if subscription is expiring soon (within 7 days)
CommunitySchema.virtual('isExpiringSoon').get(function() {
  if (!this.planEndDate || this.subscriptionStatus !== 'active') return false;
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  return new Date(this.planEndDate) <= sevenDaysFromNow;
});

// Add method to update subscription status
CommunitySchema.methods.updateSubscriptionStatus = function() {
  if (this.planEndDate && new Date() > new Date(this.planEndDate)) {
    this.subscriptionStatus = 'expired';
  }
  return this;
};
const Community = mongoose.model("Community", CommunitySchema);
export default Community;