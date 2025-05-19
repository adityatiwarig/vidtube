import {asyncHandler} from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import  {uploadOnCloudinary } from "../utils/cloudinary.js"; 
import  apiResponse  from "../utils/apiResponse.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save({ validateBeforeSave: false })

        return {accessToken , refreshToken}
        
    } catch (error) {

        throw new ApiError(500,"Something went wrong..")
        
    }
}

const registerUser = asyncHandler(async (req, res) => {    

    const {fullName, email, password , username} = req.body;  // REQ.BODY SE EXTRACT

    if(
        [fullName ,email,username,password].some ((field) =>     // AGR KOI FILED EMPTY TO 400
        field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")
    }

    // console.log("EXISTED USED: ",existedUser);
    
    const existedUser = await User.findOne({
        $or : [{ username } , {email}]        // kya koi maatch kr rha hai username ya email
    })
    
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")  // 409 conflict error
    }

    console.log(req.files);
    

     
   
   // jaise req.body data ka acccess deta hai waiseii req.files multer acess

    const avatarLocalPath = req.files?.avatar[0]?.path;// localpath KO EXTRACT KRELA

    //multer ne wo file le hai and use apne server pe lete aaya hai

    // avatar[0] ye pehla obj hai to iska path mil jayega ho skta h n bhi mile

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;  //file ka naam coverImg

    let coverImageLocalPath ;
    
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    // console.log("Avatar Path:", avatarLocalPath);   // isme file ka loc aayega public--temp
    // console.log("REQ. FILES: " ,req.files);         // isme file ka data aaeyga



    if(!avatarLocalPath){                 // AGR NA MILAL TA ERROR RETURN KRI
        throw new ApiError(400, "Avatar file required!!")

    }

     // yha se AB CLOUDINARY.JS PADH K SAMJH KI KYA OR KU LIKHA H

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError (400 , "Avatar file is required!!");  
    }


    const user  = await User.create({    // nYA USER BNATA HAI
        fullName,                        // FULLNAME AS IT IS SAVE
        avatar : avatar.url,              // UPLOAD KE BAAD KA URL
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

const loginUser = asyncHandler(async(req,res) => {
    //req body -> data
    // username , email
    // find the user
    // password check
    //  access and refresh tiken
    // send cookie


    const {username,password,email} = req.body;        //STEP1

    if(!username && !email ){
        throw new ApiError(400,"username or email required")     //STEP2
    }

    const user = await User.findOne({           //STEP3
        $or : [{username},{email}]             // DONO ME SE KOI EK MIL JAYE
    })

    if(!user){
        throw new ApiError(404,"User dont exist..")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);  // PASSWORD WO WALA JO DIYE THE

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credientials.")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select
    ("-password -refreshToken")

    const options ={
        httpOnly : true,
        secure : true,
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken , options)
    .json(
        new apiResponse(
            200,
            {
                user : loggedInUser,accessToken,refreshToken
            },
            "User loggedIn successfully.."
        )
    )


})

const logoutUser = asyncHandler(async(req, res) => {

    //user directly logout kroge to id nhi milega uska

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken:undefined    // DB SE ABHI DEL NAHI HUA HAI BS UNDEFINED
            }
        },
        {
            new: true      // RETURN UPDATED DOC
        }
    )

    const options = {          // SERVER ME HI CHANGES HOGA SECURED HAI ISILIYE
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged Out"))    // KOI DATA NAHI BHEJNA {}
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken ||req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure: true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options )
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new apiResponse(
                200,
                {accessToken , refreshToken:newRefreshToken},
                "accesstoken refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message||"invalid refresh token")
        
    }
})

const updateCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body;

    const user = User.findById(req.user?._id);


   const isPasswordCorrect = user.isPasswordCorrect(oldPassword)
   
   if(!isPasswordCorrect){
    throw new ApiError(400,"Password is incorrect.")
   }

   user.password = newPassword;

   await user.save({validateBeforeSave:false})

   return res
   .status(200)
   .json(new apiResponse(200,{},"password changed successfully"))
})

const getCurrentUser = asyncHandler (async(req,res)=>{
    return res
    .status(200)
    .json(new apiResponse(200,req.user,"user data fetched successfully."))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400,"Invalid user credentials")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                fullName,
                email
            }
        },

        {new:true}

    ).select("-password")

    return res
    .status(200)
    .json(new apiResponse(200,user,"Account details updated."))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
   const avatarLocalPath = req.file?.path

   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is requiered")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
    throw new ApiError(400,"avatar url not found")
   }

   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                avatar:avatar.url
            }
        },

        {new:true}

    ).select("-password")

    return res
    .status(200)
    .json(new apiResponse(200,res,"avatar file loaded"))


})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiResponse(200, user, "Cover image updated successfully")
    )
})

export {
registerUser,
loginUser,
logoutUser,
refreshAccessToken,
updateCurrentPassword,
updateUserAvatar,
updateCoverImage
}       // async func ka use to default kro
