import mongoose, {isValidObjectId} from "mongoose";
import {Video} from "../models/video.model.js";
import {Subscription} from "../models/subscription.model.js";
import {Like} from "../models/like.model.js";
import {ApiErrors} from "../utils/ApiErrors.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {

    const { channelId } = req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiErrors(400, "Invalid channel ID!");
    }

    const totalVideos = await Video.countDocuments({ owner: channelId });

    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    const totalViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId),
                views: { $gt: 0 } // Only count videos with views greater than 0
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" }
            }
        },
        {
            $project: {
                _id: 0,
                totalViews: 1
            }
        }
    ]);
    const totalVideoViews = totalViews.length > 0 ? totalViews[0].totalViews : 0;

    const totalLikes = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id", 
                as: "allVideos"
            }
        },
        {
            $unwind: "$allVideos"
        },
        {
            $match: {
                "allVideos.owner": new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalVideosLikes: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                totalVideosLikes: 1
            }
        }
    ]);
    const totalVideosLikes = totalLikes.length > 0 ? totalLikes[0].totalVideosLikes : 0;

    const channelStats = [
        totalSubscribers,
        totalVideos,
        totalVideoViews,
        totalVideosLikes
    ];

    return res.status(200).json(new ApiResponse(
        200,
        { channelStats },
        "Channel stats fetched successfully!"
    ));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if(!isValidObjectId(channelId)){
        throw new ApiErrors(400, "Invalid channel ID!");
    }

    const paginationOptions = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: "desc" },
        customLabels: {
            docs: "videos"
        }
    };
    const pipeline = [
        {
            $match: { owner: new mongoose.Types.ObjectId(channelId) }  
        }
    ];

    const videos = await Video.aggregatePaginate(
        Video.aggregate(pipeline),
        paginationOptions
    );

    return res.status(200).json(new ApiResponse(
        200,
        { videos },
        "Videos fetched successfully"
    ));
});

export {
    getChannelStats, 
    getChannelVideos
    };