import dotenv from "dotenv";
import connectDB from "./db/connectdb.js";

dotenv.config({
    path: './.env'
});

connectDB();