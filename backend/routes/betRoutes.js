import express from 'express'
import { createCoupon, getUserCoupons } from '../controllers/betController.js'

const router = express.Router()

router.post('/coupons', createCoupon)
router.get('/coupons', getUserCoupons)

export default router
