const mongoose=require('mongoose')
const {ObjectId}=mongoose.Schema

const blogSchema=new mongoose.Schema({
title:{
    type:String,
    required:true,
    min:3,
    max:160,
    trim:true
},
slug:{
    type:String,
    unique:true,
    index:true
},
body:{
    // type {} means all types of data is accepted like binary, text, html etc
    type:{},
    required:true,
    min:150,
    max:2000000,
},
excerpt:{
    type:String,
    max:1000
},
// meta title
mtitle:{
    type:String
},
mdesc:{
    type:String
},
photo:{
    data:Buffer,
    contentType:String 
},
categories:[{type:ObjectId,ref:'Category',required:true}],
tags:[{type:ObjectId,ref:'Tag',required:true}],
postedBy:{
    type:ObjectId,
    ref:'User'
}



},{timestamps:true})

module.exports=mongoose.model('Blog',blogSchema)