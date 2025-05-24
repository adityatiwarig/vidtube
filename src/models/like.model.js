import mongoose, {Schema} from "mongoose";


const likedBySchema = new Schema ({

    video:{
        type: Schema.Types.ObjectId,
        ref: "Video"
    },

    comment:{
        type: Schema.Types.ObjectId,
        ref:"Comment"
    },

    tweet:{
        type : Schema.Types.ObjectId,
        ref:"Tweet"
    }
},{timestamps:true})

export const Like = mongoose.model("Like",likedBySchema)