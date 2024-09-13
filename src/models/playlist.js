import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({

    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    videos:[
        {
            type: Schema.Types.ObjectId,
            res: "Video"
        }
    ],
    
    owner: {
        type: Schema.Types.ObjectId,
        res: "User"
    },
    

}, {timestamps: true});


export const Playlist = mongoose.model("PlayList", playlistSchema);