import mongoose from "mongoose";



const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    password:{
      type:String
  }
    }
  
);



const admin = mongoose.model("admin", adminSchema);

export default admin;
