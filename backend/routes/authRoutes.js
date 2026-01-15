import express from 'express'
import {
	register,
	login,
	checkSession,
	logout,
} from '../controllers/authController.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication API
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Username or email already exists
 *       500:
 *         description: Server error
 */
router.post('/register', register)

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged in successfully
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', login)

/**
 * @swagger
 * /check-session:
 *   get:
 *     summary: Check current session status
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Session status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isLoggedIn:
 *                   type: boolean
 *                 userId:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 balance:
 *                   type: number
 *       500:
 *         description: Server error
 */
router.get('/check-session', checkSession)

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       500:
 *         description: Server error
 */
router.post('/logout', logout)

export default router
