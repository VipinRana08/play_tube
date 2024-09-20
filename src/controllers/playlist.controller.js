import mongoose, {isValidObjectId} from "mongoose";
import {Playlist} from "../models/playlist.model.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import {Video} from "../models/video.model.js";


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body;

    if ([name, description].some((field) => field.trim() === "")) {
        throw new ApiError(400, "All fields are required!");
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id
    });

    if(!playlist){
        throw new ApiErrors(500, "An error occurred while creating playlist!");
    }

    return res.status(201).json(new ApiResponse(
        201,
        { playlist },
        "PlayList created successfully!"
    ));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    
    if(!isValidObjectId(userId)){
        throw new ApiErrors(400, "Invalid user ID!");
    }

    const userPlaylists = await Playlist.find({ owner: userId });

    if (userPlaylists.length === 0) {
        throw new ApiErrors(404, "No playlists found!");
    }

    return res.status(200).json(new ApiResponse(
        200,
        { userPlaylists },
        "User playlist fetched successfully!"
    ));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiErrors(400, "Invalid playlist ID!");
    }
    
    const playlist  = await Playlist.findById(playlistId);

    if(!playlist ){
        throw new ApiErrors(404, "No playlist found!");
    }

    return res.status(200).json(new ApiResponse(
        200,
        { playlist },
        "PlayList fetched successfully!"
    ));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiErrors(400, "Invalid IDs!");
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiErrors(404, "No video found!");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiErrors(404, "No playlist found!");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: { video: videoId }
        }, {new: true}
    );

    return res.status(200).json(new ApiResponse(
        200,
        { updatedPlaylist },
        "Video successfully added to PlayList"
    ));

});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;
    
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiErrors(400, "Invalid IDs!");
    }

    const updatedPlaylist  = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { video: videoId }
        }, {new: true}
    );

    if (!updatedPlaylist) {
        throw new ApiErrors(404, "Playlist not found!");
    }

    return res.status(200).json(new ApiResponse(
        200,
        { updatedPlaylist },
        "Video has been removed from PlayList successfully!"
    ));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    
    if(!isValidObjectId(playlistId)){
        throw new ApiErrors(400, "Invalid Playlist ID!");
    }

    const playList = await Playlist.findByIdAndDelete(playlistId);

    if(!playList){
        throw new ApiErrors(404, "Playlist does not exist!");
    }

    return res.status(200).json(new ApiResponse(200, {}, "PlayList removed successfully!"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    const {name, description} = req.body;
    
    if(!isValidObjectId(playlistId)){
        throw new ApiErrors(400, "Invalid playList ID!");
    }
    if(!name?.trim() === "" || !description?.trim() === ""){
        throw new ApiErrors(400, "All fields are required!");
    }

    const updatedPlaylist  = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        }, {new: true}
    );

    if(!updatedPlaylist) {
        throw new ApiErrors(404, "Playlist not found!");
    }

    return res.status(200).json(new ApiResponse(
        200,
        { updatedPlaylist },
        "PlayList updated successfully!"
    ));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}