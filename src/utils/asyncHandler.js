const asyncHandler = (requestHandler) => {
    return (req,res,next) =>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export  {asyncHandler};  // exact yhi naam import krnapdega
