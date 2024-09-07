import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type : mongoose.Types.ObjectId,
            ref : "User"
        },
        channel: {
            type : mongoose.Types.ObjectId,
            ref : "User"
        }
    },
    { timestamps : true}

)

export const Subcription = mongoose.model("Subcription", subscriptionSchema)