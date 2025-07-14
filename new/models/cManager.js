import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";


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



const CommunityManager = mongoose.model("CommunityManager", communityManagerSchema);

export default CommunityManager;
