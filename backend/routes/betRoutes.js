import express from 'express'
import { createCoupon, getUserCoupons } from '../controllers/betController.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/coupons', verifyToken, createCoupon)
router.get('/coupons', verifyToken, getUserCoupons)

export default router
