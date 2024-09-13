import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({

    video: {
        type: Schema.Types.ObjectId,
        res: "Video"
    },
    comment: {
        type: Schema.Types.ObjectId,
        res: "Comment"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        res: "Tweet"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        res: "User"
    },
    

}, {timestamps: true});


export const Like = mongoose.model("Like", likeSchema);