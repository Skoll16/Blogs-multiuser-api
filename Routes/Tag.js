const express=require('express')
const router=express.Router()
const {requireSignin, adminMiddleware}=require('../controllers/Auth')
// validators
const {createTagValidator}=require('../validators/tag')
const {runValidation}=require('../validators')

// ccpntrollers
const {read,list,remove,create}=require('../controllers/Tag')

 
router.post('/tag',createTagValidator,runValidation,requireSignin, adminMiddleware,create)
router.get('/tags',list)
router.get('/tags/:slug',read)
router.delete('/tag/:slug',requireSignin,adminMiddleware,remove)


module.exports=router;