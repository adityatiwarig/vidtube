import { Router } from "express";

import { 
    loginUser, 
    logoutUser, 
    registerUser,  
    refreshAccessToken
} from "../controllers/user.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";
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

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,  logoutUser)   // pehle verifyJWT uske baad next
router.route("/refresh-token").post(refreshAccessToken)

export default router     // koi bhi name use krskte ho