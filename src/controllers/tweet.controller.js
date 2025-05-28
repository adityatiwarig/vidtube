import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/apiError.js";
import  apiResponse  from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const userID = req.user._id

    const {content} = req.body

    if(!content){
        throw new ApiError(400,"Content not available")
    }

    const tweet = await Tweet.create({
        content,
        owner: userID
    })

    if(!tweet){
        throw new ApiError(400,"Tweer not created!")
    }

    return res
    .status(200)
    .json(new apiResponse(200,tweet,"Tweet created successfully!!"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userID} = req.params
    const {page=1,limit= 10} = req.query

    if(!userID|| isValidObjectId(userID)){
        throw new ApiError(400,"user id not found")
    }

    const tweet = await Tweet.aggregate([
        {
            $match:{
                owner:mongoose.Types.ObjectId(userID)
            },
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1
                        },
                    },
                ]
            },
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        },
        {
            $project:{
                content:1,
                owner:1,
                createdAt:1
            },
        },
        {
            $skip:(page - 1)*limit
        },
        {
            $limit:parseInt(limit)
        },

    ])

    if(!tweet){
        throw new ApiError(400,"Tweet not found!!")
    }

    return res
    .status(200)
    .json(200,tweet[0],"User tweets fetched!!")

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
      const { tweetId } = req.params;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Missing or Invalid Tweet ID");
  }

  const userID = req.user._id;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Please provide some content");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "No such tweet found");
  }

  if (!tweet.owner.equals(userID)) {
    throw new ApiError(403, "You are not allowed to update this tweet");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!updateTweet) {
    throw new ApiError(400, "Failed to update the tweet");
  }

  return res
    .status(200)
    .json(new apiResponse(201, updatedTweet, "Tweet updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params;
  const userID = req.user._id;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Missing or Invalid Tweet ID");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "No such tweet not found");
  }

  if (!tweet.owner.equals(userID)) {
    throw new ApiError(403, "You are not allowed to delete this tweet");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deletedTweet) {
    throw new ApiError(400, "Failed to delete the tweet");
  }

  return res
    .status(200)
    .json(new apiResponse(200, deletedTweet, "Tweet deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}