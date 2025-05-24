import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/apiError.js"
import  apiResponse  from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { use } from "react"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!videoId || !isValidObjectId(videoId)){    // pehle dekh lo ki video hai ya nai
        throw new ApiError(400,"Video not found")
    }

    const userID = req.user?._id;          // user ki id lelo

    const existingLike = await Like.findOne({video : videoId , likedBy : userID})// kya  liked hai 

    let liked;

    if(existingLike){  // agr liked hai to unlike kro

        const deletedVideoLike = await existingLike.deleteOne()

        if(!deletedVideoLike){
            throw new ApiError(500,"Failed to unlike the video")
        }
        liked = false;
    }else{
        const likedVideoLike = await Like.create({
            video:videoId,
            likedBy : userID
        });

        if(!likedVideoLike){
            throw new ApiError(500,"Failed to like the video")
        }

        liked  = true
    }

    const totalLikes = await Like.countDocuments({video:videoId})

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videoId, liked, totalLikes },
        liked ? "Video liked successfully" : "Video unliked successfully"
      )
    );
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!commentId || isValidObjectId(commentId)){
        throw new ApiError(400,"Comment not found")
    }

    const userID = req.user?._id

    const existingLike = await Like.findOne({comment:commentId,likedBy:userID})

    let liked;

    if(existingLike){
        const deletedCommentLike = await Like.deleteOne()

        if(!deletedCommentLike){
            throw new ApiError(500,"Failed to unlike the comment!!")
        }

        liked = false
    }else{
        const likedCommentLike = await Like.create({comment:commentId,likedBy:userID})

        if(!likedCommentLike){
            throw new ApiError(500,"Failed to like the comment!!")
        }

        liked = true
    }

    const totalLikes = await Like.countDocuments({comment:commentId})

    return res
    .status(200)
    .json
    (new apiResponse
        (200,
         {commentId , liked , totalLikes},
        liked ? "Comment liked successfully" : "Comment unliked successfully"
    ))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    const userID =  req.user?._id

    const existingLike = await Like.findOne({tweet:tweetId , likedBy:userID})

    let liked 
    if(existingLike){
        let deletedTweetLike = await existingLike.deleteOne()

        if(!deletedTweetLike){
            throw new ApiError(500,"Failed to unlike the tweeet!!")
        }
        liked = false
    }else{
        const likedTweetLike = await Like.create({
            tweet : tweetId,
            likedBy : userID
        })

        if(!likedCommentLike){
            throw new ApiError(500,"Failed to like the comment")
        }

        liked = true
    }

    const totalLikes = await Like.countDocuments({tweet:tweetId});

    return res
    .status(200,
        {tweetId , liked , totalLikes},
        liked? "Tweet liked successfully " : "Tweet unliked successfully"
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}