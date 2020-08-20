const {check}=require('express-validator')
// creating up a validation for user signUp
exports.userSignUpValidator=[
    check('name').not().isEmpty().withMessage('Name is required'),
    check('email').isEmail().withMessage('Enter a valid email '),
    check('password').isLength({min:6}).withMessage('Password must be 6 characters long')
];

exports.userSignInValidator=[
    check('email').isEmail().withMessage('Enter a valid email '),
    check('password').isLength({min:6}).withMessage('Password must be 6 characters long')
];

exports.forgotPasswordValidator=[
    check('email').not().isEmpty().isEmail().withMessage('Enter a valid email ')
];

exports.resetPasswordValidator=[
    check('newPassword').not().isEmpty().isLength({min:6}).withMessage('Password must be 6 characters long')
];