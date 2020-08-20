const {validationResult}=require('express-validator')

// creating a middleware
exports.runValidation=(req,res,next)=>{
    // we get name email and pass in req and then check for the error
    const errors=validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).json({error:errors.array()[0].msg})
    }
    // use next so that application doesn't halt
    next();
}