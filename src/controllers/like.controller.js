import mongoose, {isValidObjectId} from "mongoose";
import {Like} from "../models/like.model.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import {Video} from "../models/video.model.js";
import {Comment} from "../models/comment.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    
    if(!isValidObjectId(videoId)){
        throw new ApiErrors(400, "Invalid video ID!");
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiErrors(404, "Video not found!");
    }

    const existingLike = await Like.findOne(
        {
            video: videoId,
            likedBy: req.user._id
        }
    );
    
    if(!existingLike){
        await Like.create({ video: videoId, likedBy: req.user._id });
    }else{
        await Like.deleteOne({ video: videoId, likedBy: req.user._id });
    }

    const totalLikes = await Like.countDocuments({ video: videoId });

    return res.status(200).json(new ApiResponse(
        200,
        {
            Liked: !existingLike,
            totalLikes
        },
        "Like has been toggled successfully!"
    ));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    
    if(!isValidObjectId(commentId)){
        throw new ApiResponse(400, "Invalid comment ID!");
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiErrors(404, "Comment not found!");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    });

    if(!existingLike){
        await Like.create({ comment: commentId, likedBy: req.user._id });
    }else{
        await Like.deleteOne({ comment: commentId, likedBy: req.user._id });
    }

    const totalLikes = await Like.countDocuments({ comment: commentId });

    return res.status(200).json(new ApiResponse(
        200,
        {
            liked: !existingLike,
            totalLikes
        },
        "Like has been toggled successfully!"
    ));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    
    if(!isValidObjectId(tweetId)){
        throw new ApiResponse(400, "Invalid tweet ID!");
    }

    const tweet = await Comment.findById(tweetId);
    if(!tweet){
        throw new ApiErrors(404, "Tweet not found!");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    });

    if(!existingLike){
        await Like.create({ tweet: tweetId, likedBy: req.user._id });
    }else{
        await Like.deleteOne({ tweet: tweetId, likedBy: req.user._id });
    }

    const totalLikes = await Like.countDocuments({ tweet: tweetId });

    return res.status(200).json(new ApiResponse(
        200,
        {
            liked: !existingLike,
            totalLikes
        },
        "Like has been toggled successfully!"
    ));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.find({
        likedBy: req.user._id,
        video: {
            $exists: true  
        }
    }).populate("video");

    return res.status(200).json(new ApiResponse(
        200,
        { likedVideos },
        "All liked videos fetched successfully!"
    ));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}