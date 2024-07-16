import express from 'express';
import { getAllUsers } from '../controllers/user.controller.js';

const router = express.Router();

// Get all users
router.get('/', getAllUsers);

export default router;
