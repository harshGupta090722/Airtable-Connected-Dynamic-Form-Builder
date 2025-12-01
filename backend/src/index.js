import express from "express";
import dotenv, { config } from "dotenv";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";


import authRoutes from "./routes/authRoutes.js";
import airtableRoutes from "./routes/airtableRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import responseRoutes from "./routes/responseRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

dotenv.config();

connectDB();

const app=express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,        
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,                    
  })
);

app.use(express.json());

app.use(cookieParser());

app.use("/auth/airtable", authRoutes);
app.use("/api/airtable", airtableRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/forms", responseRoutes);
app.use("/webhooks", webhookRoutes);


const port=process.env.PORT;

app.listen(port,()=>{
  console.log(`Server is running on port ${port}`);
})