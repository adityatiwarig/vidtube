import mongoose, {Schema} from "mongoose";


const commentScehma = new Schema ({
    content: {
        type:String,
        required : true
    },

    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps:true})

export const Comment = mongoose.model("Comment",commentScehma)