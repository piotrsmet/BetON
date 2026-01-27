import express from 'express'
import { getUsers } from '../controllers/userController.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management API
 */

/**
 * @swagger
 * /uzytkownicy:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nazwa:
 *                     type: string
 *                   email:
 *                     type: string
 *                   saldo:
 *                     type: number
 *       500:
 *         description: Server error
 */
router.get('/uzytkownicy', getUsers)

export default router
