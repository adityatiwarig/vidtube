import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/apiError.js"
import apiResponse, {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError(400,"Chhannels is not found")
    }

    const userID = req.user._id;

    const subscribed = await Subscription.findById({
        channel:channelId,
        subscriber:userID
    })

    if(!subscribed){
        //subscribe the channel

        const subscribe = await Subscription.create({
            channel : channelId,
            subscriber:userID
        })

        if(!subscribe){
            throw new ApiError(500,"cant able to subscribe!!")
        }

        return res
        .status(200)
        .json(200,new apiResponse(200,subscribe,"Channel subscribed"))

    }
    
     //unsubscribe the channel
     const unsubscribe = await Subscription.deleteOne(subscribed._id);

     if (!unsubscribe) {
        throw new ApiError(500, "Error while unsubscribing from the channel");
     }

     return res.status(200).json(new ApiResponse(200, {}, "Channel Unsubscribed"));

    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const userID = req.user?._id;          
    
    if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channelID or channel not found")
    }
    const channel = await User.aggregate([
        {
            $match :{
                _id:mongoose.Types.ObjectId(channelId)
            },
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as :"subscribers"
            },
        },
        {
            $addFields:{
                totalSubscibers:{
                    $size: "$subscribers"
                }
            },
        },
        {
            $project:{
                totalSubscibers:1
            }
        }
    ]);

    if(!channel.length){
        throw new ApiError(400,"Channel not found!!")
    }

    return res
    .status(200)
    .json(new apiResponse(200,
        {totalSubscibers:channel[0].totalSubscibers},
        "Total subscribers fetched successfully!!"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const userID = req.user?._id;          

    if(!subscriberId || isValidObjectId(subscriberId)){
        throw new ApiError(400,"Invalid subscriberID or not found")
    }

    const channel = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(subscriberId)
            },
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo",
            },
        },

        {
            $addFields:{
                channelSubscribed:{
                    $size: "$subscribedTo"
                },
            },
        },

        {
            $project:{
                channelSubscribed:1,
            },
        },

    ])
    if(!channel.length){
        throw new ApiError(400,"Channel not found!!")      
    }

    return res
    .status(200)
    .json(new apiResponse(200,
        {channelSubscribed:channel[0].channelSubscribed},
        "Total subscribed channel!!"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}