const mongoose = require("mongoose");
const crypto = require("crypto");
const { strict } = require("assert");
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    required: true,
    max: 32,
    unique: true,
    index: true,
    lowercase: true,
  },
  name: {
    type: String,
    trim: true,
    required: true,
    max: 32,
  },

  email: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
  },
  profile: {
    type: String,
    required: true,
  },
  hashed_password: {
    type: String,
    required: true,
  },
  // salt is use to determine how the strong is password
  salt: String,
  about: {
    type: String,
  },
  role: {
    type: Number,
    default:0
  },
  photo: {
    data: Buffer,
    contentType: String,
  },
  resetPasswordLink: {
    data: String,
    default: "",
  },
},
{timestamps:true}
);  


userSchema.virtual('password').
set(function(password){
// create a temp val called _password
this._password=password
// generate salt
this.salt=  this.makeSalt()
// encrypt password
this.hashed_password=this.encryptPassword(password)
})
.get(function(){
  return this._password;
});

// Schema functions
userSchema.methods={
// take plain password from user and encrypt and then compare wuth hashed one
authenticate:function(plainText){
  return this.encryptPassword(plainText)===this.hashed_password;
  // return true if  same passwd
},

  
  encryptPassword:function(password){
    // if there is no password
    if(!password)return '';
    try{
      return crypto.createHmac('sha1',this.salt).update(password).digest('hex');
    }
    catch(err)
  { return '';
   }
  },
makeSalt:function(){ 
  return Math.round(new Date().valueOf()*Math.random())+ '';
}
}

module.exports=mongoose.model('User',userSchema);
