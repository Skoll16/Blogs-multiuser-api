const User = require("../Models/user");
const shortID = require("shortid");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const {errorHandler}=require('../helpers/dbErrorHandler');
const Blog = require("../Models/blog");
const _ = require("lodash");
const {OAuth2Client}=require('google-auth-library')

const sgMail=require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY)


// 

exports.preSignup = (req, res) => {
  const { name, email, password } = req.body;
  User.findOne({ email: email.toLowerCase() }, (err, user) => {
      if (user) {
          return res.status(400).json({
              error: 'Email is taken'
          });
      }
      const token = jwt.sign({ name, email, password }, process.env.JWT_ACCOUNT_ACTIVATION, { expiresIn: '10m' });

      const emailData = {
          from: process.env.EMAIL_TO,
          to: email,
          subject: `Account activation link`,
          html: `
          <p>Please use the following link to activate your acccount:</p>
          <p>${process.env.CLIENT_URL}/auth/account/activate/${token}</p>
          <hr />
          <p>This email may contain sensetive information</p>
          <p>https://seoblog.com</p>
      `
      };

      sgMail.send(emailData).then(sent => {
          return res.json({
              message: `Email has been sent to ${email}. Follow the instructions to activate your account.`
          });
      });
  });
};


// exports.signup = (req, res) => {
//   User.findOne({ email: req.body.email }).exec((err, user) => {
//     //    if exiting email is taken
//     if (user) {
//       return res.status(400).json({
//         error: "Email already exists",
//       });
//     }
//     const { name, email, password } = req.body;
//     let username = shortID.generate();
//     let profile = `${process.env.CLIENT_URL}/profile/${username}`;
//     let newUser = new User({ name, email, password, username, profile });
//     newUser.save((err, userData) => {
//       if (err) {
//         return res.status(400).json({ error: err });
//       }
//       // res.json({
//       //     user:userData
//       // });

//       res.json({
//         message: "SignUp successfully..Please SignIn!!",
//       });
//     });
//   });
// };

// exports.signup=(req,res)=>{
// const token=req.body.token
// if(token){
//   jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION,function(err,decoded){
//    if(err){
//      return res.status(401).json({
//        error:'Expire link. Sign up Again'
//      })
//    }
//    const {name,email,password}=jwt.decode(token)
//        let username = shortID.generate();
//     let profile = `${process.env.CLIENT_URL}/profile/${username}`;

//     const user=new User({name,email,password,profile,username})
//     user.save((err,user)=>{
//       if(err){
//         return res.status(401).json({
//           error:errorHandler(err)
//         })
//       }
//       return res.json({
//         message:'Sign up success!! Please sign in'
//       })
//     })
//   })
// }else{
 
//     return res.status(401).json({
//       error:'Something went wrong.Please try again later'
//     })
  
// }
// }


exports.signup = (req, res) => {
  const token = req.body.token;
  if (token) {
      jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function(err, decoded) {
          if (err) {
              return res.status(401).json({
                  error: 'Expired link. Signup again'
              });
          }

          const { name, email, password } = jwt.decode(token);

          let username = shortID.generate();
          let profile = `${process.env.CLIENT_URL}/profile/${username}`;

          const user = new User({ name, email, password, profile, username });
          user.save((err, user) => {
              if (err) {
                  return res.status(401).json({
                      error: errorHandler(err)
                  });
              }
              return res.json({
                  message: 'Singup success! Please signin'
              });
          });
      });
  } else {
      return res.json({
          message: 'Something went wrong. Try again'
      });
  }
};


// signIn
exports.signin = (req, res) => {
  const { email, password } = req.body;

  // check if user exist
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User with this email does not exist.Please signUp',
      });
    }
    // authenticate
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: 'Email and password does not match',
      });
    }
    
  // generate a webtoken and send to client
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '10d',
  });
  res.cookie("token", token, { expiresIn: '10d' });
  // user info to send
  const { _id, username, email, name, role } = user; 
  return res.json({
    token,
    user:{ _id, username, email, name, role },
  });
  });

};



// signout
exports.signout=(req,res)=>{
res.clearCookie("token")
res.json({
  message:"Signout Successfully"
})
} 
// check signin middle ware token secret check with ev sec and return true is the both are same
exports.requireSignin=expressJwt({
  secret:process.env.JWT_SECRET
  
})

// auth middleware for user 
exports.authMiddleware=(req,res,next)=>{
const authUserid=req.user._id;
User.findById({_id:authUserid}).exec((err,user)=>{
  if(err||!user){
    return res.status(400).json({error:'User not found!'})
  }
  req.profile=user
  next()
})
}

// auth middleware for admin 
exports.adminMiddleware=(req,res,next)=>{
  const adminUserid=req.user._id;
  User.findById({_id:adminUserid}).exec((err,user)=>{
    if(err||!user){
      return res.status(400).json({error:'User not found!'})
    }

  if(user.role!==1){
    return res.status(400).json({error:'Admin access denied!'})
  
  }
    req.profile=user
    next();
  })
  }



  exports.canUpdateDeleteBlog=(req,res,next)=>{
  
   const slug=req.params.slug.toLowerCase()
    Blog.findOne({slug}).exec((err,data)=>{ 
    if(err){
      return res.status(400).json({
        error:errorHandler(err)
      })
    }

    let authorizedUser=data.postedBy._id.toString()===req.profile._id.toString()
    if(!authorizedUser){

    }  
  if(err){
      return res.status(400).json({
        error:'You are not authorized'
      })
    }
  next()
  })

  }

  exports.forgotPassword=(req,res)=>{
   const {email}=req.body
   User.findOne({email},(err,user)=>{
    if(err || !user){
      return res.status(400).json({
        error:'User with this email does not exit'
      })
    }

    const token=jwt.sign({_id:user._id},process.env.JWT_SECRET_PASSWORD,{expiresIn:'15m'})

    // email the token or paswd link
    const emailData = {
      from:process.env.EMAIL_TO,
      to: email, 
      subject: `Reset Link form - ${process.env.APP_NAME}`,
      html: `
          <p>Please use following link to reset your password:</p> 
          <p>: ${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
          <hr />
          <p>This email may contain sensitive information</p>
          <p>https://Mr.Blogger.com</p>
      `
  };

  // update db
  return user.updateOne({resetPasswordLink:token},(err,success)=>{
    if(err){
      return res.status(400).json({
        error:errorHandler(err)
      })
    }else {
            

      (async () => { 
        try {
        //  const connected = await connect();
        await sgMail.send(emailData).then(sent => {
          return res.json({
              message: `Email has been sent to ${email}. Follow the instructions to reset your password. Link expires in 15 min.`
          });
      });  
        } catch(e) {
         console.log(e)
        }
      })();

    }
  })

   })
  }

//    exports.forgotPassword =async(req, res) => {
//     const { email } = req.body;

//     User.findOne({ email }, (err, user) => {
//         if (err || !user) {
//             return res.status(401).json({
//                 error: 'User with that email does not exist'
//             });
//         }

//         const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_PASSWORD, { expiresIn: '10m' });

//         // email
//         const emailData = {
//             from: process.env.EMAIL_TO,
//             to: email,
//             subject: `Password reset link`,
//             html: `
//             <p>Please use the following link to reset your password:</p>
//             <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
//             <hr />
//             <p>This email may contain sensetive information</p>
//             <p>https://seoblog.com</p>
//         `
//         };
//         // populating the db > user > resetPasswordLink
//         return user.updateOne({ resetPasswordLink: token}, (err, success) => {
//             if (err) {
//                 return res.json({ error: errorHandler(err) });
//             } else {
            

//               (async () => { 
//                 try {
//                 //  const connected = await connect();
//                 await sgMail.send(emailData).then(sent => {
//                   return res.json({
//                       message: `Email has been sent to ${email}. Follow the instructions to reset your password. Link expires in 10min.`
//                   });
//               });  
//                 } catch(e) {
//                  console.log(e)
//                 }
//               })();

//             }
//         }); 
//     });
// };

  exports.resetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;

    if (resetPasswordLink) {
        jwt.verify(resetPasswordLink, process.env.JWT_SECRET_PASSWORD, function(err, decoded) {
            if (err) {
                return res.status(401).json({
                    error: 'Expired link. Try again'
                });
            }
            User.findOne({ resetPasswordLink }, (err, user) => {
                if (err || !user) {
                    return res.status(401).json({
                        error: 'Something went wrong. Try later'
                    });
                }
                const updatedFields = {
                    password: newPassword,
                    resetPasswordLink: ''
                };

                user = _.extend(user, updatedFields);

                user.save((err, result) => {
                    if (err) {
                        return res.status(400).json({
                            error: errorHandler(err)
                        });
                    }
                    res.json({
                        message: `Great! Now you can login with your new password`
                    });
                });
            });
        });
    }
};

const client=new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

exports.googleLogin=(req,res)=>{  
const idToken=req.body.tokenId
client.verifyIdToken({idToken,audience:process.env.GOOGLE_CLIENT_ID}).then(response=>{
  const {email_verified,name,email,jti}=response.payload
  // jti is unique id
  if(email_verified){
    User.findOne({email}).exec((err,user)=>{
      if(user){
        const token=jwt.sign({_id:user._id},process.env.JWT_SECRET,{expiresIn:'30d'})
        res.cookie('token',token,{expiresIn:'30d'})
        const {_id,email,name,role,username}=user
        return res.json({token,user:{_id,email,name,role,username}})
      }
      else{
        let username=shortID.generate()
        let profile=`${process.env.CLIENT_URL}/profile/${username}`
        let password=jti
        user=new User({name,email,profile,username,password})
        user.save((err,data)=>{
          if(err){
            return res.status(400).json({
              error:errorHandler(err)
            })
          }
          const token=jwt.sign({_id:data._id},process.env.JWT_SECRET,{expiresIn:'7d'})
          res.cookie('token',token,{expiresIn:'7d'})
          const {_id,email,name,role,username}=data
          return res.json({token,user:{_id,email,name,role,username}})
        })
      }
    })
  }
  else{
    return res.status(400).json({
      error:'Google login failed. Try again'
    })

  }
})
}


