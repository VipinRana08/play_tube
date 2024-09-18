import mongoose, {isValidObjectId} from "mongoose";
import {Video} from "../models/video.model.js";
import {User} from "../models/user.model.js";
import {ApiErrors} from "../utils/ApiErrors.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    
    const sortOptions = {
        [sortBy] : sortType
    }
    const paginationOptions = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortOptions,
        userId: isValidObjectId(userId),
        customLables: {
            docs: "videos"
        }
    }
    
    const videoQuery = isValidObjectId(userId) ? [{ $match: { userId } }] : [{ $match: {} }];
    // console.log("query: ",videoQuery);
    const videos = await Video.aggregatePaginate(videoQuery, paginationOptions);

    if(!videos){
        throw new ApiErrors(404, "No video Found 😢");
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        { videos },
        "Videos fetched successfully !!!"
    ));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body;

    if(!title || !description){
        throw new ApiErrors(400, "All fileds are required!");
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoFileLocalPath || !thumbnailLocalPath){
        throw new ApiErrors(500, "Error occurred while uploading files!");
    }

    const video = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!video || !thumbnail){
        throw new ApiErrors(500, "Error occurred during file upload!");
    }

    const videoFileReference = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title,
        description,
        owner: req.user._id,
        duration: video.duration
    });

    const publishedFile = await Video.findById(videoFileReference._id);
    if(!publishedFile){
        throw new ApiErrors(500, "Error occurred while saving the video! 😢");
    }

    return res.status(200)
    .json(new ApiResponse(200, publishedFile, "Video published successfully !!!"));

});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    if(!isValidObjectId(videoId)){
        throw new ApiErrors(400, "Invalid video ID parameter!");
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiErrors(404, "Video not found 😢");
    }

    return res.status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const {title, description} = req.body;

    if(!isValidObjectId(videoId)){
        throw new ApiErrors(400, "Invalid video ID parameter!");
    }
    if(!title || !description){
        throw new ApiErrors(400, "All fields are required!");
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiErrors(404, "Video not found 😢");
    }

    let updatedData = { title, description };
    // will check for the thumbnail if provided then will update 
    if (req.files?.thumbnail?.[0]?.path) {
        const thumbnailLocalPath = req.files.thumbnail[0].path;
        
        // Upload the new thumbnail to Cloudinary
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if (!thumbnail) {
            throw new ApiErrors(500, "Error occurred during thumbnail upload!");
        }

        // Add the thumbnail URL to the updated data
        updatedData.thumbnail = thumbnail.url;
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        $set: updatedData
    }, {new: true});

    return res.status(200)
    .json(new ApiResponse(200, updatedVideo, "Video details are updated successfully"));

});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    if(!isValidObjectId(videoId)){
        throw new ApiErrors(400, "Invalid video ID parameter!");
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiErrors(404, "Video not found 😢");
    }

    // Optional: Check if the user has permission to delete the video (e.g., check if user is the owner)
    if (req.user._id.toString() !== video.owner.toString()) {
        throw new ApiErrors(403, "You are not authorized to delete this video");
    }

    await video.deleteOne();  // Directly remove the document

    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiErrors(400, "Invalid video ID parameter!");
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiErrors(404, "Video not found 😢");
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        }, {new: true}
    );

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            { isPublished: updatedVideo.isPublished },
            "Video publish status toggled successfully"
        )
    );
        
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}