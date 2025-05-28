import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import  apiResponse  from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(500,"failed to get videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(500,"No such video found")
    }

    const comments = await Comment.aggregate([
        {
            $match:{
                video : new mongoose.Schema.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "createdBy",

                pipeline: [
                    {
                        $project:{
                            username:1,
                            fullname:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields :{
                createdBy:{
                    $first : "$createdBy"
                }
            }
        },

        {
            $unwind:{createdBy}
        },
        {
            $project:{
                content:1,
                createdBy:1
            }
        },
        //pagination

        {
            $skip :(page - 1) * limit
        },

        {
            $limit : parseInt(limit),
        },
    ])

    return res
    .status(200)
    .json(new apiResponse(200, comments,"Comments fetched"))

})

const addComment = asyncHandler(async (req, res) => {
  //  Extract video ID and comment content
  const { videoId } = req.params;
  const { content } = req.body;

  //  Get logged-in user ID
  const userID = req.user.id;

  //  Validate video ID
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Missing or Invalid video ID");
  }

  //  Validate comment content
  if (!content) {
    throw new ApiError(400, "Please write something for comment");
  }

  //  Check if video exists
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video does not found");
  }

  //  Create comment
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: userID,
  });

  //  Check if comment was created successfully
  if (!comment) {
    throw new ApiError(400, "Failed to creating a comment");
  }

  //  Send success response
  return res.status(200).json(new ApiResponse(200, comment, "Comment added"));
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const {commentID} = req.params  // pehle commentID lo

    if(!commentID){
        throw new ApiError(400,"CommentId not matched")
    }

    const content = req.body;   // content lo jo likha hai

    if(!content){
        throw new ApiError(400,"Content not found")
    }

    const userID = req.user_id;   // users ki id

    const comment = await Comment.findById(commentId);   // comment 

    if(!comment){
        throw new ApiError(400,"Comment not found")
    }

    if(!comment.owner.equals(userID)){   // commentkeowner ki id uus user collection me hai kya
        throw new ApiError(403,"You r not allowed to update comment!!")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
       commentID,
     {
       $set: {
         content,
       },
     },
       { new: true }
    );

    return res
    .status(200)
    .json(200,updateComment,"Comment updated successfully!!")
   })

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const commentID = req.params

    if(!commentID){
        throw new ApiError(400,"CommentId not found!!")
    
    }
    const userID = req.user.user_id

    const comment = await Comment.findById(commentID)

    if(!comment.owner.equals(userID)){
        throw new ApiError(403,"You r not allowed to delete the comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentID)

    if(!deletedComment){
        throw new ApiError(400,"Comment cant be deleted!!")
    }

    return res
    .status(200)
    .json(new apiResponse(200,deletedComment,"Comment has been deleted"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }