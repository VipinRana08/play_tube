import mongoose, { isValidObjectId } from "mongoose";
import {Comment} from "../models/comment.model.js";
import {ApiError} from "../utils/ApiErrors.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const {page = 1, limit = 10} = req.query;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID");
    }

    const paginationOptions = {
        page:parseInt(page),
        limit:parseInt(limit),
        sort:{createdAt:"desc"},
        customLabels:{
                docs:"comments"
            }
    };
    const pipeline = [
        {
            $match: { video: videoId } 
        }
    ];
    const comments = await Comment.aggregatePaginate(
        Comment.aggregate(pipeline),
        paginationOptions
    );

    if(!comment){
        throw new ApiError(404, "No comments Found! 😢");
    }

    return res.status(200).json(new ApiResponse(
        200,
        { comments },
        "Comments fetched successfully!"
    ));
});

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID!");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Field is required!");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    });

    return res.status(201).json(new ApiResponse(
        201,
        { comment },
        "Comment added successfully!"
    ));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment ID!");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Field should not be empty!");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { content },
        { new: true }
    );

    if (!updatedComment) {
        throw new ApiError(404, "Comment not found!");
    }
    return res.status(200).json(new ApiResponse(
        200,
        { updatedComment },
        "Comment has been updated successfully!"
    ));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment ID!");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found!");
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully!"));
});

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    };