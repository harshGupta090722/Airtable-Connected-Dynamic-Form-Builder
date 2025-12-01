import mongoose from "mongoose";

const userSchema=new mongoose.Schema(
     {
    airtableUserId: {
      type: String,
      required: true,
      unique: true,  
    },
    email: {
      type: String,
    },
    name: {
      type: String,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    tokenExpiresAt: {
      type: Date,
      required: true,
    }
  },
    {timestamps:true}
);


const User=mongoose.model("User",userSchema);

export default User;