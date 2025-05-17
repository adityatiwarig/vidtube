import { Router } from "express";
import registerUser from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();


router.route("/register").post(   
    upload.fields([             // UPLOAD FIELDS --> MULTER FUNC UPLOAD MULTI FILES ,DIFF FIELDS
        {
            name: "avatar",  // FIELD 1
            maxCount: 1          // SIRF 1 FILE
        }, 
        {
            name: "coverImage",  // FIELD 2
            maxCount: 1          // SIRF 1 FILE
        }
    ]),
    registerUser     // USER KI DETAIL HANDLE KI JATI H ITS (METHOD)  SAVES USERDATA
    )

export default router     // koi bhi name use krskte ho