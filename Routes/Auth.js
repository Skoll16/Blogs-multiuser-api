const express=require('express')
const router=express.Router()
const {signup,signin,signout,requireSignin,forgotPassword,
    resetPassword,preSignup,googleLogin}=require('../controllers/Auth')

// validators
const {runValidation}=require('../validators')
const {userSignUpValidator,userSignInValidator,forgotPasswordValidator,
    resetPasswordValidator}=require('../validators/auth')

router.post('/pre-signup',userSignUpValidator,runValidation,preSignup)    
router.post('/signUp', signup)
router.post('/signIn',userSignInValidator,runValidation, signin)
router.get('/signOut',signout)

router.get('/secret',requireSignin,(req,res)=>{
    res.json({
        user:req.user
    })
})

router.put('/forgot-password',forgotPasswordValidator,runValidation,forgotPassword)
router.put('/reset-password',resetPasswordValidator,runValidation,resetPassword)

// google login
router.post('/google-login',googleLogin)

module.exports=router 

// 757256845085-3lqlmllvpp4a8d9k41p2p2gmpq508fud.apps.googleusercontent.com

// nUBwRKtkcBdzwB7iAF4OrKYN