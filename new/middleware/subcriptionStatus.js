// middleware/subscriptionCheck.js
import Community from '../models/communities.js';

const checkSubscriptionStatus = async (req, res, next) => {
  try {
    const excludedRoutes = [
      '/login', 
      '/logout', 
      '/subscription-expired',
      '/communityStatus',
      '/css/',
      '/js/',
      '/images/',
      // Add other static assets and excluded routes
    ];

    // Skip for excluded routes
    if (excludedRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    // Skip for unauthenticated users
    if (!req.user) {
      return next();
    }

    // 🚨 Skip check for admin & community manager
    if (['Admin', 'CommunityManager'].includes(req.user.userType)) {
      return next();
    }

    // Only check subscription for users tied to a community
    if (!req.user.community) {
      return next();
    }

    const community = await Community.findById(req.user.community);

    if (!community) {
      return res.status(404).render('error', { 
        message: 'Community not found',
        error: { status: 404 }
      });
    }

    if (community.subscriptionStatus === 'expired') {
      console.log(community.subscriptionStatus)
      return res.render('subscriptionExpired', {
        user: req.user,
        community
      });
    }

    res.locals.communityStatus = community.subscriptionStatus;
    res.locals.community = community;

    next();
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return res.status(500).render('error', { 
      message: 'Server error while checking subscription',
      error: { status: 500 }
    });
  }
};

export default checkSubscriptionStatus;
