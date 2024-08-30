import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

(async function(){
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        
        if(!localFilePath) return "didn't find the path 😢";
        // uploading file on the cloudinary
        const response = await coudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        // file is uploaded on cloudinary 
        console.log("File is uploaded on cloudinary", response.url);
        
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath);
        return "issue with uploading";
    }
}

export { uploadOnCloudinary };