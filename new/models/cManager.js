import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";
import CommonSpaces from "./commonSpaces.js";
import Issue from "./issues.js";
import Payment from "./payment.js";
import VisitorPreApproval from "./preapproval.js";
import Resident from "./resident.js";
import Worker from "./workers.js";
import Security from "./security.js";

const communityManagerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    image:String,
    password:{
      type:String
  },
    contact: { type: String, required: true },
    assignedCommunity: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Community", 
      required: false // A manager must always be assigned a community
    }
  },
  { timestamps: true } 
);
communityManagerSchema.pre('remove', async function (next) {
  try {
    // Find communities created by this manager
    const communities = await Community.find({ CommunityManager: this._id });

    // Get their IDs
    const communityIds = communities.map(c => c._id);

    // Delete users related to those communities
    await CommonSpaces.deleteMany({ community: { $in: communityIds } });
     await Issue.deleteMany({ community: { $in: communityIds } });
 await Payment.deleteMany({ communityId: { $in: communityIds } });
 await Resident.deleteMany({ community: { $in: communityIds } });
 await Security.deleteMany({ communityAssigned: { $in: communityIds } });
 await Worker.deleteMany({ communityAssigned: { $in: communityIds } });
 await VisitorPreApproval.deleteMany({ community: { $in: communityIds } });


    // Delete the communities
    await Community.deleteMany({ managerId: this._id });

    next();
  } catch (err) {
    next(err);
  }
});


const CommunityManager = mongoose.model("CommunityManager", communityManagerSchema);

export default CommunityManager;
