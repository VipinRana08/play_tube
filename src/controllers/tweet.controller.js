import mongoose, { isValidObjectId } from "mongoose";
import {Tweet} from "../models/tweet.model.js";
import {User} from "../models/user.model.js";
import {ApiErrors} from "../utils/ApiErrors.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if(!content){
        throw new ApiErrors(400, "Content is required!");
    }
    
    if(!isValidObjectId(req.user._id)){
        throw new ApiErrors(400, "Invalid user ID!");
    }

    const user = await User.findById(req.user._id);
    if(!user){
        throw new ApiErrors(404, "User not found!");
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    });
    
    return res.status(201).json(new ApiResponse(
        201,
        { tweet },
        "Tweet has been successfully created!"
    ));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiErrors(400, "Invalid user ID!");
    }

    const tweets = await Tweet.find({ owner: userId});

    return res.status(200).json(new ApiResponse(
        200,
        { tweets },
        "Tweet fetched successfully!"
    ));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    
    if(!isValidObjectId(tweetId)){
        throw new ApiErrors(400, "Invalid tweet ID!");
    }

    if(!content){
        throw new ApiErrors(400, "Content is required!");
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        }, { new: true}
    ); 

    if(!tweet) {
        throw new ApiErrors(404, "Tweet not found!");
    }

    return res.status(200).json(new ApiResponse(
        200,
        { tweet },
        "Tweet has been updated successfully!"
    ));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiErrors(400, "Invalid tweet ID!");
    }
    const tweet = await Tweet.findByIdAndDelete(tweetId);

    if (!tweet) {
        throw new ApiErrors(404, "Tweet not found!");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully!"));
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
};