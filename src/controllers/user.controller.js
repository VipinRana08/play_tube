import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Mongoose } from "mongoose";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiErrors(500, "Something went wrong while generating tokens !!!");
    }
};

const options = {
    httpOnly: true,
    secure: true
};

const registerUser = asyncHandler ( async (req, res) => {

    const { username, fullname, email, password } = req.body;

    if(
        [username, fullname, email, password].some((field) => field.trim() === "")
    ){
        throw new ApiErrors(400, "All fields are required !!!");
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    });

    if(existedUser){
        throw new ApiErrors(409," User is alreday exists");
    }

    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    console.log("avatarLocalPath: ", avatarLocalPath);

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)
         && req.files.coverImage.length > 0){
            coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiErrors(400, "Avatar file is required !!!");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    
    if(!avatar){
        throw new ApiErrors(400, "Avatar file is required !!!");
    }
    console.log("avatar: ", avatar);
    const user = await User.create({
        username: username.toLowerCase(),
        fullname,
        password,
        avatar: avatar?.url || "",
        coverImage: coverImage?.url || "",
        email
    } );

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
        throw new ApiErrors(500, "Something went wrong while registering the user !!!");
    }

    return res.status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully !!!"));
});

const  loginUser = asyncHandler ( async (req, res) => {

    const {username, email, password} = req.body;

    if(!(username || email)){
        throw new ApiErrors(400, "username or email is required !!!");
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    });

    if(!user){
        throw new ApiErrors(404, "User does not exist !!!");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiErrors(401, "Invalid user credentials !!!");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200,
        {
           user: loggedInUser, 
           accessToken,
           refreshToken 
        },
        "User logged in successfully"
    ));

});

const logoutUser = asyncHandler ( async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully !!!"));
});

const refreshAccessToken = asyncHandler ( async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken ;

    if(!incomingRefreshToken){
        throw new ApiErrors(401, "Unauthorized request !!!");
    }

    const decodedToekn = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log("incomingToken : ", incomingRefreshToken);

    const user = await User.findById(decodedToekn?._id).select("-password");
    console.log("db token: ", user.refreshToken);

    if(incomingRefreshToken !== user.refreshToken){
        throw new ApiErrors(401, "Refresh token is expired !!!");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200, 
        {accessToken, refreshToken},
        "Access Token refreshed successfully !!!"
    ));

});

const updateCurrentPassword = asyncHandler ( async (req, res) => {

    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiErrors(400, "Password is invalid !!!");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false});

    return res.status(200).json(new ApiResponse(200, {}, "Password has been changed successfully !!!"));
});

const getCurrentUser = asyncHandler ( async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully !!!"));

});

const updateAccountDetails = asyncHandler ( async (req, res) => {
    const {fullname, email} = req.body;

    if(!fullname || !email){
        throw new ApiErrors(400, "All fileds are required !!!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        { new: true }
    ).select("-password -refreshToekn");

    return res.status(200).json(new ApiResponse(
        200,
        user,
        "Account details has been updated successfully !!!"
    ));
});

const updateUserAvatar = asyncHandler ( async (req, res) => {

    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiErrors(400, "Avatar file is missing !!!");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar){
        throw new ApiErrors(400, "Error while uploading avatar !!!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true}
    );

    return res.status(200).json(new ApiResponse(200,user,"Avatar updated successfully !!!"));
});

const updateUserCoverImage = asyncHandler ( async (req, res) => {

    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiErrors(400, "CoverImage file is missing !!!");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage){
        throw new ApiErrors(400, "Error while uploading cover image !!!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true}
    );

    return res.status(200).json(new ApiResponse(200,user,"Cover image updated successfully !!!"));
});

const getUserChannelProfile = asyncHandler ( async () => {

    const {username} = req.params;

    if(!username){
        throw new ApiErrors(400, "Username is missing !!!");
    }

    const channel = User.aggregate([
        {
            $match: {
                username: username.trim().toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subcriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subcriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                username: 1,
                fullname: 1,
                email: 1,   
            }
        }
    ]);

    if(!channel?.length){
        throw new ApiErrors(400, "Channel does not exists !!!");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        channel[0],
        "User channel fetched successfully !!!"
    ));

});

const getWatchHistory = asyncHandler ( async () => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                } 
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
            
        }
    ]);

    return res.status(200)
    .json(new ApiResponse(
        200, user[0].watchHistory, "Watch History fetch successfully"));
});

export { registerUser,
        loginUser, 
        logoutUser, 
        refreshAccessToken, 
        updateCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile,
        getWatchHistory
        };