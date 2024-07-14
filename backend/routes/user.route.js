import express from 'express';
import { getAllUsers, registerUser, loginUser } from '../controllers/user.controller.js';

const router = express.Router();

router.get('/', getAllUsers);
router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;
