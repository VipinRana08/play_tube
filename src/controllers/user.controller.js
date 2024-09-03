import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler ( async (req, res) => {
    
    // get user details from user 
    // validation to check wether shared all required fields
    // check if user alreday exists or not : username or email 
    // check for images avatar and coverimage based on requirement 
    // upload them to cloudinary , we will get response and check weather everything is fine and store 
    // create user object for mongodb, will create entry in db
    // we will take response from db and will hide password and referesh tokens
    // check for user creation 
    // return res

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
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    console.log("avatarLocalPath: ", avatarLocalPath);

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

export { registerUser };