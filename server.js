import express, { urlencoded } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cookieParser from "cookie-parser";
import authRoutes from "./routes/user.routes.js";


dotenv.config();


connectDB();

const app = express();

//middleware
app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

//routes
app.use("/api", authRoutes);

//server start 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});