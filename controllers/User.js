const User = require("../Models/user");
const Blog = require("../Models/blog");
const { erroHandler } = require("../helpers/dbErrorHandler");
const _ = require("lodash");
const formidable = require("formidable");
const fs = require("fs");

// user profile information
exports.read = (req, res) => {
  req.profile.hashed_password = undefined; 
  return res.json(req.profile);
};  

exports.publicProfile = (req, res) => {    
  let username = req.params.username;
    let user;
    let blogs;

    User.findOne({ username }).exec((err, userFromDB) => {
        if (err || !userFromDB) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
        user = userFromDB;
        let userId = user._id;
        Blog.find({ postedBy: userId })
            .populate('categories', '_id name slug')
            .populate('tags', '_id name slug')
            .populate('postedBy', '_id name username createdAt updatedAt')
            .limit(10)
            .select('_id title slug excerpt categories tags postedBy createdAt updatedAt')
            .exec((err, data) => {
                if (err) {
                    return res.status(400).json({
                        error: errorHandler(err)
                    });
                }
                user.photo = undefined;
                user.salt = undefined;
                user.hashed_password = undefined;
                res.json({
                    user,
                    blogs: data
                });
            });
    });
}

exports.update = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions=true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Photo could not be uploaded",
      });
    }

    let user = req.profile;
    user = _.extend(user, fields);
    //  uper basically jo field change hui hai loadsh merge krdega existing field ke sath

// we are not using express validator as it works with json data not with form data

   if(fields.password && fields.password.length<6){
     return res.json({
       error:'Password must be 6 characters long'
     })
   }
 



    if (files.photo) {
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: "Image should be less than 1mb",
        });
      }
      user.photo.data = fs.readFileSync(files.photo.path);
      user.photo.contentType = files.photo.type;
    }
    user.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: erroHandler(err),
        });
      }

      user.hashed_password = undefined;
      user.salt=undefined
      user.photo=undefined
      return  res.json(user);
    });
  });
}; 

exports.photo=(req,res)=>{
  const username=req.params.username
  User.findOne({username}).exec((err,user)=>{
    if(err || !user){
      return res.status(400).json({
        error:'User not found'
      })
    }

   if(user.photo.data){
     res.set('Content-Type',user.photo.contentType)
     return res.send(user.photo.data)
   }

  })
}
