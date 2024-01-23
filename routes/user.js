const { response } = require('express');
const express = require('express');
const router = express.Router();
const userHelper = require("../helpers/user-helpers")
const postHelper = require("../helpers/post-helpers");



// Sign Up
router.post('/auth/signup', (req, res) => {
    console.log("register working ",req.body)
    userHelper.doSignUp(req.body).then((response)=>{
        console.log(response)
        res.json(response);
    })
});

//OTP Verification
router.post("/auth/otpVerification",(req,res)=>{
    console.log("otpVerification working ",req.body);
    userHelper.verifyotp(req.body).then((response)=>{
        console.log(response);
        res.json(response);
    })
})


// Login
router.post('/auth/login',(req,res)=>{
    console.log("Login working")
    userHelper.doLogin(req.body).then((response)=>{
        res.json(response);
    })
});

// Create Post
router.post('/auth/createPost',(req,res)=>{
    console.log("createPost route working")
    userHelper.doCreatePost(req.body).then((response)=>{
        console.log(response)
        res.json(response);
    })
});


router.get('/auth/get-users',(req,res)=>{
    userHelper.getAllUsers().then((response)=>{
        res.json(response);
    }).catch(error=>{
        console.log(error);
    })
});
router.post('/auth/request-otp',(req,res)=>{
    userHelper.requestOTP(req.body).then((response)=>{
        res.json(response);
    }).catch(error=>{
        console.log(error);
    })
});
router.post('/auth/reset-password',(req,res)=>{
    userHelper.resetPassword(req.body).then((response)=>{
        res.json(response);
    }).catch(error=>{
        console.log(error);
    })
});

router.post("/auth/set-online",(req,res)=>{
    console.log("working",req.body)
    userHelper.setOnline(req.body).then((response)=>{
        res.json(req.body) 
    })
})


// const express = require('express');
// const router = express.Router();


router.post('/post/video-post/post-video',(req,res)=>{
    console.log("reached request here")
    console.log("post route working")
    postHelper.doPost(req.body).then((response)=>{
        if(response){
            res.json(response)
        }
    }).catch((error)=>{
        console.log(error);
        res.json({status:"fail",message:"Something went Wrong ,Please try again later"})
    })
});


router.get('/post/video-post/get-posts',(req,res)=>{
    
    postHelper.getPosts().then((response)=>{
        res.json({response});
    })
})

router.get('/post/video-post/get-postsBySearch/:location', (req, res) => {
    
    postHelper.getPostBySearch(req.params.location).then((response)=> {
        res.json({response})
    })
})

router.get('/post/video-post/get-profile-posts',(req,res)=>{
    console.log("router working")
    console.log(req.query.userId);
    postHelper.getProfilePosts(req.query.userId).then((response)=>{
        res.json(response)
    })
})








module.exports = router;
