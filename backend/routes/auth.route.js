import express from "express"

import { loginUser, registerUser } from "../controllers/auth.controller";

const router = express.Router()
// Register route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

module.exports = router;