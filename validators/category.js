const {check}=require('express-validator')
// creating up a validation for user signUp
exports.categoryCreateValidator=[
    check('name').not().isEmpty().withMessage('Name is required')

];
