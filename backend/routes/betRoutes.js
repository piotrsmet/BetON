import express from 'express'
import { createCoupon, getUserCoupons, getCashoutValue, cashoutCoupon } from '../controllers/betController.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/coupons', verifyToken, createCoupon)
router.get('/coupons', verifyToken, getUserCoupons)
router.get('/coupons/:id/cashout', verifyToken, getCashoutValue)
router.post('/coupons/:id/cashout', verifyToken, cashoutCoupon)

export default router
