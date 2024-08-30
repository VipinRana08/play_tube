import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
})); 

app.use(express.json({limit: "15kb"})); 

app.use(express.urlencoded({extended: true})); 

app.use(express.static("public")); 

app.use(cookieParser());

// Routes import

import userRouter from "../src/routes/user.routes.js";

// route declaration 

app.use("/api/v1/users", userRouter);

export { app };