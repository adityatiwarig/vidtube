import {asyncHandler} from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import  {uploadOnCloudinary } from "../utils/cloudinary.js"; 
import  apiResponse  from "../utils/apiResponse.js";


const registerUser = asyncHandler(async (req, res) => {     
    const {fullName,email,password , username} = req.body    // REQ.BODY SE EXTRACT
    console.log("email: ",email);

    if(
        [fullName ,email,username,password].some ((field) =>     // AGR KOI FILED EMPTY TO 400
        field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")
    }
    
    const existedUser = await User.findOne({
        $or : [{ username } , {email}]        // kya koi maatch kr rha hai username ya email
    })
    
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")  // 409 conflict error
    }

    // console.log(req.files);
   
   // jaise req.body data ka acccess deta hai waiseii req.files multer acess

    const avatarLocalPath = req.files?.avatar[0]?.path;  // localpath KO EXTRACT KRELA
    
    //multer ne wo file le hai and use apne server pe lete aaya hai

    // avatar[0] ye pehla obj hai to iska path mil jayega ho skta h n bhi mile

    const coverImageLocalPath = req.files?.coverImage[0]?.path;  //file ka naam coverImg


    if(!avatarLocalPath){                 // AGR NA MILAL TA ERROR RETURN KRI

        throw new ApiError(400, "Avatar file required!!")

    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError (400 , "Avatar file is required!!");  
    }


    const user  = await User.create({    // MYA USER BNATA HAI
        fullName,                        // FULLNAME AS IT IS SAVE
        avatar :avatar.url,              // UPLOAD KE BAAD KA URL
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase(),  // LOWERCASE , SENSITIVE CASE SE BACHNE K LIYE
    })

    const createdUser  =  await User.findById(user._id).select(  // USER KA COPY FETCH KR RHI
        "-password -refreshToken"                               // PR PASS AND REFRESHTOKEN EXCLUDE KRRHI
    )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(   // NEW USER CREATE KE BAAD NEW JSON RESPONSE
        new apiResponse(200,createdUser,"User registered successfully")
    )

});

export default registerUser;       // async func ka use to default kro
