import express from 'express'
import {
	register,
	login,
	checkSession,
	logout,
} from '../controllers/authController.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/check-session', checkSession)
router.post('/logout', logout)

export default router
