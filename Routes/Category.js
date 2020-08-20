const express=require('express')
const router=express.Router()
const {requireSignin, adminMiddleware}=require('../controllers/Auth')
const {create,list,read,remove}=require('../controllers/Category')
const {runValidation}=require('../validators')
const {categoryCreateValidator}=require('../validators/category')

router.post('/category',categoryCreateValidator,runValidation,requireSignin,adminMiddleware,create)
router.get('/categories',list)
router.get('/categories/:slug',read)
router.delete('/category/:slug',requireSignin,adminMiddleware,remove)

module.exports=router ; 