import express from 'express';
import { register, login, forgotPassword,resetPassword } from '../controllers/user.controller.js';
import { 
    registerValidation, 
    loginValidation, 
    forgotPasswordValidation,
    resetPasswordValidation,
    validate 
  } from '../middleware/validate.js';
  
const router = express.Router();

router.post('/register',registerValidation,validate, register);
router.post('/login',loginValidation,validate, login);
router.post('/forgot-password',forgotPasswordValidation,validate, forgotPassword);
router.post('/reset-password/:token',resetPasswordValidation,validate, resetPassword);

export default router;