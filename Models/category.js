const mongoose = require("mongoose");
const categorySchema=new mongoose.Schema({
name:{
    type:String,
    max:32,
    trim:true,
    required:true
},
slug:{
    type:String,
    unique:true,
    index:true
}
});



module.exports=mongoose.model('Category',categorySchema);
