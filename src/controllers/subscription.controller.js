import mongoose, {isValidObjectId} from "mongoose";
import {User} from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    if(!isValidObjectId(channelId)){
        throw new ApiErrors(400, "Invalid channel ID!");
    }

    const channel = await User.findById(channelId);
    if(!channel){
        throw new ApiErrors(404, "Channel not found!");
    }
    console.log("user: ", req.user._id);
    const existingSubscription  = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });
    console.log("Existing: ", existingSubscription);
    if(!existingSubscription ){
        await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        });
    }else{
        await Subscription.deleteOne({
            subscriber: req.user._id,
            channel: channelId
        });
    }

    const totalSubscription = await Subscription.countDocuments({
        subscriber: req.user._id
    });


    return res.status(200).json(new ApiResponse(
        200, 
        {
            totalSubscription,
            isSubscribed: !existingSubscription
        },
        "Subscription has been toggled successfully!"
    ));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiErrors(400, "Invalid channel ID!");
    }

    const channel = await User.findById(channelId);
    if(!channel){
        throw new ApiErrors(404, "Channel not found!");
    }
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    const channelSubscribers = await Subscription
    .find({channel: channelId})
    .populate("subscriber", "-_id username")
    .select("-_id -channel")
    .lean();

    return res.status(200).json(new ApiResponse(
        200,
        { totalSubscribers, channelSubscribers},
        "Total subscribers fetched successfully!"
    ));
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    // const { subscriberId } = req.user._id;

    // if(!isValidObjectId(subscriberId)){
    //     throw new ApiErrors(400, "Invalid subscriber ID!");
    // }

    const user = await User.findById(req.user._id);
    if(!user){
        throw new ApiErrors(404, "User not found!");
    }

    const totalSubscription = await Subscription.countDocuments({ subscriber: req.user._id });

    const subscribedChannels = await Subscription
    .find({ subscriber: req.user._id })
    .populate("channel", "username avatar")
    .select("-_id -subscriber").lean();


    return res.status(200).json(new ApiResponse(
        200,
        { totalSubscription, subscribedChannels },
        "Total subscribed channel has been fetched successfully!"
    ));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};