import dotenv from "dotenv";
import connectDB from "./db/connectdb.js";
import { app } from "./app.js";

dotenv.config({
    path: './.env'
});

connectDB()
.then( () => {
    app.listen(process.env.PORT || 7000, () => {
        console.log(`⚙ Server is running at port : ${process.env.PORT}`)
    })
})
.catch( (error) => {
    console.log("MongoDB Connection Failed ❌ !!!", error);
});