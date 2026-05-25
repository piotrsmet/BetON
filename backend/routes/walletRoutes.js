import express from 'express'
import { getTransactions, deposit, withdraw } from '../controllers/walletController.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/transactions', verifyToken, getTransactions)
router.post('/wallet/deposit', verifyToken, deposit)
router.post('/wallet/withdraw', verifyToken, withdraw)

export default router
